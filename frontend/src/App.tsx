// src/App.tsx
// (REFACTORED)
// ... (所有舊功能)
// 16. (FIXED) 升級 Superscript/Subscript 按鈕，支援 Modal (無選取) 和 Wrap (有選取)

import React, { useState, useEffect, useRef } from 'react'
import html2pdf from 'html2pdf.js'
import { renderMarkdownToHTML } from './markdownRenderer'
import 'katex/dist/katex.min.css'
import 'highlight.js/styles/atom-one-dark.css'; 

import AppHeader from './components/AppHeader'
import EditorPane from './components/EditorPane'
import PreviewPane from './components/PreviewPane'

import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom' 
import ProjectListPage from './pages/ProjectListPage'
import MarkdownEditorPage from './pages/MarkdownEditorPage'
import LatexEditorPage from './pages/LatexEditorPage'

import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'

// 匯入我們拆分出去的檔案
import { Mode, SaveStatus } from './types' 
import MarkdownToolbar from './components/MarkdownToolbar'
import LatexToolbar from './components/LatexToolbar'
import TableModal from './components/TableModal' 
// (NEW) 匯入新的數學 Modals
import SuperscriptModal from './components/SuperscriptModal'
import SubscriptModal from './components/SubscriptModal'

const BACKEND_URL = 'http://localhost:3001/compile-latex'


// ===================================================================
// (MERGED) EditorCore - 這是新的「大腦」
// ===================================================================
type EditorCoreProps = {
  initialMode: Mode
  initialText?: string
  saveStatus?: SaveStatus
  onContentChange?: (text: string) => void
  onManualSave?: () => void
  headerToolbarUI?: React.ReactNode 
}

