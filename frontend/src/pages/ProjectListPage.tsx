// frontend/src/pages/ProjectListPage.tsx
import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import type { Mode } from '../types'

// UI Components
import AppLayout from '../layouts/AppLayout'
import { Button } from '../components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Input } from '../components/ui/Input'

// Icons
const IconDots = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" /></svg>
)
const IconFile = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
)
const IconPlus = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
)

type DocType = Mode
const MAX_DOCS = 10

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

export default function ProjectListPage({ openAddFilePrompt }: ProjectListPageProps) {
  const navigate = useNavigate()
  const [user, setUser] = useState<any>(null)
  const [docs, setDocs] = useState<DocumentRow[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)
  
  // 檔案匯入用
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  
  // 檢查是否可以再新增
  const canCreateMore = docs.length < MAX_DOCS

  // --- Logic 區 (保持原有邏輯不變) ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

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

      if (error) console.error(error)
      else setDocs(data || [])
      setLoading(false)
    }
    fetchDocs()
  }, [user])

  const openDoc = (doc: DocumentRow) => {
    const path = doc.doc_type === 'markdown' ? `/editor/md/${doc.id}` : `/editor/tex/${doc.id}`
    navigate(path)
  }

  const createDoc = async ({ docType, title, content }: CreateDocOptions) => {
    if (!user || !canCreateMore) return
    const now = new Date().toISOString()
    const resolvedTitle = title?.trim() || (docType === 'markdown' ? 'New Markdown' : 'New LaTeX')
    const resolvedContent = typeof content === 'string' ? content : (docType === 'markdown' ? '# Title\n' : '% LaTeX\n')

    setCreating(true)
    const { data, error } = await supabase.from('documents').insert({
      user_id: user.id,
      title: resolvedTitle,
      content: resolvedContent,
      doc_type: docType,
      created_at: now,
      updated_at: now,
    }).select().single()
    setCreating(false)

    if (error) {
      alert('Error: ' + error.message)
    } else {
      navigate(docType === 'markdown' ? `/editor/md/${data.id}` : `/editor/tex/${data.id}`)
    }
  }

  const handleAddDoc = async (docType: DocType) => {
    const name = await openAddFilePrompt(docType)
    if (name) await createDoc({ docType, title: name })
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (evt) => {
      const content = evt.target?.result as string
      if (typeof content !== 'string') return
      const docType = file.name.toLowerCase().endsWith('.tex') ? 'latex' : 'markdown'
      const title = file.name.replace(/\.[^/.]+$/, '').trim()
      await createDoc({ docType, title, content })
    }
    reader.readAsText(file, 'utf-8')
    e.target.value = ''
  }

  const renameDoc = async (doc: DocumentRow) => {
    const newName = window.prompt('New name:', doc.title)
    if (!newName?.trim()) return
    const now = new Date().toISOString()
    const { error } = await supabase.from('documents').update({ title: newName.trim(), updated_at: now }).eq('id', doc.id)
    if (error) alert(error.message)
    else {
      setDocs(prev => prev.map(d => d.id === doc.id ? { ...d, title: newName.trim(), updated_at: now } : d))
    }
    setMenuOpenId(null)
  }

  const deleteDoc = async (doc: DocumentRow) => {
    if (!window.confirm(`Delete "${doc.title}"?`)) return
    const { error } = await supabase.from('documents').delete().eq('id', doc.id)
    if (error) alert(error.message)
    else setDocs(prev => prev.filter(d => d.id !== doc.id))
    setMenuOpenId(null)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    navigate('/')
  }

  // --- Render 區 ---
  if (!user) return <div className="h-screen flex items-center justify-center bg-surface-base text-content-secondary">Please login...</div>

  return (
    <AppLayout user={user} onLogout={handleLogout}>
      <div className="max-w-5xl mx-auto w-full" onClick={() => setMenuOpenId(null)}>
        
        {/* Page Header */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-content-primary tracking-tight">My Projects</h1>
            <p className="text-content-secondary mt-1">
              Manage your documents ({docs.length} / {MAX_DOCS})
            </p>
          </div>
          
          <div className="flex gap-2">
            <input ref={fileInputRef} type="file" accept=".md,.tex,.txt" className="hidden" onChange={handleFileInputChange} />
            <Button 
              variant="outline" 
              onClick={() => fileInputRef.current?.click()} 
              disabled={!canCreateMore || creating}
            >
              Import
            </Button>
            
            <div className={`relative ${canCreateMore ? 'group' : ''}`}>
              <Button 
                disabled={!canCreateMore || creating}
                className="pl-3 pr-4 gap-1"
              >
                <IconPlus /> Create New
              </Button>
              {/* Simple CSS Hover Dropdown for Create */}
              {canCreateMore && (
                <div className="absolute right-0 mt-1 w-40 py-1 bg-surface-panel border border-border-base rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all transform origin-top-right z-20">
                  <button onClick={() => handleAddDoc('markdown')} className="w-full text-left px-4 py-2 text-sm hover:bg-surface-elevated text-content-primary">Markdown</button>
                  <button onClick={() => handleAddDoc('latex')} className="w-full text-left px-4 py-2 text-sm hover:bg-surface-elevated text-content-primary">LaTeX</button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content Grid */}
        {loading ? (
          <div className="text-center py-20 text-content-muted">Loading projects...</div>
        ) : docs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 border border-dashed border-border-base rounded-2xl bg-surface-layer/50">
            <div className="w-12 h-12 rounded-full bg-surface-elevated flex items-center justify-center mb-4 text-content-muted">
              <IconFile />
            </div>
            <h3 className="text-lg font-medium text-content-primary">No documents yet</h3>
            <p className="text-content-secondary text-sm mt-1">Create your first project to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {docs.map((doc) => (
              <Card 
                key={doc.id} 
                className="group relative hover:border-brand-muted hover:shadow-md transition-all cursor-pointer overflow-visible"
                onClick={() => openDoc(doc)}
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="p-2 rounded-lg bg-surface-elevated text-brand-DEFAULT mb-3">
                       <IconFile />
                    </div>
                    {/* Context Menu Button */}
                    <div className="relative" onClick={e => e.stopPropagation()}>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuOpenId(menuOpenId === doc.id ? null : doc.id);
                        }}
                        className="p-1 rounded-md text-content-muted hover:text-content-primary hover:bg-surface-elevated transition-colors"
                      >
                        <IconDots />
                      </button>
                      {/* Context Menu Dropdown */}
                      {menuOpenId === doc.id && (
                        <div className="absolute right-0 mt-1 w-32 py-1 bg-surface-panel border border-border-base rounded-lg shadow-xl z-30 animate-in fade-in zoom-in-95 duration-100">
                          <button 
                            onClick={(e) => { e.stopPropagation(); renameDoc(doc); }}
                            className="w-full text-left px-3 py-2 text-xs hover:bg-surface-elevated text-content-primary"
                          >
                            Rename
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); deleteDoc(doc); }}
                            className="w-full text-left px-3 py-2 text-xs hover:bg-status-error/10 text-status-error"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <CardTitle className="truncate pr-2" title={doc.title}>
                    {doc.title}
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="pb-4">
                  <p className="text-xs text-content-muted line-clamp-2 h-8">
                    {doc.content.slice(0, 100)}...
                  </p>
                </CardContent>
                
                <CardFooter className="pt-0 flex items-center justify-between">
                  <Badge variant={doc.doc_type === 'markdown' ? 'default' : 'secondary'}>
                    {doc.doc_type === 'markdown' ? 'MD' : 'TeX'}
                  </Badge>
                  <span className="text-[10px] text-content-muted">
                    {new Date(doc.updated_at).toLocaleDateString()}
                  </span>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
