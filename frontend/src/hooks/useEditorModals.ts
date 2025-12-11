// frontend/src/hooks/useEditorModals.ts
import { useState, useCallback } from 'react'
import type { Mode } from '../types'

type UseEditorModalsProps = {
  editorRef: React.RefObject<HTMLTextAreaElement>
  handleSimpleInsert: (templateStart: string, templateEnd: string, placeholder: string) => void
  handleMathInsert: (templateStart: string, templateEnd: string, placeholder: string, selectionOptions?: { selectTemplate?: boolean }, requiredPackage?: string) => void
  mode: Mode
}

export function useEditorModals({ 
  editorRef, 
  handleSimpleInsert, 
  handleMathInsert,
  mode 
}: UseEditorModalsProps) {

  // --- States ---
  const [isTableModalOpen, setIsTableModalOpen] = useState(false)
  const [isSuperscriptModalOpen, setIsSuperscriptModalOpen] = useState(false)
  const [isSubscriptModalOpen, setIsSubscriptModalOpen] = useState(false)
  const [isMatrixModalOpen, setIsMatrixModalOpen] = useState(false)
  const [isAlignedModalOpen, setIsAlignedModalOpen] = useState(false)
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false)
  const [isImageModalOpen, setIsImageModalOpen] = useState(false)

  // Initial text states
  const [linkInitialText, setLinkInitialText] = useState('')
  const [imageInitialText, setImageInitialText] = useState('')

  // --- Close Handlers ---
  const onCloseTable = useCallback(() => setIsTableModalOpen(false), [])
  const onCloseSuperscript = useCallback(() => setIsSuperscriptModalOpen(false), [])
  const onCloseSubscript = useCallback(() => setIsSubscriptModalOpen(false), [])
  const onCloseMatrix = useCallback(() => setIsMatrixModalOpen(false), [])
  const onCloseAligned = useCallback(() => setIsAlignedModalOpen(false), [])
  const onCloseLink = useCallback(() => setIsLinkModalOpen(false), [])
  const onCloseImage = useCallback(() => setIsImageModalOpen(false), [])

  // --- Request Handlers (Open Modals) ---
  const onRequestTable = useCallback(() => setIsTableModalOpen(true), [])
  const onRequestSuperscript = useCallback(() => setIsSuperscriptModalOpen(true), [])
  const onRequestSubscript = useCallback(() => setIsSubscriptModalOpen(true), [])
  const onRequestMatrix = useCallback(() => setIsMatrixModalOpen(true), [])
  const onRequestAligned = useCallback(() => setIsAlignedModalOpen(true), [])

  const onRequestLink = useCallback(() => {
    const editor = editorRef.current
    if (editor) {
      const start = editor.selectionStart
      const end = editor.selectionEnd
      setLinkInitialText(editor.value.substring(start, end))
    }
    setIsLinkModalOpen(true)
  }, [editorRef])

  const onRequestImage = useCallback(() => {
    const editor = editorRef.current
    if (editor) {
      const start = editor.selectionStart
      const end = editor.selectionEnd
      setImageInitialText(editor.value.substring(start, end))
    }
    setIsImageModalOpen(true)
  }, [editorRef])

  // --- Create Handlers (Logic) ---

  // 1. Table Logic
  const handleCreateTable = useCallback(
    (tableData: string[][], options?: { hasRowHeaders: boolean }) => {
      const rows = tableData.length;
      const cols = tableData[0]?.length || 0;
      const hasRowHeaders = options?.hasRowHeaders ?? false;

      if (rows === 0 || cols === 0) return;

      if (mode === 'latex') {
        // --- LaTeX Mode ---
        
        // 1. 定義欄位對齊
        const colTypes = Array(cols).fill('c');
        if (hasRowHeaders) colTypes[0] = 'l';
        const colDef = '|' + colTypes.join('|') + '|';
        
        let latex = `\\begin{table}[h]\n  \\centering\n  \\begin{tabular}{${colDef}}\n    \\hline\n`;
        
        // 2. 填充內容
        tableData.forEach((row, rowIndex) => {
          const formattedRow = row.map((cell, colIndex) => {
            let content = cell;
            // 標頭加粗邏輯
            const isHeader = rowIndex === 0 || (hasRowHeaders && colIndex === 0);
            
            if (isHeader && content.trim() !== '') {
              if (!content.startsWith('\\textbf{')) {
                content = `\\textbf{${content}}`;
              }
            }
            return content;
          });
          
          latex += `    ${formattedRow.join(' & ')} \\\\\n    \\hline\n`;
        });
        
        latex += `  \\end{tabular}\n  \\caption{My Table}\n\\end{table}`;
        
        handleSimpleInsert(latex, '', '');

      } else {
        // --- Markdown Mode ---
        let markdown = '\n';
        
        const headerRow = tableData[0].map(cell => ` ${cell} `).join('|');
        markdown += `|${headerRow}|\n`;
        
        const separator = tableData[0].map(() => ' --- ').join('|');
        markdown += `|${separator}|\n`;
        
        for (let r = 1; r < rows; r++) {
          const rowStr = tableData[r].map((cell, c) => {
            if (hasRowHeaders && c === 0 && cell.trim()) {
              return ` **${cell}** `;
            }
            return ` ${cell} `;
          }).join('|');
          markdown += `|${rowStr}|\n`;
        }
        
        handleSimpleInsert(markdown, '', '');
      }
      
      setIsTableModalOpen(false)
    },
    [handleSimpleInsert, mode]
  )

  // 2. Superscript [FIXED]
  // 現在接收兩個參數：base (底數) 和 exponent (指數)
  const handleCreateSuperscript = useCallback((base: string, exponent: string) => {
    if (mode === 'latex') {
      // 組合完整 LaTeX 字串，如 x^{2}
      // 使用 handleMathInsert 確保它被自動包在 $...$ (若不在數學模式)
      const content = `${base}^{${exponent}}`;
      handleMathInsert(content, '', ''); 
    } else {
      // Markdown
      const content = `${base}<sup>${exponent}</sup>`;
      handleSimpleInsert(content, '', '');
    }
    setIsSuperscriptModalOpen(false)
  }, [handleMathInsert, handleSimpleInsert, mode])

  // 3. Subscript [FIXED]
  // 現在接收兩個參數：base (底數) 和 index (下標)
  const handleCreateSubscript = useCallback((base: string, index: string) => {
    if (mode === 'latex') {
      const content = `${base}_{${index}}`;
      handleMathInsert(content, '', '');
    } else {
      const content = `${base}<sub>${index}</sub>`;
      handleSimpleInsert(content, '', '');
    }
    setIsSubscriptModalOpen(false)
  }, [handleMathInsert, handleSimpleInsert, mode])

  // 4. Matrix
  const handleCreateMatrix = useCallback((matrixData: string[][]) => {
    const rows = matrixData.length
    if (rows === 0) return

    let latex = '\\begin{bmatrix}\n'
    for (const row of matrixData) {
      latex += '  ' + row.join(' & ') + ' \\\\\n'
    }
    latex += '\\end{bmatrix}'
    
    // Matrix needs amsmath package
    handleMathInsert(latex, '', '', undefined, 'amsmath')
    setIsMatrixModalOpen(false)
  }, [handleMathInsert])

  // 5. Aligned Equations
  const handleCreateAligned = useCallback((lines: string[]) => {
    let latex = '\\begin{aligned}\n'
    latex += lines.join(' \\\\\n')
    latex += '\n\\end{aligned}'
    
    // Aligned environment needs amsmath package
    handleMathInsert(latex, '', '', undefined, 'amsmath')
    setIsAlignedModalOpen(false)
  }, [handleMathInsert])

  // 6. Link
  const handleCreateLink = useCallback((text: string, url: string) => {
    if (mode === 'latex') {
      // Simple \href or \url fallback
      handleSimpleInsert(`\\href{${url}}{`, '}', text)
    } else {
      handleSimpleInsert('[', `](${url})`, text)
    }
    setIsLinkModalOpen(false)
  }, [handleSimpleInsert, mode])

  // 7. Image
  const handleCreateImage = useCallback((alt: string, url: string) => {
    if (mode === 'latex') {
      // Standard LaTeX figure
      const latex = `\\begin{figure}[h]\n  \\centering\n  \\includegraphics[width=0.8\\textwidth]{${url}}\n  \\caption{${alt}}\n\\end{figure}`
      handleSimpleInsert(latex, '', '')
    } else {
      handleSimpleInsert('![', `](${url})`, alt)
    }
    setIsImageModalOpen(false)
  }, [handleSimpleInsert, mode])

  return {
    isTableModalOpen,
    isSuperscriptModalOpen,
    isSubscriptModalOpen,
    isMatrixModalOpen,
    isAlignedModalOpen,
    isLinkModalOpen,
    isImageModalOpen,
    linkInitialText,
    imageInitialText,
    
    onCloseTable,
    onCloseSuperscript,
    onCloseSubscript,
    onCloseMatrix,
    onCloseAligned,
    onCloseLink,
    onCloseImage,
    
    onRequestTable,
    onRequestSuperscript,
    onRequestSubscript,
    onRequestMatrix,
    onRequestAligned,
    onRequestLink,
    onRequestImage,
    
    onCreateTable: handleCreateTable,
    onCreateSuperscript: handleCreateSuperscript,
    onCreateSubscript: handleCreateSubscript,
    onCreateMatrix: handleCreateMatrix,
    onCreateAligned: handleCreateAligned,
    onCreateLink: handleCreateLink,
    onCreateImage: handleCreateImage,
  }
}