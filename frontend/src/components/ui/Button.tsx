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
    
    // 基礎樣式：
    // 1. 加入 active:scale-[0.98] (點擊微縮效果)
    // 2. 改為 transition-all duration-200 (滑順動畫)
    const baseStyles = "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-active disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]";
    
    // 變體樣式 (Variants)
    const variants = {
      // Primary: 增加 hover 陰影與浮起感
      primary: "bg-brand-DEFAULT text-white hover:bg-brand-hover hover:shadow-md shadow-sm border border-transparent",
      
      // Secondary: 修正深色模式下的 hover 反饋，改為變亮 (neutral-600) 而非變暗
      secondary: "bg-surface-elevated text-content-primary hover:bg-neutral-600 border border-border-base hover:border-neutral-500",
      
      // Ghost: 保持透明，依賴 active scale 提供回饋
      ghost: "bg-transparent text-content-primary hover:bg-surface-elevated hover:text-brand-hover",
      
      // Danger: 增加 hover 陰影
      danger: "bg-status-error text-white hover:bg-red-600 hover:shadow-md shadow-sm border border-transparent",
      
      // Outline: Hover 時加深邊框
      outline: "border border-border-base bg-transparent hover:bg-surface-elevated text-content-primary hover:border-content-muted"
    };

    // 尺寸樣式 (Sizes)
    const sizes = {
      sm: "h-8 px-3 text-xs",
      md: "h-10 px-4 py-2 text-sm",
      icon: "h-9 w-9 p-0", // 用於正方形圖示
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