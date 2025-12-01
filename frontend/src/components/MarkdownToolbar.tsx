// frontend/src/components/MarkdownToolbar.tsx
import React from 'react'
import { ToolbarProps } from '../types'
import Dropdown, { DropdownItem } from './Dropdown'
import { Button } from './ui/Button'

// 輔助函式：產生包含 Tooltip 的按鈕
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

// 新增 onRequestLink, onRequestImage
export interface MarkdownToolbarProps extends ToolbarProps {
  onRequestLink?: () => void;
  onRequestImage?: () => void;
}

export default function MarkdownToolbar({ 
  onSimpleInsert, 
  onMathInsert, 
  onSmartBlock, 
  onSmartInline,
  onRequestTable,
  onRequestSuperscript, 
  onRequestSubscript,  
  onRequestMatrix,
  onRequestAligned,
  onRequestLink,
  onRequestImage,
}: MarkdownToolbarProps) {

  return (
    <div className="flex flex-wrap items-center gap-1">
      
      {/* --- 第一區：文字樣式 (Bold, Italic, Code, Highlight, Kbd) --- */}
      <div className="flex items-center gap-0.5 mr-2 border-r border-border-subtle pr-2">
        <ToolbarBtn 
          label="Bold (Ctrl+B)" 
          onClick={() => onSmartInline('**', 'bold')} 
          icon={<b className="font-serif text-lg">B</b>} 
        />
        <ToolbarBtn 
          label="Italic (Ctrl+I)" 
          onClick={() => onSmartInline('*', 'italic')} 
          icon={<i className="font-serif text-lg">I</i>} 
        />
        
        {/* Inline Code: 使用程式碼標籤圖示 */}
        <ToolbarBtn 
          label="Inline Code" 
          onClick={() => onSmartInline('`', 'code')} 
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
          } 
        />

        {/* Highlight: 使用螢光筆圖示 */}
        <ToolbarBtn 
          label="Highlight <mark>" 
          onClick={() => onSimpleInsert('<mark>', '</mark>', 'highlight')} 
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 11-6 6v3h9l3-3"/><path d="m22 2-2.6 2.6a1 1 0 0 1-1.4 0l-2-2a1 1 0 0 1 0-1.4L18.6 2a1 1 0 0 1 1.4 0l2 2a1 1 0 0 1 0 1.4Z"/></svg>
          } 
        />

        {/* Keyboard: 使用鍵盤圖示 */}
        <ToolbarBtn 
          label="Keyboard Input <kbd>" 
          onClick={() => onSimpleInsert('<kbd>', '</kbd>', 'Key')} 
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2" ry="2"/><path d="M6 8h.001"/><path d="M10 8h.001"/><path d="M14 8h.001"/><path d="M18 8h.001"/><path d="M6 12h.001"/><path d="M10 12h.001"/><path d="M14 12h.001"/><path d="M18 12h.001"/></svg>
          } 
        />
      </div>

      {/* --- 第二區：插入物件 (Link, Image, Table) --- */}
      <div className="flex items-center gap-0.5 mr-2 border-r border-border-subtle pr-2">
        <ToolbarBtn 
          label="Link" 
          onClick={onRequestLink || (() => onSimpleInsert('[', '](url)', 'text'))} 
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
          } 
        />
        <ToolbarBtn 
          label="Image" 
          onClick={onRequestImage || (() => onSimpleInsert('![', '](url)', 'alt'))}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
          } 
        />
        <ToolbarBtn 
          label="Table Wizard" 
          onClick={onRequestTable} 
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v18"/><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/></svg>
          } 
        />
      </div>

      {/* --- 第三區：排版與分隔 --- */}
      <Dropdown label="Format">
        <DropdownItem onClick={() => onSmartBlock('# ', 'heading')}>H1 Heading</DropdownItem>
        <DropdownItem onClick={() => onSmartBlock('## ', 'heading')}>H2 Heading</DropdownItem>
        <DropdownItem onClick={() => onSmartBlock('### ', 'heading')}>H3 Heading</DropdownItem>
        <div className="my-1 border-t border-border-base" />
        <DropdownItem onClick={() => onSmartBlock('* ', 'list')}>Bullet List</DropdownItem>
        <DropdownItem onClick={() => onSmartBlock('1. ', 'list')}>Numbered List</DropdownItem>
        <DropdownItem onClick={() => onSmartBlock('* [ ] ', 'task')}>Task List</DropdownItem>
        <DropdownItem onClick={() => onSmartBlock('> ', 'quote')}>Blockquote</DropdownItem>
        <div className="my-1 border-t border-border-base" />
        <DropdownItem onClick={() => onSimpleInsert('\n---\n', '', '')}>Divider</DropdownItem>
        <DropdownItem onClick={() => onSimpleInsert('```javascript\n', '\n```', '// code')}>Code Block</DropdownItem>
      </Dropdown>

      <div className="w-px h-4 bg-border-base mx-2"></div>

      {/* --- 第四區：數學 --- */}
      <Dropdown label="Math">
        <DropdownItem onClick={() => onSimpleInsert('$', '$', 'E=mc^2')}>Inline Math $</DropdownItem>
        <DropdownItem onClick={() => onSimpleInsert('$$\n', '\n$$', 'E=mc^2')}>Block Math $$</DropdownItem>
        <DropdownItem onClick={onRequestSuperscript}>Superscript x^y</DropdownItem>
        <DropdownItem onClick={onRequestSubscript}>Subscript x_i</DropdownItem>
        <DropdownItem onClick={() => onMathInsert('\\frac{', '}{denominator}', 'numerator')}>Fraction</DropdownItem>
        <DropdownItem onClick={() => onMathInsert('\\sqrt{', '}', 'x')}>Square Root</DropdownItem>
        <DropdownItem onClick={() => onMathInsert('\\sqrt[', ']{x}', 'n')}>Nth Root</DropdownItem>
      </Dropdown>

      <Dropdown label="Symbols">
        <DropdownItem onClick={() => onMathInsert('\\pi', '', '')}>Pi (π)</DropdownItem>
        <DropdownItem onClick={() => onMathInsert('\\theta', '', '')}>Theta (θ)</DropdownItem>
        <DropdownItem onClick={() => onMathInsert('\\alpha', '', '')}>Alpha (α)</DropdownItem>
        <DropdownItem onClick={() => onMathInsert('\\beta', '', '')}>Beta (β)</DropdownItem>
        <DropdownItem onClick={() => onMathInsert('\\lambda', '', '')}>Lambda (λ)</DropdownItem>
        <DropdownItem onClick={() => onMathInsert('\\Delta', '', '')}>Delta (Δ)</DropdownItem>
        <DropdownItem onClick={() => onMathInsert('\\times', '', '')}>Times (×)</DropdownItem>
        <DropdownItem onClick={() => onMathInsert('\\div', '', '')}>Divide (÷)</DropdownItem>
        <DropdownItem onClick={() => onMathInsert('\\infty', '', '')}>Infinity (∞)</DropdownItem>
        <DropdownItem onClick={() => onMathInsert('\\pm', '', '')}>Plus/Minus (±)</DropdownItem>
        <DropdownItem onClick={() => onMathInsert('\\to', '', '')}>Arrow (→)</DropdownItem>
        <DropdownItem onClick={() => onMathInsert('\\neq', '', '')}>Not Equal (≠)</DropdownItem>
      </Dropdown>

      <Dropdown label="Calculus">
        <DropdownItem onClick={() => onMathInsert('\\sum_{i=1}^{', '}{x_i}', 'n')}>Summation (Σ)</DropdownItem>
        <DropdownItem onClick={() => onMathInsert('\\int_{', '}^{b}{f(x)dx}', 'a')}>Integral (∫)</DropdownItem>
        <DropdownItem onClick={() => onMathInsert('\\lim_{x \\to ', '}{f(x)}', '0')}>Limit (lim)</DropdownItem>
        <div className="my-1 border-t border-border-base" />
        <DropdownItem onClick={onRequestMatrix}>Matrix Wizard</DropdownItem>
        <DropdownItem onClick={onRequestAligned}>Aligned Wizard</DropdownItem>
      </Dropdown>
    </div>
  )
}