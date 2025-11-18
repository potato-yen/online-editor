import { useEffect, useState } from 'react'

import { renderMarkdownToHTML } from '../markdownRenderer'
import type { Mode } from '../types'

type UseMarkdownRendererOptions = {
  text: string
  mode: Mode
  previewRef: React.RefObject<HTMLDivElement>
}

export function useMarkdownRenderer({ text, mode, previewRef }: UseMarkdownRendererOptions) {
  const [renderedHTML, setRenderedHTML] = useState('')

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

  useEffect(() => {
    if (mode !== 'markdown') return
    const target = previewRef.current
    if (!target || !window.mermaid || typeof window.mermaid.init !== 'function') return
    try {
      window.mermaid.init(undefined, target.querySelectorAll('.mermaid'))
    } catch (err) {
      console.error('Mermaid render error:', err)
    }
  }, [previewRef, renderedHTML, mode])

  return { renderedHTML }
}

export type MarkdownRenderer = ReturnType<typeof useMarkdownRenderer>
