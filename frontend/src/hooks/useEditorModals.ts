// frontend/src/hooks/useEditorModals.ts
import { useCallback, useState } from 'react'

import type { SimpleInsert } from './useEditorActions'

type UseEditorModalsOptions = {
  editorRef: React.RefObject<HTMLTextAreaElement>
  handleSimpleInsert: SimpleInsert
  handleMathInsert: SimpleInsert
}

export function useEditorModals({
  editorRef,
  handleSimpleInsert,
  handleMathInsert,
}: UseEditorModalsOptions) {
  const [isTableModalOpen, setIsTableModalOpen] = useState(false)
  const [isSuperscriptModalOpen, setIsSuperscriptModalOpen] = useState(false)
  const [isSubscriptModalOpen, setIsSubscriptModalOpen] = useState(false)
  const [isMatrixModalOpen, setIsMatrixModalOpen] = useState(false)
  const [isAlignedModalOpen, setIsAlignedModalOpen] = useState(false)
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false)
  const [linkInitialText, setLinkInitialText] = useState('')
  
  const [isImageModalOpen, setIsImageModalOpen] = useState(false)
  const [imageInitialText, setImageInitialText] = useState('')

  const handleCreateTable = useCallback(
    (tableData: string[][]) => {
      if (tableData.length === 0 || tableData[0]?.length === 0) return
      let table = '\n'
      const headerLine = '| ' + tableData[0].join(' | ') + ' |'
      table += headerLine + '\n'
      const separatorLine = '|' + tableData[0].map(() => ' :--- ').join('|') + '|'
      table += separatorLine + '\n'
      for (let r = 1; r < tableData.length; r++) {
        table += '| ' + tableData[r].join(' | ') + ' |\n'
      }
      const placeholder = tableData[0][0]
      const placeholderIndex = table.indexOf(placeholder)
      const templateStart = table.substring(0, placeholderIndex)
      const templateEnd = table.substring(placeholderIndex + placeholder.length)
      handleSimpleInsert(templateStart, templateEnd, placeholder)
      setIsTableModalOpen(false)
    },
    [handleSimpleInsert]
  )

  const handleCreateSuperscript = useCallback(
    (base: string, exponent: string) => {
      handleMathInsert(`${base}^{${exponent}}`, '', '')
      setIsSuperscriptModalOpen(false)
    },
    [handleMathInsert]
  )

  const handleCreateSubscript = useCallback(
    (base: string, index: string) => {
      handleMathInsert(`${base}_{${index}}`, '', '')
      setIsSubscriptModalOpen(false)
    },
    [handleMathInsert]
  )

  const handleCreateMatrix = useCallback(
    (matrixData: string[][]) => {
      if (!matrixData.length || !matrixData[0]?.length) return
      const placeholder = matrixData[0][0]
      let matrixBody = ''
      const rows = matrixData.length
      const cols = matrixData[0].length
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (c > 0) {
            matrixBody += ' & '
          }
          matrixBody += matrixData[r][c] || `a_{${r + 1}${c + 1}}`
        }
        if (r < rows - 1) {
          matrixBody += ' \\\\ '
        }
      }
      const templateStart = '\\begin{bmatrix}'
      const placeholderIndex = matrixBody.indexOf(placeholder)
      const finalTemplateStart = templateStart + matrixBody.substring(0, placeholderIndex)
      const finalTemplateEnd = matrixBody.substring(placeholderIndex + placeholder.length) + '\\end{bmatrix}'
      
      handleMathInsert(finalTemplateStart, finalTemplateEnd, placeholder)
      setIsMatrixModalOpen(false)
    },
    [handleMathInsert]
  )

  const handleCreateAligned = useCallback(
    (lines: { left: string; symbol: string; right: string }[]) => {
      if (lines.length === 0) return;
      
      let alignedBody = '';
      lines.forEach((line, idx) => {
        alignedBody += `${line.left} &${line.symbol} ${line.right}`;
        if (idx < lines.length - 1) {
          alignedBody += ' \\\\ \n';
        }
      });

      const templateStart = '\\begin{aligned}\n' + alignedBody + '\n\\end{aligned}';
      handleMathInsert(templateStart, '', '')
      setIsAlignedModalOpen(false)
    },
    [handleMathInsert]
  )

  const handleCreateLink = useCallback(
    (text: string, url: string) => {
      const fullLink = `[${text}](${url})`;
      handleSimpleInsert(fullLink, '', '')
      setIsLinkModalOpen(false)
    },
    [handleSimpleInsert]
  )

  const handleCreateImage = useCallback(
    (altText: string, url: string) => {
      const fullImage = `![${altText}](${url})`;
      handleSimpleInsert(fullImage, '', '')
      setIsImageModalOpen(false)
    },
    [handleSimpleInsert]
  )

  // (FIXED) 智慧型上標修正
  // 選取文字 (例如 "x") 應作為底數，變成 x^{k}，並反白 "k"
  const handleRequestSuperscript = useCallback(() => {
    const editor = editorRef.current
    if (!editor) return
    const { selectionStart, selectionEnd, value } = editor
    
    if (selectionStart === selectionEnd) {
      setIsSuperscriptModalOpen(true)
      return
    }

    // 1. 取得選取文字 (Base，例如 "x")
    const base = value.substring(selectionStart, selectionEnd)
    const placeholder = 'k'; // 預設次方符號
    
    // 2. 準備插入字串： base^{placeholder}
    //    我們使用「取代」模式 (templateEnd 為空)，直接用新字串替換選取範圍
    const templateStart = `${base}^{`;
    const templateEnd = `}`;
    
    // 3. 計算游標/反白位置
    //    我們希望反白 placeholder ('k')
    //    'k' 的位置在 templateStart 之後
    //    relativeStart: templateStart.length
    //    relativeLength: placeholder.length
    
    handleMathInsert(templateStart, templateEnd, placeholder, {
      relativeStart: templateStart.length, 
      relativeLength: placeholder.length 
    })
  }, [editorRef, handleMathInsert])

  // (FIXED) 智慧型下標修正：同上邏輯
  const handleRequestSubscript = useCallback(() => {
    const editor = editorRef.current
    if (!editor) return
    const { selectionStart, selectionEnd, value } = editor
    
    if (selectionStart === selectionEnd) {
      setIsSubscriptModalOpen(true)
      return
    }

    const base = value.substring(selectionStart, selectionEnd)
    const placeholder = 'k';
    
    const templateStart = `${base}_{`;
    const templateEnd = `}`;
    
    handleMathInsert(templateStart, templateEnd, placeholder, {
      relativeStart: templateStart.length,
      relativeLength: placeholder.length 
    })
  }, [editorRef, handleMathInsert])

  const handleRequestTable = useCallback(() => {
    setIsTableModalOpen(true)
  }, [])

  const handleRequestMatrix = useCallback(() => {
    setIsMatrixModalOpen(true)
  }, [])

  const handleRequestAligned = useCallback(() => {
    setIsAlignedModalOpen(true)
  }, [])

  const handleRequestLink = useCallback(() => {
    const editor = editorRef.current
    if (!editor) {
      setLinkInitialText('')
    } else {
      const { selectionStart, selectionEnd, value } = editor
      const selectedText = value.substring(selectionStart, selectionEnd)
      setLinkInitialText(selectedText)
    }
    setIsLinkModalOpen(true)
  }, [editorRef])

  const handleRequestImage = useCallback(() => {
    const editor = editorRef.current
    if (!editor) {
      setImageInitialText('')
    } else {
      const { selectionStart, selectionEnd, value } = editor
      const selectedText = value.substring(selectionStart, selectionEnd)
      setImageInitialText(selectedText)
    }
    setIsImageModalOpen(true)
  }, [editorRef])

  return {
    isTableModalOpen,
    isSuperscriptModalOpen,
    isSubscriptModalOpen,
    isMatrixModalOpen,
    isAlignedModalOpen,
    isLinkModalOpen,
    linkInitialText,
    isImageModalOpen,
    imageInitialText,
    onCloseTable: () => setIsTableModalOpen(false),
    onCloseSuperscript: () => setIsSuperscriptModalOpen(false),
    onCloseSubscript: () => setIsSubscriptModalOpen(false),
    onCloseMatrix: () => setIsMatrixModalOpen(false),
    onCloseAligned: () => setIsAlignedModalOpen(false),
    onCloseLink: () => setIsLinkModalOpen(false),
    onCloseImage: () => setIsImageModalOpen(false),
    onRequestTable: handleRequestTable,
    onRequestSuperscript: handleRequestSuperscript,
    onRequestSubscript: handleRequestSubscript,
    onRequestMatrix: handleRequestMatrix,
    onRequestAligned: handleRequestAligned,
    onRequestLink: handleRequestLink,
    onRequestImage: handleRequestImage,
    onCreateTable: handleCreateTable,
    onCreateSuperscript: handleCreateSuperscript,
    onCreateSubscript: handleCreateSubscript,
    onCreateMatrix: handleCreateMatrix,
    onCreateAligned: handleCreateAligned,
    onCreateLink: handleCreateLink,
    onCreateImage: handleCreateImage,
  }
}

export type EditorModals = ReturnType<typeof useEditorModals>