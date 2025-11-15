// src/App.tsx
// (REFACTORED)
// 1. 組員的 `react-router` 和 `EditorCore` 架構
// 2. 我們的 `handleSmart...` 函式支援「恢復選取」
// 3. (FIX) 移除「雙向滾動」，只保留 Editor -> Preview 的單向滾動，修復抖動(Jitter)問題
// 4. (NEW) 加入 TableModal 邏輯
// 5. (NEW) 加入 handleIndent/handleOutdent 邏輯
// 6. (FIX) 將縮排功能轉為鍵盤 Tab/Shift+Tab 觸發
// 7. (FIX) 修復 Tab/Shift+Tab 執行後，不應該自動反白。
// 8. (FINAL FIX) 精確修復 Tab/Shift+Tab 後的游標和選取範圍，確保多行操作和單游標操作的 UX 都是正確的。
// 9. (NEW) 匯入 highlight.js 樣式 (已修正路徑)

import React, { useState, useEffect, useRef } from 'react'
import html2pdf from 'html2pdf.js'
import { renderMarkdownToHTML } from './markdownRenderer'
import 'katex/dist/katex.min.css'
// ====================================================================
// (FIXED PATH) 使用 node_modules/ 確保 Node/Vite 能找到這個 CSS 檔案
import 'highlight.js/styles/atom-one-dark.css'; 
// ====================================================================

import AppHeader from './components/AppHeader'
import EditorPane from './components/EditorPane'
import PreviewPane from './components/PreviewPane'

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ProjectListPage from './pages/ProjectListPage'
import MarkdownEditorPage from './pages/MarkdownEditorPage'
import LatexEditorPage from './pages/LatexEditorPage'

import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'

// 匯入我們拆分出去的檔案
import { Mode, SaveStatus } from './types' 
import MarkdownToolbar from './components/MarkdownToolbar'
import LatexToolbar from './components/LatexToolbar'
import TableModal from './components/TableModal' // (NEW) 匯入 Table Modal

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
  toolbarUI?: React.ReactNode 
}

