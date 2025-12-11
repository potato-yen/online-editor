// frontend/src/components/LatexToolbar.tsx
import React from 'react'
import { ToolbarProps } from '../types'
import Dropdown, { DropdownItem } from './Dropdown'
import { Button } from './ui/Button'

// 輔助按鈕
const ToolbarBtn = ({ onClick, icon, label }: { onClick: () => void; icon: React.ReactNode; label: string }) => (
  <Button
    variant="ghost"
    size="icon"
    onClick={onClick}
    title={label}
    className="h-8 w-8 text-content-secondary hover:text-brand-DEFAULT"
  >
    {icon}
  </Button>
);

type LatexToolbarProps = {
  onSimpleInsert: ToolbarProps['onSimpleInsert'];
  onMathInsert: ToolbarProps['onMathInsert'];
  onRequestSuperscript: ToolbarProps['onRequestSuperscript'];
  onRequestSubscript: ToolbarProps['onRequestSubscript'];
  onRequestMatrix: ToolbarProps['onRequestMatrix'];
  onRequestAligned: ToolbarProps['onRequestAligned'];
  onRequestTable: ToolbarProps['onRequestTable'];
}

export default function LatexToolbar({ 
  onSimpleInsert,
  onMathInsert,
  onRequestSuperscript,
  onRequestSubscript,
  onRequestMatrix,
  onRequestAligned,
  onRequestTable
}: LatexToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      
      {/* --- 第一區：高頻結構 (快捷按鈕) --- */}
      <div className="flex items-center gap-0.5 mr-2 border-r border-border-subtle pr-2">
        <ToolbarBtn 
          label="Fraction" 
          onClick={() => onMathInsert('\\frac{', '}{}', 'a', undefined, 'amsmath')} 
          icon={<span className="font-serif text-sm">½</span>} 
        />
        <ToolbarBtn 
          label="Superscript" 
          onClick={onRequestSuperscript} 
          icon={<span className="font-serif text-xs">x<sup>2</sup></span>} 
        />
        <ToolbarBtn 
          label="Subscript" 
          onClick={onRequestSubscript} 
          icon={<span className="font-serif text-xs">x<sub>i</sub></span>} 
        />
        <ToolbarBtn 
          label="Square Root" 
          // [MODIFIED] 改為插入 \sqrt{x} 並反白 x
          onClick={() => onMathInsert('\\sqrt{', '}', 'x')} 
          icon={<span className="font-serif text-sm">√</span>} 
        />
      </div>

      {/* --- 第二區：Wizards (快捷按鈕) --- */}
      <div className="flex items-center gap-0.5 mr-2 border-r border-border-subtle pr-2">
        <ToolbarBtn 
          label="Matrix Wizard" 
          onClick={onRequestMatrix} 
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M7 7h.01"/><path d="M7 12h.01"/><path d="M7 17h.01"/><path d="M12 7h.01"/><path d="M12 12h.01"/><path d="M12 17h.01"/><path d="M17 7h.01"/><path d="M17 12h.01"/><path d="M17 17h.01"/></svg>
          } 
        />
        <ToolbarBtn 
          label="Aligned Equations Wizard" 
          onClick={onRequestAligned} 
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M3 12h18"/><path d="M3 18h18"/><path d="M7 6v12"/></svg>
          } 
        />
      </div>

      {/* --- 第三區：完整分類 (Dropdowns) --- */}
      
      <Dropdown label="Structure">
        <DropdownItem onClick={() => onSimpleInsert('\\section{', '}', 'Title')}>Section</DropdownItem>
        <DropdownItem onClick={() => onSimpleInsert('\\subsection{', '}', 'Subtitle')}>Subsection</DropdownItem>
        <div className="my-1 border-t border-border-base" />
        <DropdownItem onClick={() => onSimpleInsert('\\begin{itemize}\n  \\item ', '\n\\end{itemize}', 'Item 1')}>Bulleted List</DropdownItem>
        <DropdownItem onClick={() => onSimpleInsert('\\begin{enumerate}\n  \\item ', '\n\\end{enumerate}', 'Item 1')}>Numbered List</DropdownItem>
        <div className="my-1 border-t border-border-base" />
        <DropdownItem onClick={onRequestTable}>Table Wizard</DropdownItem>
      </Dropdown>

      <Dropdown label="Greek & Symbols">
        <DropdownItem onClick={() => onMathInsert('\\pi', '', '')}>Pi (π)</DropdownItem>
        <DropdownItem onClick={() => onMathInsert('\\theta', '', '')}>Theta (θ)</DropdownItem>
        <DropdownItem onClick={() => onMathInsert('\\alpha', '', '')}>Alpha (α)</DropdownItem>
        <DropdownItem onClick={() => onMathInsert('\\beta', '', '')}>Beta (β)</DropdownItem>
        <DropdownItem onClick={() => onMathInsert('\\lambda', '', '')}>Lambda (λ)</DropdownItem>
        <DropdownItem onClick={() => onMathInsert('\\omega', '', '')}>Omega (ω)</DropdownItem>
        <DropdownItem onClick={() => onMathInsert('\\Omega', '', '')}>Omega (Ω)</DropdownItem>
        <DropdownItem onClick={() => onMathInsert('\\Delta', '', '')}>Delta (Δ)</DropdownItem>
        
        <div className="my-1 border-t border-border-base" />
        
        <DropdownItem onClick={() => onMathInsert('\\times', '', '')}>Times (×)</DropdownItem>
        <DropdownItem onClick={() => onMathInsert('\\div', '', '')}>Divide (÷)</DropdownItem>
        <DropdownItem onClick={() => onMathInsert('\\cdot', '', '')}>Dot (·)</DropdownItem>
        <DropdownItem onClick={() => onMathInsert('\\pm', '', '')}>Plus/Minus (±)</DropdownItem>
        <DropdownItem onClick={() => onMathInsert('\\approx', '', '')}>Approx (≈)</DropdownItem>
        <DropdownItem onClick={() => onMathInsert('\\neq', '', '')}>Not Equal (≠)</DropdownItem>
        <DropdownItem onClick={() => onMathInsert('\\leq', '', '', undefined, 'amssymb')}>Less Eq (≤)</DropdownItem>
        <DropdownItem onClick={() => onMathInsert('\\geq', '', '', undefined, 'amssymb')}>Greater Eq (≥)</DropdownItem>
        
        <div className="my-1 border-t border-border-base" />

        <DropdownItem onClick={() => onMathInsert('\\infty', '', '')}>Infinity (∞)</DropdownItem>
        <DropdownItem onClick={() => onMathInsert('\\to', '', '')}>Arrow (→)</DropdownItem>
        <DropdownItem onClick={() => onMathInsert('\\in', '', '')}>Element of (∈)</DropdownItem>
        <DropdownItem onClick={() => onMathInsert('\\forall', '', '')}>For all (∀)</DropdownItem>
      </Dropdown>

      <Dropdown label="Calculus">
        <DropdownItem onClick={() => onMathInsert('\\nabla', '', '')}>Gradient (∇)</DropdownItem>
        <DropdownItem onClick={() => onMathInsert('\\partial', '', '')}>Partial (∂)</DropdownItem>
        <DropdownItem onClick={() => onMathInsert('\\sum_{i=1}^{', '}{x_i}', 'n')}>Summation (Σ)</DropdownItem>
        <DropdownItem onClick={() => onMathInsert('\\int_{', '}^{b}{f(x)dx}', 'a')}>Integral (∫)</DropdownItem>
        <DropdownItem onClick={() => onMathInsert('\\lim_{x \\to ', '}{f(x)}', '0')}>Limit (lim)</DropdownItem>
        <div className="my-1 border-t border-border-base" />
        {/* [MODIFIED] Sin/Cos 加上大括號與預設參數 */}
        <DropdownItem onClick={() => onMathInsert('\\sin{', '}', 'x')}>Sin</DropdownItem>
        <DropdownItem onClick={() => onMathInsert('\\cos{', '}', 'x')}>Cos</DropdownItem>
        <DropdownItem onClick={() => onMathInsert('\\log{', '}', 'x')}>Log</DropdownItem>
        <DropdownItem onClick={() => onMathInsert('\\ln{', '}', 'x')}>Ln</DropdownItem>
      </Dropdown>
    </div>
  )
}