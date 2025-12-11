// frontend/src/components/PreviewPane.tsx
import React, { useEffect, useState } from 'react'
import type { Mode } from '../types'

interface Props {
  mode: Mode
  renderedHTML: string
  pdfURL: string
  errorLog: string
  previewRef: React.RefObject<HTMLDivElement>
}

export default function PreviewPane({
  mode,
  renderedHTML,
  pdfURL,
  errorLog,
  previewRef,
}: Props) {
  const [errorCopied, setErrorCopied] = useState(false)

  useEffect(() => {
    if (mode !== 'markdown') return
    const container = previewRef.current
    if (!container) return

    const preBlocks = Array.from(container.querySelectorAll('pre'))
    const cleanups: Array<() => void> = []

    preBlocks.forEach((pre) => {
      pre.classList.add('code-block-with-copy')
      const button = document.createElement('button')
      button.type = 'button'
      button.className = 'copy-button copy-button--code'
      button.textContent = 'Copy'

      const handleClick = async (event: MouseEvent) => {
        event.stopPropagation()
        const codeEl = pre.querySelector('code')
        const text = codeEl?.textContent ?? pre.textContent ?? ''
        if (!text.trim() || !navigator.clipboard?.writeText) return
        try {
          await navigator.clipboard.writeText(text)
          button.textContent = 'Copied'
          button.classList.add('copy-button--copied')
          window.setTimeout(() => {
            button.textContent = 'Copy'
            button.classList.remove('copy-button--copied')
          }, 1400)
        } catch (copyErr) {
          console.error('Copy failed:', copyErr)
          button.textContent = 'Failed'
        }
      }
      button.addEventListener('click', handleClick)
      pre.appendChild(button)
      cleanups.push(() => {
        button.removeEventListener('click', handleClick)
        button.remove()
        pre.classList.remove('code-block-with-copy')
      })
    })
    return () => cleanups.forEach((fn) => fn())
  }, [mode, renderedHTML, previewRef])

  const handleCopyErrorLog = async () => {
    if (!errorLog || !navigator.clipboard?.writeText) return
    try {
      await navigator.clipboard.writeText(errorLog)
      setErrorCopied(true)
      window.setTimeout(() => setErrorCopied(false), 1400)
    } catch (err) { console.error(err) }
  }

  // 處理 PDF URL，加入參數以隱藏工具列並自適應寬度
  const getPdfViewerUrl = (url: string) => {
    if (!url) return '';
    // #toolbar=0: 隱藏工具列 (下載/列印等)
    // #view=FitH: 讓 PDF 自動以「符合寬度」模式顯示
    return `${url}#toolbar=0&view=FitH&navpanes=0`;
  };

  return (
    // 加入 'group' class，讓子元素可以用 group-hover
    <div className="flex-1 flex flex-col bg-surface-layer overflow-hidden border-l border-border-base relative group">
       {/* [MODIFIED] 預覽區標籤 - 設定 opacity-0 (隱藏) 與 group-hover:opacity-100 (顯示) */}
       {/* 位置改回 top-4 right-4 (右上角) */}
       <div className="absolute top-4 right-4 z-20 pointer-events-none non-printable opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <span className="text-[10px] font-bold text-content-muted/50 bg-surface-base/30 px-2 py-1 rounded uppercase tracking-widest backdrop-blur-sm">
          Preview
        </span>
      </div>

      {mode === 'markdown' ? (
        <div
          ref={previewRef}
          className="flex-1 overflow-auto p-8 prose prose-invert max-w-none scrollbar-thin scrollbar-track-transparent"
          dangerouslySetInnerHTML={{ __html: renderedHTML }}
        />
      ) : (
        <div className="flex-1 overflow-auto bg-surface-base relative">
          {errorLog ? (
            // Error Log Container
            <div className="absolute inset-0 p-8 overflow-auto scrollbar-thin">
              <div className="w-full max-w-3xl mx-auto flex flex-col rounded-xl border border-status-error/30 bg-status-error/5 text-status-error shadow-lg">
                <div className="px-4 py-3 border-b border-status-error/20 bg-status-error/10 flex items-center justify-between sticky top-0 backdrop-blur-sm z-10">
                  <span className="font-semibold text-sm flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
                    Compilation Failed
                  </span>
                  <button onClick={handleCopyErrorLog} className="text-xs border border-status-error/30 px-2 py-1 rounded hover:bg-status-error/10 transition-colors">
                    {errorCopied ? 'Copied!' : 'Copy Log'}
                  </button>
                </div>
                {/* [MODIFIED] 這裡加上 break-all 確保錯誤訊息長字串正確換行，但不影響編輯器 */}
                <pre className="p-4 text-xs font-mono whitespace-pre-wrap break-all leading-relaxed opacity-90">
                  {errorLog}
                </pre>
              </div>
            </div>
          ) : pdfURL ? (
            <iframe
              src={getPdfViewerUrl(pdfURL)}
              className="w-full h-full border-none"
              title="LaTeX PDF Preview"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-center text-content-muted">
              <div>
                <p className="mb-2 text-4xl opacity-20">☕</p>
                <p className="text-sm">Click "Preview PDF" to compile.</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}