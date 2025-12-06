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
      
      // [FIX] 移除了這裡的 `if (isEditorScrolling.current) return` 阻塞檢查
      // 這確保了即使是快速捲動，所有的事件（包含最後一次到底的事件）都能被處理。
      
      isEditorScrolling.current = true
      if (editorScrollTimer.current) clearTimeout(editorScrollTimer.current)
      // 設定一個 timer 只是為了在停止捲動後重置狀態，不再阻擋執行
      editorScrollTimer.current = setTimeout(() => {
        isEditorScrolling.current = false
      }, 150)
      
      const editor = e.currentTarget
      const preview = previewRef.current
      if (!preview) return

      // [FIX] 強制到底判定：只要編輯器捲動到了底部區域 (誤差 50px 內)
      const scrollBuffer = 50; 
      const isAtBottom = editor.scrollTop + editor.clientHeight >= editor.scrollHeight - scrollBuffer
      
      if (isAtBottom) {
        // 直接將預覽區捲動到最大高度，確保同步
        preview.scrollTo({ top: preview.scrollHeight, behavior: 'auto' })
        return
      }

      // 一般同步邏輯 (依賴行號對齊)
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
      
      // 如果沒有下一行，就直接對齊當前行
      if (!nextMatch) {
        preview.scrollTo({ top: bestMatchTop, behavior: 'auto' })
        return
      }

      const bestMatchLine = parseInt(bestMatch.dataset.line || '0', 10)
      const nextMatchLine = parseInt(nextMatch.dataset.line || '0', 10)
      const nextMatchTop =
        nextMatch.getBoundingClientRect().top - previewContainerTop + preview.scrollTop

      // 避免除以零
      if (bestMatchLine === nextMatchLine) {
        preview.scrollTo({ top: bestMatchTop, behavior: 'auto' })
        return
      }

      // 線性插值計算精確位置
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