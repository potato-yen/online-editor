import { useCallback, useMemo } from 'react'
import type React from 'react'

type UseEditorActionsOptions = {
  editorRef: React.RefObject<HTMLTextAreaElement>
  onContentChange?: (text: string) => void
  setText: React.Dispatch<React.SetStateAction<string>>
  indentSize?: number
  // [NEW]
  autoCloseBrackets?: boolean
}

// 定義選取範圍的調整參數 (相對於插入內容的起始位置)
export type SelectionOptions = {
  relativeStart: number;
  relativeLength: number;
}

type SimpleInsertHandler = (
  templateStart: string,
  templateEnd: string,
  placeholder: string,
  selectionOptions?: SelectionOptions
) => void

type SmartBlockType = 'heading' | 'list' | 'quote' | 'task'

// 檢查游標位置是否在數學環境中
function isCursorInMath(text: string, pos: number): boolean {
  let inCodeBlock = false;
  let inInlineCode = false;
  let inBlockMath = false; 
  let inInlineMath = false;
  
  for (let i = 0; i < pos; i++) {
    const char = text[i];
    if (char === '\\') { 
      if (text.startsWith('\\[', i)) { inBlockMath = true; i++; continue; }
      if (text.startsWith('\\]', i)) { inBlockMath = false; i++; continue; }
      i++; 
      continue;
    }
    if (text.startsWith('```', i)) { inCodeBlock = !inCodeBlock; i += 2; continue; }
    if (inCodeBlock) continue;
    if (char === '`') { inInlineCode = !inInlineCode; continue; }
    if (inInlineCode) continue;
    if (text.startsWith('$$', i)) { inBlockMath = !inBlockMath; i++; continue; }
    if (inBlockMath) continue;
    if (char === '$') { inInlineMath = !inInlineMath; }
  }
  return inBlockMath || inInlineMath;
}

