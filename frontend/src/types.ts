// src/types.ts
// 這裡存放所有共享的型別定義

export type Mode = 'markdown' | 'latex'
export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

// 我們從 App.tsx 搬過來的 Toolbar 屬性
export interface ToolbarProps {
  onSimpleInsert: (start: string, end: string, placeholder: string) => void;
  // 智慧數學插入
  onMathInsert: (start: string, end: string, placeholder: string) => void;
  
  onSmartBlock: (prefix: string, type: 'heading' | 'list' | 'quote' | 'task') => void;
  onSmartInline: (wrapChars: string, placeholder: string) => void;
  onRequestTable: () => void;
  onRequestSuperscript: () => void;
  onRequestSubscript: () => void;
  onRequestMatrix: () => void;
  // 請求多行對齊公式
  onRequestAligned: () => void;
  // 請求連結彈窗
  onRequestLink?: () => void;
  // (NEW) 請求圖片彈窗
  onRequestImage?: () => void;
}