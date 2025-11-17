// src/components/Dropdown.tsx
import React, { useState, useEffect, useRef } from 'react';

interface DropdownProps {
  label: React.ReactNode; // 觸發按鈕的標籤
  children: React.ReactNode; // 下拉式選單的內容
}

export default function Dropdown({ label, children }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 點擊外部關閉
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownRef]);

  // 讓子項目(e.g., button)點擊後可以關閉 dropdown
  const childrenWithProps = React.Children.map(children, child => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, {
        // @ts-ignore
        onClick: () => {
          // @ts-ignore
          if (child.props.onClick) child.props.onClick();
          setIsOpen(false);
        },
      });
    }
    return child;
  });

  return (
    <div className="relative" ref={dropdownRef}>
      {/* 觸發按鈕 */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-neutral-800 hover:bg-neutral-700 border border-neutral-600 flex items-center gap-1"
      >
        {label}
        {/* 下拉箭頭圖示 */}
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
      </button>

      {/* ========================================================== */}
      {/* (FIXED) 下拉式選單內容 */}
      {/* ========================================================== */}
      {isOpen && (
        <div 
          className="absolute top-full left-0 mt-2 w-40 bg-neutral-800 border border-neutral-700 rounded-lg shadow-lg z-10 py-1 
                     overflow-y-auto max-h-60 
                     scrollbar-thin scrollbar-track-neutral-900 scrollbar-thumb-neutral-600"
        >
          {childrenWithProps}
        </div>
      )}
    </div>
  );
}

// Dropdown 內部的項目 (可選)
interface DropdownItemProps {
  onClick?: () => void;
  children: React.ReactNode;
}

// 建立一個 DropdownItem 輔助元件
export function DropdownItem({ onClick, children }: DropdownItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left block px-3 py-1.5 text-xs text-neutral-100 hover:bg-neutral-700"
    >
      {children}
    </button>
  );
}