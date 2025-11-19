// frontend/src/components/ui/Input.tsx
import React, { InputHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          // 基礎：背景色、邊框、文字色
          "flex h-10 w-full rounded-md border border-border-base bg-surface-layer px-3 py-2 text-sm text-content-primary placeholder:text-content-muted",
          // Focus 狀態：品牌色光暈
          "focus:outline-none focus:ring-2 focus:ring-brand-active/50 focus:border-brand-active",
          // Disable 狀態
          "disabled:cursor-not-allowed disabled:opacity-50",
          // 錯誤狀態 (例如驗證失敗)
          error && "border-status-error focus:ring-status-error/50 focus:border-status-error",
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';