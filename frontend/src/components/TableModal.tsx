// src/components/TableModal.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/Button';

interface TableModalProps {
  isOpen: boolean;
  onClose: () => void;
  // [MODIFIED] 修改 onCreate 簽章，加入 options 參數來傳遞設定
  onCreate: (tableData: string[][], options?: { hasRowHeaders: boolean }) => void; 
}

export default function TableModal({ isOpen, onClose, onCreate }: TableModalProps) {
  const [rows, setRows] = useState(2); 
  const [cols, setCols] = useState(3); 
  const [showRowHeaders, setShowRowHeaders] = useState(false);
  
  const [tableData, setTableData] = useState<string[][]>([]);

  const rowsInputRef = useRef<HTMLInputElement>(null);
  const colsInputRef = useRef<HTMLInputElement>(null);
  const submitButtonRef = useRef<HTMLButtonElement>(null);
  
  const effectiveCols = showRowHeaders ? cols + 1 : cols;

  useEffect(() => {
    if (isOpen) {
      setRows(2);
      setCols(3);
      setShowRowHeaders(false); 
      setTimeout(() => {
        rowsInputRef.current?.focus();
        rowsInputRef.current?.select();
      }, 100); 
    }
  }, [isOpen]);

  useEffect(() => {
    setTableData(() => {
      const newTable: string[][] = [];
      const headerRow: string[] = [];
      
      for (let c = 0; c < effectiveCols; c++) {
        if (showRowHeaders && c === 0) {
          headerRow.push(''); 
        } else {
          const headerIndex = showRowHeaders ? c : c + 1;
          headerRow.push(`Header ${headerIndex}`);
        }
      }
      newTable.push(headerRow);

      for (let r = 0; r < rows; r++) {
        const newRow: string[] = [];
        for (let c = 0; c < effectiveCols; c++) {
          if (showRowHeaders && c === 0) {
            newRow.push(`Row ${r + 1}`);
          } else {
            const colIndex = showRowHeaders ? c : c + 1;
            newRow.push(`Cell ${r + 1}-${colIndex}`);
          }
        }
        newTable.push(newRow);
      }
      return newTable;
    });
  }, [rows, cols, showRowHeaders, effectiveCols]);

  if (!isOpen) return null;

  const handleCellChange = (r: number, c: number, value: string) => {
    const newData = [...tableData];
    newData[r][c] = value;
    setTableData(newData);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, r: number, c: number) => {
    if (e.key !== 'Enter') return;
    e.preventDefault(); 

    let nextElement: HTMLElement | null = null;
    if (r === -1 && c === -1) { 
      nextElement = document.getElementById('table-cols-input');
    } else if (r === -1 && c === 0) { 
      nextElement = document.getElementById('table-cell-0-0');
    } else {
      if (c < effectiveCols - 1) {
        nextElement = document.getElementById(`table-cell-${r}-${c + 1}`);
      } else if (r < rows) { 
        nextElement = document.getElementById(`table-cell-${r + 1}-0`);
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
    
    // [MODIFIED] 不要在這裡修改資料 (移除 Markdown 的 ** 語法)，直接將原始資料與設定傳出去
    // 讓 useEditorModals 根據模式 (LaTeX/MD) 決定如何渲染
    onCreate(tableData, { hasRowHeaders: showRowHeaders });
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-neutral-800 rounded-xl shadow-lg p-6 w-full max-w-lg border border-neutral-700 max-h-[80vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-white mb-4">建立表格 (Create Table)</h2>
        
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex gap-4 mb-4 items-end">
            <div className="flex-1">
              <label htmlFor="table-rows-input" className="block text-sm font-medium text-neutral-300">
                列 (Rows) <span className="text-xs text-neutral-500">(不含標頭)</span>
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

            <div className="flex-1">
              <label htmlFor="table-cols-input" className="block text-sm font-medium text-neutral-300">
                欄 (Cols)
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

            <div className="flex items-center pb-2">
                <label className="flex items-center gap-2 cursor-pointer select-none group">
                    <input 
                        type="checkbox" 
                        checked={showRowHeaders} 
                        onChange={(e) => setShowRowHeaders(e.target.checked)}
                        className="w-4 h-4 rounded border-neutral-600 bg-neutral-900 text-sky-500 focus:ring-sky-500 focus:ring-offset-neutral-800"
                    />
                    <span className="text-sm text-neutral-300 group-hover:text-white transition-colors">左側標頭</span>
                </label>
            </div>
          </div>

          <div className="flex-1 overflow-auto pr-2 scrollbar-thin scrollbar-track-neutral-900 scrollbar-thumb-neutral-600">
            <div 
              className="grid gap-2" 
              style={{ gridTemplateColumns: `repeat(${effectiveCols}, minmax(0, 1fr))` }} 
            >
              {tableData.map((row, r) => (
                <React.Fragment key={r}>
                  {row.map((cellValue, c) => {
                    const isTopHeader = r === 0;
                    const isLeftHeader = showRowHeaders && c === 0;
                    const isHeader = isTopHeader || isLeftHeader;

                    return (
                        <input
                        key={c}
                        id={`table-cell-${r}-${c}`}
                        type="text"
                        value={cellValue}
                        onChange={e => handleCellChange(r, c, e.target.value)}
                        onKeyDown={e => handleKeyDown(e, r, c)}
                        className={`w-full px-2 py-1 border border-neutral-600 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                            isHeader 
                              ? 'bg-neutral-800 font-bold text-sky-300' 
                              : 'bg-neutral-900' 
                        }`}
                        onFocus={e => e.target.select()} 
                        />
                    );
                  })}
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