export function EditorCore({
  initialMode,
  initialText,
  saveStatus = 'idle',
  onContentChange,
  onManualSave,
  headerToolbarUI, 
}: EditorCoreProps) {
  const [mode, setMode] = useState<Mode>(initialMode)
  const defaultText = [
    '% Example Markdown or LaTeX input',
    '# 標題 Title',
    '這是一段 **Markdown** 文字。',
    '$a^2 + b^2 = c^2$'
  ].join('\n')

  const [text, setText] = useState<string>(() => initialText ?? defaultText)
  const [renderedHTML, setRenderedHTML] = useState<string>('')
  const [pdfURL, setPdfURL] = useState<string>('')
  const [compileError, setCompileError] = useState<string>('')
  const [isCompiling, setIsCompiling] = useState(false)

  const [splitPos, setSplitPos] = useState(50)
  const [isResizing, setIsResizing] = useState(false)
  
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  // (NEW) 新增數學 Modals 的 State
  const [isSuperscriptModalOpen, setIsSuperscriptModalOpen] = useState(false);
  const [isSubscriptModalOpen, setIsSubscriptModalOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null)
  
  const previewRef = useRef<HTMLDivElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const editorRef = useRef<HTMLTextAreaElement | null>(null) 
  
  const isEditorScrolling = useRef(false);
  const editorScrollTimer = useRef<NodeJS.Timeout | null>(null);
  const editorLineHeight = useRef(22); 
  
  const isAtBottomRef = useRef(false);


  useEffect(() => {
    if (editorRef.current) {
      const style = window.getComputedStyle(editorRef.current);
      const lh = parseFloat(style.lineHeight);
      if (!isNaN(lh) && lh > 0) {
        editorLineHeight.current = lh;
      }
    }
  }, [editorRef.current]);

  // ---------- Markdown render ----------
  useEffect(() => {
    if (mode !== 'markdown') return

    let cancelled = false
      ; (async () => {
        try {
          const html = await renderMarkdownToHTML(text)
          if (!cancelled) {
            setRenderedHTML(html)
          }
        } catch (err) {
          console.error('Markdown render error:', err)
        }
      })()
    return () => {
      cancelled = true
    }
  }, [mode, text]) 

  // (NEW) 修復「自動滾動到底部」的 Effect
  useEffect(() => {
    if (mode === 'markdown' && isAtBottomRef.current && previewRef.current) {
      previewRef.current.scrollTo({ 
        top: previewRef.current.scrollHeight, 
        behavior: 'auto' 
      });
      isAtBottomRef.current = false;
    }
  }, [renderedHTML, mode]); 


  // ===================================================================
  // (MERGED & UPGRADED) 我們的核心函式
  // ===================================================================

  // ---------- (NEW) 輔助函式：取得目前游標所在的「行」資訊 ----------
  const getCurrentLineInfo = (editor: HTMLTextAreaElement) => {
    const { value, selectionStart } = editor;
    let lineStart = selectionStart;
    while (lineStart > 0 && value[lineStart - 1] !== '\n') {
      lineStart--;
    }
    let lineEnd = selectionStart;
    while (lineEnd < value.length && value[lineEnd] !== '\n') {
      lineEnd++;
    }
    const currentLine = value.substring(lineStart, lineEnd);
    return { currentLine, lineStart, lineEnd };
  };
  
  // ---------- (NEW) 輔助函式：定義區塊前綴 (Prefixes) ----------
  const blockPrefixes = {
    heading: /^(#+\s)/,
    list: /^(\* \s|1\. \s)/,
    quote: /^(> \s)/,
    task: /^(\* \[\s\] \s)/,
  };
  
  const allBlockPrefixRegex = /^(#+\s|> \s|\* \s|1\. \s|\* \[\s\] \s)/;

  
  // ===================================================================
  // (UPGRADED) 智慧型區塊按鈕 (H1, List...) - 支援 Toggle & Replace
  // ===================================================================
  function handleSmartBlock(
    newPrefix: string,
    type: 'heading' | 'list' | 'quote' | 'task'
  ) {
    const editor = editorRef.current;
    if (!editor) return;
    const { selectionStart, selectionEnd } = editor;
    const { currentLine, lineStart, lineEnd } = getCurrentLineInfo(editor);
    let oldPrefix = '';
    let replacement = '';
    let isToggleOff = false;
    if (currentLine.startsWith(newPrefix)) {
      isToggleOff = true;
      oldPrefix = newPrefix;
      replacement = currentLine.substring(newPrefix.length);
    } else {
      isToggleOff = false;
      const match = currentLine.match(allBlockPrefixRegex);
      if (match) {
        oldPrefix = match[1];
        replacement = newPrefix + currentLine.substring(oldPrefix.length);
      } else {
        oldPrefix = '';
        replacement = newPrefix + currentLine;
      }
    }
    editor.focus();
    editor.setSelectionRange(lineStart, lineEnd);
    document.execCommand('insertText', false, replacement);
    setTimeout(() => {
      editor.focus();
      const finalSelStart = isToggleOff ? lineStart : (lineStart + newPrefix.length);
      const finalSelEnd = lineStart + replacement.length;
      if (selectionEnd > selectionStart) {
        const prefixLengthChange = (isToggleOff ? -oldPrefix.length : newPrefix.length - oldPrefix.length);
        if (selectionStart >= lineStart && selectionEnd <= lineEnd) {
          editor.setSelectionRange(
            selectionStart + prefixLengthChange, 
            selectionEnd + prefixLengthChange
          );
        } else {
           editor.setSelectionRange(finalSelStart, finalSelEnd);
        }
      } else {
         editor.setSelectionRange(finalSelStart, finalSelEnd);
      }
    }, 0);
  }


  // ===================================================================
  // (UPGRADED) 智慧型行內按鈕 (Bold, Italic...) - 支援 Toggle
  // ===================================================================
  function handleSmartInline(
    wrapChars: string,
    placeholder: string
  ) {
    const editor = editorRef.current;
    if (!editor) return;
    const { selectionStart, selectionEnd, value } = editor;
    const selectedText = value.substring(selectionStart, selectionEnd);
    const wrapLen = wrapChars.length;
    const preText = value.substring(selectionStart - wrapLen, selectionStart);
    const postText = value.substring(selectionEnd, selectionEnd + wrapLen);
    let replacement = '';
    let finalSelStart = 0;
    let finalSelEnd = 0;
    if (preText === wrapChars && postText === wrapChars && selectedText) {
      replacement = selectedText;
      editor.setSelectionRange(selectionStart - wrapLen, selectionEnd + wrapLen);
      finalSelStart = selectionStart - wrapLen;
      finalSelEnd = finalSelStart + selectedText.length;
    } else {
      const textToInsert = selectedText ? selectedText : placeholder;
      replacement = wrapChars + textToInsert + wrapChars;
      editor.setSelectionRange(selectionStart, selectionEnd);
      finalSelStart = selectionStart + wrapLen;
      finalSelEnd = finalSelStart + textToInsert.length;
    }
    editor.focus();
    document.execCommand('insertText', false, replacement);
    setTimeout(() => {
      editor.focus();
      editor.setSelectionRange(finalSelStart, finalSelEnd);
    }, 0);
  }

  // ===================================================================
  // (UPGRADED) 簡單插入按鈕 (支援多行文字 `\n`)
  // ===================================================================
  function handleSimpleInsert(
    templateStart: string,
    templateEnd: string,
    placeholder: string
  ) {
    const editor = editorRef.current;
    if (!editor) return;

    const { selectionStart, selectionEnd, value } = editor;
    const selectedText = value.substring(selectionStart, selectionEnd);
    const textToInsert = selectedText
      ? templateStart + selectedText + templateEnd
      : templateStart + placeholder + templateEnd;

    const isMultiLine = textToInsert.includes('\n');
    editor.focus();

    if (isMultiLine) {
      // 情況 A: 多行文字 (例如 Matrix Env)
      console.warn("Forcing state update for multi-line insert (Undo not supported for this action).");
      const newText =
        value.substring(0, selectionStart) +
        textToInsert +
        value.substring(selectionEnd);
      setText(newText);
      onContentChange?.(newText);
      setTimeout(() => {
        editor.focus();
        let newCursorStart, newCursorEnd;
        if (selectedText) {
          newCursorStart = newCursorEnd = selectionStart + textToInsert.length;
        } else {
          newCursorStart = selectionStart + templateStart.length;
          newCursorEnd = newCursorStart + placeholder.length;
        }
        editor.setSelectionRange(newCursorStart, newCursorEnd);
      }, 0);

    } else {
      // 情況 B: 單行文字 (支援 Undo)
      const isSuccess = document.execCommand('insertText', false, textToInsert);
      if (isSuccess && !selectedText) {
        const newCursorStart = selectionStart + templateStart.length;
        const newCursorEnd = newCursorStart + placeholder.length;
        editor.setSelectionRange(newCursorStart, newCursorEnd);
      }
      if (!isSuccess) {
        console.warn("execCommand failed, falling back to state update (Undo not supported for this action).");
        const newText =
          value.substring(0, selectionStart) +
          textToInsert +
          value.substring(selectionEnd);
        setText(newText);
        onContentChange?.(newText);
      }
    }
  }


  // ===================================================================
  // (NEW) 表格 Modal 的處理函式
  // ===================================================================
  const handleRequestTable = () => {
    setIsTableModalOpen(true);
  };
  const handleCreateTable = (rows: number, cols: number) => {
    if (!editorRef.current) return;
    let table = '\n|';
    for (let c = 0; c < cols; c++) {
      table += ` Header ${c + 1} |`;
    }
    table += '\n|';
    for (let c = 0; c < cols; c++) {
      table += ' :--- |';
    }
    for (let r = 0; r < rows; r++) {
      table += '\n|';
      for (let c = 0; c < cols; c++) {
        table += ` Cell ${r + 1}-${c + 1} |`;
      }
    }
    table += '\n';
    handleSimpleInsert(table, '', '');
    setIsTableModalOpen(false);
  };

  // ===================================================================
  // (FIXED) 智慧型數學按鈕邏輯
  // ===================================================================
  // 1. Superscript (上標)
  const handleRequestSuperscript = () => {
    const editor = editorRef.current;
    if (!editor) return;
    const { selectionStart, selectionEnd, value } = editor;

    if (selectionStart === selectionEnd) {
      // 情況 1: 沒有選取 -> 開啟 Modal
      setIsSuperscriptModalOpen(true);
    } else {
      // 情況 2: 有選取 (e.g., "x") -> 直接插入 $x^{exponent}$
      const selectedText = value.substring(selectionStart, selectionEnd);
      const placeholder = 'exponent';
      const templateStart = `$${selectedText}^{`; // e.g., $x^{
      const templateEnd = `}$`; // e.g., }$
      const textToInsert = templateStart + placeholder + templateEnd; // e.g., $x^{exponent}$

      // 執行插入 (替換掉 "x")
      editor.focus();
      editor.setSelectionRange(selectionStart, selectionEnd); 
      document.execCommand('insertText', false, textToInsert);

      // 恢復選取 (選取 "exponent")
      setTimeout(() => {
        editor.focus();
        const newCursorStart = selectionStart + templateStart.length;
        const newCursorEnd = newCursorStart + placeholder.length;
        editor.setSelectionRange(newCursorStart, newCursorEnd);
      }, 0);
    }
  };
  const handleCreateSuperscript = (base: string, exponent: string) => {
    // Modal 建立的永遠是「完整」的 $...$ 區塊
    handleSimpleInsert(`$${base}^{${exponent}}$`, '', '');
    setIsSuperscriptModalOpen(false);
  };

  // 2. Subscript (下標)
  const handleRequestSubscript = () => {
    const editor = editorRef.current;
    if (!editor) return;
    const { selectionStart, selectionEnd, value } = editor;

    if (selectionStart === selectionEnd) {
      // 情況 1: 沒有選取 -> 開啟 Modal
      setIsSubscriptModalOpen(true);
    } else {
      // 情況 2: 有選取 (e.g., "x") -> 直接插入 $x_{index}$
      const selectedText = value.substring(selectionStart, selectionEnd);
      const placeholder = 'index';
      const templateStart = `$${selectedText}_{`; // e.g., $x_{
      const templateEnd = `}$`; // e.g., }$
      const textToInsert = templateStart + placeholder + templateEnd; // e.g., $x_{index}$

      // 執行插入 (替換掉 "x")
      editor.focus();
      editor.setSelectionRange(selectionStart, selectionEnd); 
      document.execCommand('insertText', false, textToInsert);

      // 恢復選取 (選取 "index")
      setTimeout(() => {
        editor.focus();
        const newCursorStart = selectionStart + templateStart.length;
        const newCursorEnd = newCursorStart + placeholder.length;
        editor.setSelectionRange(newCursorStart, newCursorEnd);
      }, 0);
    }
  };
  const handleCreateSubscript = (base: string, index: string) => {
    handleSimpleInsert(`$${base}_{${index}}$`, '', '');
    setIsSubscriptModalOpen(false);
  };


  // ===================================================================
  // (NEW) 巢狀清單縮排/取消縮排的核心邏輯
  // ===================================================================
  function handleIndent(action: 'indent' | 'outdent') {
    const editor = editorRef.current;
    if (!editor) return;

    const { selectionStart, selectionEnd, value } = editor;
    
    const isSingleCaret = selectionStart === selectionEnd;
    
    if (isSingleCaret && !value.substring(selectionStart, selectionEnd).includes('\n')) {
        return; 
    }
    
    let startLineIndex = value.lastIndexOf('\n', selectionStart - 1) + 1;
    let endLineIndex = selectionEnd;
    
    if (value[endLineIndex - 1] === '\n') {
        endLineIndex -= 1;
    }

    const selectedText = value.substring(startLineIndex, endLineIndex);
    const lines = selectedText.split('\n');
    const indentChars = '    '; // 4 個空格

    let newLines = [];
    let indentChange = 0; 

    if (action === 'indent') {
      newLines = lines.map(line => {
        if (line.trim().length > 0) {
            indentChange += indentChars.length;
            return indentChars + line;
        }
        return line;
      });
    } else {
      newLines = lines.map(line => {
        if (line.startsWith(indentChars)) {
          indentChange -= indentChars.length;
          return line.substring(indentChars.length);
        }
        if (line.startsWith('\t')) {
          indentChange -= 1;
          return line.substring(1);
        }
        return line;
      });
    }

    const newTextToInsert = newLines.join('\n');
    
    editor.focus();
    editor.setSelectionRange(startLineIndex, endLineIndex);
    document.execCommand('insertText', false, newTextToInsert);

    setTimeout(() => {
        editor.focus();
        
        const newSelStart = selectionStart + indentChange;
        const newSelEnd = selectionEnd + indentChange;

        editor.setSelectionRange(newSelStart, newSelEnd);

    }, 0);
  }
  
  // ===================================================================
  // (MODIFIED) Scroll Sync 邏輯 (只保留單向)
  // ===================================================================
  const handleEditorScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (isEditorScrolling.current) return;
    isEditorScrolling.current = true;
    if (editorScrollTimer.current) clearTimeout(editorScrollTimer.current);
    editorScrollTimer.current = setTimeout(() => { isEditorScrolling.current = false; }, 150);
    const editor = e.currentTarget;
    const preview = previewRef.current;
    if (!preview) return;
    const scrollBuffer = editorLineHeight.current * 2; 
    const isAtBottom = editor.scrollTop + editor.clientHeight >= editor.scrollHeight - scrollBuffer;
    if (isAtBottom) {
      preview.scrollTo({ top: preview.scrollHeight, behavior: 'auto' });
      return;
    }
    const topLine = Math.floor(editor.scrollTop / editorLineHeight.current + 0.5) + 1;
    const elements = Array.from(preview.querySelectorAll('[data-line]')) as HTMLElement[];
    if (elements.length === 0) return;
    let bestMatch: HTMLElement | null = null;
    let nextMatch: HTMLElement | null = null;
    for (const el of elements) {
      const line = parseInt(el.dataset.line || '0', 10);
      if (line <= topLine) {
        bestMatch = el;
      } else {
        nextMatch = el;
        break; 
      }
    }
    if (!bestMatch) {
      preview.scrollTo({ top: 0, behavior: 'auto' });
      return;
    }
    const previewContainerTop = preview.getBoundingClientRect().top;
    const bestMatchTop = bestMatch.getBoundingClientRect().top - previewContainerTop + preview.scrollTop;
    const bestMatchLine = parseInt(bestMatch.dataset.line || '0', 10);
    if (!nextMatch) {
      preview.scrollTo({ top: bestMatchTop, behavior: 'auto' });
      return;
    }
    const nextMatchLine = parseInt(nextMatch.dataset.line || '0', 10);
    const nextMatchTop = nextMatch.getBoundingClientRect().top - previewContainerTop + preview.scrollTop;
    if (bestMatchLine === nextMatchLine) {
        preview.scrollTo({ top: bestMatchTop, behavior: 'auto' });
        return;
    }
    const editorBlockPercent = (topLine - bestMatchLine) / (nextMatchLine - bestMatchLine);
    const previewScrollTop = bestMatchTop + (nextMatchTop - bestMatchTop) * editorBlockPercent;
    preview.scrollTo({ top: previewScrollTop - 10, behavior: 'auto' }); 
  };

  // ---------- Split pane dragging (組員的原始碼) ----------
  useEffect(() => {
    function handleMouseMove(e: MouseEvent) {
      if (!isResizing || !containerRef.current) return
      
      const rect = containerRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left; 
      const containerContentWidth = rect.width;
      if (containerContentWidth <= 0) return; 

      const percent = (x / containerContentWidth) * 100 
      const clamped = Math.min(80, Math.max(20, percent))
      setSplitPos(clamped)
    }
    function handleMouseUp() {
      if (isResizing) setIsResizing(false)
    }
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [isResizing])

  const handleResizeStart = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsResizing(true)
  }

  // (MODIFIED) handleTextChange (加入 isAtBottom 檢查)
  const handleTextChange = (newText: string) => {
    const editor = editorRef.current;
    if (editor && mode === 'markdown') {
      const scrollBuffer = editorLineHeight.current * 2;
      isAtBottomRef.current = editor.scrollTop + editor.clientHeight >= editor.scrollHeight - scrollBuffer;
    }
    setText(newText)
    onContentChange?.(newText)
  }

  // ---------- Import .md / .tex (組員的原始碼) ----------
  const handleImportClick = () => {
    fileInputRef.current?.click()
  }
  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const fileName = file.name.toLowerCase()
    const reader = new FileReader()
    reader.onload = (evt) => {
      const fileContent = evt.target?.result as string | null
      if (fileContent == null) {
        console.error('Failed to read file: content is null')
        setCompileError('讀取檔案失敗：內容為空')
        return
      }
      setText(fileContent)
      onContentChange?.(fileContent)
      setCompileError('')
    }
    reader.onerror = (err) => {
      console.error('File read error:', err)
      setCompileError('讀取檔案失敗')
    }
    reader.readAsText(file, 'utf-8')
    if (e.target) {
      e.target.value = '';
    }
  }

  // ---------- 匯出原始檔 (組員的原始碼) ----------
  const handleExportSource = () => {
    const ext = mode === 'latex' ? 'tex' : 'md'
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `document.${ext}`
    a.click()
    URL.revokeObjectURL(url)
  }

  // (FIXED) 匯出 PDF（智慧型換頁）
  const handleExportPDF = async () => {
    if (mode === 'latex') {
      return
    }
    if (!renderedHTML || !renderedHTML.trim()) {
      return
    }
    const wrapper = document.createElement('div')
    wrapper.className = 'pdf-export prose prose-neutral'
    wrapper.innerHTML = renderedHTML
    document.body.appendChild(wrapper)
    const opt = {
      margin: 10,
      filename: 'document.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      },
      jsPDF: {
        unit: 'mm',
        format: 'a4',
        orientation: 'portrait',
      },
      pagebreak: {
        mode: ['avoid-all', 'css', 'legacy'],
        avoid: ['p', 'li', 'pre', 'code', 'table', 'blockquote', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'img', 'hr'],
      },
    }
    try {
      await (html2pdf() as any).set(opt as any).from(wrapper).save()
    } finally {
      document.body.removeChild(wrapper)
    }
  }

  // ---------- LaTeX 編譯 (組員的原始碼) ----------
  const handleCompileLatex = async () => {
    if (mode !== 'latex') return
    setIsCompiling(true)
    setCompileError('')
    setPdfURL('')
    try {
      const res = await fetch(BACKEND_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: text }),
      })
      if (!res.ok) {
        const msg = await res.text()
        throw new Error(msg || `HTTP ${res.status}`)
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      setPdfURL(url)
    } catch (err: any) {
      console.error(err)
      setCompileError(err?.message || 'LaTeX 編譯失敗')
    } finally {
      setIsCompiling(false)
    }
  }

  // (NEW) Tab 按鍵處理邏輯 (取代原本的按鈕)
  const handleTabKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
        e.preventDefault(); 
        const editor = editorRef.current;
        if (!editor) return;
        const { selectionStart, selectionEnd } = editor;
        if (selectionStart === selectionEnd && !e.shiftKey) {
            document.execCommand('insertText', false, '    ');
            return;
        }
        if (e.shiftKey) {
            handleIndent('outdent');
        } else {
            handleIndent('indent');
        }
    }
  };

  const leftWidth = `${splitPos}%`
  const rightWidth = `${100 - splitPos}%`

  // ===================================================================
  // (CHANGED) EditorCore 的 Return JSX (版面大改動)
  // ===================================================================
  return (
    <div className="flex h-screen flex-col bg-neutral-950 text-neutral-100 overflow-hidden"> 
      <AppHeader
        mode={mode}
        isCompiling={isCompiling}
        saveStatus={saveStatus}
        onImportClick={handleImportClick}
        onCompileLatex={handleCompileLatex}
        onExportSource={handleExportSource}
        onExportPDF={handleExportPDF}
        onManualSave={onManualSave}
        toolbarUI={headerToolbarUI} 
      />

      {/* (NEW) 渲染 Table Modal (它預設是隱藏的) */}
      <TableModal 
        isOpen={isTableModalOpen}
        onClose={() => setIsTableModalOpen(false)}
        onCreate={handleCreateTable}
      />
      {/* (NEW) 渲染 Superscript Modal */}
      <SuperscriptModal
        isOpen={isSuperscriptModalOpen}
        onClose={() => setIsSuperscriptModalOpen(false)}
        onCreate={handleCreateSuperscript}
      />
      {/* (NEW) 渲染 Subscript Modal */}
      <SubscriptModal
        isOpen={isSubscriptModalOpen}
        onClose={() => setIsSubscriptModalOpen(false)}
        onCreate={handleCreateSubscript}
      />

      <input
        ref={fileInputRef}
        type="file"
        accept=".md,.txt,.tex"
        className="hidden"
        onChange={handleFileImport}
      />

      <div className="flex flex-wrap items-center gap-2 p-3 border-b border-neutral-800 bg-neutral-950/80">
        {mode === 'markdown' ? (
          <MarkdownToolbar 
            onSimpleInsert={handleSimpleInsert}
            onSmartBlock={handleSmartBlock}
            onSmartInline={handleSmartInline}
            onRequestTable={handleRequestTable}
            onRequestSuperscript={handleRequestSuperscript} // (NEW)
            onRequestSubscript={handleRequestSubscript}   // (NEW)
          />
        ) : (
          <LatexToolbar 
            onSimpleInsert={handleSimpleInsert}
            onRequestSuperscript={handleRequestSuperscript} // (NEW)
            onRequestSubscript={handleRequestSubscript}   // (NEW)
          />
        )}
      </div>

      <div
        ref={containerRef}
        className="flex-1 flex flex-row overflow-hidden"
      >
        <EditorPane
          mode={mode}
          text={text}
          onTextChange={handleTextChange}
          style={{ width: leftWidth }}
          editorRef={editorRef}
          onScroll={handleEditorScroll}
          onKeyDown={handleTabKey}
        />

        <div
          className="w-1 cursor-col-resize bg-neutral-900 hover:bg-neutral-700 transition-colors"
          onMouseDown={handleResizeStart}
        />

        <div style={{ width: rightWidth }} className="flex-1 flex">
          <PreviewPane
            mode={mode}
            renderedHTML={renderedHTML}
            pdfURL={pdfURL}
            compileError={compileError}
            previewRef={previewRef}
          />
        </div>
      </div>
    </div>
  )
}

// ===================================================================
// (Original) App 路由 (已修正 Context 錯誤)
// ===================================================================

// (CHANGED) 輔助元件，用於提供 useLocation 的 context
function AppRouterWrapper() {
  const location = useLocation(); // (NEW) 取得 location 物件

  // (NEW) 每次路由變化時，捲動到頂部 (修復 BFCache)
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    // (REMOVED) 移除 key={location.key}，因為它太暴力了
    <Routes>
      {/* 首頁先導到 /login */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Auth */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      {/* 專案列表 */}
      <Route path="/projects" element={<ProjectListPage />} />

      {/* 不同編輯器 */}
      <Route path="/editor/md/:id" element={<MarkdownEditorPage />} />
      <Route path="/editor/tex/:id" element={<LatexEditorPage />} />

      {/* 兜底：亂打路徑導回登入 */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

// (CHANGED) 導出預設元件，只負責提供 <BrowserRouter>
export default function App() {
  return (
    <BrowserRouter>
      <AppRouterWrapper />
    </BrowserRouter>
  );
}