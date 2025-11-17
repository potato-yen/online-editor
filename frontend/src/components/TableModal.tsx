// src/components/TableModal.tsx
import React, { useState, useEffect, useRef } from 'react';

interface TableModalProps {
  isOpen: boolean;
  onClose: () => void;
  // (CHANGED) 讓 App.tsx 傳入一個「建立表格」的函式，接收二維陣列
  onCreate: (tableData: string[][]) => void; 
}

export default function TableModal({ isOpen, onClose, onCreate }: TableModalProps) {
  const [rows, setRows] = useState(2); // 2 列資料
  const [cols, setCols] = useState(3); // 3 欄
  
  // (NEW) 建立 state 儲存所有表格資料 (包含標頭)
  // 總共會有 (rows + 1) 列
  const [tableData, setTableData] = useState<string[][]>([]);

  // (NEW) Refs for keyboard navigation
  const rowsInputRef = useRef<HTMLInputElement>(null);
  const colsInputRef = useRef<HTMLInputElement>(null);
  const submitButtonRef = useRef<HTMLButtonElement>(null);
  
  // (NEW) 當 Modal 打開時，重設 rows/cols 並 focus
  useEffect(() => {
    if (isOpen) {
      setRows(2);
      setCols(3);
      setTimeout(() => {
        // (FIXED) 確保 focus rows (m)
        rowsInputRef.current?.focus();
        rowsInputRef.current?.select();
      }, 100); 
    }
  }, [isOpen]);

  // (NEW) 當 rows 或 cols 改變時，*總是* 重新初始化表格
  useEffect(() => {
    setTableData(() => {
      const newTable: string[][] = [];
      
      // 1. 建立標頭列 (Header Row)
      const headerRow: string[] = [];
      for (let c = 0; c < cols; c++) {
        headerRow.push(`Header ${c + 1}`);
      }
      newTable.push(headerRow);

      // 2. 建立資料列 (Data Rows)
      for (let r = 0; r < rows; r++) {
        const newRow: string[] = [];
        for (let c = 0; c < cols; c++) {
          newRow.push(`Cell ${r + 1}-${c + 1}`);
        }
        newTable.push(newRow);
      }
      return newTable;
    });
  }, [rows, cols]); // 會在 isOpen effect 之後執行

  if (!isOpen) return null;

  // (NEW) 處理儲存格變更
  const handleCellChange = (r: number, c: number, value: string) => {
    const newData = [...tableData];
    newData[r][c] = value;
    setTableData(newData);
  };

  // (NEW) 處理鍵盤導航 (Enter 鍵)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, r: number, c: number) => {
    if (e.key !== 'Enter') return;
    e.preventDefault(); 

    let nextElement: HTMLElement | null = null;
    
    if (r === -1 && c === -1) { // 這是 'Rows' input
      nextElement = document.getElementById('table-cols-input');
    } else if (r === -1 && c === 0) { // 這是 'Cols' input
      nextElement = document.getElementById('table-cell-0-0'); // 跳到第一個標頭
    } else { // 這是在表格 grid 中
      if (c < cols - 1) {
        // 移到下一欄
        nextElement = document.getElementById(`table-cell-${r}-${c + 1}`);
      } else if (r < rows) { // (CHANGED) 總共有 (rows + 1) 列 (含標頭)，所以 r < rows
        // 移到下一列的第一欄
        nextElement = document.getElementById(`table-cell-${r + 1}-0`);
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

  // (CHANGED) 提交時傳回完整的 tableData
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate(tableData);
    onClose(); // 關閉 Modal
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-neutral-800 rounded-xl shadow-lg p-6 w-full max-w-lg border border-neutral-700 max-h-[80vh] flex flex-col" // (CHANGED) 加寬
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-white mb-4">建立表格 (Create Table)</h2>
        
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          {/* --- m x n 輸入 --- */}
          <div className="flex gap-4 mb-4">
            
            {/* 列 (Rows) */}
            <div className="flex-1">
              <label htmlFor="table-rows-input" className="block text-sm font-medium text-neutral-300">
                列 (Rows, m) (資料列，不含標頭)
              </label>
              <input
                ref={rowsInputRef}
                type="number"
                id="table-rows-input"
                value={rows}
                onChange={e => setRows(Math.max(1, parseInt(e.target.value) || 1))}
                onKeyDown={(e) => handleKeyDown(e, -1, -1)}
                onFocus={e => e.target.select()}
                min={1}
                className="mt-1 block w-full px-3 py-2 bg-neutral-900 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            {/* 欄 (Columns) */}
            <div className="flex-1">
              <label htmlFor="table-cols-input" className="block text-sm font-medium text-neutral-300">
                欄 (Columns, n)
              </label>
              <input
                ref={colsInputRef}
                type="number"
                id="table-cols-input"
                value={cols}
                onChange={e => setCols(Math.max(1, parseInt(e.target.value) || 1))}
                onKeyDown={(e) => handleKeyDown(e, -1, 0)}
                onFocus={e => e.target.select()}
                min={1}
                className="mt-1 block w-full px-3 py-2 bg-neutral-900 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          {/* --- 表格元素 Grid (NEW) --- */}
          <div className="flex-1 overflow-auto pr-2 scrollbar-thin scrollbar-track-neutral-900 scrollbar-thumb-neutral-600">
            <div 
              className="grid gap-2" 
              style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }} // 動態 grid
            >
              {tableData.map((row, r) => (
                <React.Fragment key={r}>
                  {row.map((cellValue, c) => (
                    <input
                      key={c}
                      id={`table-cell-${r}-${c}`} // 賦予 ID 讓鍵盤能導航
                      type="text"
                      value={cellValue}
                      onChange={e => handleCellChange(r, c, e.target.value)}
                      onKeyDown={e => handleKeyDown(e, r, c)}
                      className={`w-full px-2 py-1 bg-neutral-900 border border-neutral-600 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                        r === 0 ? 'font-semibold text-sky-300' : '' // 標頭行給予特殊樣式
                      }`}
                      onFocus={e => e.target.select()} // 自動反白
                    />
                  ))}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* --- 提示文字 --- */}
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