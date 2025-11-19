// frontend/src/App.tsx
import React, { useState, useEffect, useRef } from 'react'
import 'katex/dist/katex.min.css'
import 'highlight.js/styles/atom-one-dark.css'; 

// Components
import AppHeader from './components/AppHeader'
import EditorPane from './components/EditorPane'
import PreviewPane from './components/PreviewPane'
import SettingsMenu from './components/SettingsMenu'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom' 
import ProjectListPage from './pages/ProjectListPage'
import MarkdownEditorPage from './pages/MarkdownEditorPage'
import LatexEditorPage from './pages/LatexEditorPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'

// Toolbar & Modals
import { Mode, SaveStatus } from './types' 
import MarkdownToolbar from './components/MarkdownToolbar'
import LatexToolbar from './components/LatexToolbar'
import TableModal from './components/TableModal' 
import SuperscriptModal from './components/SuperscriptModal'
import SubscriptModal from './components/SubscriptModal'
import MatrixModal from './components/MatrixModal' 

// Hooks
import { useEditorActions } from './hooks/useEditorActions'
import { useEditorModals } from './hooks/useEditorModals'
import { useLatexCompiler } from './hooks/useLatexCompiler'
import { useMarkdownRenderer } from './hooks/useMarkdownRenderer'
import { useSplitPane } from './hooks/useSplitPane'
import { useScrollSync } from './hooks/useScrollSync'
import {
  EditorSettingsProvider,
  useEditorSettings,
} from './contexts/EditorSettingsContext'
import { useAccountActions } from './hooks/useAccountActions'

// Global Mermaid
declare global {
  interface Window {
    mermaid?: {
      initialize: (config: Record<string, unknown>) => void
      init: (config?: Record<string, unknown>, nodes?: Element | NodeListOf<Element> | string) => void
    }
  }
}

// --- EditorCore Component ---
type EditorCoreProps = {
  initialMode: Mode
  initialText?: string
  title?: string
  saveStatus?: SaveStatus
  onContentChange?: (text: string) => void
  onManualSave?: () => void
  headerToolbarUI?: React.ReactNode // 保留介面但不一定要用，因為我們在下面直接判定
}

