// src/App.tsx
// (REFACTORED)
// ... (所有舊功能)
// 21. (FIX) 修正 window.print() 邏輯，加入 .non-printable class

import React, { useState, useEffect, useRef } from 'react'
// (REMOVED) html2pdf.js 已不再需要
// import html2pdf from 'html2pdf.js' 
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
import { useEditorActions } from './hooks/useEditorActions'
import { useEditorModals } from './hooks/useEditorModals'
import { useLatexCompiler } from './hooks/useLatexCompiler'
import { useMarkdownRenderer } from './hooks/useMarkdownRenderer'
import { useSplitPane } from './hooks/useSplitPane'
import { useScrollSync } from './hooks/useScrollSync'

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
  title?: string
  saveStatus?: SaveStatus
  onContentChange?: (text: string) => void
  onManualSave?: () => void
  headerToolbarUI?: React.ReactNode 
}

export function EditorCore({
  initialMode,
  initialText,
  title,
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

  const previewRef = useRef<HTMLDivElement | null>(null)
  const editorRef = useRef<HTMLTextAreaElement | null>(null)

  const { renderedHTML } = useMarkdownRenderer({ text, mode, previewRef })
  const { splitPos, containerRef, handleResizeStart } = useSplitPane()
  const {
    handleSmartBlock,
    handleSmartInline,
    handleSimpleInsert,
    handleIndent,
    handleTabKey,
  } = useEditorActions({ editorRef, onContentChange, setText })
  const {
    isTableModalOpen,
    isSuperscriptModalOpen,
    isSubscriptModalOpen,
    isMatrixModalOpen,
    onCloseTable,
    onCloseSuperscript,
    onCloseSubscript,
    onCloseMatrix,
    onRequestTable,
    onRequestSuperscript,
    onRequestSubscript,
    onRequestMatrix,
    onCreateTable,
    onCreateSuperscript,
    onCreateSubscript,
    onCreateMatrix,
  } = useEditorModals({ editorRef, handleSimpleInsert })
  const { handleEditorScroll, editorLineHeight } = useScrollSync({
    editorRef,
    previewRef,
    mode,
  })
  const {
    isCompiling,
    pdfURL,
    compileErrorLog,
    handleCompileLatex,
  } = useLatexCompiler({ text, mode })

  const isAtBottomRef = useRef(false)


  // ---------- Markdown render ----------
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
    const filename = `${title?.trim() || 'document'}.${ext}`
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
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
          onClose={onCloseTable}
          onCreate={onCreateTable}
        />
        {/* (NEW) 渲染 Superscript Modal */}
        <SuperscriptModal
          isOpen={isSuperscriptModalOpen}
          onClose={onCloseSuperscript}
          onCreate={onCreateSuperscript}
        />
        {/* (NEW) 渲染 Subscript Modal */}
        <SubscriptModal
          isOpen={isSubscriptModalOpen}
          onClose={onCloseSubscript}
          onCreate={onCreateSubscript}
        />
        {/* (NEW) 渲染 Matrix Modal */}
        <MatrixModal
          isOpen={isMatrixModalOpen}
          onClose={onCloseMatrix}
          onCreate={onCreateMatrix}
        />
      </div>

      {/* (NEW) 頂部水平工具列 */}
      <div className="flex flex-wrap items-center gap-2 p-3 border-b border-neutral-800 bg-neutral-950/80 non-printable"> {/* (FIXED) 加上 non-printable */}
        {mode === 'markdown' ? (
          <MarkdownToolbar 
            onSimpleInsert={handleSimpleInsert}
            onSmartBlock={handleSmartBlock}
            onSmartInline={handleSmartInline}
            onRequestTable={onRequestTable}
            onRequestSuperscript={onRequestSuperscript}
            onRequestSubscript={onRequestSubscript}
            onRequestMatrix={onRequestMatrix} // (NEW)
          />
        ) : (
          <LatexToolbar 
            onSimpleInsert={handleSimpleInsert}
            onRequestSuperscript={onRequestSuperscript}
            onRequestSubscript={onRequestSubscript}
            onRequestMatrix={onRequestMatrix} // (NEW)
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
  const promptInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (!promptState) return
    const raf = requestAnimationFrame(() => {
      promptInputRef.current?.select()
    })
    return () => cancelAnimationFrame(raf)
  }, [promptState])

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
              ref={promptInputRef}
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
