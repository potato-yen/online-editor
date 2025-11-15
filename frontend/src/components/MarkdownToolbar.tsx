// src/components/MarkdownToolbar.tsx
import React from 'react'
import { ToolbarProps } from '../types' // 匯入我們剛建立的共享型別

// (CHANGED) 移除 onIndent 屬性 (prop)
export default function MarkdownToolbar({ 
  onSimpleInsert, 
  onSmartBlock, 
  onSmartInline,
  onRequestTable,
  // onIndent, // (REMOVED)
}: ToolbarProps) {
  const btnClass = "w-full text-left px-3 py-1.5 rounded-xl text-xs font-medium bg-neutral-800 hover:bg-neutral-700 border border-neutral-600"
  const dividerClass = "h-px w-full my-1 bg-neutral-700" 
  const labelClass = "text-xs font-semibold text-neutral-400 mt-2"

  return (
    <div className="flex flex-col gap-2">
      {/* 基礎格式 */}
      <span className={labelClass}>Style</span>
      <button onClick={() => onSmartInline('**', 'bold text')} className={btnClass} title="粗體">Bold</button>
      <button onClick={() => onSmartInline('*', 'italic text')} className={btnClass} title="斜體">Italic</button>
      <button onClick={() => onSmartInline('~~', 'strikethrough')} className={btnClass} title="刪除線">Strike</button>
      <button onClick={() => onSmartInline('`', 'code')} className={btnClass} title="行內程式碼">Code</button>
      
      <div className={dividerClass} />

      {/* 標題 */}
      <span className={labelClass}>Heading</span>
      <button onClick={() => onSmartBlock('# ', 'heading')} className={btnClass} title="標題 1">H1</button>
      <button onClick={() => onSmartBlock('## ', 'heading')} className={btnClass} title="標題 2">H2</button>
      <button onClick={() => onSmartBlock('### ', 'heading')} className={btnClass} title="標題 3">H3</button>

      <div className={dividerClass} />
      
      {/* 區塊 (Block) */}
      <span className={labelClass}>Block</span>
      <button onClick={() => onSmartBlock('> ', 'quote')} className={btnClass} title="引用">Quote</button>
      <button onClick={() => onSmartBlock('* ', 'list')} className={btnClass} title="項目清單">List</button>
      <button onClick={() => onSmartBlock('1. ', 'list')} className={btnClass} title="數字清單">Num List</button>
      <button onClick={() => onSmartBlock('* [ ] ', 'task')} className={btnClass} title="待辦清單">Task</button>

      {/* (REMOVED) 刪除 Indent 區塊 */}
      {/* <div className={dividerClass} />
      <span className={labelClass}>Indent</span>
      <button onClick={() => onIndent('indent')} className={btnClass} title="增加縮排 (巢狀清單)">Indent (Tab)</button>
      <button onClick={() => onIndent('outdent')} className={btnClass} title="減少縮排 (取消巢狀)">Outdent (Shift+Tab)</button> */}
      
      <div className={dividerClass} />
      
      {/* 特殊元素 (Element) */}
      <span className={labelClass}>Element</span>
      <button onClick={() => onSimpleInsert('[', '](https://)', 'link text')} className={btnClass} title="插入連結">Link</button>
      <button onClick={() => onSimpleInsert('![', '](image-url)', 'alt text')} className={btnClass} title="插入圖片">Image</button>
      <button onClick={() => onSimpleInsert('\n---\n', '', '')} className={btnClass} title="水平分隔線">HR</button>
      <button onClick={onRequestTable} className={btnClass} title="插入表格">Table</button>
      
      <div className={dividerClass} />
      <span className={labelClass}>Inline HTML</span>
      <button onClick={() => onSmartInline('<kbd>', '</kbd>', 'Ctrl')} className={btnClass} title="鍵盤按鍵">KBD Tag</button>
      <button onClick={() => onSmartInline('<mark>', '</mark>', 'highlight')} className={btnClass} title="高亮標記">Mark Tag</button>

      <div className={dividerClass} />
      
      {/* 程式碼 & 數學 (Code/Math) */}
      <span className={labelClass}>Code/Math</span>
      <button onClick={() => onSimpleInsert('```javascript\n', '\n```', '// code')} className={btnClass} title="程式碼區塊">Code Block</button>
      <button onClick={() => onSimpleInsert('$', '$', 'E = mc^2')} className={btnClass} title="LaTeX 行內公式">$...$</button>
      <button onClick={() => onSimpleInsert('$$\n', '\n$$', 'f(x) = ...')} className={btnClass} title="LaTeX 區塊公式">$$...$$</button>
      <button onClick={() => onSimpleInsert('$\\frac{', '}{denominator}$', 'numerator')} className={btnClass} title="LaTeX 分數">Fraction</button>
    </div>
  )
}