import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { EditorCore } from '../App'

type DocumentRow = {
  id: string
  title: string
  content: string
  doc_type: string
  created_at: string
  updated_at: string
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export default function MarkdownEditorPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [doc, setDoc] = useState<DocumentRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [pendingText, setPendingText] = useState<string | null>(null)

  // 讀取文件
  useEffect(() => {
    if (!id) {
      setError('缺少文件 id')
      setLoading(false)
      return
    }

    const fetchDoc = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.error(error)
        setError('找不到這個文檔')
        setLoading(false)
        return
      }

      if (data.doc_type !== 'markdown') {
        setError('這個文檔不是 Markdown 類型')
        setLoading(false)
        return
      }

      setDoc(data as DocumentRow)
      setLoading(false)
    }

    fetchDoc()
  }, [id])

  // EditorCore 通知文字變更 → 等待 auto-save
  const handleContentChange = (newText: string) => {
    setPendingText(newText)
    setSaveStatus('saving')
  }

  // 共用的實際儲存函式（auto-save & 手動 save 都用這個）
  const performSave = async (text: string) => {
    if (!doc) return
    const now = new Date().toISOString()

    const { error } = await supabase
      .from('documents')
      .update({
        content: text,
        updated_at: now,
      })
      .eq('id', doc.id)

    if (error) {
      console.error(error)
      setSaveStatus('error')
    } else {
      setSaveStatus('saved')
      setPendingText(null)
      setDoc((prev) =>
        prev ? { ...prev, content: text, updated_at: now } : prev,
      )
    }
  }

  // debounce auto-save
  useEffect(() => {
    if (!doc || pendingText === null) return

    const textToSave = pendingText
    const timer = setTimeout(() => {
      performSave(textToSave)
    }, 3000)

    return () => clearTimeout(timer)
  }, [pendingText, doc]) // eslint-disable-line react-hooks/exhaustive-deps

  // 手動 Save：立刻把最新文字存進去
  const handleManualSave = () => {
    if (!doc) return
    const textToSave = pendingText ?? doc.content
    setSaveStatus('saving')
    performSave(textToSave)
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-neutral-950 text-neutral-200">
        載入中…
      </div>
    )
  }

  if (error || !doc) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-neutral-950 text-neutral-200">
        <div className="mb-3">{error ?? '發生未知錯誤'}</div>
        <button
          onClick={() => navigate('/projects')}
          className="px-3 py-1.5 text-xs rounded-md border border-neutral-700 hover:bg-neutral-900"
        >
          回到專案列表
        </button>
      </div>
    )
  }

  return (
    <EditorCore
      initialMode="markdown"
      initialText={doc.content}
      title={doc.title}
      saveStatus={saveStatus}
      onContentChange={handleContentChange}
      onManualSave={handleManualSave}
    />
  )
}
