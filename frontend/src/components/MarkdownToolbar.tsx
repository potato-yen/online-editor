// src/components/MarkdownToolbar.tsx
import React from 'react'
import { ToolbarProps } from '../types'
import Dropdown, { DropdownItem } from './Dropdown'

// (CHANGED) ToolbarProps 現在包含了所有函式
export default function MarkdownToolbar({ 
  onSimpleInsert, 
  onSmartBlock, 
  onSmartInline,
  onRequestTable,
  onRequestSuperscript, 
  onRequestSubscript,  
  onRequestMatrix, // (NEW)
}: ToolbarProps) {
  
  // (NEW) 單一按鈕的樣式
  const btnClass = "px-3 py-1.5 rounded-lg text-xs font-medium bg-neutral-800 hover:bg-neutral-700 border border-neutral-600"

  return (
    // (CHANGED) 改為 flex-row (水平排列)
    <div className="flex flex-wrap items-center gap-2">
      
      {/* --- Style (行內) --- */}
      <Dropdown label="Style">
        <DropdownItem onClick={() => onSmartInline('**', 'bold text')}>Bold</DropdownItem>
        <DropdownItem onClick={() => onSmartInline('*', 'italic text')}>Italic</DropdownItem>
        <DropdownItem onClick={() => onSmartInline('~~', 'strikethrough')}>Strike</DropdownItem>
        <DropdownItem onClick={() => onSmartInline('`', 'code')}>Code</DropdownItem>
      </Dropdown>

      {/* --- Heading (區塊) --- */}
      <Dropdown label="Heading">
        <DropdownItem onClick={() => onSmartBlock('# ', 'heading')}>Heading 1</DropdownItem>
        <DropdownItem onClick={() => onSmartBlock('## ', 'heading')}>Heading 2</DropdownItem>
        <DropdownItem onClick={() => onSmartBlock('### ', 'heading')}>Heading 3</DropdownItem>
      </Dropdown>
      
      {/* --- Block (區塊) --- */}
      <Dropdown label="Block">
        <DropdownItem onClick={() => onSmartBlock('> ', 'quote')}>Quote</DropdownItem>
        <DropdownItem onClick={() => onSmartBlock('* ', 'list')}>List (Bullet)</DropdownItem>
        <DropdownItem onClick={() => onSmartBlock('1. ', 'list')}>List (Number)</DropdownItem>
        <DropdownItem onClick={() => onSmartBlock('* [ ] ', 'task')}>Task List</DropdownItem>
      </Dropdown>

      {/* --- Element (插入) --- */}
      <Dropdown label="Insert">
        <DropdownItem onClick={() => onSimpleInsert('[', '](https://)', 'link text')}>Link</DropdownItem>
        <DropdownItem onClick={() => onSimpleInsert('![', '](image-url)', 'alt text')}>Image</DropdownItem>
        <DropdownItem onClick={onRequestTable}>Table</DropdownItem>
        <DropdownItem onClick={() => onSimpleInsert('\n---\n', '', '')}>Horizontal Rule</DropdownItem>
        <DropdownItem onClick={() => onSimpleInsert('```javascript\n', '\n```', '// code')}>Code Block</DropdownItem>
      </Dropdown>

      {/* --- HTML (行內) --- */}
      <Dropdown label="HTML">
        <DropdownItem onClick={() => onSimpleInsert('<kbd>', '</kbd>', 'Ctrl')}>KBD Tag</DropdownItem>
        <DropdownItem onClick={() => onSimpleInsert('<mark>', '</mark>', 'highlight')}>Mark Tag</DropdownItem>
      </Dropdown>

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
