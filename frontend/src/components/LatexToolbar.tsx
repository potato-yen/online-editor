// src/components/LatexToolbar.tsx
import React from 'react'
import { ToolbarProps } from '../types'
import Dropdown, { DropdownItem } from './Dropdown'

// (CHANGED) 接收新的 props
type LatexToolbarProps = {
  onSimpleInsert: ToolbarProps['onSimpleInsert'];
  onRequestSuperscript: ToolbarProps['onRequestSuperscript'];
  onRequestSubscript: ToolbarProps['onRequestSubscript'];
  onRequestMatrix: ToolbarProps['onRequestMatrix']; // (NEW)
}

export default function LatexToolbar({ 
  onSimpleInsert,
  onRequestSuperscript,
  onRequestSubscript,
  onRequestMatrix // (NEW)
}: LatexToolbarProps) {
  return (
    // (CHANGED) 改為 flex-row (水平排列)
    <div className="flex flex-wrap items-center gap-2">
      
      {/* ========================================================== */}
      {/* (UPGRADED) Math 數學按鈕 */}
      {/* ========================================================== */}
      <Dropdown label="Math">
        <DropdownItem onClick={() => onSimpleInsert('$', '$', 'E = mc^2')}>Inline Math $...$</DropdownItem>
        <DropdownItem onClick={() => onSimpleInsert('$$\n', '\n$$', 'f(x) = ...')}>Block Math $$...$$</DropdownItem>
        <DropdownItem onClick={onRequestSuperscript}>Superscript x^y</DropdownItem>
        <DropdownItem onClick={onRequestSubscript}>Subscript x_i</DropdownItem>
        <DropdownItem onClick={() => onSimpleInsert('$\\frac{', '}{denominator}$', 'numerator')}>Fraction</DropdownItem>
        <DropdownItem onClick={() => onSimpleInsert('$\\sqrt{', '}$', 'x')}>Square Root</DropdownItem>
        <DropdownItem onClick={() => onSimpleInsert('$\\sqrt[', ']{x}$', 'n')}>Nth Root</DropdownItem>
      </Dropdown>

      {/* ========================================================== */}
      {/* (NEW) Symbols 符號按鈕 */}
      {/* ========================================================== */}
      <Dropdown label="Symbols">
        <DropdownItem onClick={() => onSimpleInsert(' $\\pi$ ', '', '')}>Pi (π)</DropdownItem>
        <DropdownItem onClick={() => onSimpleInsert(' $\\theta$ ', '', '')}>Theta (θ)</DropdownItem>
        <DropdownItem onClick={() => onSimpleInsert(' $\\alpha$ ', '', '')}>Alpha (α)</DropdownItem>
        <DropdownItem onClick={() => onSimpleInsert(' $\\beta$ ', '', '')}>Beta (β)</DropdownItem>
        <DropdownItem onClick={() => onSimpleInsert(' $\\Delta$ ', '', '')}>Delta (Δ)</DropdownItem>
        <DropdownItem onClick={() => onSimpleInsert(' $\\times$ ', '', '')}>Times (×)</DropdownItem>
        <DropdownItem onClick={() => onSimpleInsert(' $\\div$ ', '', '')}>Divide (÷)</DropdownItem>
        <DropdownItem onClick={() => onSimpleInsert(' $\\infty$ ', '', '')}>Infinity (∞)</DropdownItem>
        <DropdownItem onClick={() => onSimpleInsert(' $\\pm$ ', '', '')}>Plus/Minus (±)</DropdownItem>
        <DropdownItem onClick={() => onSimpleInsert(' $\\to$ ', '', '')}>Arrow (→)</DropdownItem>
        <DropdownItem onClick={() => onSimpleInsert(' $\\neq$ ', '', '')}>Not Equal (≠)</DropdownItem>
      </Dropdown>

      {/* ========================================================== */}
      {/* (NEW) Structures 結構按鈕 */}
      {/* ========================================================== */}
      <Dropdown label="Calculus/Env">
        <DropdownItem onClick={() => onSimpleInsert('$\\sum_{i=1}^{', '}{x_i}$', 'n')}>Summation (Σ)</DropdownItem>
        <DropdownItem onClick={() => onSimpleInsert('$\\int_{', '}^{b}{f(x)dx}$', 'a')}>Integral (∫)</DropdownItem>
        <DropdownItem onClick={() => onSimpleInsert('$\\lim_{x \\to ', '}{f(x)}$', '0')}>Limit (lim)</DropdownItem>
        <DropdownItem onClick={() => onSimpleInsert('$$\\begin{aligned}\n', '\n\\end{aligned}$$', 'f(x) &= ... \\\\')}>Aligned Env</DropdownItem>
        {/* (CHANGED) 更新 Matrix Env 按鈕 */}
        <DropdownItem onClick={onRequestMatrix}>Matrix Env</DropdownItem>
      </Dropdown>

    </div>
  )
}