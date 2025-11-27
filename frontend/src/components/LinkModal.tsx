// frontend/src/components/LinkModal.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/Button';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (text: string, url: string) => void;
  initialText?: string; // 預設帶入的選取文字
}

export default function LinkModal({ isOpen, onClose, onInsert, initialText = '' }: Props) {
  const [text, setText] = useState('');
  const [url, setUrl] = useState('');
  
  const textInputRef = useRef<HTMLInputElement>(null);
  const urlInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setText(initialText);
      setUrl('');
      
      // 智慧焦點邏輯
      setTimeout(() => {
        if (initialText) {
          // 如果有選取文字，直接聚焦在 URL 欄位，方便輸入連結
          urlInputRef.current?.focus();
        } else {
          // 否則聚焦在顯示文字欄位
          textInputRef.current?.focus();
        }
      }, 100);
    }
  }, [isOpen, initialText]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    onInsert(text, url);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent, field: 'text' | 'url') => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (field === 'text') {
        // 在 Text 欄位按 Enter，跳到 URL
        urlInputRef.current?.focus();
      } else {
        // 在 URL 欄位按 Enter，送出
        handleSubmit();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-neutral-800 rounded-xl shadow-lg p-6 w-full max-w-sm border border-neutral-700"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-white mb-4">插入連結 (Insert Link)</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1">
              顯示文字 (Text)
            </label>
            <input
              ref={textInputRef}
              type="text"
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => handleKeyDown(e, 'text')}
              placeholder="e.g., Google"
              className="w-full px-3 py-2 bg-neutral-900 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-brand-active"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1">
              連結網址 (URL)
            </label>
            <input
              ref={urlInputRef}
              type="text"
              value={url}
              onChange={e => setUrl(e.target.value)}
              onKeyDown={e => handleKeyDown(e, 'url')}
              placeholder="e.g., https://google.com"
              className="w-full px-3 py-2 bg-neutral-900 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-brand-active"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              取消
            </Button>
            <Button type="submit" variant="primary">
              插入
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}