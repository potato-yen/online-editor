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
        setCompileErrorLog(data.errorLog || data.error || 'LaTeX 編譯失敗')
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
      setCompileErrorLog(err?.message || 'LaTeX 編譯失敗')
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
