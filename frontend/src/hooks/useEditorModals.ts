import { useCallback, useState } from 'react'

import type { SimpleInsert } from './useEditorActions'

type UseEditorModalsOptions = {
  editorRef: React.RefObject<HTMLTextAreaElement>
  handleSimpleInsert: SimpleInsert
}

export function useEditorModals({
  editorRef,
  handleSimpleInsert,
}: UseEditorModalsOptions) {
  const [isTableModalOpen, setIsTableModalOpen] = useState(false)
  const [isSuperscriptModalOpen, setIsSuperscriptModalOpen] = useState(false)
  const [isSubscriptModalOpen, setIsSubscriptModalOpen] = useState(false)
  const [isMatrixModalOpen, setIsMatrixModalOpen] = useState(false)

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
      handleSimpleInsert(`$${base}^{${exponent}}$`, '', '')
      setIsSuperscriptModalOpen(false)
    },
    [handleSimpleInsert]
  )

  const handleCreateSubscript = useCallback(
    (base: string, index: string) => {
      handleSimpleInsert(`$${base}_{${index}}$`, '', '')
      setIsSubscriptModalOpen(false)
    },
    [handleSimpleInsert]
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
      const templateStart = '$$\\begin{bmatrix}'
      const placeholderIndex = matrixBody.indexOf(placeholder)
      const finalTemplateStart = templateStart + matrixBody.substring(0, placeholderIndex)
      const finalTemplateEnd = matrixBody.substring(placeholderIndex + placeholder.length) + '\\end{bmatrix}$$'
      handleSimpleInsert(finalTemplateStart, finalTemplateEnd, placeholder)
      setIsMatrixModalOpen(false)
    },
    [handleSimpleInsert]
  )

  const handleRequestSuperscript = useCallback(() => {
    const editor = editorRef.current
    if (!editor) return
    const { selectionStart, selectionEnd, value } = editor
    if (selectionStart === selectionEnd) {
      setIsSuperscriptModalOpen(true)
      return
    }
    const selectedText = value.substring(selectionStart, selectionEnd)
    const placeholder = 'exponent'
    const templateStart = `$${selectedText}^{`
    const templateEnd = `}$`
    const textToInsert = templateStart + placeholder + templateEnd
    editor.focus()
    editor.setSelectionRange(selectionStart, selectionEnd)
    document.execCommand('insertText', false, textToInsert)
    setTimeout(() => {
      editor.focus()
      const newCursorStart = selectionStart + templateStart.length
      const newCursorEnd = newCursorStart + placeholder.length
      editor.setSelectionRange(newCursorStart, newCursorEnd)
    }, 0)
  }, [editorRef])

  const handleRequestSubscript = useCallback(() => {
    const editor = editorRef.current
    if (!editor) return
    const { selectionStart, selectionEnd, value } = editor
    if (selectionStart === selectionEnd) {
      setIsSubscriptModalOpen(true)
      return
    }
    const selectedText = value.substring(selectionStart, selectionEnd)
    const placeholder = 'index'
    const templateStart = `$${selectedText}_{`
    const templateEnd = `}$`
    const textToInsert = templateStart + placeholder + templateEnd
    editor.focus()
    editor.setSelectionRange(selectionStart, selectionEnd)
    document.execCommand('insertText', false, textToInsert)
    setTimeout(() => {
      editor.focus()
      const newCursorStart = selectionStart + templateStart.length
      const newCursorEnd = newCursorStart + placeholder.length
      editor.setSelectionRange(newCursorStart, newCursorEnd)
    }, 0)
  }, [editorRef])

  const handleRequestTable = useCallback(() => {
    setIsTableModalOpen(true)
  }, [])

  const handleRequestMatrix = useCallback(() => {
    setIsMatrixModalOpen(true)
  }, [])

  return {
    isTableModalOpen,
    isSuperscriptModalOpen,
    isSubscriptModalOpen,
    isMatrixModalOpen,
    onCloseTable: () => setIsTableModalOpen(false),
    onCloseSuperscript: () => setIsSuperscriptModalOpen(false),
    onCloseSubscript: () => setIsSubscriptModalOpen(false),
    onCloseMatrix: () => setIsMatrixModalOpen(false),
    onRequestTable: handleRequestTable,
    onRequestSuperscript: handleRequestSuperscript,
    onRequestSubscript: handleRequestSubscript,
    onRequestMatrix: handleRequestMatrix,
    onCreateTable: handleCreateTable,
    onCreateSuperscript: handleCreateSuperscript,
    onCreateSubscript: handleCreateSubscript,
    onCreateMatrix: handleCreateMatrix,
  }
}

export type EditorModals = ReturnType<typeof useEditorModals>
