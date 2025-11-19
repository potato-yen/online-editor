// frontend/src/components/EditorPane.tsx
import React from 'react'
import type { Mode } from '../types'

interface EditorPaneProps {
  mode: Mode
  text: string
  onTextChange: (newText: string) => void
  editorRef: React.RefObject<HTMLTextAreaElement>
  onScroll: (e: React.UIEvent<HTMLTextAreaElement>) => void
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
  fontSize: number
  wordWrap: boolean
}

export default function EditorPane({
  text,
  onTextChange,
  editorRef,
  onScroll,
  onKeyDown,
  fontSize,
  wordWrap,
}: EditorPaneProps) {
  return (
    <div className="h-full w-full flex flex-col bg-surface-base relative group">
      {/* 編輯區標籤 (浮水印風格) */}
      <div className="absolute top-2 right-4 z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <span className="text-[10px] font-bold text-content-muted bg-surface-panel/80 px-2 py-1 rounded uppercase tracking-widest backdrop-blur-sm">
          Editor
        </span>
      </div>

      <textarea
        ref={editorRef}
        onScroll={onScroll}
        onKeyDown={onKeyDown}
        className="w-full h-full resize-none bg-transparent text-content-primary font-mono leading-relaxed p-6 outline-none scrollbar-thin scrollbar-track-transparent scrollbar-thumb-surface-elevated/50 hover:scrollbar-thumb-surface-elevated"
        style={{
          fontSize: `${fontSize}px`,
          lineHeight: 1.6,
          whiteSpace: wordWrap ? undefined : 'pre',
        }}
        value={text}
        onChange={(e) => onTextChange(e.target.value)}
        wrap={wordWrap ? 'soft' : 'off'}
        spellCheck={false}
        placeholder="Start typing here..."
      />
    </div>
  )
}
