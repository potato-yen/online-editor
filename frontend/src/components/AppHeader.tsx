import React from 'react';
import { Mode } from '../types/app'; // 最終統一使用新的 type 檔
import ModeToggle from './ModeToggle';

interface Props {
  mode: Mode;
  isCompiling: boolean;
  onSetMode: (m: Mode) => void;
  onImportClick: () => void;
  onCompileLatex: () => void;
  onExportSource: () => void;
  onExportPDF: () => void;
  
  // ===== 修改版新增 =====
  username?: string;      // 使用者名稱 (可選)
  onLogout?: () => void;  // 登出函式 (可選，保持相容)
}

export default function AppHeader({
  mode,
  isCompiling,
  onSetMode,
  onImportClick,
  onCompileLatex,
  onExportSource,
  onExportPDF,
  username,
  onLogout,
}: Props) {
  return (
    <header className="flex flex-wrap items-center gap-4 px-4 py-3 border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-md">
      {/* ---- Mode Toggle ---- */}
      <div className="flex items-center gap-2 text-neutral-300 text-sm">
        <span className="font-medium text-neutral-100">Mode:</span>
        <ModeToggle mode={mode} setMode={onSetMode} />
      </div>

      <div className="flex-1" />

      {/* ---- 匯入 ---- */}
      <button
        onClick={onImportClick}
        className="px-3 py-1.5 rounded-xl text-xs font-medium bg-neutral-800 hover:bg-neutral-700 border border-neutral-600"
      >
        匯入檔案
      </button>

      {/* ---- LaTeX 編譯按鈕 (僅 latex 模式顯示) ---- */}
      {mode === 'latex' && (
        <button
          onClick={onCompileLatex}
          disabled={isCompiling}
          className="px-3 py-1.5 rounded-xl text-xs font-medium bg-neutral-800 hover:bg-neutral-700 border border-neutral-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isCompiling ? '編譯中…' : '編譯並預覽 (.pdf)'}
        </button>
      )}

      {/* ---- 下載原始檔 ---- */}
      <button
        onClick={onExportSource}
        className="px-3 py-1.5 rounded-xl text-xs font-medium bg-neutral-800 hover:bg-neutral-700 border border-neutral-600"
      >
        下載原始檔 ({mode === 'markdown' ? '.md' : '.tex'})
      </button>

      {/* ---- Markdown 模式才有匯出 PDF ---- */}
      {mode === 'markdown' && (
        <button
          onClick={onExportPDF}
          className="px-3 py-1.5 rounded-xl text-xs font-medium bg-neutral-100 text-neutral-900 hover:bg-white border border-neutral-300"
        >
          匯出 PDF
        </button>
      )}

      {/* ---- 使用者資訊 + 登出（修改版新增）---- */}
      {(username || onLogout) && (
        <div className="flex items-center gap-3 ml-2">
          {username && (
            <span className="text-sm text-neutral-400">歡迎, {username}</span>
          )}

          {onLogout && (
            <button
              onClick={onLogout}
              className="px-3 py-1.5 rounded-xl text-xs font-medium bg-neutral-700 hover:bg-neutral-600 border border-neutral-500"
            >
              登出
            </button>
          )}
        </div>
      )}
    </header>
  );
}