export function useEditorActions({
  editorRef,
  onContentChange,
  setText,
  indentSize = 4,
  // [NEW]
  autoCloseBrackets = true,
}: UseEditorActionsOptions) {
  const indentCharacters = useMemo(() => {
    const spaces = typeof indentSize === 'number' ? indentSize : 4
    const safeSize = Number.isFinite(spaces) && spaces > 0 ? Math.min(spaces, 8) : 4
    return ' '.repeat(safeSize)
  }, [indentSize])

  const getCurrentLineInfo = useCallback((editor: HTMLTextAreaElement) => {
    const { value, selectionStart } = editor
    let lineStart = selectionStart
    while (lineStart > 0 && value[lineStart - 1] !== '\n') {
      lineStart--
    }
    let lineEnd = selectionStart
    while (lineEnd < value.length && value[lineEnd] !== '\n') {
      lineEnd++
    }
    const currentLine = value.substring(lineStart, lineEnd)
    return { currentLine, lineStart, lineEnd }
  }, [])

  const allBlockPrefixRegex = /^(#+\s|> \s|\* \s|1\. \s|\* \[\s\] \s)/

  const handleSmartBlock = useCallback(
    (newPrefix: string, _type: SmartBlockType) => {
      const editor = editorRef.current
      if (!editor) return
      const { selectionStart, selectionEnd } = editor
      const { currentLine, lineStart, lineEnd } = getCurrentLineInfo(editor)
      let oldPrefix = ''
      let replacement = ''
      let isToggleOff = false
      if (currentLine.startsWith(newPrefix)) {
        isToggleOff = true
        oldPrefix = newPrefix
        replacement = currentLine.substring(newPrefix.length)
      } else {
        isToggleOff = false
        const match = currentLine.match(allBlockPrefixRegex)
        if (match) {
          oldPrefix = match[1]
          replacement = newPrefix + currentLine.substring(oldPrefix.length)
        } else {
          oldPrefix = ''
          replacement = newPrefix + currentLine
        }
      }
      editor.focus()
      editor.setSelectionRange(lineStart, lineEnd)
      document.execCommand('insertText', false, replacement)
      setTimeout(() => {
        editor.focus()
        const finalSelStart = isToggleOff ? lineStart : lineStart + newPrefix.length
        const finalSelEnd = lineStart + replacement.length
        if (selectionEnd > selectionStart) {
          const prefixLengthChange = isToggleOff
            ? -oldPrefix.length
            : newPrefix.length - oldPrefix.length
          if (selectionStart >= lineStart && selectionEnd <= lineEnd) {
            editor.setSelectionRange(
              selectionStart + prefixLengthChange,
              selectionEnd + prefixLengthChange
            )
          } else {
            editor.setSelectionRange(finalSelStart, finalSelEnd)
          }
        } else {
          editor.setSelectionRange(finalSelStart, finalSelEnd)
        }
      }, 0)
    },
    [editorRef, getCurrentLineInfo]
  )

  const handleSmartInline = useCallback(
    (wrapChars: string, placeholder: string) => {
      const editor = editorRef.current
      if (!editor) return
      const { selectionStart, selectionEnd, value } = editor
      const selectedText = value.substring(selectionStart, selectionEnd)
      const wrapLen = wrapChars.length
      const preText = value.substring(selectionStart - wrapLen, selectionStart)
      const postText = value.substring(selectionEnd, selectionEnd + wrapLen)
      let replacement = ''
      let finalSelStart = 0
      let finalSelEnd = 0
      if (preText === wrapChars && postText === wrapChars && selectedText) {
        replacement = selectedText
        editor.setSelectionRange(selectionStart - wrapLen, selectionEnd + wrapLen)
        finalSelStart = selectionStart - wrapLen
        finalSelEnd = finalSelStart + selectedText.length
      } else {
        const textToInsert = selectedText ? selectedText : placeholder
        replacement = wrapChars + textToInsert + wrapChars
        editor.setSelectionRange(selectionStart, selectionEnd)
        finalSelStart = selectionStart + wrapLen
        finalSelEnd = finalSelStart + textToInsert.length
      }
      editor.focus()
      document.execCommand('insertText', false, replacement)
      setTimeout(() => {
        editor.focus()
        editor.setSelectionRange(finalSelStart, finalSelEnd)
      }, 0)
    },
    [editorRef]
  )

  const handleSimpleInsert: SimpleInsertHandler = useCallback(
    (templateStart, templateEnd, placeholder, selectionOptions) => {
      const editor = editorRef.current
      if (!editor) return
      const { selectionStart, selectionEnd, value } = editor
      const selectedText = value.substring(selectionStart, selectionEnd)
      
      let textToInsert = '';
      const isSymbolReplacement = templateEnd === '';

      if (selectedText) {
        if (isSymbolReplacement) {
          textToInsert = templateStart + templateEnd;
        } else {
          textToInsert = templateStart + selectedText + templateEnd;
        }
      } else {
        textToInsert = templateStart + placeholder + templateEnd;
      }

      editor.focus()
      
      const updateCursor = () => {
        if (!editor) return;
        let newCursorStart: number
        let newCursorEnd: number
        
        if (selectionOptions) {
          newCursorStart = selectionStart + selectionOptions.relativeStart;
          newCursorEnd = newCursorStart + selectionOptions.relativeLength;
        } else if (selectedText && !isSymbolReplacement) {
           newCursorStart = newCursorEnd = selectionStart + textToInsert.length
        } else {
           newCursorStart = selectionStart + templateStart.length
           newCursorEnd = isSymbolReplacement ? newCursorStart : newCursorStart + placeholder.length
        }
        editor.setSelectionRange(newCursorStart, newCursorEnd)
      };

      const isSuccess = document.execCommand('insertText', false, textToInsert)
      
      if (isSuccess) {
         setTimeout(() => {
            updateCursor(); 
         }, 0);
      } else {
        console.warn(
          'execCommand failed, falling back to state update (Undo not supported for this action).'
        )
        const newText =
          value.substring(0, selectionStart) + textToInsert + value.substring(selectionEnd)
        setText(newText)
        onContentChange?.(newText)
        setTimeout(() => {
          editor.focus()
          updateCursor()
        }, 0)
      }
    },
    [editorRef, onContentChange, setText]
  )

  const handleMathInsert = useCallback(
    (templateStart: string, templateEnd: string, placeholder: string, selectionOptions?: SelectionOptions) => {
      const editor = editorRef.current;
      if (!editor) return;
      
      const { selectionStart, selectionEnd, value } = editor;
      
      const inMath = isCursorInMath(value, selectionStart);
      
      let finalStart = templateStart;
      let finalEnd = templateEnd;
      let addedPrefixLength = 0;
      
      if (!inMath) {
        const { currentLine, lineStart, lineEnd } = getCurrentLineInfo(editor);
        const selectedText = value.substring(selectionStart, selectionEnd);
        const textBeforeSelection = value.substring(lineStart, selectionStart);
        const textAfterSelection = value.substring(selectionEnd, lineEnd);
        const isLineEmpty = currentLine.trim().length === 0;
        const isSelectionWholeLine = selectedText.length > 0 && 
                                     textBeforeSelection.trim().length === 0 && 
                                     textAfterSelection.trim().length === 0;

        if (isLineEmpty || isSelectionWholeLine) {
           const prefix = '$$\n';
           finalStart = prefix + templateStart;
           finalEnd = templateEnd + '\n$$';
           addedPrefixLength = prefix.length;
        } else {
           const prefix = '$';
           finalStart = prefix + templateStart;
           finalEnd = templateEnd + prefix;
           addedPrefixLength = prefix.length;
        }
      }

      const adjustedOptions = selectionOptions ? {
        relativeStart: selectionOptions.relativeStart + addedPrefixLength,
        relativeLength: selectionOptions.relativeLength
      } : undefined;

      handleSimpleInsert(finalStart, finalEnd, placeholder, adjustedOptions);
    },
    [handleSimpleInsert, editorRef, getCurrentLineInfo]
  );

  const handleIndent = useCallback(
    (action: 'indent' | 'outdent') => {
      const editor = editorRef.current
      if (!editor) return
      const { selectionStart, selectionEnd, value } = editor
      
      let startLineIndex = value.lastIndexOf('\n', selectionStart - 1) + 1
      let endLineIndex = selectionEnd
      
      if (endLineIndex > 0 && value[endLineIndex - 1] === '\n' && endLineIndex > startLineIndex) {
        endLineIndex -= 1
      }
      
      const selectedText = value.substring(startLineIndex, endLineIndex)
      const lines = selectedText.split('\n')
      const indentChars = indentCharacters
      let newLines: string[] = []
      let indentChange = 0 // 總字元數變化量
      
      if (action === 'indent') {
        newLines = lines.map((line) => {
          indentChange += indentChars.length
          return indentChars + line
        })
      } else {
        newLines = lines.map((line) => {
          if (line.startsWith(indentChars)) {
            indentChange -= indentChars.length
            return line.substring(indentChars.length)
          }
          if (line.startsWith('\t')) {
            indentChange -= 1
            return line.substring(1)
          }
          return line
        })
      }
      
      const newTextToInsert = newLines.join('\n')
      
      editor.focus()
      editor.setSelectionRange(startLineIndex, endLineIndex)
      document.execCommand('insertText', false, newTextToInsert)
      
      setTimeout(() => {
        editor.focus()
        const isSingleCursor = selectionStart === selectionEnd;

        if (isSingleCursor) {
            const newCursorPos = startLineIndex + newTextToInsert.length;
            editor.setSelectionRange(newCursorPos, newCursorPos);
        } else {
            const newLength = newTextToInsert.length
            editor.setSelectionRange(startLineIndex, startLineIndex + newLength)
        }
      }, 0)
    },
    [editorRef, indentCharacters]
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      const editor = editorRef.current;
      if (!editor) return;

      // 1. 快捷鍵
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey) {
        const key = e.key.toLowerCase();
        if (key === 'b') {
          e.preventDefault();
          handleSmartInline('**', 'bold');
          return;
        }
        if (key === 'i') {
          e.preventDefault();
          handleSmartInline('*', 'italic');
          return;
        }
        if (key === 's') {
          e.preventDefault();
          return;
        }
      }

      // 2. Tab 鍵
      if (e.key === 'Tab') {
        e.preventDefault();
        const { selectionStart, selectionEnd } = editor;
        
        if (selectionStart === selectionEnd && !e.shiftKey) {
           document.execCommand('insertText', false, indentCharacters);
           return;
        }
        
        if (e.shiftKey) {
          handleIndent('outdent');
        } else {
          handleIndent('indent');
        }
        return;
      }

      // 3. Enter 鍵
      if (e.key === 'Enter') {
        const { currentLine } = getCurrentLineInfo(editor);
        const match = currentLine.match(/^(\s*)([-*+]|\d+\.)\s+(\[[ x]\]\s)?/);
        
        if (match) {
          const content = currentLine.substring(match[0].length).trim();
          
          if (content === '') {
             e.preventDefault();
             const { lineStart, lineEnd } = getCurrentLineInfo(editor);
             editor.setSelectionRange(lineStart, lineEnd);
             document.execCommand('delete');
             return;
          }

          e.preventDefault();
          let nextPrefix = match[0];
          
          const numberMatch = match[2].match(/^(\d+)\./);
          if (numberMatch) {
             const currentNum = parseInt(numberMatch[1], 10);
             const newNumStr = `${currentNum + 1}.`;
             nextPrefix = nextPrefix.replace(match[2], newNumStr);
          }
          
          if (match[3]) {
             nextPrefix = nextPrefix.replace(/\[x\]/, '[ ]');
          }

          document.execCommand('insertText', false, '\n' + nextPrefix);
          return;
        }
      }

      // 4. 自動配對括號與引號
      const pairs: Record<string, string> = {
        '(': ')',
        '[': ']',
        '{': '}',
        '"': '"',
        "'": "'",
        '`': '`',
      };

      // 只有在 autoCloseBrackets 為 true 時才執行
      if (autoCloseBrackets && Object.keys(pairs).includes(e.key)) {
        e.preventDefault();
        const open = e.key;
        const close = pairs[open];
        const { selectionStart, selectionEnd, value } = editor;
        
        if (selectionStart !== selectionEnd) {
           const selectedText = value.substring(selectionStart, selectionEnd);
           document.execCommand('insertText', false, open + selectedText + close);
        } else {
           document.execCommand('insertText', false, open + close);
           editor.setSelectionRange(selectionStart + 1, selectionStart + 1);
        }
        return;
      }
      
      // 5. Backspace 智慧刪除
      if (autoCloseBrackets && e.key === 'Backspace') {
         const { selectionStart, selectionEnd, value } = editor;
         if (selectionStart === selectionEnd && selectionStart > 0) {
            const charBefore = value[selectionStart - 1];
            const charAfter = value[selectionStart];
            
            if (pairs[charBefore] === charAfter) {
               e.preventDefault();
               editor.setSelectionRange(selectionStart - 1, selectionStart + 1);
               document.execCommand('delete');
            }
         }
      }
    },
    // [FIXED] 絕對關鍵：autoCloseBrackets 必須在此陣列中，否則函式閉包會鎖死在舊值
    [editorRef, handleIndent, indentCharacters, getCurrentLineInfo, handleSmartInline, autoCloseBrackets]
  )

  return {
    handleSmartBlock,
    handleSmartInline,
    handleSimpleInsert,
    handleMathInsert, 
    handleIndent,
    handleTabKey: handleKeyDown,
  }
}

export type EditorActions = ReturnType<typeof useEditorActions>
export type SimpleInsert = SimpleInsertHandler