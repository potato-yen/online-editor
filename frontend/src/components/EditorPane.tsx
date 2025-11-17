// src/components/EditorPane.tsx
import React from 'react'
import type { Mode } from '../types'

// ===================================================================
// (MERGED) 接收 editorRef, onScroll, 和 onKeyDown
// ===================================================================
interface EditorPaneProps {
  mode: Mode
  text: string
  onTextChange: (newText: string) => void
  style?: React.CSSProperties
  // (NEW)
  editorRef: React.RefObject<HTMLTextAreaElement>
  onScroll: (e: React.UIEvent<HTMLTextAreaElement>) => void
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void // (NEW)
}

export default function EditorPane({
  mode,
  text,
  onTextChange,
  style,
  // (NEW)
  editorRef,
  onScroll,
  onKeyDown, // (NEW)
}: EditorPaneProps) {
  return (
    <section
      style={style}
      className="flex flex-col h-full bg-neutral-950 border-r border-neutral-800"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-neutral-800">
        <div className="text-xs uppercase tracking-wide text-neutral-500">
          <span className="font-semibold">Editor</span>{' '}
          <span className="text-neutral-500">
            {mode === 'markdown' ? 'Markdown' : 'LaTeX'}
          </span>
        </div>
      </div>

      {/* Scrollable editor area */}
      <div className="flex-1 h-full overscroll-contain">
        <textarea
          // (NEW) 綁定 Ref, Scroll, 和 KeyDown 事件
          ref={editorRef}
          onScroll={onScroll}
          onKeyDown={onKeyDown} // (NEW)
          // (Original)
          className="w-full h-full resize-none bg-neutral-950 text-neutral-100 text-sm font-mono leading-relaxed p-4 outline-none scrollbar-thin scrollbar-track-neutral-900 scrollbar-thumb-neutral-600"
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          spellCheck={false}
        />
      </div>
    </section>
  )
}
