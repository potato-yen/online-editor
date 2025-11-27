// frontend/src/layouts/AuthLayout.tsx
import React from 'react';

interface AuthLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export default function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-surface-base relative overflow-hidden">
      
      {/* --- 動態背景區塊 --- */}
      <div className="fixed inset-0 w-full h-full pointer-events-none overflow-hidden">
        
        {/* 1. 紫色小球 (左上 - 第二象限) */}
        <div
          className="absolute top-[10%] left-[18%] md:top-[12%] md:left-[22%] w-80 h-80 md:w-[28rem] md:h-[28rem] bg-purple-600 rounded-full filter blur-[110px] opacity-40 animate-blob"
        />
        
        {/* 2. 粉紅色小球 (左下 - 第三象限) */}
        <div 
          className="absolute top-[45%] left-[8%] md:top-[50%] md:left-[12%] w-80 h-80 md:w-[30rem] md:h-[30rem] bg-pink-600 rounded-full filter blur-[140px] opacity-40 animate-blob-slow"
          style={{ animationDelay: '3s' }}
        />

        {/* 3. 品牌藍色小球 (右下 - 第四象限)
            - 位置設為 bottom-0 right-0
            - 使用 animate-blob-reverse (往左跑)，避免跑出螢幕
            - 時間設為 25s，動作最緩慢
         */}
        <div 
          className="absolute top-[35%] right-[6%] md:top-[40%] md:right-[14%] w-80 h-80 md:w-[30rem] md:h-[30rem] rounded-full filter blur-[140px] opacity-35 animate-blob-reverse"
          style={{ animationDelay: '5s', backgroundColor: '#a0d973' }}
        />
      </div>

      {/* 主要內容容器 */}
      <div className="w-full max-w-md px-4 relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-content-primary mb-2">
            {title || 'Welcome Back'}
          </h1>
          {subtitle && (
            <p className="text-content-secondary text-sm">
              {subtitle}
            </p>
          )}
        </div>
        
        {/* 卡片內容 */}
        {children}
        
        <div className="mt-8 text-center text-xs text-content-muted">
          &copy; {new Date().getFullYear()} Online Editor. All rights reserved.
        </div>
      </div>
    </div>
  );
}
