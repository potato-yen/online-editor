// frontend/src/components/ui/Button.tsx
import React, { ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'icon';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
    
    // 基礎樣式：圓角、過渡動畫、聚焦狀態、停用狀態
    const baseStyles = "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-active disabled:opacity-50 disabled:cursor-not-allowed";
    
    // 變體樣式 (Variants)
    const variants = {
      primary: "bg-brand-DEFAULT text-white hover:bg-brand-hover shadow-sm",
      secondary: "bg-surface-elevated text-content-primary hover:bg-surface-panel border border-border-base",
      ghost: "bg-transparent text-content-primary hover:bg-surface-elevated hover:text-brand-hover",
      danger: "bg-status-error text-white hover:bg-red-600",
      outline: "border border-border-base bg-transparent hover:bg-surface-elevated text-content-primary"
    };

    // 尺寸樣式 (Sizes)
    const sizes = {
      sm: "h-8 px-3 text-xs",
      md: "h-10 px-4 py-2 text-sm",
      icon: "h-9 w-9 p-0", // 用於正方形圖示按鈕
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <span className="mr-2 animate-spin">
            {/* 簡單的 Loading Spinner SVG */}
            <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </span>
        ) : null}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';