export function EditorCore({
  initialMode,
  initialText,
  title,
  saveStatus = 'idle',
  onContentChange,
  onManualSave,
}: EditorCoreProps) {
  const [mode] = useState<Mode>(initialMode)
  const defaultText = ''
  const [text, setText] = useState<string>(() => initialText ?? defaultText)
  const { fontSize, wordWrap, indentSize } = useEditorSettings()

  const previewRef = useRef<HTMLDivElement | null>(null)
  const editorRef = useRef<HTMLTextAreaElement | null>(null)

  // Hooks
  const { renderedHTML } = useMarkdownRenderer({ text, mode, previewRef })
  const { splitPos, containerRef, handleResizeStart } = useSplitPane()
  const {
    handleSmartBlock,
    handleSmartInline,
    handleSimpleInsert,
    handleTabKey,
  } = useEditorActions({ editorRef, onContentChange, setText, indentSize })

  const {
    isTableModalOpen, isSuperscriptModalOpen, isSubscriptModalOpen, isMatrixModalOpen,
    onCloseTable, onCloseSuperscript, onCloseSubscript, onCloseMatrix,
    onRequestTable, onRequestSuperscript, onRequestSubscript, onRequestMatrix,
    onCreateTable, onCreateSuperscript, onCreateSubscript, onCreateMatrix,
  } = useEditorModals({ editorRef, handleSimpleInsert })

  const { handleEditorScroll, editorLineHeight } = useScrollSync({
    editorRef,
    previewRef,
    mode,
    fontSize,
  })
  const { isCompiling, pdfURL, compileErrorLog, handleCompileLatex } = useLatexCompiler({ text, mode })

  const isAtBottomRef = useRef(false)

  const {
    onModifyUsername,
    onChangePassword,
    onDeleteAccount,
  } = useAccountActions()

  // Auto scroll logic
  useEffect(() => {
    if (mode === 'markdown' && isAtBottomRef.current && previewRef.current) {
      previewRef.current.scrollTo({ top: previewRef.current.scrollHeight, behavior: 'auto' });
      isAtBottomRef.current = false;
    }
  }, [renderedHTML, mode]); 

  const handleTextChange = (newText: string) => {
    const editor = editorRef.current;
    if (editor && mode === 'markdown') {
      const scrollBuffer = editorLineHeight.current * 2;
      isAtBottomRef.current = editor.scrollTop + editor.clientHeight >= editor.scrollHeight - scrollBuffer;
    }
    setText(newText)
    onContentChange?.(newText)
  }

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

  const handleExportPDF = () => {
    if (mode === 'latex') {
      alert("For LaTeX, please use 'Preview PDF' then download from the viewer.");
      return;
    }
    window.print();
  };

  const leftWidth = `${splitPos}%`
  const rightWidth = `${100 - splitPos}%`

  // Toolbar UI Construction
  const ToolbarComponent = mode === 'markdown' ? (
    <MarkdownToolbar 
      onSimpleInsert={handleSimpleInsert}
      onSmartBlock={handleSmartBlock}
      onSmartInline={handleSmartInline}
      onRequestTable={onRequestTable}
      onRequestSuperscript={onRequestSuperscript}
      onRequestSubscript={onRequestSubscript}
      onRequestMatrix={onRequestMatrix}
    />
  ) : (
    <LatexToolbar 
      onSimpleInsert={handleSimpleInsert}
      onRequestSuperscript={onRequestSuperscript}
      onRequestSubscript={onRequestSubscript}
      onRequestMatrix={onRequestMatrix}
    />
  );

  const settingsMenu = (
    <SettingsMenu
      onModifyUsername={onModifyUsername}
      onChangePassword={onChangePassword}
      onDeleteAccount={onDeleteAccount}
    />
  )

  return (
    <div className="flex h-screen flex-col bg-surface-base text-content-primary overflow-hidden">
      {/* Modals (always rendered, hidden by state) */}
      <div className="non-printable">
        <TableModal isOpen={isTableModalOpen} onClose={onCloseTable} onCreate={onCreateTable} />
        <SuperscriptModal isOpen={isSuperscriptModalOpen} onClose={onCloseSuperscript} onCreate={onCreateSuperscript} />
        <SubscriptModal isOpen={isSubscriptModalOpen} onClose={onCloseSubscript} onCreate={onCreateSubscript} />
        <MatrixModal isOpen={isMatrixModalOpen} onClose={onCloseMatrix} onCreate={onCreateMatrix} />
      </div>

      {/* Header & Toolbar */}
      <div className="non-printable z-20 shadow-sm">
        <AppHeader
          mode={mode}
          isCompiling={isCompiling}
          saveStatus={saveStatus}
          onCompileLatex={handleCompileLatex}
          onExportSource={handleExportSource}
          onExportPDF={handleExportPDF}
          onManualSave={onManualSave}
          toolbarUI={ToolbarComponent}
          settingsMenu={settingsMenu}
        />
      </div>

      {/* Editor & Preview Split Pane */}
      <div ref={containerRef} className="flex-1 flex flex-row overflow-hidden relative z-10">
        
        {/* Left: Editor */}
        <section className="flex flex-col non-printable min-w-[200px]" style={{ width: leftWidth }}>
          <EditorPane
            mode={mode}
            text={text}
            onTextChange={handleTextChange}
            editorRef={editorRef}
            onScroll={handleEditorScroll}
            onKeyDown={handleTabKey}
            fontSize={fontSize}
            wordWrap={wordWrap}
          />
        </section>

        {/* Resizer Handle */}
        <div
          className="w-1 bg-border-base hover:bg-brand-active cursor-col-resize transition-colors z-30 non-printable flex items-center justify-center group"
          onMouseDown={handleResizeStart}
        >
          {/* Handle visual cue */}
          <div className="w-0.5 h-8 bg-content-muted/20 group-hover:bg-white rounded-full" />
        </div>

        {/* Right: Preview */}
        <div style={{ width: rightWidth }} className="flex flex-col min-w-[200px]">
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

// --- Router Wrapper ---
type AppRouterWrapperProps = {
  openAddFilePrompt: (docType: Mode) => Promise<string | null>
}

function AppRouterWrapper({ openAddFilePrompt }: AppRouterWrapperProps) {
  const location = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [location.pathname]);

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/projects" element={<ProjectListPage openAddFilePrompt={openAddFilePrompt} />} />
      <Route path="/editor/md/:id" element={<MarkdownEditorPage />} />
      <Route path="/editor/tex/:id" element={<LatexEditorPage />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

// --- Main App Component ---
export default function App() {
  // (Prompt Logic 保持不變，與舊版 App.tsx 相同，這裡為節省篇幅省略 State 宣告，請保留原有的 promptState, promptValue, handlePrompt... 等邏輯)
  const [promptState, setPromptState] = useState<{docType: Mode, defaultValue: string} | null>(null)
  const [promptValue, setPromptValue] = useState('')
  const resolverRef = useRef<((value: string | null) => void) | null>(null)
  const promptInputRef = useRef<HTMLInputElement | null>(null)

  // Prompt Effect
  useEffect(() => {
    if (!promptState) return
    const raf = requestAnimationFrame(() => promptInputRef.current?.select())
    return () => cancelAnimationFrame(raf)
  }, [promptState])

  const openAddFilePrompt = (docType: Mode) => {
    const defaultValue = docType === 'markdown' ? 'New Doc' : 'New LaTeX'
    if (resolverRef.current) resolverRef.current(null)
    return new Promise<string | null>((resolve) => {
      resolverRef.current = resolve
      setPromptState({ docType, defaultValue })
      setPromptValue(defaultValue)
    })
  }

  const closePrompt = (result: string | null) => {
    if (resolverRef.current) resolverRef.current(result)
    resolverRef.current = null
    setPromptState(null)
  }

  return (
    <EditorSettingsProvider>
      <BrowserRouter>
        <AppRouterWrapper openAddFilePrompt={openAddFilePrompt} />
      </BrowserRouter>

      {/* Custom Prompt Modal (Styled) */}
      {promptState && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => closePrompt(null)}>
          <div className="w-full max-w-sm bg-surface-panel border border-border-base rounded-xl p-6 shadow-2xl animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-content-primary mb-1">
              Create {promptState.docType === 'markdown' ? 'Markdown' : 'LaTeX'}
            </h2>
            <p className="text-xs text-content-secondary mb-4">Enter a name for your new document.</p>
            
            <input
              ref={promptInputRef}
              autoFocus
              value={promptValue}
              onChange={(e) => setPromptValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') closePrompt(promptValue.trim() || promptState.defaultValue)
                if (e.key === 'Escape') closePrompt(null)
              }}
              className="w-full px-3 py-2 bg-surface-layer border border-border-base rounded-lg text-content-primary focus:outline-none focus:ring-2 focus:ring-brand-active mb-4"
            />
            
            <div className="flex justify-end gap-2">
              <button onClick={() => closePrompt(null)} className="px-3 py-1.5 text-xs font-medium text-content-secondary hover:text-content-primary">Cancel</button>
              <button onClick={() => closePrompt(promptValue.trim() || promptState.defaultValue)} className="px-3 py-1.5 text-xs font-medium bg-brand-DEFAULT text-white rounded-lg hover:bg-brand-hover">Create</button>
            </div>
          </div>
        </div>
      )}
    </EditorSettingsProvider>
  );
}
