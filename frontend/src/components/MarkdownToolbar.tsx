// frontend/src/components/MarkdownToolbar.tsx
import React from 'react'
import { ToolbarProps } from '../types'
import Dropdown, { DropdownItem } from './Dropdown'

export default function MarkdownToolbar({ 
  onSimpleInsert, 
  onSmartBlock, 
  onSmartInline,
  onRequestTable,
  onRequestSuperscript, 
  onRequestSubscript,  
  onRequestMatrix,
}: ToolbarProps) {

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* 1. 文字樣式 & HTML (合併) */}
      <Dropdown label="Text Style">
        <DropdownItem onClick={() => onSmartInline('**', 'bold text')}>Bold</DropdownItem>
        <DropdownItem onClick={() => onSmartInline('*', 'italic text')}>Italic</DropdownItem>
        <DropdownItem onClick={() => onSmartInline('~~', 'strikethrough')}>Strikethrough</DropdownItem>
        <DropdownItem onClick={() => onSmartInline('`', 'code')}>Inline Code</DropdownItem>
        <DropdownItem onClick={() => onSimpleInsert('<kbd>', '</kbd>', 'Ctrl')}>Keyboard &lt;kbd&gt;</DropdownItem>
        <DropdownItem onClick={() => onSimpleInsert('<mark>', '</mark>', 'highlight')}>Highlight &lt;mark&gt;</DropdownItem>
      </Dropdown>

      {/* 2. 標題 */}
      <Dropdown label="Heading">
        <DropdownItem onClick={() => onSmartBlock('# ', 'heading')}>Heading 1</DropdownItem>
        <DropdownItem onClick={() => onSmartBlock('## ', 'heading')}>Heading 2</DropdownItem>
        <DropdownItem onClick={() => onSmartBlock('### ', 'heading')}>Heading 3</DropdownItem>
      </Dropdown>
      
      {/* 3. 列表與區塊 */}
      <Dropdown label="Lists">
        <DropdownItem onClick={() => onSmartBlock('* ', 'list')}>Bullet List</DropdownItem>
        <DropdownItem onClick={() => onSmartBlock('1. ', 'list')}>Numbered List</DropdownItem>
        <DropdownItem onClick={() => onSmartBlock('* [ ] ', 'task')}>Task List</DropdownItem>
        <DropdownItem onClick={() => onSmartBlock('> ', 'quote')}>Blockquote</DropdownItem>
      </Dropdown>

      {/* 4. 插入物件 */}
      <Dropdown label="Insert">
        <DropdownItem onClick={() => onSimpleInsert('[', '](https://)', 'link text')}>Link</DropdownItem>
        <DropdownItem onClick={() => onSimpleInsert('![', '](image-url)', 'alt text')}>Image</DropdownItem>
        <DropdownItem onClick={onRequestTable}>Table</DropdownItem>
        <DropdownItem onClick={() => onSimpleInsert('\n---\n', '', '')}>Divider</DropdownItem>
        <DropdownItem onClick={() => onSimpleInsert('```javascript\n', '\n```', '// code')}>Code Block</DropdownItem>
      </Dropdown>

      {/* 5. 數學結構 (Math) - 補回 Nth Root */}
      <Dropdown label="Math">
        <DropdownItem onClick={() => onSimpleInsert('$', '$', 'E = mc^2')}>Inline Math</DropdownItem>
        <DropdownItem onClick={() => onSimpleInsert('$$\n', '\n$$', 'f(x) = ...')}>Block Math</DropdownItem>
        <DropdownItem onClick={onRequestSuperscript}>Superscript</DropdownItem>
        <DropdownItem onClick={onRequestSubscript}>Subscript</DropdownItem>
        <DropdownItem onClick={() => onSimpleInsert('$\\frac{', '}{denominator}$', 'numerator')}>Fraction</DropdownItem>
        <DropdownItem onClick={() => onSimpleInsert('$\\sqrt{', '}$', 'x')}>Square Root</DropdownItem>
        <DropdownItem onClick={() => onSimpleInsert('$\\sqrt[', ']{x}$', 'n')}>Nth Root</DropdownItem>
      </Dropdown>

      {/* 6. (補回) 符號 (Symbols) - 整組補回 */}
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

      {/* 7. (補回) 微積分與環境 (Calculus) - 整組補回 */}
      <Dropdown label="Calculus">
        <DropdownItem onClick={() => onSimpleInsert('$\\sum_{i=1}^{', '}{x_i}$', 'n')}>Summation (Σ)</DropdownItem>
        <DropdownItem onClick={() => onSimpleInsert('$\\int_{', '}^{b}{f(x)dx}$', 'a')}>Integral (∫)</DropdownItem>
        <DropdownItem onClick={() => onSimpleInsert('$\\lim_{x \\to ', '}{f(x)}$', '0')}>Limit (lim)</DropdownItem>
        <DropdownItem onClick={() => onSimpleInsert('$$\\begin{aligned}\n', '\n\\end{aligned}$$', 'f(x) &= ... \\\\')}>Aligned Env</DropdownItem>
        <DropdownItem onClick={onRequestMatrix}>Matrix Env</DropdownItem>
      </Dropdown>
    </div>
  )
}