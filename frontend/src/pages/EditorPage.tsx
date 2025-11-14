// frontend/src/pages/EditorPage.tsx
import React, { useState, useEffect, useRef } from 'react';
import { renderMarkdownToHTML } from '../markdownRenderer';
import html2pdf from 'html2pdf.js';
import * as api from '../services/api';
import { useAuth } from '../context/AuthContext';

// 元件
import AppHeader from '../components/AppHeader'; //
import EditorPane from '../components/EditorPane'; //
import PreviewPane from '../components/PreviewPane'; //
import { Mode } from '../types/app'; // (我們需要建立這個類型檔)

export default function EditorPage() {
  const { token, logout, user } = useAuth(); // 從 Context 取得 token
  
  const [mode, setMode] = useState<Mode>('markdown');
  const [text, setText] = useState<string>('# 歡迎, ' + (user?.username || 'User') + '!\n\n開始編輯...');
  
  const [renderedHTML, setRenderedHTML] = useState<string>('');
  const [pdfURL, setPdfURL] = useState<string>('');
  const [isCompiling, setIsCompiling] = useState<boolean>(false);
  const [compileError, setCompileError] = useState<string>('');

  const previewRef = useRef(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Re-render markdown preview
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (mode === 'markdown') {
        const html = await renderMarkdownToHTML(text);
        if (!cancelled) setRenderedHTML(html);
      }
    })();
    return () => { cancelled = true; };
  }, [text, mode]);

  // Export source file
  function handleExportSource() {
    const blob = new Blob([text], { type: mode === 'markdown' ? 'text/markdown' : 'application/x-tex' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = mode === 'markdown' ? 'document.md' : 'document.tex';
    a.click();
    URL.revokeObjectURL(url);
  }

  // Export PDF (Markdown)
  function handleExportPDF() {
    // (此處邏輯與 App.tsx 完全相同，省略以節省篇幅)
    if (!previewRef.current) return;
    const el = previewRef.current as HTMLElement;
    const originalClassName = el.className;
    el.className = originalClassName.replace('prose-invert', '').replace('bg-neutral-900', '') + ' pdf-export';
    el.style.overflow = 'visible';
    // ... (其他樣式設定) ...
    html2pdf().set({ /* ... options ... */ }).from(el).save().finally(() => {
        el.className = originalClassName;
        el.removeAttribute('style');
    });
  }

  // Compile LaTeX (Modified)
  async function handleCompileLatex() {
    if (!token) {
      setCompileError("認證失敗，請重新登入");
      logout(); // 強制登出
      return;
    }
    
    setIsCompiling(true);
    setCompileError('');
    setPdfURL('');

    try {
      const blob = await api.compileLatex(text, token);
      const objectURL = URL.createObjectURL(blob);
      setPdfURL(objectURL);
    } catch (err: any) {
      setCompileError(err.message || String(err));
      if (err.message.includes('Invalid token')) {
        logout(); // Token 過期或無效，登出
      }
    } finally {
      setIsCompiling(false);
    }
  }

  // Import file
  function handleImportClick() {
    fileInputRef.current?.click();
  }

  // Handle file import
  function handleFileImport(e: React.ChangeEvent<HTMLInputElement>) {
    // (此處邏輯與 App.tsx 完全相同)
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
        const fileContent = evt.target?.result as string;
        setText(fileContent);
        if (file.name.endsWith('.tex')) setMode('latex');
        else if (file.name.endsWith('.md')) setMode('markdown');
    };
    reader.readAsText(file);
    if (e.target) e.target.value = '';
  }

  // Resizable split layout
  const [paneWidthPercent, setPaneWidthPercent] = useState<number>(50);
  const isDraggingRef = useRef<boolean>(false);
  function handleDividerMouseDown(e: React.MouseEvent) {
    e.preventDefault();
    isDraggingRef.current = true;
  }
  useEffect(() => {
    function onMove(ev: MouseEvent) {
      if (!isDraggingRef.current) return;
      const pct = Math.min(80, Math.max(20, (ev.clientX / window.innerWidth) * 100));
      setPaneWidthPercent(pct);
    }
    function onUp() { isDraggingRef.current = false; }
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, []);
  const leftPaneStyle: React.CSSProperties = { width: paneWidthPercent + '%' };


  return (
    <div className="min-h-screen flex flex-col bg-neutral-900 text-neutral-100">
      <AppHeader
        mode={mode}
        isCompiling={isCompiling}
        onSetMode={(m) => {
          setMode(m);
          if (m !== 'latex') { setPdfURL(''); setCompileError(''); }
        }}
        onImportClick={handleImportClick}
        onCompileLatex={handleCompileLatex}
        onExportSource={handleExportSource}
        onExportPDF={handleExportPDF}
        username={user?.username} // 傳入使用者名稱
        onLogout={logout} // 傳入登出函式
      />

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileImport}
        accept=".md,.tex,.txt"
        style={{ display: 'none' }}
      />

      <main className="flex flex-1 min-h-0 select-none">
        <EditorPane
          mode={mode}
          text={text}
          onTextChange={setText}
          style={leftPaneStyle}
        />
        
        <div
          onMouseDown={handleDividerMouseDown}
          className="w-[4px] cursor-col-resize bg-neutral-800 hover:bg-neutral-600"
        />

        <PreviewPane
          mode={mode}
          renderedHTML={renderedHTML}
          pdfURL={pdfURL}
          compileError={compileError}
          previewRef={previewRef}
        />
      </main>
    </div>
  );
}
