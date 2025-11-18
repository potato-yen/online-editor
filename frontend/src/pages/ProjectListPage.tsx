// src/pages/ProjectListPage.tsx

import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import type { Mode } from '../types'

type DocType = Mode

type DocumentRow = {
  id: string
  title: string
  content: string
  doc_type: string
  created_at: string
  updated_at: string
}

type CreateDocOptions = {
  docType: DocType
  title?: string
  content?: string
}

type ProjectListPageProps = {
  openAddFilePrompt: (docType: DocType) => Promise<string | null>
}

const MAX_DOCS = 10

export default function ProjectListPage({
  openAddFilePrompt,
}: ProjectListPageProps) {
  const navigate = useNavigate()

  const [user, setUser] = useState<any>(null)
  const [docs, setDocs] = useState<DocumentRow[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [addMenuOpen, setAddMenuOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // 每列的 ⋮ menu
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  // 使用者頭像 menu
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const canCreateMore = docs.length < MAX_DOCS

  // 追蹤 auth 狀態
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => {
      sub.subscription.unsubscribe()
    }
  }, [])

  // 抓 documents
  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    const fetchDocs = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('updated_at', { ascending: false })

      if (error) {
        console.error(error)
        setDocs([])
      } else {
        setDocs(data || [])
      }
      setLoading(false)
    }

    fetchDocs()
  }, [user])

  const openDoc = (doc: DocumentRow) => {
    if (doc.doc_type === 'markdown') {
      navigate(`/editor/md/${doc.id}`)
    } else {
      navigate(`/editor/tex/${doc.id}`)
    }
  }

  // 建立新文檔或從檔案匯入
  const createDoc = async ({ docType, title, content }: CreateDocOptions) => {
    if (!user) {
      alert('請先登入才能建立文檔')
      return
    }

    if (!canCreateMore) {
      alert(`每個帳號最多只能建立 ${MAX_DOCS} 個文檔。`)
      return
    }

    const now = new Date().toISOString()
    const resolvedTitle =
      title?.trim() ||
      (docType === 'markdown' ? '未命名 Markdown 文檔' : '未命名 LaTeX 文檔')
    const resolvedContent =
      typeof content === 'string'
        ? content
        : docType === 'markdown'
          ? '# 新的 Markdown 文檔\n'
          : '% 新的 LaTeX 文檔\n'

    setCreating(true)

    const { data, error } = await supabase
      .from('documents')
      .insert({
        user_id: user.id,
        title: resolvedTitle,
        content: resolvedContent,
        doc_type: docType,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single()

    setCreating(false)

    if (error) {
      console.error(error)
      alert('建立失敗：' + error.message)
      return
    }

    setDocs((prev) =>
      [data as DocumentRow, ...prev].sort((a, b) =>
        a.updated_at < b.updated_at ? 1 : -1,
      ),
    )

    navigate(
      docType === 'markdown'
        ? `/editor/md/${data.id}`
        : `/editor/tex/${data.id}`,
    )
  }

  const handleAddDoc = async (docType: DocType) => {
    if (!canCreateMore || creating) return
    setAddMenuOpen(false)
    const name = await openAddFilePrompt(docType)
    if (!name) return
    await createDoc({ docType, title: name })
  }

  const triggerFilePicker = () => {
    if (!canCreateMore || creating) return
    setAddMenuOpen(false)
    fileInputRef.current?.click()
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (evt) => {
      const fileContent = evt.target?.result
      if (typeof fileContent !== 'string') {
        alert('讀取檔案失敗')
        return
      }

      const lowerName = file.name.toLowerCase()
      const docType: DocType = lowerName.endsWith('.tex') ? 'latex' : 'markdown'
      const baseTitle = file.name.replace(/\.[^/.]+$/, '').trim()
      const title =
        baseTitle ||
        (docType === 'markdown' ? 'Imported Markdown 文檔' : 'Imported LaTeX 文檔')

      await createDoc({ docType, title, content: fileContent })
    }

    reader.onerror = () => {
      alert('讀取檔案失敗')
    }

    reader.readAsText(file, 'utf-8')
    e.target.value = ''
  }

  // 重新命名
  const renameDoc = async (doc: DocumentRow) => {
    const newName = window.prompt('輸入新的文檔名稱：', doc.title)
    if (newName == null) return
    const trimmed = newName.trim()
    if (!trimmed) return

    const now = new Date().toISOString()

    const { error } = await supabase
      .from('documents')
      .update({ title: trimmed, updated_at: now })
      .eq('id', doc.id)

    if (error) {
      console.error(error)
      alert('重新命名失敗：' + error.message)
      return
    }

    setDocs((prev) =>
      prev
        .map((d) =>
          d.id === doc.id ? { ...d, title: trimmed, updated_at: now } : d,
        )
        .sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1)),
    )
  }

  // 刪除
  const deleteDoc = async (doc: DocumentRow) => {
    const ok = window.confirm(`確定要刪除「${doc.title}」嗎？此操作無法復原。`)
    if (!ok) return

    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', doc.id)

    if (error) {
      console.error(error)
      alert('刪除失敗：' + error.message)
      return
    }

    setDocs((prev) => prev.filter((d) => d.id !== doc.id))
  }

  // 登出
  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setUserMenuOpen(false)
    navigate('/') // 如果你有 /login，可以改成 navigate('/login')
  }

  const username: string | undefined = user?.user_metadata?.username
  const initial =
    (username && username.trim().charAt(0).toUpperCase()) ||
    (user?.email && user.email.trim().charAt(0).toUpperCase()) ||
    '?'

  if (!user) {
    return (
      <div className="h-screen flex justify-center items-center bg-neutral-950 text-neutral-300">
        請先登入（之後可以在這裡放登入入口按鈕）
      </div>
    )
  }

  return (
    <div
      className="h-screen flex flex-col bg-neutral-950 text-neutral-100"
      onClick={() => {
        setOpenMenuId(null)
        setUserMenuOpen(false)
        setAddMenuOpen(false)
      }}
    >
      <header className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
        <div>
          <h1 className="text-lg font-semibold">Your Documents</h1>
          <p className="text-xs text-neutral-400">
            {docs.length} / {MAX_DOCS} documents used
          </p>
        </div>

        {/* 右側：新增文檔按鈕 + 使用者頭像 */}
        <div className="flex items-center gap-4">
          <div
            className="flex items-center gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            {!canCreateMore && (
              <span className="text-[10px] text-red-400 mr-1">
                已達 {MAX_DOCS} 個上限，請刪除部分文檔後再新增。
              </span>
            )}

            <div className="relative">
              <button
                onClick={() =>
                  setAddMenuOpen((open) =>
                    !canCreateMore || creating ? open : !open,
                  )
                }
                disabled={!canCreateMore || creating}
                className="px-4 py-2 rounded-full bg-neutral-100 text-neutral-900 text-xs font-semibold border border-neutral-300 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                + add
              </button>

              {addMenuOpen && (
                <div className="absolute right-0 mt-2 w-36 rounded-md bg-neutral-900 border border-neutral-700 shadow-lg z-20 text-xs overflow-hidden">
                  <button
                    className="w-full text-left px-3 py-2 hover:bg-neutral-800"
                    onClick={triggerFilePicker}
                  >
                    Import file
                  </button>
                  <button
                    className="w-full text-left px-3 py-2 hover:bg-neutral-800"
                    onClick={() => {
                      void handleAddDoc('markdown')
                    }}
                  >
                    Add .md
                  </button>
                  <button
                    className="w-full text-left px-3 py-2 hover:bg-neutral-800"
                    onClick={() => {
                      void handleAddDoc('latex')
                    }}
                  >
                    Add .tex
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 使用者頭像按鈕 */}
          <div
            className="relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="w-8 h-8 rounded-full bg-neutral-200 text-neutral-900 flex items-center justify-center text-xs font-semibold"
              onClick={() => setUserMenuOpen((o) => !o)}
            >
              {initial}
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-40 rounded-md bg-neutral-900 border border-neutral-700 shadow-lg z-20 text-xs overflow-hidden">
                <div className="px-3 py-2 border-b border-neutral-800">
                  <div className="text-[10px] text-neutral-500 mb-0.5">
                    Signed in as
                  </div>
                  <div className="text-neutral-200 truncate">
                    {username || user.email}
                  </div>
                </div>
                <button
                  className="w-full text-left px-3 py-1.5 text-red-300 hover:bg-neutral-800"
                  onClick={handleLogout}
                >
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <input
        ref={fileInputRef}
        type="file"
        accept=".md,.tex,.txt"
        className="hidden"
        onChange={handleFileInputChange}
      />

      <main className="flex-1 overflow-auto px-6 py-4">
        {loading ? (
          <div className="text-neutral-400">載入中…</div>
        ) : docs.length === 0 ? (
          <div className="text-neutral-500">
            目前沒有任何文檔，點擊右上角的 + add 按鈕來新增或匯入吧。
          </div>
        ) : (
          <table className="w-full text-sm border-collapse">
            <thead className="text-neutral-400 border-b border-neutral-800">
              <tr>
                <th className="text-left font-normal pb-2">Title</th>
                <th className="text-left font-normal pb-2">Type</th>
                <th className="text-left font-normal pb-2">Last Edited</th>
                <th className="text-left font-normal pb-2">Created</th>
                <th className="w-10 pb-2" />
              </tr>
            </thead>
            <tbody>
              {docs.map((doc) => (
                <tr
                  key={doc.id}
                  className="border-b border-neutral-900 hover:bg-neutral-900 cursor-pointer"
                  onClick={() => openDoc(doc)}
                >
                  <td className="py-2 pr-4">
                    <span className="truncate">{doc.title}</span>
                  </td>

                  <td className="py-2 pr-4 text-xs uppercase text-neutral-400">
                    {doc.doc_type}
                  </td>

                  <td className="py-2 pr-4 text-xs text-neutral-400">
                    {new Date(doc.updated_at).toLocaleString()}
                  </td>

                  <td className="py-2 pr-4 text-xs text-neutral-500">
                    {new Date(doc.created_at).toLocaleString()}
                  </td>

                  {/* ⋮ menu */}
                  <td className="py-2 pl-2 pr-0 text-right">
                    <div
                      className="relative inline-block"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-neutral-100"
                        onClick={() =>
                          setOpenMenuId((id) => (id === doc.id ? null : doc.id))
                        }
                      >
                        ⋮
                      </button>

                      {openMenuId === doc.id && (
                        <div className="absolute right-0 mt-1 w-28 rounded-md bg-neutral-900 border border-neutral-700 shadow-lg z-10 text-xs overflow-hidden">
                          <button
                            className="w-full text-left px-3 py-1.5 hover:bg-neutral-800"
                            onClick={() => {
                              renameDoc(doc)
                              setOpenMenuId(null)
                            }}
                          >
                            Rename
                          </button>
                          <button
                            className="w-full text-left px-3 py-1.5 text-red-300 hover:bg-neutral-800"
                            onClick={() => {
                              deleteDoc(doc)
                              setOpenMenuId(null)
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </main>
    </div>
  )
}
