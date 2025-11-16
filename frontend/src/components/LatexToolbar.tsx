// src/components/LatexToolbar.tsx
import React from 'react'
import { ToolbarProps } from '../types' // 匯入共享型別

// 這個元件只需要 ToolbarProps 裡的一部分
type LatexToolbarProps = {
  onSimpleInsert: ToolbarProps['onSimpleInsert'];
}

export default function LatexToolbar({ onSimpleInsert }: LatexToolbarProps) {
  const btnClass = "w-full text-left px-3 py-1.5 rounded-xl text-xs font-medium bg-neutral-800 hover:bg-neutral-700 border border-neutral-600"
  const labelClass = "text-xs font-semibold text-neutral-400 mt-2"
  
  return (
    <div className="flex flex-col gap-2">
      <span className={labelClass}>Math</span>
      <button onClick={() => onSimpleInsert('$', '$', 'E = mc^2')} className={btnClass} title="LaTeX 行內公式">$...$</button>
      <button onClick={() => onSimpleInsert('$$\n', '\n$$', 'f(x) = ...')} className={btnClass} title="LaTeX 區塊公式">$$...$$</button>
      <button onClick={() => onSimpleInsert('$\\frac{', '}{denominator}$', 'numerator')} className={btnClass} title="LaTeX 分數">Fraction</button>
    </div>
  )
}