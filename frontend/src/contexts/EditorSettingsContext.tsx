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
}

const EditorSettingsContext = createContext<
  EditorSettingsContextValue | undefined
>(undefined)

type ProviderProps = {
  children: React.ReactNode
}

export function EditorSettingsProvider({ children }: ProviderProps) {
  const [fontSize, setFontSize] = useState(14)
  const [wordWrap, setWordWrap] = useState(true)
  const [indentSize, setIndentSizeState] = useState<2 | 4>(4)
  const [autoSaveInterval, setAutoSaveInterval] = useState<number | null>(3000)

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
    }),
    [
      fontSize,
      wordWrap,
      indentSize,
      setIndentSize,
      autoSaveInterval,
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
