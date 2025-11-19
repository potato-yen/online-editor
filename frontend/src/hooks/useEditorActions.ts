import { useCallback, useMemo } from 'react'
import type React from 'react'

type UseEditorActionsOptions = {
  editorRef: React.RefObject<HTMLTextAreaElement>
  onContentChange?: (text: string) => void
  setText: React.Dispatch<React.SetStateAction<string>>
  indentSize?: number
}

type SimpleInsertHandler = (
  templateStart: string,
  templateEnd: string,
  placeholder: string
) => void

type SmartBlockType = 'heading' | 'list' | 'quote' | 'task'

export function useEditorActions({
  editorRef,
  onContentChange,
  setText,
  indentSize = 4,
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
    (templateStart, templateEnd, placeholder) => {
      const editor = editorRef.current
      if (!editor) return
      const { selectionStart, selectionEnd, value } = editor
      const selectedText = value.substring(selectionStart, selectionEnd)
      const textToInsert = selectedText
        ? templateStart + selectedText + templateEnd
        : templateStart + placeholder + templateEnd
      const isMultiLine = textToInsert.includes('\n')
      editor.focus()
      if (isMultiLine) {
        console.warn(
          'Forcing state update for multi-line insert (Undo not supported for this action).'
        )
        const newText =
          value.substring(0, selectionStart) + textToInsert + value.substring(selectionEnd)
        setText(newText)
        onContentChange?.(newText)
        setTimeout(() => {
          editor.focus()
          let newCursorStart: number
          let newCursorEnd: number
          if (selectedText) {
            newCursorStart = newCursorEnd = selectionStart + textToInsert.length
          } else {
            newCursorStart = selectionStart + templateStart.length
            newCursorEnd = newCursorStart + placeholder.length
          }
          editor.setSelectionRange(newCursorStart, newCursorEnd)
        }, 0)
      } else {
        const isSuccess = document.execCommand('insertText', false, textToInsert)
        if (isSuccess && !selectedText) {
          const newCursorStart = selectionStart + templateStart.length
          const newCursorEnd = newCursorStart + placeholder.length
          editor.setSelectionRange(newCursorStart, newCursorEnd)
        }
        if (!isSuccess) {
          console.warn(
            'execCommand failed, falling back to state update (Undo not supported for this action).'
          )
          const newText =
            value.substring(0, selectionStart) + textToInsert + value.substring(selectionEnd)
          setText(newText)
          onContentChange?.(newText)
        }
      }
    },
    [editorRef, onContentChange, setText]
  )

  const handleIndent = useCallback(
    (action: 'indent' | 'outdent') => {
      const editor = editorRef.current
      if (!editor) return
      const { selectionStart, selectionEnd, value } = editor
      const isSingleCaret = selectionStart === selectionEnd
      if (isSingleCaret && !value.substring(selectionStart, selectionEnd).includes('\n')) {
        return
      }
      let startLineIndex = value.lastIndexOf('\n', selectionStart - 1) + 1
      let endLineIndex = selectionEnd
      if (value[endLineIndex - 1] === '\n') {
        endLineIndex -= 1
      }
      const selectedText = value.substring(startLineIndex, endLineIndex)
      const lines = selectedText.split('\n')
      const indentChars = indentCharacters
      let newLines: string[] = []
      let indentChange = 0
      if (action === 'indent') {
        newLines = lines.map((line) => {
          if (line.trim().length > 0) {
            indentChange += indentChars.length
            return indentChars + line
          }
          return line
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
        const newSelStart =
          selectionStart === startLineIndex
            ? startLineIndex
            : selectionStart + (action === 'indent' ? indentChars.length : -indentChars.length)
        const newSelEnd = selectionEnd + indentChange
        editor.setSelectionRange(newSelStart, newSelEnd)
      }, 0)
    },
    [editorRef, indentCharacters]
  )

  const handleTabKey = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key !== 'Tab') return
      e.preventDefault()
      const editor = editorRef.current
      if (!editor) return
      const { selectionStart, selectionEnd } = editor
      if (selectionStart === selectionEnd && !e.shiftKey) {
        document.execCommand('insertText', false, indentCharacters)
        return
      }
      if (e.shiftKey) {
        handleIndent('outdent')
      } else {
        handleIndent('indent')
      }
    },
    [editorRef, handleIndent, indentCharacters]
  )

  return {
    handleSmartBlock,
    handleSmartInline,
    handleSimpleInsert,
    handleIndent,
    handleTabKey,
  }
}

export type EditorActions = ReturnType<typeof useEditorActions>
export type SimpleInsert = SimpleInsertHandler
