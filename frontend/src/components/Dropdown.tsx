// frontend/src/components/Dropdown.tsx
import React, { useState, useEffect, useRef } from 'react';
import { cn } from '../lib/utils';

interface DropdownProps {
  label: React.ReactNode;
  children: React.ReactNode;
}

export default function Dropdown({ label, children }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownRef]);

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
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        // (FIX 1) 增強按鈕樣式：明確的 border, 背景色, 與文字顏色
        className={cn(
          "px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1 border",
          isOpen 
            ? "bg-brand-muted text-brand-DEFAULT border-brand-DEFAULT/30" 
            : "bg-surface-panel border-border-subtle text-content-primary hover:bg-surface-elevated hover:border-border-highlight"
        )}
      >
        {label}
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cn("transition-transform duration-200 opacity-70", isOpen && "rotate-180")}><path d="m6 9 6 6 6-6"/></svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-48 bg-surface-panel border border-border-base rounded-lg shadow-xl z-50 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100 origin-top-left">
          <div className="max-h-60 overflow-y-auto scrollbar-thin">
            {childrenWithProps}
          </div>
        </div>
      )}
    </div>
  );
}

interface DropdownItemProps {
  onClick?: () => void;
  children: React.ReactNode;
}

export function DropdownItem({ onClick, children }: DropdownItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      // (FIX 1) 確保下拉選單項目文字顏色正確
      className="w-full text-left block px-3 py-2 text-xs text-content-primary hover:bg-brand-DEFAULT hover:text-white transition-colors"
    >
      {children}
    </button>
  );
}