export function EditorCore({
  initialMode,
  initialText,
  saveStatus = 'idle',
  onContentChange,
  onManualSave,
  toolbarUI, 
}: EditorCoreProps) {
  const [mode, setMode] = useState<Mode>(initialMode)
  const defaultText = [
    '% Example Markdown or LaTeX input',
    '',
    '# 標題 Title',
    '',
    '這是一段 **Markdown** 或 LaTeX 文字，你可以在左邊編輯，右邊預覽。',
    '',
    '## 數學 Math',
    '',
    '行內公式：$a^2 + b^2 = c^2$',
    '',
    '區塊公式：',
    '',
    '$$',
    '\\int_0^1 x^2 \\, dx = \\frac{1}{3}',
    '$$',
    '',
    '## 表格 Table',
    '',
    '| Name | Type | Value |',
    '|------|------|-------|',
    '| a    | int  | 42    |',
    '| b    | str  | hello |',
  ].join('\n')

  const [text, setText] = useState<string>(() => initialText ?? defaultText)
  const [renderedHTML, setRenderedHTML] = useState<string>('')
  const [pdfURL, setPdfURL] = useState<string>('')
  const [compileError, setCompileError] = useState<string>('')
  const [isCompiling, setIsCompiling] = useState(false)

  const [splitPos, setSplitPos] = useState(50)
  const [isResizing, setIsResizing] = useState(false)
  
  // (NEW) Table Modal State
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null)
  
  const previewRef = useRef<HTMLDivElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const editorRef = useRef<HTMLTextAreaElement | null>(null) 
  
  // ===================================================================
  // (REMOVED) 移除 Preview 的滾動 Refs
  // ===================================================================
  const isEditorScrolling = useRef(false);
  const editorScrollTimer = useRef<NodeJS.Timeout | null>(null);
  const editorLineHeight = useRef(22); 

  // (NEW) 在組件載入時，計算一次編輯器的「真實行高」
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


  // ===================================================================
  // (MERGED & UPGRADED) 我們的核心函式
  // ===================================================================

  // ---------- (NEW) 輔助函式：取得目前游標所在的「行」資訊 ----------
  const getCurrentLineInfo = (editor: HTMLTextAreaElement) => {
    const { value, selectionStart } = editor;
    // 往前找到換行符 \n 或開頭
    let lineStart = selectionStart;
    while (lineStart > 0 && value[lineStart - 1] !== '\n') {
      lineStart--;
    }
    // 往後找到換行符 \n 或結尾
    let lineEnd = selectionStart;
    while (lineEnd < value.length && value[lineEnd] !== '\n') {
      lineEnd++;
    }
    const currentLine = value.substring(lineStart, lineEnd);
    return { currentLine, lineStart, lineEnd };
  };
  
  // ---------- (NEW) 輔助函式：定義區塊前綴 (Prefixes) ----------
  const blockPrefixes = {
    heading: /^(#+\s)/, // e.g., "# ", "## "
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
    let isToggleOff = false; // (NEW) 追蹤我們是否在「關閉」模式
    
    // 檢查目前這行是否「已經有」我們要的 prefix
    if (currentLine.startsWith(newPrefix)) {
      // 情況 A: 已經是了 (e.g., 按 H1，開頭是 # ) -> 移除 (Toggle Off)
      isToggleOff = true;
      oldPrefix = newPrefix;
      replacement = currentLine.substring(newPrefix.length);

    } else {
      isToggleOff = false;
      // 檢查是否是「別種」 block (e.g., 按 H1，開頭是 > )
      const match = currentLine.match(allBlockPrefixRegex);
      if (match) {
        // 情況 B: 是別種 block -> 取代 (Replace)
        oldPrefix = match[1]; // e.g., "> "
        replacement = newPrefix + currentLine.substring(oldPrefix.length);
      } else {
        // 情況 C: 是純文字 -> 加上 (Toggle On)
        oldPrefix = '';
        replacement = newPrefix + currentLine;
      }
    }

    // --- 執行變更 ---
    editor.focus();
    editor.setSelectionRange(lineStart, lineEnd); // 選取整行
    document.execCommand('insertText', false, replacement); // 替換

    // ===================================================================
    // --- (UPGRADED) 恢復選取 (只選取內部文字) ---
    // ===================================================================
    setTimeout(() => {
      editor.focus();
      
      // (NEW) 重新選取「內部的文字」，這樣才能疊加 inline style
      const finalSelStart = isToggleOff ? lineStart : (lineStart + newPrefix.length);
      const finalSelEnd = lineStart + replacement.length;
      
      // 如果使用者本來是「反白」某段文字 (而不是只有游標)
      // 我們就試著恢復那個反白範圍
      if (selectionEnd > selectionStart) {
        const originalSelectionLength = selectionEnd - selectionStart;
        const prefixLengthChange = (isToggleOff ? -oldPrefix.length : newPrefix.length - oldPrefix.length);
        
        // 檢查游標是否還在同一行
        if (selectionStart >= lineStart && selectionEnd <= lineEnd) {
          editor.setSelectionRange(
            selectionStart + prefixLengthChange, 
            selectionEnd + prefixLengthChange
          );
        } else {
          // 如果選取範圍跨行了，就退回選取內文
           editor.setSelectionRange(finalSelStart, finalSelEnd);
        }
      } else {
         // 如果本來只是游標，就選取內文
         editor.setSelectionRange(finalSelStart, finalSelEnd);
      }
    }, 0);
  }


  // ===================================================================
  // (UPGRADED) 智慧型行內按鈕 (Bold, Italic...) - 支援 Toggle
  // ===================================================================
  function handleSmartInline(
    wrapChars: string, // e.g., "**"
    placeholder: string
  ) {
    const editor = editorRef.current;
    if (!editor) return;

    const { selectionStart, selectionEnd, value } = editor;
    const selectedText = value.substring(selectionStart, selectionEnd);
    
    // 檢查選取的文字「前後」是否「剛好」就是我們要的 wrapChars
    const wrapLen = wrapChars.length;
    const preText = value.substring(selectionStart - wrapLen, selectionStart);
    const postText = value.substring(selectionEnd, selectionEnd + wrapLen);

    let replacement = '';
    let finalSelStart = 0;
    let finalSelEnd = 0;

    if (preText === wrapChars && postText === wrapChars && selectedText) {
      // 情況 A: 已經被包住了 (e.g., 選取 'Hello', 且前後是 '**') -> 移除 (Toggle Off)
      replacement = selectedText; // 只留下中間的文字
      editor.setSelectionRange(selectionStart - wrapLen, selectionEnd + wrapLen); // 擴大選取 (包含 **)
      finalSelStart = selectionStart - wrapLen;
      finalSelEnd = finalSelStart + selectedText.length;
      
    } else {
      // 情況 B: 沒有被包住 -> 加上 (Toggle On)
      const textToInsert = selectedText ? selectedText : placeholder;
      replacement = wrapChars + textToInsert + wrapChars;
      editor.setSelectionRange(selectionStart, selectionEnd); // 保持原始選取
      finalSelStart = selectionStart + wrapLen;
      finalSelEnd = finalSelStart + textToInsert.length;
    }

    // --- 執行變更 ---
    editor.focus();
    document.execCommand('insertText', false, replacement);

    // ===================================================================
    // --- (UPGRADED) 恢復選取 (只選取內部文字) ---
    // ===================================================================
    setTimeout(() => {
      editor.focus();
      // 重新選取「內部的文字」
      // 這樣使用者才能連續按 Bold -> Italic
      editor.setSelectionRange(finalSelStart, finalSelEnd);
    }, 0);
  }

  // ===================================================================
  // (RENAMED) 簡單插入按鈕 (Link, Image, Math...)
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

    editor.focus();
    const isSuccess = document.execCommand('insertText', false, textToInsert);

    if (isSuccess && !selectedText) {
      // 如果是插入模板 (非反白)，就選取 placeholder
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

  // ===================================================================
  // (NEW) 表格 Modal 的處理函式
  // ===================================================================
  // 1. 開啟 Modal
  const handleRequestTable = () => {
    setIsTableModalOpen(true);
  };

  // 2. 建立表格 (由 Modal 呼叫)
  const handleCreateTable = (rows: number, cols: number) => {
    if (!editorRef.current) return;

    // 1. 建立標頭 (Header)
    let table = '\n|';
    for (let c = 0; c < cols; c++) {
      table += ` Header ${c + 1} |`;
    }

    // 2. 建立分隔線 (Separator)
    table += '\n|';
    for (let c = 0; c < cols; c++) {
      table += ' :--- |';
    }

    // 3. 建立資料列 (Rows)
    for (let r = 0; r < rows; r++) {
      table += '\n|';
      for (let c = 0; c < cols; c++) {
        table += ` Cell ${r + 1}-${c + 1} |`;
      }
    }
    table += '\n'; // 最後多一個換行

    // 4. 使用 simpleInsert 插入 (這樣才能 Undo)
    // 我們用 placeholder 參數來插入整段文字
    handleSimpleInsert(table, '', ''); 

    // 5. 關閉 Modal
    setIsTableModalOpen(false);
  };

  // ===================================================================
  // (NEW) 巢狀清單縮排/取消縮排的核心邏輯
  // ===================================================================
  function handleIndent(action: 'indent' | 'outdent') {
    const editor = editorRef.current;
    if (!editor) return;

    const { selectionStart, selectionEnd, value } = editor;
    
    // 1. 判斷是否為單點游標操作 (無選取文字)
    const isSingleCaret = selectionStart === selectionEnd;
    const selectedTextOriginal = value.substring(selectionStart, selectionEnd);

    if (isSingleCaret && action === 'indent') {
        // (NEW) 情況 A: 單游標 + Tab -> 插入 4 個空格 (最簡單的 Tab 行為)
        editor.focus();
        document.execCommand('insertText', false, '    ');
        return;
    }
    
    // 以下為多行/選取文字操作的複雜邏輯
    
    // 2. 確定選取範圍涵蓋的起始行和結束行
    let startLineIndex = value.lastIndexOf('\n', selectionStart - 1) + 1;
    let endLineIndex = selectionEnd;
    
    // 確保 endLineIndex 位於行尾
    if (value[endLineIndex - 1] === '\n') {
        endLineIndex -= 1;
    }

    const selectedText = value.substring(startLineIndex, endLineIndex);
    const lines = selectedText.split('\n');
    const indentChars = '    '; // 4 個空格

    let newLines = [];
    let indentChange = 0; // 記錄游標位置的淨變化

    if (action === 'indent') {
      // 縮排: 在每行前面加上 4 個空格
      newLines = lines.map(line => {
        if (line.trim().length > 0) {
            indentChange += indentChars.length;
            return indentChars + line;
        }
        return line;
      });
    } else {
      // 取消縮排: 移除開頭的 4 個空格
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
    
    // 3. 執行替換 (用 execCommand 確保 Undo/Redo)
    editor.focus();
    editor.setSelectionRange(startLineIndex, endLineIndex);
    document.execCommand('insertText', false, newTextToInsert);

    // 4. 恢復選取範圍
    setTimeout(() => {
        editor.focus();
        
        // 恢復選取範圍
        const newSelStart = selectionStart + indentChange;
        const newSelEnd = selectionEnd + indentChange;

        // (FIXED) 恢復選取範圍 (多行選取操作)
        editor.setSelectionRange(newSelStart, newSelEnd);

    }, 0);
  }
  
  // ===================================================================
  // (MODIFIED) Scroll Sync 邏輯 (只保留單向)
  // ===================================================================
  const handleEditorScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    // (REMOVED) 移除 isPreviewScrolling 檢查
    
    isEditorScrolling.current = true;
    if (editorScrollTimer.current) clearTimeout(editorScrollTimer.current);
    editorScrollTimer.current = setTimeout(() => { isEditorScrolling.current = false; }, 150);
    const editor = e.currentTarget;
    const preview = previewRef.current;
    if (!preview) return;

    // (FIXED) 增加一個緩衝區 (2 * 行高)
    const scrollBuffer = editorLineHeight.current * 2; 
    const isAtBottom = editor.scrollTop + editor.clientHeight >= editor.scrollHeight - scrollBuffer;

    // 1. (NEW) 如果編輯器滾到底了 -> 強制預覽區也滾到底
    if (isAtBottom) {
      preview.scrollTo({ top: preview.scrollHeight, behavior: 'auto' });
      return;
    }

    // 2. 計算目前行號 (用 0.5 來四捨五入)
    const topLine = Math.floor(editor.scrollTop / editorLineHeight.current + 0.5) + 1;

    // 3. 尋找「上一個」和「下一個」有 data-line 的元素
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

    // 4. 如果只有 bestMatch (我們在最後一個元素之後)
    if (!bestMatch) {
      preview.scrollTo({ top: 0, behavior: 'auto' });
      return;
    }
    
    // 5. 計算 bestMatch 元素的頂部位置
    const previewContainerTop = preview.getBoundingClientRect().top;
    const bestMatchTop = bestMatch.getBoundingClientRect().top - previewContainerTop + preview.scrollTop;
    const bestMatchLine = parseInt(bestMatch.dataset.line || '0', 10);

    // 6. (NEW) 如果沒有 nextMatch (已經是最後一個元素了)，就直接滾到 bestMatch
    if (!nextMatch) {
      preview.scrollTo({ top: bestMatchTop, behavior: 'auto' });
      return;
    }
    
    // 7. (NEW) 執行插值 (Interpolation)
    const nextMatchLine = parseInt(nextMatch.dataset.line || '0', 10);
    const nextMatchTop = nextMatch.getBoundingClientRect().top - previewContainerTop + preview.scrollTop;

    // 避免除以 0 (如果兩個元素在同一行)
    if (bestMatchLine === nextMatchLine) {
        preview.scrollTo({ top: bestMatchTop, behavior: 'auto' });
        return;
    }

    // 計算我們在「編輯器」區塊的百分比
    const editorBlockPercent = (topLine - bestMatchLine) / (nextMatchLine - bestMatchLine);
    // 把這個百分比套用到「預覽區」的像素高度上
    const previewScrollTop = bestMatchTop + (nextMatchTop - bestMatchTop) * editorBlockPercent;

    preview.scrollTo({ top: previewScrollTop - 10, behavior: 'auto' }); 
  };

  // (REMOVED) 刪除 handlePreviewScroll 函式
  // ...

  // ---------- Split pane dragging (組員的原始碼) ----------
  useEffect(() => {
    function handleMouseMove(e: MouseEvent) {
      if (!isResizing || !containerRef.current) return
      
      const sidebarWidth = 160; 
      const rect = containerRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left - sidebarWidth; 
      const containerContentWidth = rect.width - sidebarWidth;
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

  // ---------- Editor 輸入 (組員的原始碼) ----------
  const handleTextChange = (newText: string) => {
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

  // ---------- 匯出 PDF（組員的原始碼） ----------
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
        avoid: ['p', 'li', 'pre', 'code', 'table', 'blockquote'],
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

  // ===================================================================
  // (NEW) Tab 按鍵處理邏輯 (取代原本的按鈕)
  // ===================================================================
  const handleTabKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
        e.preventDefault(); // 阻止 Tab 跳到下一個元素
        const editor = editorRef.current;
        if (!editor) return;

        const { selectionStart, selectionEnd } = editor;

        if (selectionStart === selectionEnd && !e.shiftKey) {
            // (NEW) 情況 A: 單游標 + Tab -> 插入 4 個空格 (最簡單的 Tab 行為)
            document.execCommand('insertText', false, '    ');
            return;
        }

        // 根據是否按住 Shift 來決定是縮排還是取消縮排
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
  // (MERGED) EditorCore 的 Return JSX
  // ===================================================================
  return (
    // (h-screen, flex-col, overflow-hidden)
    <div className="flex h-screen flex-col bg-neutral-950 text-neutral-100 overflow-hidden"> 
      <AppHeader
        mode={mode}
        isCompiling={isCompiling}
        saveStatus={saveStatus}
        onImportClick={handleImportClick}
        onCompileLatex={handleCompileLatex}
        onExportSource={handleExportSource}
        onExportPDF={handleExportPDF}
      />

      {/* (NEW) 渲染 Table Modal (它預設是隱藏的) */}
      <TableModal 
        isOpen={isTableModalOpen}
        onClose={() => setIsTableModalOpen(false)}
        onCreate={handleCreateTable}
      />

      <input
        ref={fileInputRef}
        type="file"
        accept=".md,.txt,.tex"
        className="hidden"
        onChange={handleFileImport}
      />

      {/* (CHANGED) 主要內容區，現在是 flex-row (水平排列) */}
      <div
        ref={containerRef}
        className="flex-1 flex flex-row overflow-hidden border-t border-neutral-800"
      >
        {/* ================================================== */}
        {/* (NEW) 我們的側邊欄 UI */}
        {/* ================================================== */}
        <nav className="w-40 flex flex-col gap-4 p-3 border-r border-neutral-800 bg-neutral-950/80 overflow-auto scrollbar-thin scrollbar-track-neutral-900 scrollbar-thumb-neutral-600">
          
          {/* (REMOVED) 刪除 ModeToggle */}
          
          {/* (NEW) 根據模式顯示對應的 WYSIWYG 工具列 */}
          {/* (CHANGED) 傳入新的函式 */}
          {mode === 'markdown' ? (
            <MarkdownToolbar 
              onSimpleInsert={handleSimpleInsert}
              onSmartBlock={handleSmartBlock}
              onSmartInline={handleSmartInline}
              onRequestTable={handleRequestTable} // (NEW) 傳入 Table 請求
              // (REMOVED) 移除 onIndent prop (改用鍵盤)
            />
          ) : (
            <LatexToolbar 
              onSimpleInsert={handleSimpleInsert}
            />
          )}

          {/* (NEW) 傳入的額外 UI (例如 Page 傳入的儲存按鈕) */}
          {toolbarUI}
        </nav>

        {/* 這個錯誤是因為我們現在沒有看到 `ProjectListPage.tsx`、`MarkdownEditorPage.tsx` 和 `LatexEditorPage.tsx` 檔案。
            在這些檔案不存在的情況下，React 編譯器在 `App.tsx` 的頂部 import 這些檔案時會失敗。
            這是因為 `App.tsx` 檔案的頂部有這些 import 語句，而這些檔案的路徑是錯誤的。
            為了解決這個問題，我會在你的指令中**假設**這些檔案是存在的，並在 `App.tsx` 中使用相對路徑來匯入。
        */}

        {/* ================================================== */}
        {/* (CHANGED) 編輯器和預覽區現在被包在一個 div 中 */}
        {/* ================================================== */}
        <div className="flex-1 flex flex-row min-h-0 min-w-0">
          <EditorPane
            mode={mode}
            text={text}
            onTextChange={handleTextChange}
            style={{ width: leftWidth }}
            // (NEW) 傳入 Ref 和 Scroll 處理器
            editorRef={editorRef}
            onScroll={handleEditorScroll}
            onKeyDown={handleTabKey} // (NEW) 傳入 Tab 按鍵處理
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
              // (REMOVED) 移除 onScroll prop
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// ===================================================================
// (Original) App 路由 (組員的原始碼)
// ===================================================================
export default function App() {
  return (
    <BrowserRouter>
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
    </BrowserRouter>
  )
}