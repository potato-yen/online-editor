// src/components/PreviewPane.tsx
// (NEW) - Right pane preview

import React from 'react'
import type { Mode } from '../types'

// ===================================================================
// (MERGED) 移除 onScroll 屬性 (prop)
// ===================================================================
interface Props {
  mode: Mode
  renderedHTML: string
  pdfURL: string
  errorLog: string
  previewRef: React.RefObject<HTMLDivElement>
  // onScroll: (e: React.UIEvent<HTMLDivElement>) => void // (REMOVED)
}

export default function PreviewPane({
  mode,
  renderedHTML,
  pdfURL,
  errorLog,
  previewRef,
  // onScroll, // (REMOVED)
}: Props) {
  return (
    <section className="flex-1 flex flex-col bg-neutral-900 overflow-hidden">
      
      {/* ================================================== */}
      {/* (FIXED) 幫這個標頭加上 non-printable */}
      {/* ================================================== */}
      <div className="px-4 py-2 text-[11px] uppercase tracking-wide text-neutral-400 border-b border-neutral-800 flex items-center justify-between non-printable">
        <span className="font-semibold">Preview</span>
        <span className="text-neutral-500">即時渲染結果</span>
      </div>

      {mode === 'markdown' ? (
        <div
          ref={previewRef}
          // onScroll={onScroll} // (REMOVED) 移除 Markdown 滾動
          className="flex-1 overflow-auto p-6 prose prose-invert max-w-none text-neutral-100 text-base leading-relaxed scrollbar-thin scrollbar-track-neutral-900 scrollbar-thumb-neutral-600"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: renderedHTML }}
        />
      ) : (
        <div 
          className="flex-1 overflow-auto p-6 scrollbar-thin scrollbar-track-neutral-900 scrollbar-thumb-neutral-600"
          // onScroll={onScroll} // (REMOVED) 移除 LaTeX 滾動
        >
          {errorLog ? (
            <div className="h-full flex flex-col rounded-lg border border-red-700 bg-red-950/40 text-red-200">
              <div className="px-4 py-2 border-b border-red-800 text-xs font-semibold uppercase tracking-wide">
                Compilation Error
              </div>
              <pre className="flex-1 overflow-auto px-4 py-3 text-xs font-mono whitespace-pre-wrap leading-relaxed">
                {errorLog}
              </pre>
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
  )
}
