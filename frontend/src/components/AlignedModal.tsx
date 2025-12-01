// frontend/src/components/AlignedModal.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/Button';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (lines: { left: string; symbol: string; right: string }[]) => void;
}

type LineData = {
  left: string;
  symbol: string;
  right: string;
};

// 追蹤當前焦點的游標位置
type SelectionState = {
  lineIndex: number;
  field: 'left' | 'right' | 'symbol';
  start: number;
  end: number;
} | null;

export default function AlignedModal({ isOpen, onClose, onCreate }: Props) {
  const [lines, setLines] = useState<LineData[]>([
    { left: 'f(x)', symbol: '=', right: '(x+a)(x+b)' },
    { left: '', symbol: '=', right: 'x^2 + (a+b)x + ab' },
  ]);

  // 儲存最後一次操作的輸入框狀態
  const selectionRef = useRef<SelectionState>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  // 當輸入框被選取或鍵盤操作時，更新游標位置記錄
  const handleSelect = (
    e: React.SyntheticEvent<HTMLInputElement>,
    lineIndex: number,
    field: 'left' | 'right' | 'symbol'
  ) => {
    const target = e.currentTarget;
    selectionRef.current = {
      lineIndex,
      field,
      start: target.selectionStart || 0,
      end: target.selectionEnd || 0,
    };
  };

  useEffect(() => {
    if (isOpen) {
      setLines([
        { left: 'f(x)', symbol: '=', right: '' },
        { left: '', symbol: '=', right: '' },
      ]);
      // 初始化選取狀態為第一行的右側，方便直接開始
      selectionRef.current = { lineIndex: 0, field: 'right', start: 0, end: 0 };
      
      setTimeout(() => {
        // 預設聚焦在第一行的右側 (通常左側 f(x) 變動少，右側開始推導)
        const inputs = document.querySelectorAll<HTMLInputElement>('#aligned-modal-inputs input');
        // inputs[0]=left, [1]=symbol, [2]=right...
        if (inputs[2]) {
            inputs[2].focus();
        } else {
            firstInputRef.current?.focus();
        }
      }, 100);
    }
  }, [isOpen]);

  // 插入文字到當前記錄的輸入框
  const insertText = (prefix: string, suffix: string = '') => {
    const sel = selectionRef.current;
    if (!sel) return; // 如果沒聚焦過任何框，就不動作

    const { lineIndex, field, start, end } = sel;
    
    // 防呆：確保索引有效
    if (lineIndex < 0 || lineIndex >= lines.length) return;

    setLines(prevLines => {
      const newLines = [...prevLines];
      const currentLine = newLines[lineIndex];
      const text = currentLine[field]; // 取得目前文字

      // 切割字串並插入
      const before = text.substring(0, start);
      const selected = text.substring(start, end);
      const after = text.substring(end);

      // 如果有選取文字，通常是把它包起來 (例如分母)
      // 如果沒選取，就直接插入
      const newText = before + prefix + selected + suffix + after;

      newLines[lineIndex] = { ...currentLine, [field]: newText };
      return newLines;
    });

    // 插入後，嘗試讓瀏覽器把焦點放回該輸入框 (提升體驗)
    // 這裡需要一點 DOM 操作技巧，透過 ID 找回 input
    setTimeout(() => {
        const inputId = `aligned-input-${lineIndex}-${field}`;
        const el = document.getElementById(inputId) as HTMLInputElement;
        if (el) {
            el.focus();
            // 移動游標到插入內容的中間或後面
            const newCursorPos = start + prefix.length + (suffix ? 0 : 0); 
            // 若 suffix 為空，代表是取代型符號，游標在後
            // 若 suffix 有值，代表是包覆型 (如 ^{})，我們希望游標停在 {} 中間方便輸入
            // 這裡做個簡單判斷：如果是 ^{} 這種，游標停在 } 前面
            // 如果是有選取文字被包覆，游標停在最尾端
            
            // 簡單策略：如果有選取文字，停在最尾；如果沒有，停在 prefix 之後
            el.setSelectionRange(newCursorPos, newCursorPos);
        }
    }, 0);
  };

  if (!isOpen) return null;

  const updateLine = (index: number, field: keyof LineData, value: string) => {
    const newLines = [...lines];
    newLines[index] = { ...newLines[index], [field]: value };
    setLines(newLines);
  };

  const addLine = () => {
    setLines([...lines, { left: '', symbol: '=', right: '' }]);
  };

  const removeLine = (index: number) => {
    if (lines.length <= 1) return;
    setLines(lines.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate(lines);
    onClose();
  };

  // 迷你工具列按鈕樣式
  const toolBtnClass = "px-2 py-1 text-xs bg-surface-elevated hover:bg-neutral-600 border border-neutral-600 rounded text-neutral-200 transition-colors font-mono";

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-neutral-800 rounded-xl shadow-lg p-6 w-full max-w-3xl border border-neutral-700 max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-white">多行公式精靈 (Aligned Equations)</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* --- 迷你工具列 (Mini Toolbar) --- */}
        <div className="mb-4 p-2 bg-neutral-900/50 rounded-lg border border-neutral-700 flex flex-wrap gap-2 items-center">
            <span className="text-xs text-neutral-500 mr-2 uppercase tracking-wider font-bold">Quick Insert:</span>
            
            {/* 使用 onMouseDown PREVENT DEFAULT 來防止按鈕點擊時 input 失去焦點 (雖然我們有 selectionRef 備份，但這樣體驗更好) */}
            <button type="button" className={toolBtnClass} onMouseDown={e=>e.preventDefault()} onClick={() => insertText('^{', '}')} title="Superscript">x^n</button>
            <button type="button" className={toolBtnClass} onMouseDown={e=>e.preventDefault()} onClick={() => insertText('_{', '}')} title="Subscript">x_n</button>
            <button type="button" className={toolBtnClass} onMouseDown={e=>e.preventDefault()} onClick={() => insertText('\\frac{', '}{}')} title="Fraction">a/b</button>
            <button type="button" className={toolBtnClass} onMouseDown={e=>e.preventDefault()} onClick={() => insertText('\\sqrt{', '}')} title="Sqrt">√x</button>
            <div className="w-px h-4 bg-neutral-700 mx-1"></div>
            <button type="button" className={toolBtnClass} onMouseDown={e=>e.preventDefault()} onClick={() => insertText('\\pi')} title="Pi">π</button>
            <button type="button" className={toolBtnClass} onMouseDown={e=>e.preventDefault()} onClick={() => insertText('\\times')} title="Times">×</button>
            <button type="button" className={toolBtnClass} onMouseDown={e=>e.preventDefault()} onClick={() => insertText('\\div')} title="Divide">÷</button>
            <button type="button" className={toolBtnClass} onMouseDown={e=>e.preventDefault()} onClick={() => insertText('\\infty')} title="Infinity">∞</button>
            <button type="button" className={toolBtnClass} onMouseDown={e=>e.preventDefault()} onClick={() => insertText('\\int_{}^{}')} title="Integral">∫</button>
            <button type="button" className={toolBtnClass} onMouseDown={e=>e.preventDefault()} onClick={() => insertText('\\sum_{}^{}')} title="Sum">Σ</button>
        </div>
        
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-track-neutral-900 scrollbar-thumb-neutral-600 space-y-3" id="aligned-modal-inputs">
            
            <div className="flex gap-2 text-xs text-neutral-400 px-1">
              <div className="flex-[3]">左側 (Left)</div>
              <div className="flex-[1] text-center">符號 (Symbol)</div>
              <div className="flex-[4]">右側 (Right)</div>
              <div className="w-8"></div>
            </div>

            {lines.map((line, idx) => (
              <div key={idx} className="flex gap-2 items-center group">
                {/* Left Part */}
                <input
                  id={`aligned-input-${idx}-left`}
                  ref={idx === 0 ? firstInputRef : null}
                  type="text"
                  value={line.left}
                  placeholder={idx > 0 ? "(空白)" : "f(x)"}
                  onChange={(e) => updateLine(idx, 'left', e.target.value)}
                  onSelect={(e) => handleSelect(e, idx, 'left')} // 追蹤游標
                  onClick={(e) => handleSelect(e, idx, 'left')}  // 點擊也算
                  onKeyUp={(e) => handleSelect(e, idx, 'left')}  // 鍵盤移動也算
                  className="flex-[3] px-3 py-2 bg-neutral-900 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-sky-500 text-right font-mono text-sm"
                />
                
                {/* Symbol */}
                <input
                  id={`aligned-input-${idx}-symbol`}
                  type="text"
                  value={line.symbol}
                  onChange={(e) => updateLine(idx, 'symbol', e.target.value)}
                  onSelect={(e) => handleSelect(e, idx, 'symbol')}
                  onClick={(e) => handleSelect(e, idx, 'symbol')}
                  className="flex-[1] px-2 py-2 bg-neutral-900 border border-neutral-600 rounded-md text-sky-400 font-bold text-center focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono text-sm"
                />

                {/* Right Part */}
                <input
                  id={`aligned-input-${idx}-right`}
                  type="text"
                  value={line.right}
                  placeholder="..."
                  onChange={(e) => updateLine(idx, 'right', e.target.value)}
                  onSelect={(e) => handleSelect(e, idx, 'right')}
                  onClick={(e) => handleSelect(e, idx, 'right')}
                  className="flex-[4] px-3 py-2 bg-neutral-900 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono text-sm"
                />

                {/* Delete Button */}
                <div className="w-8 flex justify-center">
                  <button
                    type="button"
                    onClick={() => removeLine(idx)}
                    disabled={lines.length === 1}
                    className="p-1.5 text-neutral-500 hover:text-red-400 hover:bg-neutral-700 rounded-full disabled:opacity-30 disabled:hover:bg-transparent transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                    tabIndex={-1}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addLine}
              className="w-full border-dashed text-neutral-400 hover:text-white hover:border-neutral-500"
            >
              + 新增一行 (Add Line)
            </Button>
          </div>

          <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-neutral-700">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
            >
              取消
            </Button>
            <Button
              type="submit"
              variant="primary"
            >
              插入 (Insert)
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}