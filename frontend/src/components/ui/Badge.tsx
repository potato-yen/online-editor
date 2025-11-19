// frontend/src/components/ui/Badge.tsx
import React from 'react';
import { cn } from '../../lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'success' | 'warning';
}

export const Badge = ({ className, variant = 'default', ...props }: BadgeProps) => {
  const variants = {
    // (FIX 1) 將 default 改為與 secondary 相同的灰色系，讓 MD 與 TeX 標籤長得一樣
    default: "border-transparent bg-surface-elevated text-content-primary hover:bg-surface-panel", 
    secondary: "border-transparent bg-surface-elevated text-content-primary hover:bg-surface-panel",
    outline: "text-content-primary border-border-base",
    success: "border-transparent bg-status-success/20 text-status-success hover:bg-status-success/30",
    warning: "border-transparent bg-status-warning/20 text-status-warning hover:bg-status-warning/30",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        variants[variant],
        className
      )}
      {...props}
    />
  );
};