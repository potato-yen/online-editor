// src/App.tsx
// (REFACTORED)
// ... (所有舊功能)
// 21. (FIX) 修正 window.print() 邏輯，加入 .non-printable class

import React, { useState, useEffect, useRef } from 'react'
// (REMOVED) html2pdf.js 已不再需要
// import html2pdf from 'html2pdf.js' 
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
import SuperscriptModal from './components/SuperscriptModal'
import SubscriptModal from './components/SubscriptModal'
import MatrixModal from './components/MatrixModal' 

const DEFAULT_BACKEND_URL = 'http://localhost:3001/compile-latex'

function resolveBackendURL() {
  const envURL = import.meta.env.VITE_BACKEND_URL?.trim()
  if (envURL) {
    return envURL
  }

  if (typeof window !== 'undefined') {
    const origin = new URL(window.location.origin)
    origin.port = '3001'
    origin.pathname = '/compile-latex'
    origin.search = ''
    origin.hash = ''
    return origin.toString()
  }

  return DEFAULT_BACKEND_URL
}

const BACKEND_URL = resolveBackendURL()

declare global {
  interface Window {
    mermaid?: {
      initialize: (config: Record<string, unknown>) => void
      init: (config?: Record<string, unknown>, nodes?: Element | NodeListOf<Element> | string) => void
    }
  }
}

