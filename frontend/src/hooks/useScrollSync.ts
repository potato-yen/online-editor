import { useCallback, useEffect, useRef } from 'react'
import type React from 'react'

import type { Mode } from '../types'

type UseScrollSyncOptions = {
  editorRef: React.RefObject<HTMLTextAreaElement>
  previewRef: React.RefObject<HTMLDivElement>
  mode: Mode
  fontSize?: number
}

export function useScrollSync({ editorRef, previewRef, mode, fontSize }: UseScrollSyncOptions) {
  const isEditorScrolling = useRef(false)
  const editorScrollTimer = useRef<NodeJS.Timeout | null>(null)
  const editorLineHeight = useRef(22)

  useEffect(() => {
    const editor = editorRef.current
    if (!editor) return
    const style = window.getComputedStyle(editor)
    const lineHeight = parseFloat(style.lineHeight)
    if (!Number.isNaN(lineHeight) && lineHeight > 0) {
      editorLineHeight.current = lineHeight
    }
  }, [editorRef, mode, fontSize])

  useEffect(() => {
    return () => {
      if (editorScrollTimer.current) {
        clearTimeout(editorScrollTimer.current)
      }
    }
  }, [])

  const handleEditorScroll = useCallback(
    (e: React.UIEvent<HTMLTextAreaElement>) => {
      if (mode !== 'markdown') return
      if (isEditorScrolling.current) return
      isEditorScrolling.current = true
      if (editorScrollTimer.current) clearTimeout(editorScrollTimer.current)
      editorScrollTimer.current = setTimeout(() => {
        isEditorScrolling.current = false
      }, 150)
      const editor = e.currentTarget
      const preview = previewRef.current
      if (!preview) return
      const scrollBuffer = editorLineHeight.current * 2
      const isAtBottom = editor.scrollTop + editor.clientHeight >= editor.scrollHeight - scrollBuffer
      if (isAtBottom) {
        preview.scrollTo({ top: preview.scrollHeight, behavior: 'auto' })
        return
      }
      const topLine = Math.floor(editor.scrollTop / editorLineHeight.current + 0.5) + 1
      const elements = Array.from(preview.querySelectorAll('[data-line]')) as HTMLElement[]
      if (elements.length === 0) return
      let bestMatch: HTMLElement | null = null
      let nextMatch: HTMLElement | null = null
      for (const el of elements) {
        const line = parseInt(el.dataset.line || '0', 10)
        if (line <= topLine) {
          bestMatch = el
        } else {
          nextMatch = el
          break
        }
      }
      if (!bestMatch) {
        preview.scrollTo({ top: 0, behavior: 'auto' })
        return
      }
      const previewContainerTop = preview.getBoundingClientRect().top
      const bestMatchTop =
        bestMatch.getBoundingClientRect().top - previewContainerTop + preview.scrollTop
      const bestMatchLine = parseInt(bestMatch.dataset.line || '0', 10)
      if (!nextMatch) {
        preview.scrollTo({ top: bestMatchTop, behavior: 'auto' })
        return
      }
      const nextMatchLine = parseInt(nextMatch.dataset.line || '0', 10)
      const nextMatchTop =
        nextMatch.getBoundingClientRect().top - previewContainerTop + preview.scrollTop
      if (bestMatchLine === nextMatchLine) {
        preview.scrollTo({ top: bestMatchTop, behavior: 'auto' })
        return
      }
      const editorBlockPercent = (topLine - bestMatchLine) / (nextMatchLine - bestMatchLine)
      const previewScrollTop = bestMatchTop + (nextMatchTop - bestMatchTop) * editorBlockPercent
      preview.scrollTo({ top: previewScrollTop - 10, behavior: 'auto' })
    },
    [mode, previewRef]
  )

  return {
    handleEditorScroll,
    editorLineHeight,
  }
}

export type ScrollSync = ReturnType<typeof useScrollSync>
