import { useCallback, useEffect, useRef, useState } from 'react'
import type React from 'react'

type SplitPaneHook = {
  splitPos: number
  containerRef: React.RefObject<HTMLDivElement>
  handleResizeStart: (e: React.MouseEvent<HTMLDivElement>) => void
}

export function useSplitPane(): SplitPaneHook {
  const [splitPos, setSplitPos] = useState(50)
  const [isResizing, setIsResizing] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)

  const handleResizeStart = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsResizing(true)
  }, [])

  useEffect(() => {
    function handleMouseMove(e: MouseEvent) {
      if (!isResizing || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const containerContentWidth = rect.width
      if (containerContentWidth <= 0) return
      const percent = (x / containerContentWidth) * 100
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

  return {
    splitPos,
    containerRef,
    handleResizeStart,
  }
}

export type SplitPane = ReturnType<typeof useSplitPane>
