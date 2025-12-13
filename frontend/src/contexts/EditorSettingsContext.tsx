import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react'

type EditorSettingsContextValue = {
  fontSize: number
  setFontSize: (size: number) => void
  wordWrap: boolean
  setWordWrap: (value: boolean) => void
  indentSize: 2 | 4
  setIndentSize: (size: number) => void
  autoSaveInterval: number | null
  setAutoSaveInterval: (value: number | null) => void
  // [NEW]
  autoCloseBrackets: boolean
  setAutoCloseBrackets: (value: boolean) => void
}

const EditorSettingsContext = createContext<
  EditorSettingsContextValue | undefined
>(undefined)

type ProviderProps = {
  children: React.ReactNode
}

export function EditorSettingsProvider({ children }: ProviderProps) {
  const [fontSize, setFontSize] = useState(16)
  const [wordWrap, setWordWrap] = useState(true)
  const [indentSize, setIndentSizeState] = useState<2 | 4>(2)
  const [autoSaveInterval, setAutoSaveInterval] = useState<number | null>(3000)
  // 預設開啟
  const [autoCloseBrackets, setAutoCloseBrackets] = useState(true)

  const setIndentSize = useCallback((size: number) => {
    setIndentSizeState(size === 2 ? 2 : 4)
  }, [])

  const value = useMemo(
    () => ({
      fontSize,
      setFontSize,
      wordWrap,
      setWordWrap,
      indentSize,
      setIndentSize,
      autoSaveInterval,
      setAutoSaveInterval,
      autoCloseBrackets,
      setAutoCloseBrackets,
    }),
    [
      fontSize,
      wordWrap,
      indentSize,
      setIndentSize,
      autoSaveInterval,
      // 確保這裡有加入依賴，這樣 Context 才會發出更新通知
      autoCloseBrackets,
    ]
  )

  return (
    <EditorSettingsContext.Provider value={value}>
      {children}
    </EditorSettingsContext.Provider>
  )
}

export function useEditorSettings() {
  const context = useContext(EditorSettingsContext)
  if (!context) {
    throw new Error(
      'useEditorSettings must be used within an EditorSettingsProvider'
    )
  }
  return context
}
