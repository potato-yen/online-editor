// src/components/AppHeader.tsx
// (NEW) - Header component

import React from 'react'
import { Mode } from '../App' // Import the type
import ModeToggle from './ModeToggle'

interface Props {
  mode: Mode
  isCompiling: boolean
  onSetMode: (m: Mode) => void
  onImportClick: () => void
  onCompileLatex: () => void
  onExportSource: () => void
  onExportPDF: () => void
}

export default function AppHeader({
  mode,
  isCompiling,
  onSetMode,
  onImportClick,
  onCompileLatex,
  onExportSource,
  onExportPDF,
}: Props) {
  return (
    <header className="flex flex-wrap items-center gap-4 px-4 py-3 border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-md">
      <div className="flex items-center gap-2 text-neutral-300 text-sm">
        <span className="font-medium text-neutral-100">Mode:</span>
        <ModeToggle mode={mode} setMode={onSetMode} />
      </div>

      <div className="flex-1" />

      {/* Import Button */}
      <button
        onClick={onImportClick}
        className="px-3 py-1.5 rounded-xl text-xs font-medium bg-neutral-800 hover:bg-neutral-700 border border-neutral-600"
      >
        匯入檔案
      </button>

      {mode === 'latex' ? (
        <button
          onClick={onCompileLatex}
          className="px-3 py-1.5 rounded-xl text-xs font-medium bg-neutral-800 hover:bg-neutral-700 border border-neutral-600 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isCompiling}
        >
          {isCompiling ? '編譯中…' : '編譯並預覽 (.pdf)'}
        </button>
      ) : null}

      <button
        onClick={onExportSource}
        className="px-3 py-1.5 rounded-xl text-xs font-medium bg-neutral-800 hover:bg-neutral-700 border border-neutral-600"
      >
        下載原始檔 ({mode === 'markdown' ? '.md' : '.tex'})
      </button>

      {mode === 'markdown' ? (
        <button
          onClick={onExportPDF}
          className="px-3 py-1.5 rounded-xl text-xs font-medium bg-neutral-100 text-neutral-900 hover:bg-white border border-neutral-300"
        >
          匯出 PDF
        </button>
      ) : null}
    </header>
  )
}