type AddFilePromptHandler = (docType: Mode) => Promise<string | null>
type AddFilePromptState = {
  docType: Mode
  defaultValue: string
}


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
  const [compileErrorLog, setCompileErrorLog] = useState<string>('')
  const [isCompiling, setIsCompiling] = useState(false)

  const [splitPos, setSplitPos] = useState(50)
  const [isResizing, setIsResizing] = useState(false)
  
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [isSuperscriptModalOpen, setIsSuperscriptModalOpen] = useState(false);
  const [isSubscriptModalOpen, setIsSubscriptModalOpen] = useState(false);
  const [isMatrixModalOpen, setIsMatrixModalOpen] = useState(false); 

  const containerRef = useRef<HTMLDivElement | null>(null)
  
  const previewRef = useRef<HTMLDivElement | null>(null)
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

  useEffect(() => {
    if (mode !== 'markdown') return
    const target = previewRef.current
    if (!target || !window.mermaid || typeof window.mermaid.init !== 'function') return
    try {
      window.mermaid.init(undefined, target.querySelectorAll('.mermaid'))
    } catch (err) {
      console.error('Mermaid render error:', err)
    }
  }, [renderedHTML, mode])


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
      // 情況 A: 多行文字 (例如 Table)
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
      // 情況 B: 單行文字 (例如 Math, KBD - 支援 Undo)
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
  // (CHANGED) 表格 Modal 的處理函式 (升級版)
  // ===================================================================
  const handleRequestTable = () => {
    setIsTableModalOpen(true);
  };
  const handleCreateTable = (tableData: string[][]) => { // (CHANGED) 接收二維陣列
    if (!editorRef.current) return;

    const rows = tableData.length;
    if (rows === 0) return;
    const cols = tableData[0]?.length;
    if (cols === 0) return;

    let table = '\n'; // 確保表格在新的一行
    
    // 1. 建立標頭 (Header)
    const headerLine = '| ' + tableData[0].join(' | ') + ' |';
    table += headerLine + '\n';

    // 2. 建立分隔線 (Separator)
    // (FIXED) 確保分隔線 `---` 至少有 3 個破折號
    const separatorLine = '|' + tableData[0].map(() => ' :--- ').join('|') + '|';
    table += separatorLine + '\n';

    // 3. 建立資料列 (Rows)
    for (let r = 1; r < rows; r++) { // (CHANGED) 從 1 開始
      table += '| ' + tableData[r].join(' | ') + ' |\n';
    }

    // 4. 準備自動反白
    const placeholder = tableData[0][0]; // "Header 1"
    const placeholderIndex = table.indexOf(placeholder);
    const templateStart = table.substring(0, placeholderIndex);
    const templateEnd = table.substring(placeholderIndex + placeholder.length);
    
    // 5. 呼叫 handleSimpleInsert (它現在會偵測到 \n 並使用 Fallback)
    handleSimpleInsert(templateStart, templateEnd, placeholder);
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
      setIsSuperscriptModalOpen(true);
    } else {
      const selectedText = value.substring(selectionStart, selectionEnd);
      const placeholder = 'exponent';
      const templateStart = `$${selectedText}^{`; 
      const templateEnd = `}$`; 
      const textToInsert = templateStart + placeholder + templateEnd; 
      editor.focus();
      editor.setSelectionRange(selectionStart, selectionEnd); 
      document.execCommand('insertText', false, textToInsert);
      setTimeout(() => {
        editor.focus();
        const newCursorStart = selectionStart + templateStart.length;
        const newCursorEnd = newCursorStart + placeholder.length;
        editor.setSelectionRange(newCursorStart, newCursorEnd);
      }, 0);
    }
  };
  const handleCreateSuperscript = (base: string, exponent: string) => {
    handleSimpleInsert(`$${base}^{${exponent}}$`, '', '');
    setIsSuperscriptModalOpen(false);
  };

  // 2. Subscript (下標)
  const handleRequestSubscript = () => {
    const editor = editorRef.current;
    if (!editor) return;
    const { selectionStart, selectionEnd, value } = editor;

    if (selectionStart === selectionEnd) {
      setIsSubscriptModalOpen(true);
    } else {
      const selectedText = value.substring(selectionStart, selectionEnd);
      const placeholder = 'index';
      const templateStart = `$${selectedText}_{`; 
      const templateEnd = `}$`; 
      const textToInsert = templateStart + placeholder + templateEnd; 

      editor.focus();
      editor.setSelectionRange(selectionStart, selectionEnd); 
      document.execCommand('insertText', false, textToInsert);

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
  // (FINAL FIX) 智慧型矩陣按鈕邏輯 (修正語法 + 自動反白 a_11)
  // ===================================================================
  const handleRequestMatrix = () => {
    setIsMatrixModalOpen(true);
  };
  
  // (CHANGED) 接收來自 Modal 的二維陣列
  const handleCreateMatrix = (matrixData: string[][]) => {
    const placeholder = matrixData[0][0]; // 這是我們將反白的第一個元素
    let matrixBody = '';
    const rows = matrixData.length;
    const cols = matrixData[0]?.length || 0;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        
        // 加上「&」分隔符 (除了第一欄)
        if (c > 0) {
          matrixBody += ' & ';
        }
        // 插入 Modal 傳來的元素值
        matrixBody += matrixData[r][c] || `a_{${r+1}${c+1}}`;
      }
      
      // (FINAL FIX) 移除所有 \n，只使用 LaTeX 換行符 \\
      if (r < rows - 1) {
        matrixBody += ' \\\\ '; 
      }
    }
    
    // (FINAL FIX) 確保所有內容都在「單行」傳遞給 handleSimpleInsert
    const templateStart = '$$\\begin{bmatrix}'; // (CHANGED) 使用 bmatrix
    
    // (FIXED) 找出 placeholder 在 matrixBody 中的位置
    const placeholderIndex = matrixBody.indexOf(placeholder);

    // (FIXED) templateStart 應該包含 placeholder 之前的所有內容
    const finalTemplateStart = templateStart + matrixBody.substring(0, placeholderIndex);
    
    // (FIXED) templateEnd 應該包含 placeholder 之後的所有內容
    const finalTemplateEnd = matrixBody.substring(placeholderIndex + placeholder.length) + '\\end{bmatrix}$$'; // (CHANGED) 使用 bmatrix
    
    // 呼叫 handleSimpleInsert (它現在是單行，會支援 Undo)
    handleSimpleInsert(finalTemplateStart, finalTemplateEnd, placeholder);
        
    setIsMatrixModalOpen(false);
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
    const indentChars = '    ';
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
        
        // (FIXED) 修正選取邏輯
        const newSelStart = (selectionStart === startLineIndex) ? startLineIndex : selectionStart + (action === 'indent' ? indentChars.length : -indentChars.length);
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
      window.removeEventListener('mouseup', handleMouseUp)
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

  // ===================================================================
  // (FIXED) 匯出 PDF 改用 window.print()，解決 html2canvas 跑版問題
  // ===================================================================
  const handleExportPDF = async () => {
    if (mode === 'latex') {
      alert("PDF 匯出僅適用於 Markdown 模式。\n請在 LaTeX 模式下使用 '編譯並預覽'，然後從 PDF 檢視器中下載。");
      return;
    }
    
    // 觸發瀏覽器內建的列印功能
    window.print();
  };

  // ---------- LaTeX 編譯 (組員的原始碼) ----------
  const handleCompileLatex = async () => {
    if (mode !== 'latex') return
    setIsCompiling(true)
    setCompileErrorLog('')
    setPdfURL('')
    try {
      const res = await fetch(BACKEND_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: text }),
      })
      const data = await res.json()
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid response from compile server')
      }
      if (!data.success) {
        setCompileErrorLog(data.errorLog || data.error || 'LaTeX 編譯失敗')
        return
      }
      if (!data.pdfBase64 || typeof data.pdfBase64 !== 'string') {
        throw new Error('PDF 資料缺失')
      }
      const byteCharacters = window.atob(data.pdfBase64)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i += 1) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      const blob = new Blob([byteArray], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      setPdfURL(url)
    } catch (err: any) {
      console.error(err)
      setCompileErrorLog(err?.message || 'LaTeX 編譯失敗')
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
      
      {/* (FIXED) 加上 non-printable class */}
      <div className="non-printable">
        <AppHeader
          mode={mode}
          isCompiling={isCompiling}
          saveStatus={saveStatus}
          onCompileLatex={handleCompileLatex}
          onExportSource={handleExportSource}
          onExportPDF={handleExportPDF}
          onManualSave={onManualSave}
          toolbarUI={headerToolbarUI} 
        />
      </div>

      {/* (FIXED) 加上 non-printable class */}
      <div className="non-printable">
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
        {/* (NEW) 渲染 Matrix Modal */}
        <MatrixModal
          isOpen={isMatrixModalOpen}
          onClose={() => setIsMatrixModalOpen(false)}
          onCreate={handleCreateMatrix}
        />
      </div>

      {/* (NEW) 頂部水平工具列 */}
      <div className="flex flex-wrap items-center gap-2 p-3 border-b border-neutral-800 bg-neutral-950/80 non-printable"> {/* (FIXED) 加上 non-printable */}
        {mode === 'markdown' ? (
          <MarkdownToolbar 
            onSimpleInsert={handleSimpleInsert}
            onSmartBlock={handleSmartBlock}
            onSmartInline={handleSmartInline}
            onRequestTable={handleRequestTable}
            onRequestSuperscript={handleRequestSuperscript}
            onRequestSubscript={handleRequestSubscript}
            onRequestMatrix={handleRequestMatrix} // (NEW)
          />
        ) : (
          <LatexToolbar 
            onSimpleInsert={handleSimpleInsert}
            onRequestSuperscript={handleRequestSuperscript}
            onRequestSubscript={handleRequestSubscript}
            onRequestMatrix={handleRequestMatrix} // (NEW)
          />
        )}
      </div>

      <div
        ref={containerRef}
        className="flex-1 flex flex-row overflow-hidden"
      >
        {/* (FIXED) 編輯區 Section 加上 non-printable */}
        <section 
          className="flex-1 flex flex-col non-printable" 
          style={{ width: leftWidth }}
        >
          <EditorPane
            mode={mode}
            text={text}
            onTextChange={handleTextChange}
            // (REMOVED) style 已移到父層
            editorRef={editorRef}
            onScroll={handleEditorScroll}
            onKeyDown={handleTabKey}
          />
        </section>

        {/* (FIXED) 拖曳條 加上 non-printable */}
        <div
          className="w-1 cursor-col-resize bg-neutral-900 hover:bg-neutral-700 transition-colors non-printable"
          onMouseDown={handleResizeStart}
        />

        {/* (REMOVED) 移除 printable-area class */}
        <div 
          style={{ width: rightWidth }} 
          className="flex-1 flex"
        >
          <PreviewPane
            mode={mode}
            renderedHTML={renderedHTML}
            pdfURL={pdfURL}
            errorLog={compileErrorLog}
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
type AppRouterWrapperProps = {
  openAddFilePrompt: AddFilePromptHandler
}

function AppRouterWrapper({ openAddFilePrompt }: AppRouterWrapperProps) {
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
      <Route
        path="/projects"
        element={<ProjectListPage openAddFilePrompt={openAddFilePrompt} />}
      />

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
  const [promptState, setPromptState] = useState<AddFilePromptState | null>(null)
  const [promptValue, setPromptValue] = useState('')
  const resolverRef = useRef<((value: string | null) => void) | null>(null)

  const closePrompt = (result: string | null) => {
    const resolver = resolverRef.current
    resolverRef.current = null
    setPromptState(null)
    setPromptValue('')
    if (resolver) {
      resolver(result)
    }
  }

  const openAddFilePrompt: AddFilePromptHandler = (docType) => {
    const defaultValue =
      docType === 'markdown' ? '未命名(md)文檔' : '未命名(tex)文檔'
    if (resolverRef.current) {
      resolverRef.current(null)
    }
    return new Promise<string | null>((resolve) => {
      resolverRef.current = resolve
      setPromptState({ docType, defaultValue })
      setPromptValue(defaultValue)
    })
  }

  const handlePromptConfirm = () => {
    if (!promptState) return
    const trimmed = promptValue.trim() || promptState.defaultValue
    closePrompt(trimmed)
  }

  const handlePromptCancel = () => {
    closePrompt(null)
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      handlePromptConfirm()
    } else if (event.key === 'Escape') {
      event.preventDefault()
      handlePromptCancel()
    }
  }

  const promptDescription =
    promptState?.docType === 'markdown' ? '.md' : '.tex'

  return (
    <>
      <BrowserRouter>
        <AppRouterWrapper openAddFilePrompt={openAddFilePrompt} />
      </BrowserRouter>

      {promptState && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4"
          onClick={handlePromptCancel}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-neutral-900 border border-neutral-700 p-5 text-neutral-100 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold mb-2">
              {promptState.docType === 'markdown'
                ? '新增 Markdown 檔案'
                : '新增 LaTeX 檔案'}
            </h2>
            <p className="text-xs text-neutral-400 mb-4">
              請輸入新檔案名稱，系統會自動加上 {promptDescription} 副檔名。
            </p>
            <label className="text-[11px] uppercase tracking-wide text-neutral-500 mb-1 block">
              File name
            </label>
            <input
              autoFocus
              value={promptValue}
              onChange={(e) => setPromptValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-neutral-300"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={handlePromptCancel}
                className="px-3 py-1.5 rounded-full border border-neutral-700 text-xs text-neutral-200 hover:bg-neutral-800"
              >
                取消
              </button>
              <button
                onClick={handlePromptConfirm}
                className="px-3 py-1.5 rounded-full bg-neutral-100 text-neutral-900 text-xs font-semibold hover:bg-white"
              >
                建立
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
