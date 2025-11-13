// src/components/EditorPane.tsx
// (NEW) - Left pane editor

import React from 'react'
import { Mode } from '../App'

interface Props {
  mode: Mode
  text: string
  onTextChange: (newText: string) => void
  style: React.CSSProperties
}

export default function EditorPane({ mode, text, onTextChange, style }: Props) {
  return (
    <section
      className="flex flex-col border-r border-neutral-800 bg-neutral-950"
      style={style}
    >
      <div className="px-4 py-2 text-[11px] uppercase tracking-wide text-neutral-400 border-b border-neutral-800 flex items-center justify-between">
        <span className="font-semibold">Editor</span>
        <span className="text-neutral-500">
          {mode === 'markdown' ? 'Markdown' : 'LaTeX'}
        </span>
      </div>

      <textarea
        className="flex-1 w-full resize-none bg-neutral-950 text-neutral-100 text-sm font-mono p-4 outline-none leading-relaxed scrollbar-thin scrollbar-track-neutral-900 scrollbar-thumb-neutral-600"
        value={text}
        onChange={(e) => onTextChange(e.target.value)}
        spellCheck={false}
      />
    </section>
  )
}