// frontend/src/components/MatrixModal.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/Button';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (matrixData: string[][]) => void; 
}

// 追蹤當前焦點的游標位置
type SelectionState = {
  row: number;
  col: number;
  start: number;
  end: number;
} | null;

export default function MatrixModal({ isOpen, onClose, onCreate }: Props) {
  const [rows, setRows] = useState(2);
  const [cols, setCols] = useState(2);
  const [matrixData, setMatrixData] = useState<string[][]>([]);

  // 儲存最後一次操作的輸入框狀態
  const selectionRef = useRef<SelectionState>(null);

  const rowsInputRef = useRef<HTMLInputElement>(null);
  const colsInputRef = useRef<HTMLInputElement>(null);
  const submitButtonRef = useRef<HTMLButtonElement>(null);
  
  useEffect(() => {
    if (isOpen) {
      setRows(2);
      setCols(2);
      setTimeout(() => {
        rowsInputRef.current?.focus();
        rowsInputRef.current?.select();
      }, 100); 
    }
  }, [isOpen]);

  useEffect(() => {
    setMatrixData(() => { 
      const newMatrix: string[][] = [];
      for (let r = 0; r < rows; r++) {
        const newRow: string[] = [];
        for (let c = 0; c < cols; c++) {
          newRow.push(`a_{${r + 1}${c + 1}}`);
        }
        newMatrix.push(newRow);
      }
      return newMatrix;
    });
    // 重置選取狀態 (預設選取第一個元素)
    selectionRef.current = { row: 0, col: 0, start: 0, end: 0 };
  }, [rows, cols]); 

  // 當輸入框被選取或鍵盤操作時，更新游標位置記錄
  const handleSelect = (
    e: React.SyntheticEvent<HTMLInputElement>,
    r: number,
    c: number
  ) => {
    const target = e.currentTarget;
    selectionRef.current = {
      row: r,
      col: c,
      start: target.selectionStart || 0,
      end: target.selectionEnd || 0,
    };
  };

  // 插入文字到當前記錄的單元格
  // [MODIFIED] 新增 mode 參數，支援 append 模式 (用於上標/下標)
  const insertText = (prefix: string, suffix: string = '', mode: 'wrap' | 'append' = 'wrap') => {
    const sel = selectionRef.current;
    if (!sel) return;

    const { row, col, start, end } = sel;
    
    // 防呆
    if (row < 0 || row >= matrixData.length || col < 0 || col >= matrixData[0]?.length) return;

    setMatrixData(prevData => {
      const newData = prevData.map(r => [...r]); // Deep copy
      const text = newData[row][col];

      const before = text.substring(0, start);
      const selected = text.substring(start, end);
      const after = text.substring(end);

      let newText = '';
      if (mode === 'wrap') {
        newText = before + prefix + selected + suffix + after;
      } else {
        // append 模式：將選取文字作為底數，插入內容接在後面
        newText = before + selected + prefix + suffix + after;
      }
      
      newData[row][col] = newText;
      return newData;
    });

    // 恢復焦點
    setTimeout(() => {
        const inputId = `matrix-cell-${row}-${col}`;
        const el = document.getElementById(inputId) as HTMLInputElement;
        if (el) {
            el.focus();
            let newCursorPos = 0;
            if (mode === 'wrap') {
                // wrap: 游標停在 prefix 後面 (內容開頭)
                newCursorPos = start + prefix.length;
            } else {
                // append: 游標停在 prefix 後面 (例如 ^{ 之後)
                const selectedLen = end - start;
                newCursorPos = start + selectedLen + prefix.length;
            }
            el.setSelectionRange(newCursorPos, newCursorPos);
        }
    }, 0);
  };

  if (!isOpen) return null;

  const handleCellChange = (r: number, c: number, value: string) => {
    const newData = [...matrixData];
    newData[r][c] = value;
    setMatrixData(newData);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, r: number, c: number) => {
    if (e.key !== 'Enter') return;
    e.preventDefault(); 

    let nextElement: HTMLElement | null = null;
    
    if (r === -1 && c === -1) { 
      nextElement = document.getElementById('matrix-cols-input');
    } else if (r === -1 && c === 0) { 
      nextElement = document.getElementById('matrix-cell-0-0');
    } else { 
      if (c < cols - 1) {
        nextElement = document.getElementById(`matrix-cell-${r}-${c + 1}`);
      } else if (r < rows - 1) {
        nextElement = document.getElementById(`matrix-cell-${r + 1}-0`);
      } else {
        nextElement = submitButtonRef.current;
      }
    }
    
    if (nextElement) {
      nextElement.focus();
      if (nextElement.tagName === 'INPUT') {
        (nextElement as HTMLInputElement).select();
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate(matrixData);
    onClose(); 
  };

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
          <h2 className="text-lg font-semibold text-white">建立矩陣 (Create Matrix)</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          {/* --- m x n 輸入 --- */}
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <label htmlFor="matrix-rows-input" className="block text-sm font-medium text-neutral-300">
                列 (Rows, m)
              </label>
              <input
                ref={rowsInputRef}
                type="number"
                id="matrix-rows-input"
                value={rows}
                onChange={e => setRows(Math.max(1, parseInt(e.target.value) || 1))}
                onKeyDown={(e) => handleKeyDown(e, -1, -1)}
                onFocus={e => e.target.select()} 
                min={1}
                className="mt-1 block w-full px-3 py-2 bg-neutral-900 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
            
            <div className="flex-1">
              <label htmlFor="matrix-cols-input" className="block text-sm font-medium text-neutral-300">
                欄 (Columns, n)
              </label>
              <input
                ref={colsInputRef}
                type="number"
                id="matrix-cols-input"
                value={cols}
                onChange={e => setCols(Math.max(1, parseInt(e.target.value) || 1))}
                onKeyDown={(e) => handleKeyDown(e, -1, 0)}
                onFocus={e => e.target.select()} 
                min={1}
                className="mt-1 block w-full px-3 py-2 bg-neutral-900 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          {/* --- 迷你工具列 (Mini Toolbar) --- */}
          <div className="mb-4 p-2 bg-neutral-900/50 rounded-lg border border-neutral-700 flex flex-wrap gap-2 items-center">
            <span className="text-xs text-neutral-500 mr-2 uppercase tracking-wider font-bold">Quick Insert:</span>
            
            {/* [MODIFIED] 上標與下標改用 append 模式，實現反白文字當底數 */}
            <button type="button" className={toolBtnClass} onMouseDown={e=>e.preventDefault()} onClick={() => insertText('^{', '}', 'append')} title="Superscript">x^n</button>
            <button type="button" className={toolBtnClass} onMouseDown={e=>e.preventDefault()} onClick={() => insertText('_{', '}', 'append')} title="Subscript">x_n</button>
            <button type="button" className={toolBtnClass} onMouseDown={e=>e.preventDefault()} onClick={() => insertText('\\frac{', '}{}')} title="Fraction">a/b</button>
            <button type="button" className={toolBtnClass} onMouseDown={e=>e.preventDefault()} onClick={() => insertText('\\sqrt{', '}')} title="Sqrt">√x</button>
            <div className="w-px h-4 bg-neutral-700 mx-1"></div>
            <button type="button" className={toolBtnClass} onMouseDown={e=>e.preventDefault()} onClick={() => insertText('\\pi')} title="Pi">π</button>
            <button type="button" className={toolBtnClass} onMouseDown={e=>e.preventDefault()} onClick={() => insertText('\\times')} title="Times">×</button>
            <button type="button" className={toolBtnClass} onMouseDown={e=>e.preventDefault()} onClick={() => insertText('\\div')} title="Divide">÷</button>
            <button type="button" className={toolBtnClass} onMouseDown={e=>e.preventDefault()} onClick={() => insertText('\\infty')} title="Infinity">∞</button>
            <button type="button" className={toolBtnClass} onMouseDown={e=>e.preventDefault()} onClick={() => insertText('\\alpha')} title="Alpha">α</button>
            <button type="button" className={toolBtnClass} onMouseDown={e=>e.preventDefault()} onClick={() => insertText('\\theta')} title="Theta">θ</button>
          </div>

          {/* --- 矩陣元素 Grid --- */}
          <div className="flex-1 overflow-auto pr-2 scrollbar-thin scrollbar-track-neutral-900 scrollbar-thumb-neutral-600">
            <div 
              className="grid gap-2" 
              style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
            >
              {matrixData.map((row, r) => (
                <React.Fragment key={r}>
                  {row.map((cellValue, c) => (
                    <input
                      key={c}
                      id={`matrix-cell-${r}-${c}`}
                      type="text"
                      value={cellValue}
                      onChange={e => handleCellChange(r, c, e.target.value)}
                      onKeyDown={e => handleKeyDown(e, r, c)}
                      onSelect={(e) => handleSelect(e, r, c)} // 追蹤
                      onClick={(e) => handleSelect(e, r, c)}
                      onKeyUp={(e) => handleSelect(e, r, c)}
                      className="w-full px-2 py-1 bg-neutral-900 border border-neutral-600 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                      onFocus={e => e.target.select()}
                    />
                  ))}
                </React.Fragment>
              ))}
            </div>
          </div>

          <p className="text-xs text-neutral-400 mt-4">
            Tip: Use <kbd>Enter</kbd> to quickly navigate between inputs.
          </p>

          <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-neutral-700">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
            >
              取消
            </Button>
            <Button
              ref={submitButtonRef}
              type="submit"
              variant="primary"
            >
              建立
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}