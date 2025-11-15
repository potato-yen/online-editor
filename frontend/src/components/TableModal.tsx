// src/components/TableModal.tsx
import React, { useState } from 'react';

interface TableModalProps {
  isOpen: boolean;
  onClose: () => void;
  // 讓 App.tsx 傳入一個「建立表格」的函式
  onCreate: (rows: number, cols: number) => void; 
}

export default function TableModal({ isOpen, onClose, onCreate }: TableModalProps) {
  // Modal 自己的 state，用來追蹤 m, n (欄, 列)
  const [rows, setRows] = useState(2);
  const [cols, setCols] = useState(3);

  // 如果 modal 不是 open，就什麼都不渲染
  if (!isOpen) {
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); // 防止表單送出
    // 呼叫 App.tsx 傳來的 onCreate 函式，並把 m, n 傳回去
    onCreate(rows, cols);
  };

  return (
    // 這是一個 modal 的基本架構：
    // 1. 一個半透明的黑色背景 (backdrop)
    // 2. 一個在中間的白色視窗 (card)
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose} // 點擊背景也會關閉
    >
      <div
        className="bg-neutral-800 rounded-xl shadow-lg p-6 w-full max-w-sm border border-neutral-700"
        onClick={e => e.stopPropagation()} // 防止點擊視窗時關閉
      >
        <h2 className="text-lg font-semibold text-white mb-4">建立表格 (Create Table)</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* 欄 (Columns) */}
            <div>
              <label htmlFor="cols" className="block text-sm font-medium text-neutral-300">
                欄 (Columns)
              </label>
              <input
                type="number"
                id="cols"
                value={cols}
                onChange={e => setCols(Math.max(1, parseInt(e.target.value)))} // 至少 1
                min={1}
                className="mt-1 block w-full px-3 py-2 bg-neutral-900 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            {/* 列 (Rows) */}
            <div>
              <label htmlFor="rows" className="block text-sm font-medium text-neutral-300">
                列 (Rows) (資料列，不含標題)
              </label>
              <input
                type="number"
                id="rows"
                value={rows}
                onChange={e => setRows(Math.max(1, parseInt(e.target.value)))} // 至少 1
                min={1}
                className="mt-1 block w-full px-3 py-2 bg-neutral-900 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          {/* 按鈕區 */}
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button" // 必須是 type="button" 才不會觸發表單
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium bg-neutral-700 hover:bg-neutral-600 rounded-lg text-neutral-100"
            >
              取消
            </button>
            <button
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