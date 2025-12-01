// src/components/SuperscriptModal.tsx
import React, { useState } from 'react';
import { Button } from './ui/Button'; // [Refactor]

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (base: string, exponent: string) => void;
}

export default function SuperscriptModal({ isOpen, onClose, onCreate }: Props) {
  const [base, setBase] = useState('x');
  const [exponent, setExponent] = useState('y');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate(base, exponent);
    setBase('x');
    setExponent('y');
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-neutral-800 rounded-xl shadow-lg p-6 w-full max-w-sm border border-neutral-700"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-white mb-4">插入上標 (Superscript)</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="base" className="block text-sm font-medium text-neutral-300">
                底數 (Base)
              </label>
              <input
                type="text"
                id="base"
                value={base}
                onChange={e => setBase(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-neutral-900 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label htmlFor="exponent" className="block text-sm font-medium text-neutral-300">
                上標 (Exponent)
              </label>
              <input
                type="text"
                id="exponent"
                value={exponent}
                onChange={e => setExponent(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-neutral-900 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          {/* [Refactor] 使用共用 Button 元件 */}
          <div className="mt-6 flex justify-end gap-3">
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
              建立
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}