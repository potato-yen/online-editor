// frontend/src/components/LatexToolbar.tsx
import React from 'react'
import { ToolbarProps } from '../types'
import Dropdown, { DropdownItem } from './Dropdown'

type LatexToolbarProps = {
  onSimpleInsert: ToolbarProps['onSimpleInsert'];
  onRequestSuperscript: ToolbarProps['onRequestSuperscript'];
  onRequestSubscript: ToolbarProps['onRequestSubscript'];
  onRequestMatrix: ToolbarProps['onRequestMatrix'];
}

export default function LatexToolbar({ 
  onSimpleInsert,
  onRequestSuperscript,
  onRequestSubscript,
  onRequestMatrix
}: LatexToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* 1. 數學結構 - 補回 Nth Root */}
      <Dropdown label="Math Structure">
        <DropdownItem onClick={() => onSimpleInsert('$', '$', 'E = mc^2')}>Inline Math</DropdownItem>
        <DropdownItem onClick={() => onSimpleInsert('$$\n', '\n$$', 'f(x) = ...')}>Block Math</DropdownItem>
        <DropdownItem onClick={onRequestSuperscript}>Superscript x^y</DropdownItem>
        <DropdownItem onClick={onRequestSubscript}>Subscript x_i</DropdownItem>
        <DropdownItem onClick={() => onSimpleInsert('$\\frac{', '}{denominator}$', 'numerator')}>Fraction</DropdownItem>
        <DropdownItem onClick={() => onSimpleInsert('$\\sqrt{', '}$', 'x')}>Square Root</DropdownItem>
        <DropdownItem onClick={() => onSimpleInsert('$\\sqrt[', ']{x}$', 'n')}>Nth Root</DropdownItem>
      </Dropdown>

      {/* 2. 希臘字母與符號 - 補回 Times, Divide, PM, Arrow, NEQ */}
      <Dropdown label="Greek & Symbols">
        <DropdownItem onClick={() => onSimpleInsert(' \\pi ', '', '')}>Pi (π)</DropdownItem>
        <DropdownItem onClick={() => onSimpleInsert(' \\theta ', '', '')}>Theta (θ)</DropdownItem>
        <DropdownItem onClick={() => onSimpleInsert(' \\alpha ', '', '')}>Alpha (α)</DropdownItem>
        <DropdownItem onClick={() => onSimpleInsert(' \\beta ', '', '')}>Beta (β)</DropdownItem>
        <DropdownItem onClick={() => onSimpleInsert(' \\Delta ', '', '')}>Delta (Δ)</DropdownItem>
        <DropdownItem onClick={() => onSimpleInsert(' \\times ', '', '')}>Times (×)</DropdownItem>
        <DropdownItem onClick={() => onSimpleInsert(' \\div ', '', '')}>Divide (÷)</DropdownItem>
        <DropdownItem onClick={() => onSimpleInsert(' \\infty ', '', '')}>Infinity (∞)</DropdownItem>
        <DropdownItem onClick={() => onSimpleInsert(' \\pm ', '', '')}>Plus/Minus (±)</DropdownItem>
        <DropdownItem onClick={() => onSimpleInsert(' \\to ', '', '')}>Arrow (→)</DropdownItem>
        <DropdownItem onClick={() => onSimpleInsert(' \\neq ', '', '')}>Not Equal (≠)</DropdownItem>
      </Dropdown>

      {/* 3. 微積分與矩陣 */}
      <Dropdown label="Calculus & Matrix">
        <DropdownItem onClick={() => onSimpleInsert('\\sum_{i=1}^{', '}{x_i}$', 'n')}>Summation (Σ)</DropdownItem>
        <DropdownItem onClick={() => onSimpleInsert('\\int_{', '}^{b}{f(x)dx}$', 'a')}>Integral (∫)</DropdownItem>
        <DropdownItem onClick={() => onSimpleInsert('\\lim_{x \\to ', '}{f(x)}$', '0')}>Limit (lim)</DropdownItem>
        <DropdownItem onClick={() => onSimpleInsert('\\begin{aligned}\n', '\n\\end{aligned}', 'f(x) &= ... \\\\')}>Aligned Env</DropdownItem>
        <DropdownItem onClick={onRequestMatrix}>Matrix Env</DropdownItem>
      </Dropdown>
    </div>
  )
}