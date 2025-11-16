// src/App.tsx

import React, { useState, useEffect, useRef } from 'react'
import html2pdf from 'html2pdf.js'
import { renderMarkdownToHTML } from './markdownRenderer'

import AppHeader from './components/AppHeader'
import EditorPane from './components/EditorPane'
import PreviewPane from './components/PreviewPane'

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ProjectListPage from './pages/ProjectListPage'
import MarkdownEditorPage from './pages/MarkdownEditorPage'
import LatexEditorPage from './pages/LatexEditorPage'

import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'

const BACKEND_URL = 'http://localhost:3001/compile-latex'

export type Mode = 'markdown' | 'latex'
type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

type EditorCoreProps = {
  initialMode: Mode
  allowModeSwitch?: boolean
  initialText?: string
  saveStatus?: SaveStatus
  onContentChange?: (text: string) => void
  onManualSave?: () => void
}

export function EditorCore({
  initialMode,
  allowModeSwitch = true,
  initialText,
  saveStatus = 'idle',
  onContentChange,
  onManualSave,
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

  const containerRef = useRef<HTMLDivElement | null>(null)
  const previewRef = useRef<HTMLDivElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // ---------- Markdown render ----------
  useEffect(() => {
    if (mode !== 'markdown') return

    let cancelled = false

    ;(async () => {
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

  // ---------- Split pane dragging ----------
  useEffect(() => {
    function handleMouseMove(e: MouseEvent) {
      if (!isResizing || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const percent = (x / rect.width) * 100
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

  // ---------- Mode 切換 ----------
  const handleSetMode = (m: Mode) => {
    if (!allowModeSwitch) return

    setMode(m)
    if (m !== 'latex') {
      setPdfURL('')
      setCompileError('')
    }
  }

  // ---------- Editor 輸入 ----------
  const handleTextChange = (newText: string) => {
    setText(newText)
    onContentChange?.(newText)
  }

  // ---------- Import .md / .tex ----------
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

      if (allowModeSwitch) {
        if (fileName.endsWith('.tex')) {
          setMode('latex')
          setPdfURL('')
          setCompileError('')
        } else if (fileName.endsWith('.md') || fileName.endsWith('.txt')) {
          setMode('markdown')
          setCompileError('')
        }
      } else {
        setCompileError('')
      }
    }

    reader.onerror = (err) => {
      console.error('File read error:', err)
      setCompileError('讀取檔案失敗')
    }

    reader.readAsText(file, 'utf-8')
  }

  // ---------- 匯出原始檔 ----------
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

  // ---------- 匯出 PDF（只給 Markdown 用，走白底樣式） ----------
  const handleExportPDF = async () => {
    // LaTeX 模式不在這裡匯出，直接用瀏覽器 PDF viewer 的下載功能
    if (mode === 'latex') {
      return
    }

    // 沒有預覽內容就不匯出
    if (!renderedHTML || !renderedHTML.trim()) {
      return
    }

    // 1. 建一個乾淨的白底容器，專門給 PDF 匯出用
    const wrapper = document.createElement('div')
    // .pdf-export 的樣式定義在 styles.css（白底黑字、表格、code 等）
    wrapper.className = 'pdf-export prose prose-neutral'
    wrapper.innerHTML = renderedHTML

    // 2. 暫時掛到 DOM（不會顯示在螢幕上，但 html2pdf 需要它在 DOM 裡）
    document.body.appendChild(wrapper)

    // 3. 設定匯出選項
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
        mode: ['avoid-all', 'css', 'legacy'],  // ← 新增 avoid-all
        avoid: ['p', 'li', 'pre', 'code', 'table', 'blockquote'],
      },
    }

    try {
      await (html2pdf() as any).set(opt as any).from(wrapper).save()
    } finally {
      // 4. 匯出完把暫時 DOM 刪掉，避免污染畫面
      document.body.removeChild(wrapper)
    }
  }

  // ---------- LaTeX 編譯 ----------
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

  const leftWidth = `${splitPos}%`
  const rightWidth = `${100 - splitPos}%`

  return (
    <div className="flex flex-col h-screen bg-neutral-950 text-neutral-100">
      <AppHeader
        mode={mode}
        isCompiling={isCompiling}
        saveStatus={saveStatus}
        onImportClick={handleImportClick}
        onCompileLatex={handleCompileLatex}
        onExportSource={handleExportSource}
        onExportPDF={handleExportPDF}
        onManualSave={onManualSave}
      />

      <input
        ref={fileInputRef}
        type="file"
        accept=".md,.txt,.tex"
        className="hidden"
        onChange={handleFileImport}
      />

      <div
        ref={containerRef}
        className="flex-1 flex overflow-hidden border-t border-neutral-800"
      >
        <EditorPane
          mode={mode}
          text={text}
          onTextChange={handleTextChange}
          style={{ width: leftWidth }}
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