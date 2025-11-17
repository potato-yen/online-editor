// src/components/ModeToggle.tsx
// (NEW) - Extracted component

import React from 'react'
import type { Mode } from '../types' // Import the shared type

interface Props {
  mode: Mode
  setMode: (m: Mode) => void
}

export default function ModeToggle({ mode, setMode }: Props) {
  return (
    <div className="flex rounded-xl bg-neutral-800 border border-neutral-600 overflow-hidden text-[11px]">
      <button
        className={
          'px-3 py-1.5 font-semibold ' +
          (mode === 'markdown'
            ? 'bg-neutral-100 text-neutral-900'
            : 'text-neutral-300 hover:bg-neutral-700')
        }
        onClick={() => setMode('markdown')}
      >
        Markdown
      </button>

      <button
        className={
          'px-3 py-1.5 font-semibold border-l border-neutral-600 ' +
          (mode === 'latex'
            ? 'bg-neutral-100 text-neutral-900'
            : 'text-neutral-300 hover:bg-neutral-700')
        }
        onClick={() => setMode('latex')}
      >
        LaTeX
      </button>
    </div>
  )
}
