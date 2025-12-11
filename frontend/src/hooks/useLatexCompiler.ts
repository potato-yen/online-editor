// frontend/src/hooks/useLatexCompiler.ts
import { useCallback, useEffect, useState } from 'react'

import type { Mode } from '../types'

const DEFAULT_BACKEND_URL = 'http://localhost:3001/compile-latex'

function resolveBackendURL() {
  const envURL = import.meta.env.VITE_BACKEND_URL?.trim()
  if (envURL) {
    return envURL
  }
  if (typeof window !== 'undefined') {
    const origin = new URL(window.location.origin)
    origin.port = '3001'
    origin.pathname = '/compile-latex'
    origin.search = ''
    origin.hash = ''
    return origin.toString()
  }
  return DEFAULT_BACKEND_URL
}

const BACKEND_URL = resolveBackendURL()

type UseLatexCompilerOptions = {
  text: string
  mode: Mode
}

// [NEW] 錯誤解析器：將冗長的 LaTeX log 轉換為人類可讀的格式
function parseLatexLog(rawLog: string): string {
  if (!rawLog) return '';

  const lines = rawLog.split('\n');
  const errors: string[] = [];
  let errorCount = 0;

  // 1. 提取關鍵錯誤 (以 ! 開頭的行)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // LaTeX 錯誤通常以 ! 開頭
    if (line.startsWith('! ')) {
      errorCount++;
      if (errorCount > 3) break; // 只抓前三個錯誤，避免洗版

      const errorMsg = line.substring(2); // 去掉 "! "
      let location = '';

      // 嘗試在接下來的幾行中尋找行號 "l.10"
      for (let j = 1; j <= 3; j++) {
        if (i + j < lines.length) {
          const nextLine = lines[i + j];
          const lineMatch = nextLine.match(/^l\.(\d+)/);
          if (lineMatch) {
            location = ` (Line ${lineMatch[1]})`;
            break;
          }
        }
      }
      
      errors.push(`🔴 ${errorMsg}${location}`);
    } 
    // 捕捉 "Emergency stop"
    else if (line.includes('! Emergency stop')) {
        errors.push(`🔴 Emergency stop (Check if document structure is complete)`);
    }
    // 捕捉 "No PDF output generated" (來自 server.js)
    else if (line.includes('No PDF output generated')) {
        errors.push(`🔴 No PDF generated. The compilation failed severely.`);
    }
  }

  if (errors.length === 0) {
    // 如果找不到特定格式，但有錯誤，就回傳一個通用提示
    return `⚠️ Compilation Error\n\nPlease check the raw log below for details.\n\n---\n${rawLog}`;
  }

  // 組合友善訊息 + 原始 Log
  const friendlySummary = errors.join('\n');
  return `⚠️ Compilation Failed\n\n${friendlySummary}\n\n=============================\nRAW LOGS:\n=============================\n${rawLog}`;
}

export function useLatexCompiler({ text, mode }: UseLatexCompilerOptions) {
  const [isCompiling, setIsCompiling] = useState(false)
  const [pdfURL, setPdfURL] = useState('')
  const [compileErrorLog, setCompileErrorLog] = useState('')
  const [compileErrorLines, setCompileErrorLines] = useState<number[]>([])

  useEffect(() => {
    if (!pdfURL || !pdfURL.startsWith('blob:')) return undefined

    // Revoke the previous object URL when pdfURL changes or on unmount
    return () => {
      URL.revokeObjectURL(pdfURL)
    }
  }, [pdfURL])

  const handleCompileLatex = useCallback(async () => {
    if (mode !== 'latex') return
    setIsCompiling(true)
    setCompileErrorLog('')
    setCompileErrorLines([])
    setPdfURL('')
    try {
      const res = await fetch(BACKEND_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: text }),
      })
      const data = await res.json()
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid response from compile server')
      }
      if (!data.success) {
        const errorLines = Array.isArray(data.errorLines)
          ? data.errorLines.map((n: unknown) => Number(n)).filter((n) => Number.isFinite(n))
          : []
        setCompileErrorLines(errorLines)
        
        // [MODIFIED] 使用解析器來設定錯誤訊息
        const rawLog = data.errorLog || data.error || 'LaTeX 編譯失敗';
        setCompileErrorLog(parseLatexLog(rawLog));
        
        return
      }
      if (!data.pdfBase64 || typeof data.pdfBase64 !== 'string') {
        throw new Error('PDF 資料缺失')
      }
      const byteCharacters = window.atob(data.pdfBase64)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i += 1) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      const blob = new Blob([byteArray], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      setPdfURL(url)
      setCompileErrorLines([])
    } catch (err: any) {
      console.error(err)
      // [MODIFIED] 同樣對 catch 到的錯誤進行處理
      setCompileErrorLog(`⚠️ Network/Server Error:\n${err?.message || 'Unknown Error'}`)
      setCompileErrorLines([])
    } finally {
      setIsCompiling(false)
    }
  }, [mode, text])

  return {
    isCompiling,
    pdfURL,
    compileErrorLog,
    compileErrorLines,
    handleCompileLatex,
  }
}

export type LatexCompiler = ReturnType<typeof useLatexCompiler>