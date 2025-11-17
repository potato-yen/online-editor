// src/components/MatrixModal.tsx
import React, { useState, useEffect, useRef } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (matrixData: string[][]) => void; 
}

export default function MatrixModal({ isOpen, onClose, onCreate }: Props) {
  const [rows, setRows] = useState(2);
  const [cols, setCols] = useState(2);
  
  // (CHANGED) 初始化為空陣列
  const [matrixData, setMatrixData] = useState<string[][]>([]);

  const rowsInputRef = useRef<HTMLInputElement>(null);
  const colsInputRef = useRef<HTMLInputElement>(null);
  const submitButtonRef = useRef<HTMLButtonElement>(null);
  
  // (CHANGED) 當 Modal 打開時，重設 rows/cols，這會觸發下一個 effect
  useEffect(() => {
    if (isOpen) {
      // (NEW) 重設 rows/cols 為預設值
      setRows(2);
      setCols(2);

      setTimeout(() => {
        rowsInputRef.current?.focus();
        rowsInputRef.current?.select();
      }, 100); 
    }
  }, [isOpen]);

  // (CHANGED) 當 rows 或 cols 改變時，*總是* 重新初始化矩陣
  useEffect(() => {
    setMatrixData(() => { // 移除 currentData
      const newMatrix: string[][] = [];
      for (let r = 0; r < rows; r++) {
        const newRow: string[] = [];
        for (let c = 0; c < cols; c++) {
          // (CHANGED) 總是填入預設值
          newRow.push(`a_{${r + 1}${c + 1}}`);
        }
        newMatrix.push(newRow);
      }
      return newMatrix;
    });
  }, [rows, cols]); // 這個 effect 會在 isOpen effect 之後執行

  if (!isOpen) return null;

  // (NEW) 處理矩陣中單一元素的變更
  const handleCellChange = (r: number, c: number, value: string) => {
    const newData = [...matrixData];
    newData[r][c] = value;
    setMatrixData(newData);
  };

  // (NEW) 處理鍵盤導航 (Enter 鍵)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, r: number, c: number) => {
    if (e.key !== 'Enter') return;
    e.preventDefault(); 

    let nextElement: HTMLElement | null = null;
    
    if (r === -1 && c === -1) { // 這是 'Rows' input
      nextElement = document.getElementById('matrix-cols-input');
    } else if (r === -1 && c === 0) { // 這是 'Cols' input
      nextElement = document.getElementById('matrix-cell-0-0');
    } else { // 這是在矩陣 grid 中
      if (c < cols - 1) {
        // 移到下一欄
        nextElement = document.getElementById(`matrix-cell-${r}-${c + 1}`);
      } else if (r < rows - 1) {
        // 移到下一列的第一欄
        nextElement = document.getElementById(`matrix-cell-${r + 1}-0`);
      } else {
        // 這是最後一個元素，移到「建立」按鈕
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

  // (CHANGED) 提交時傳回完整的 matrixData
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate(matrixData);
    onClose(); // 關閉 Modal
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-neutral-800 rounded-xl shadow-lg p-6 w-full max-w-md border border-neutral-700 max-h-[80vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-white mb-4">建立矩陣 (Create Matrix)</h2>
        
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          {/* --- m x n 輸入 --- */}
          <div className="flex gap-4 mb-4">
            {/* 列 (Rows) */}
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
                onFocus={e => e.target.select()} // (NEW)
                min={1}
                className="mt-1 block w-full px-3 py-2 bg-neutral-900 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
            
            {/* 欄 (Columns) */}
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
                onFocus={e => e.target.select()} // (NEW)
                min={1}
                className="mt-1 block w-full px-3 py-2 bg-neutral-900 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          {/* --- 矩陣元素 Grid (NEW) --- */}
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
                      className="w-full px-2 py-1 bg-neutral-900 border border-neutral-600 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                      onFocus={e => e.target.select()}
                    />
                  ))}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* ========================================================== */}
          {/* (NEW) 提示文字 */}
          {/* ========================================================== */}
          <p className="text-xs text-neutral-400 mt-4">
            Tip: Use <kbd>Enter</kbd> to quickly navigate between inputs.
          </p>


          {/* --- 按鈕區 --- */}
          <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-neutral-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium bg-neutral-700 hover:bg-neutral-600 rounded-lg text-neutral-100"
            >
              取消
            </button>
            <button
              ref={submitButtonRef}
              type="submit"
              className="px-4 py-2 text-sm font-medium bg-sky-600 hover:bg-sky-500 rounded-lg text-white"
            >
              建立
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}