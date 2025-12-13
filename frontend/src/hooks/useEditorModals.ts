// frontend/src/hooks/useEditorModals.ts
import { useState, useCallback } from 'react'
import type { Mode } from '../types'

type UseEditorModalsProps = {
  editorRef: React.RefObject<HTMLTextAreaElement>
  handleSimpleInsert: (templateStart: string, templateEnd: string, placeholder: string) => void
  handleMathInsert: (templateStart: string, templateEnd: string, placeholder: string, selectionOptions?: { selectTemplate?: boolean; relativeStart: number; relativeLength: number }, requiredPackage?: string) => void
  mode: Mode
}

// [FIX] 定義 Aligned 的資料結構
type AlignedLine = {
  left: string;
  symbol: string;
  right: string;
};

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

  // --- Request Handlers (Open Modals or Smart Insert) ---
  const onRequestTable = useCallback(() => setIsTableModalOpen(true), [])
  const onRequestMatrix = useCallback(() => setIsMatrixModalOpen(true), [])
  const onRequestAligned = useCallback(() => setIsAlignedModalOpen(true), [])

  // [FIXED] 恢復智慧上標：如果有選取文字，直接變成底數；否則開彈窗
  const onRequestSuperscript = useCallback(() => {
    const editor = editorRef.current
    if (editor) {
      const { selectionStart, selectionEnd, value } = editor
      // 如果有選取文字 (例如選了 "x")
      if (selectionStart !== selectionEnd) {
        const base = value.substring(selectionStart, selectionEnd)
        const placeholder = '2' // 預設指數
        
        // 生成: base^{2}
        const templateStart = `${base}^{`
        const templateEnd = `}`
        
        handleMathInsert(templateStart, templateEnd, placeholder, {
          relativeStart: templateStart.length, // 游標跳到底數和大括號後面
          relativeLength: placeholder.length   // 反白預設指數
        })
        return
      }
    }
    // 沒選字才開彈窗
    setIsSuperscriptModalOpen(true)
  }, [editorRef, handleMathInsert])

  // [FIXED] 恢復智慧下標：同上
  const onRequestSubscript = useCallback(() => {
    const editor = editorRef.current
    if (editor) {
      const { selectionStart, selectionEnd, value } = editor
      if (selectionStart !== selectionEnd) {
        const base = value.substring(selectionStart, selectionEnd)
        const placeholder = 'i' // 預設下標
        
        // 生成: base_{i}
        const templateStart = `${base}_{`
        const templateEnd = `}`
        
        handleMathInsert(templateStart, templateEnd, placeholder, {
          relativeStart: templateStart.length,
          relativeLength: placeholder.length
        })
        return
      }
    }
    setIsSubscriptModalOpen(true)
  }, [editorRef, handleMathInsert])

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
        const colTypes = Array(cols).fill('c');
        if (hasRowHeaders) colTypes[0] = 'l';
        const colDef = '|' + colTypes.join('|') + '|';
        
        let latex = `\\begin{table}[h]\n  \\centering\n  \\begin{tabular}{${colDef}}\n    \\hline\n`;
        
        tableData.forEach((row, rowIndex) => {
          const formattedRow = row.map((cell, colIndex) => {
            let content = cell;
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

  // 2. Superscript (Modal Callback)
  const handleCreateSuperscript = useCallback((base: string, exponent: string) => {
    const content = `${base}^{${exponent}}`;
    handleMathInsert(content, '', ''); 
    setIsSuperscriptModalOpen(false)
  }, [handleMathInsert])

  // 3. Subscript (Modal Callback)
  const handleCreateSubscript = useCallback((base: string, index: string) => {
    const content = `${base}_{${index}}`;
    handleMathInsert(content, '', '');
    setIsSubscriptModalOpen(false)
  }, [handleMathInsert])

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

  // 5. Aligned Equations (FIXED)
  const handleCreateAligned = useCallback((lines: AlignedLine[]) => { // 使用正確的物件陣列型別
    let latex = '\\begin{aligned}\n'
    
    // 修正：正確解析物件，並組合成 LaTeX 的對齊格式
    // 格式：Left &Symbol Right
    const formattedLines = lines.map(line => {
      const left = line.left ? `${line.left} ` : '';
      const symbol = line.symbol ? `&${line.symbol} ` : '& ';
      const right = line.right || '';
      return `${left}${symbol}${right}`;
    });

    latex += formattedLines.join(' \\\\\n')
    latex += '\n\\end{aligned}'
    
    // Aligned environment needs amsmath package
    handleMathInsert(latex, '', '', undefined, 'amsmath')
    setIsAlignedModalOpen(false)
  }, [handleMathInsert])

  // 6. Link
  const handleCreateLink = useCallback((text: string, url: string) => {
    if (mode === 'latex') {
      handleSimpleInsert(`\\href{${url}}{`, '}', text)
    } else {
      handleSimpleInsert('[', `](${url})`, text)
    }
    setIsLinkModalOpen(false)
  }, [handleSimpleInsert, mode])

  // 7. Image
  const handleCreateImage = useCallback((alt: string, url: string) => {
    if (mode === 'latex') {
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
    onCreateAligned: handleCreateAligned, // 這裡這裡，現在傳入正確的函式了
    onCreateLink: handleCreateLink,
    onCreateImage: handleCreateImage,
  }
}