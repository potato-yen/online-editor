// src/App.tsx
// Features:
// 1. Draggable split pane (left editor / right preview)
// 2. Markdown rendering with math + tables (KaTeX + remark-gfm)
// 3. Export .md/.tex source
// 4. Export PDF using html2pdf.js (front-end only)
// 5. LaTeX mode: send source to backend, receive compiled PDF blob, preview in iframe
// 6. Dark UI with Tailwind + typography

import React, { useState, useEffect, useRef } from 'react'
import { renderMarkdownToHTML } from './markdownRenderer'
import html2pdf from 'html2pdf.js'

// backend endpoint (development assumption)
const BACKEND_URL = 'http://localhost:3001/compile-latex'

type Mode = 'markdown' | 'latex'

export default function App() {
  const [mode, setMode] = useState<Mode>('markdown')

  const [text, setText] = useState<string>([
    '% Example Markdown or LaTeX input',
    '',
    '# 標題 Title',
    '',
    '這是一段 **Markdown** 測試文字，含行內公式 $a^2 + b^2 = c^2$.',
    '',
    '## 小節',
    '- 條列 1',
    '- 條列 2',
    '',
    '| a | b | a+b |',
    '|---|---|-----|',
    '| 1 | 2 | 3   |',
    '| 3 | 4 | 7   |',
    '',
    '$$\\int_0^1 x^2 dx = 1/3$$',
    '',
    '% LaTeX example:',
    '% \\documentclass{article}',
    '% \\begin{document}',
    '% Hello world, this is \\LaTeX',
    '% \\end{document}',
    '',
  ].join('\n'))

  // renderedHTML: what we show in markdown mode
  const [renderedHTML, setRenderedHTML] = useState<string>('')

  // compiled PDF preview URL (blob URL) for LaTeX mode
  const [pdfURL, setPdfURL] = useState<string>('')

  // track loading / error states for LaTeX compile
  const [isCompiling, setIsCompiling] = useState<boolean>(false)
  const [compileError, setCompileError] = useState<string>('')

  // Re-render markdown preview when text or mode changes
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (mode === 'markdown') {
        const html = await renderMarkdownToHTML(text)
        if (!cancelled) setRenderedHTML(html)
      }
    })()
    return () => { cancelled = true }
  }, [text, mode])

  // Preview DOM ref (for PDF export of markdown view)
  const previewRef = useRef<HTMLDivElement | null>(null)

  // Export source file (.md / .tex)
  function handleExportSource() {
    const blob = new Blob([text], {
      type: mode === 'markdown' ? 'text/markdown' : 'application/x-tex',
    })
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = mode === 'markdown' ? 'document.md' : 'document.tex'
    a.click()
    URL.revokeObjectURL(url)
  }

  // Export preview DOM as PDF using html2pdf.js (only meaningful in markdown mode)
  function handleExportPDF() {
    if (!previewRef.current) return

    const opt = {
      margin:       10,
      filename:     'document.pdf',
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
    }

    html2pdf()
      .from(previewRef.current)
      .set(opt)
      .save()
  }

  // Call backend to compile LaTeX -> PDF, store result in blob URL (pdfURL)
  async function handleCompileLatex() {
    setIsCompiling(true)
    setCompileError('')
    setPdfURL('')

    try {
      const resp = await fetch(BACKEND_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: text }),
      })

      if (!resp.ok) {
        const errJson = await resp.json().catch(() => ({}))
        throw new Error(errJson.error || 'Compile failed')
      }

      const blob = await resp.blob() // should be application/pdf
      const objectURL = URL.createObjectURL(blob)
      setPdfURL(objectURL)
    } catch (err: any) {
      setCompileError(err.message || String(err))
    } finally {
      setIsCompiling(false)
    }
  }

  // -----------------------
  // Resizable split layout
  // -----------------------
  const [paneWidthPercent, setPaneWidthPercent] = useState<number>(50)
  const isDraggingRef = useRef<boolean>(false)

  function handleDividerMouseDown(e: React.MouseEvent) {
    e.preventDefault()
    isDraggingRef.current = true
  }

  useEffect(() => {
    function onMove(ev: MouseEvent) {
      if (!isDraggingRef.current) return
      const totalWidth = window.innerWidth
      const x = ev.clientX
      const pct = Math.min(80, Math.max(20, (x / totalWidth) * 100))
      setPaneWidthPercent(pct)
    }
    function onUp() {
      isDraggingRef.current = false
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [])

  const leftPaneStyle: React.CSSProperties = {
    width: paneWidthPercent + '%',
    minWidth: '240px',
    maxWidth: '80%',
  }

  // -----------------------
  // Render
  // -----------------------

  return (
    <div className="min-h-screen flex flex-col bg-neutral-900 text-neutral-100">
      {/* Toolbar */}
      <header className="flex flex-wrap items-center gap-4 px-4 py-3 border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-md">
        <div className="flex items-center gap-2 text-neutral-300 text-sm">
          <span className="font-medium text-neutral-100">Mode:</span>
          <ModeToggle mode={mode} setMode={(m) => {
            setMode(m)
            // clear pdf preview when switching out of latex
            if (m !== 'latex') {
              setPdfURL('')
              setCompileError('')
            }
          }} />
        </div>

        <div className="flex-1" />

        {mode === 'latex' ? (
          <button
            onClick={handleCompileLatex}
            className="px-3 py-1.5 rounded-xl text-xs font-medium bg-neutral-800 hover:bg-neutral-700 border border-neutral-600 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isCompiling}
          >
            {isCompiling ? '編譯中…' : '編譯並預覽 (.pdf)'}
          </button>
        ) : null}

        <button
          onClick={handleExportSource}
          className="px-3 py-1.5 rounded-xl text-xs font-medium bg-neutral-800 hover:bg-neutral-700 border border-neutral-600"
        >
          下載原始檔 ({mode === 'markdown' ? '.md' : '.tex'})
        </button>

        {mode === 'markdown' ? (
          <button
            onClick={handleExportPDF}
            className="px-3 py-1.5 rounded-xl text-xs font-medium bg-neutral-100 text-neutral-900 hover:bg-white border border-neutral-300"
          >
            匯出 PDF
          </button>
        ) : null}
      </header>

      {/* Main Split Pane */}
      <main className="flex flex-1 min-h-0 select-none">
        {/* Editor Pane */}
        <section
          className="flex flex-col border-r border-neutral-800 bg-neutral-950"
          style={leftPaneStyle}
        >
          <div className="px-4 py-2 text-[11px] uppercase tracking-wide text-neutral-400 border-b border-neutral-800 flex items-center justify-between">
            <span className="font-semibold">Editor</span>
            <span className="text-neutral-500">
              {mode === 'markdown' ? 'Markdown' : 'LaTeX'}
            </span>
          </div>

          <textarea
            className="flex-1 w-full resize-none bg-neutral-950 text-neutral-100 text-sm font-mono p-4 outline-none leading-relaxed scrollbar-thin scrollbar-track-neutral-900 scrollbar-thumb-neutral-600"
            value={text}
            onChange={(e) => setText(e.target.value)}
            spellCheck={false}
          />
        </section>

        {/* draggable divider */}
        <div
          onMouseDown={handleDividerMouseDown}
          className="w-[4px] cursor-col-resize bg-neutral-800 hover:bg-neutral-600"
          title="拖曳以調整寬度"
        />

        {/* Preview Pane */}
        <section className="flex-1 flex flex-col bg-neutral-900 overflow-hidden">
          <div className="px-4 py-2 text-[11px] uppercase tracking-wide text-neutral-400 border-b border-neutral-800 flex items-center justify-between">
            <span className="font-semibold">Preview</span>
            <span className="text-neutral-500">即時渲染結果</span>
          </div>

          {mode === 'markdown' ? (
            <div
              ref={previewRef}
              className="flex-1 overflow-auto p-6 prose prose-invert max-w-none text-neutral-100 text-base leading-relaxed scrollbar-thin scrollbar-track-neutral-900 scrollbar-thumb-neutral-600"
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={{ __html: renderedHTML }}
            />
          ) : (
            <div className="flex-1 overflow-auto p-6 scrollbar-thin scrollbar-track-neutral-900 scrollbar-thumb-neutral-600">
              {compileError ? (
                <div className="text-red-400 text-sm whitespace-pre-wrap">
                  編譯失敗：{compileError}
                </div>
              ) : pdfURL ? (
                <iframe
                  src={pdfURL}
                  className="w-full h-full rounded-lg bg-neutral-800 border border-neutral-700"
                  title="LaTeX PDF Preview"
                />
              ) : (
                <div className="text-neutral-500 text-sm">
                  尚未有編譯結果，請按「編譯並預覽 (.pdf)」
                </div>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

function ModeToggle({ mode, setMode }: { mode: Mode; setMode: (m: Mode) => void }) {
  return (
    <div className="flex rounded-xl bg-neutral-800 border border-neutral-600 overflow-hidden text-[11px]">
      <button
        className={
          'px-3 py-1.5 font-semibold ' +
          (mode === 'markdown'
            ? 'bg-neutral-100 text-neutral-900'
            : 'text-neutral-300 hover:bg-neutral-700')
        }
        onClick={() => setMode('markdown')}
      >
        Markdown
      </button>

      <button
        className={
          'px-3 py-1.5 font-semibold border-l border-neutral-600 ' +
          (mode === 'latex'
            ? 'bg-neutral-100 text-neutral-900'
            : 'text-neutral-300 hover:bg-neutral-700')
        }
        onClick={() => setMode('latex')}
      >
        LaTeX
      </button>
    </div>
  )
}
