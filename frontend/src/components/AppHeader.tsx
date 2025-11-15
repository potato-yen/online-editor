// src/components/AppHeader.tsx
import { useNavigate } from 'react-router-dom'
import type { Mode } from '../App'

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

type Props = {
  mode: Mode
  isCompiling: boolean
  saveStatus?: SaveStatus
  onImportClick: () => void
  onCompileLatex: () => void
  onExportSource: () => void
  onExportPDF: () => void
  onManualSave?: () => void
  onSetMode?: (m: Mode) => void // 現在沒用到，但先保留
}

export default function AppHeader({
  mode,
  isCompiling,
  saveStatus = 'idle',
  onImportClick,
  onCompileLatex,
  onExportSource,
  onExportPDF,
  onManualSave,
}: Props) {
  const navigate = useNavigate()

  let saveText: string | null = null
  if (saveStatus === 'saving') saveText = 'Saving…'
  else if (saveStatus === 'saved') saveText = 'Saved'
  else if (saveStatus === 'error') saveText = 'Save failed'

  const baseBtn =
    'text-xs px-3 py-1.5 rounded-full bg-neutral-100 text-neutral-900 border border-neutral-300 hover:bg-white hover:border-neutral-100'

  const sourceLabel = mode === 'markdown' ? 'Export .md' : 'Export .tex'
  const modeLabel = mode.toUpperCase()

  return (
    <div className="relative flex items-center px-4 py-3 border-b border-neutral-800 bg-neutral-950/60 backdrop-blur-sm">
      {/* 左：返回專案列表 */}
      <button
        onClick={() => navigate('/projects')}
        className="text-neutral-400 hover:text-neutral-200 text-lg px-2"
      >
        &lt;
      </button>

      {/* 中：模式 + 儲存狀態，置中 */}
      <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center">
        <div className="text-xs text-neutral-500 uppercase tracking-wide">
          {modeLabel}
        </div>
        <div className="text-[10px] text-neutral-500 h-4">
          {saveText}
        </div>
      </div>

      {/* 右：操作按鈕列 */}
      <div className="ml-auto flex items-center gap-2">
        <button
          onClick={onManualSave}
          disabled={!onManualSave || saveStatus === 'saving'}
          className={`${baseBtn} disabled:opacity-60 disabled:cursor-not-allowed`}
        >
          Save
        </button>

        <button onClick={onImportClick} className={baseBtn}>
          Import
        </button>

        {mode === 'latex' && (
          <button
            onClick={onCompileLatex}
            disabled={isCompiling}
            className={`${baseBtn} disabled:opacity-60 disabled:cursor-not-allowed`}
          >
            {isCompiling ? 'Compiling…' : 'Compile'}
          </button>
        )}

        <button onClick={onExportSource} className={baseBtn}>
          {sourceLabel}
        </button>

        {/* ✅ 只有 Markdown 模式才顯示 Export PDF */}
        {mode === 'markdown' && (
          <button onClick={onExportPDF} className={baseBtn}>
            Export PDF
          </button>
        )}
      </div>
    </div>
  )
}