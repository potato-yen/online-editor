// frontend/src/components/ImageModal.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/Button';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (altText: string, url: string) => void;
  initialText?: string;
}

export default function ImageModal({ isOpen, onClose, onInsert, initialText = '' }: Props) {
  const [altText, setAltText] = useState('');
  const [url, setUrl] = useState('');
  
  const altInputRef = useRef<HTMLInputElement>(null);
  const urlInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      // 1. 設定初始值
      // 如果有選取文字，使用選取文字；否則使用預設值 "替代文字"
      setAltText(initialText || '替代文字');
      setUrl('');
      
      // 2. 焦點邏輯 (FIXED)
      // 無論是否有選取文字，焦點總是直接停在 URL 欄位
      // 方便使用者直接貼上圖片連結
      setTimeout(() => {
        urlInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, initialText]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    onInsert(altText, url);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent, field: 'alt' | 'url') => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (field === 'alt') {
        // 在 Alt 欄位按 Enter，跳到 URL 欄位
        urlInputRef.current?.focus();
      } else {
        // 在 URL 欄位按 Enter，送出表單
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
        <h2 className="text-lg font-semibold text-white mb-4">插入圖片 (Insert Image)</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1">
              替代文字 (Alt Text)
              <span className="ml-2 text-xs text-neutral-500 font-normal">
                (圖片無法顯示時出現的文字)
              </span>
            </label>
            <input
              ref={altInputRef}
              type="text"
              value={altText}
              onChange={e => setAltText(e.target.value)}
              onKeyDown={e => handleKeyDown(e, 'alt')}
              placeholder="e.g., Screenshot"
              className="w-full px-3 py-2 bg-neutral-900 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-brand-active"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1">
              圖片網址 (Image URL)
            </label>
            <input
              ref={urlInputRef}
              type="text"
              value={url}
              onChange={e => setUrl(e.target.value)}
              onKeyDown={e => handleKeyDown(e, 'url')}
              placeholder="e.g., https://example.com/image.png"
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