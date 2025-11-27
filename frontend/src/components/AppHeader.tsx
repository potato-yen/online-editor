// frontend/src/components/AppHeader.tsx
import { useNavigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import type { Mode, SaveStatus } from '../types'
import { Button } from './ui/Button'
import { Badge } from './ui/Badge'

type Props = {
  mode: Mode
  isCompiling: boolean
  saveStatus?: SaveStatus
  onCompileLatex: () => void
  onExportSource: () => void
  onExportPDF: () => void
  onManualSave?: () => void
  onSetMode?: (m: Mode) => void
  toolbarUI?: ReactNode
  settingsMenu?: ReactNode
}

export default function AppHeader({
  mode,
  isCompiling,
  saveStatus = 'idle',
  onCompileLatex,
  onExportSource,
  onExportPDF,
  onManualSave,
  toolbarUI,
  settingsMenu,
}: Props) {
  const navigate = useNavigate()

  let saveText = ''
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let saveVariant: 'default' | 'success' | 'warning' | 'outline' = 'outline'
  
  if (saveStatus === 'saving') { saveText = 'Saving...'; saveVariant = 'warning'; }
  else if (saveStatus === 'saved') { saveText = 'Saved'; saveVariant = 'success'; }
  else if (saveStatus === 'error') { saveText = 'Failed'; saveVariant = 'default'; }

  const modeLabel = mode === 'markdown' ? 'Markdown' : 'LaTeX'

  return (
    <header className="border-b border-border-base bg-surface-layer/80 backdrop-blur-md sticky top-0 z-40">
      <div className="flex items-center justify-between px-4 h-14">
        {/* Left */}
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/projects')}
            className="text-content-secondary hover:text-content-primary"
            title="Back to Projects"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </Button>
          
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="uppercase tracking-wider font-bold text-[10px]">
              {modeLabel}
            </Badge>
            {saveText && (
               <span className="text-xs text-content-muted animate-pulse">
                 {saveText}
               </span>
            )}
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onManualSave}
            disabled={saveStatus === 'saving'}
          >
            Save
          </Button>

          {mode === 'latex' && (
            <Button
              variant="primary"
              size="sm"
              onClick={onCompileLatex}
              disabled={isCompiling}
              isLoading={isCompiling}
            >
              {isCompiling ? 'Compiling' : 'Preview PDF'}
            </Button>
          )}

          <div className="h-4 w-px bg-border-base mx-1" />

          <Button variant="ghost" size="sm" onClick={onExportSource}>
            Export .{mode === 'markdown' ? 'md' : 'tex'}
          </Button>

          {mode === 'markdown' && (
            <Button variant="ghost" size="sm" onClick={onExportPDF}>
              Export PDF
            </Button>
          )}

          {settingsMenu && <div className="ml-1">{settingsMenu}</div>}
        </div>
      </div>

      {/* Toolbar Area */}
      {toolbarUI && (
        // (FIX 2) 關鍵修正：
        // 1. flex-wrap: 允許按鈕換行
        // 2. overflow-visible: 允許 Dropdown 彈出視窗超出此容器
        // 3. min-h-[40px]: 確保高度足夠
        <div className="px-4 py-2 border-t border-border-subtle bg-surface-base/50 flex items-center gap-2 flex-wrap overflow-visible min-h-[40px]">
          {toolbarUI}
        </div>
      )}
    </header>
  )
}
