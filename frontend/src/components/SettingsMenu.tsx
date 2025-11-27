import React, { useEffect, useRef, useState } from 'react'
import { Button } from './ui/Button'
import { cn } from '../lib/utils'
import { useEditorSettings } from '../contexts/EditorSettingsContext'

type SectionKey = 'editor' | 'behavior' | 'account'

type SettingsMenuProps = {
  renderTrigger?: (params: { open: boolean; toggle: () => void }) => React.ReactNode
  placement?: 'bottom-end' | 'right'
  onModifyUsername?: () => void
  onChangePassword?: () => void
  onDeleteAccount?: () => void
}

type SettingsSectionProps = {
  id: SectionKey
  title: string
  description: string
  isOpen: boolean
  onToggle: (id: SectionKey) => void
  children: React.ReactNode
}

const fontSizeOptions = Array.from({ length: 7 }, (_, idx) => 12 + idx * 2)
const indentOptions = [
  { label: '2 spaces', value: 2 },
  { label: '4 spaces', value: 4 },
]
const autoSaveOptions: Array<{ label: string; value: number | null }> = [
  { label: '3 seconds', value: 3000 },
  { label: '10 seconds', value: 10000 },
  { label: '30 seconds', value: 30000 },
  { label: 'Off', value: null },
]

const SettingsSection = ({
  id,
  title,
  description,
  isOpen,
  onToggle,
  children,
}: SettingsSectionProps) => {
  return (
    <div className="border border-border-subtle rounded-lg bg-surface-panel/70 shadow-inner">
      <button
        type="button"
        onClick={() => onToggle(id)}
        className="w-full flex items-center justify-between px-3 py-2 text-left"
        aria-expanded={isOpen}
      >
        <div>
          <p className="text-sm font-semibold text-content-primary">{title}</p>
          <p className="text-xs text-content-muted">{description}</p>
        </div>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={cn(
            'w-4 h-4 text-content-muted transition-transform',
            isOpen && 'rotate-180'
          )}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {isOpen && (
        <div className="px-3 pb-3 pt-1 text-sm text-content-primary space-y-3">
          {children}
        </div>
      )}
    </div>
  )
}

export default function SettingsMenu({
  renderTrigger,
  placement = 'bottom-end',
  onModifyUsername,
  onChangePassword,
  onDeleteAccount,
}: SettingsMenuProps = {}) {
  const {
    fontSize,
    setFontSize,
    wordWrap,
    setWordWrap,
    indentSize,
    setIndentSize,
    autoSaveInterval,
    setAutoSaveInterval,
  } = useEditorSettings()
  const [open, setOpen] = useState(false)
  const [section, setSection] = useState<SectionKey>('editor')
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return
    const handleClick = (event: MouseEvent) => {
      if (containerRef.current?.contains(event.target as Node)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  useEffect(() => {
    if (!open) return
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open])

  const handleSectionToggle = (next: SectionKey) => {
    setSection(next)
  }

  const renderWordWrapSwitch = () => (
    <button
      type="button"
      onClick={() => setWordWrap(!wordWrap)}
      role="switch"
      aria-checked={wordWrap}
      className={cn(
        'w-12 h-6 rounded-full flex items-center px-1 transition-colors',
        wordWrap ? 'bg-brand-active' : 'bg-border-base'
      )}
    >
      <span
        className={cn(
          'bg-white w-4 h-4 rounded-full shadow transition-transform',
          wordWrap ? 'translate-x-6' : 'translate-x-0'
        )}
      />
    </button>
  )

  const autoSaveValue =
    autoSaveInterval === null ? 'off' : String(autoSaveInterval)

  return (
    <div className="relative" ref={containerRef}>
      {renderTrigger ? (
        renderTrigger({ open, toggle: () => setOpen((prev) => !prev) })
      ) : (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="gap-2 text-content-secondary hover:text-content-primary"
          onClick={() => setOpen((prev) => !prev)}
          aria-expanded={open}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            className="w-4 h-4"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.076.124l1.216-.456a1.125 1.125 0 011.37.491l1.298 2.247a1.125 1.125 0 01-.26 1.43l-1.005.828c-.293.24-.438.613-.431.992.003.084.005.168.005.253s-.002.169-.005.253c-.007.379.138.752.431.993l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.49l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.52 6.52 0 01-.22.127c-.332.184-.582.496-.644.87l-.213 1.281c-.09.542-.56.94-1.11.94h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49L4.5 15.345a1.125 1.125 0 01.26-1.43l1.004-.828c.292-.24.437-.613.43-.992A6.932 6.932 0 016.25 12c0-.085.002-.169.005-.253.007-.379-.138-.752-.43-.993l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.217.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          Settings
        </Button>
      )}

      {open && (
        <div
          className={cn(
            'absolute w-80 rounded-2xl border border-border-base bg-surface-layer shadow-2xl z-50 overflow-hidden',
            placement === 'right'
              ? 'left-full top-0 ml-3'
              : 'right-0 top-full mt-2'
          )}
        >
          <div className="px-4 py-3 border-b border-border-subtle bg-surface-base/70">
            <p className="text-xs uppercase tracking-widest text-content-muted">
              Quick Settings
            </p>
            <p className="text-sm text-content-primary">
              Customize how the editor behaves.
            </p>
          </div>

          <div className="p-4 space-y-3">
            <SettingsSection
              id="editor"
              title="Editor Preferences"
              description="Control how the editor looks and feels."
              isOpen={section === 'editor'}
              onToggle={handleSectionToggle}
            >
              <label className="flex flex-col gap-1">
                <span className="text-xs text-content-muted uppercase tracking-wide">
                  Font Size
                </span>
                <select
                  className="w-full rounded-md border border-border-subtle bg-surface-base px-2 py-1.5 text-sm"
                  value={String(fontSize)}
                  onChange={(event) => setFontSize(Number(event.target.value))}
                >
                  {fontSizeOptions.map((size) => (
                    <option key={size} value={size}>
                      {size}px
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs text-content-muted uppercase tracking-wide">
                  Indentation
                </span>
                <select
                  className="w-full rounded-md border border-border-subtle bg-surface-base px-2 py-1.5 text-sm"
                  value={String(indentSize)}
                  onChange={(event) =>
                    setIndentSize(Number(event.target.value))
                  }
                >
                  {indentOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-content-muted">
                    Word Wrap
                  </p>
                  <p className="text-sm">
                    {wordWrap ? 'Soft wrap enabled' : 'Soft wrap disabled'}
                  </p>
                </div>
                {renderWordWrapSwitch()}
              </div>
            </SettingsSection>

            <SettingsSection
              id="behavior"
              title="Behavior"
              description="Adjust auto-save and background actions."
              isOpen={section === 'behavior'}
              onToggle={handleSectionToggle}
            >
              <label className="flex flex-col gap-1">
                <span className="text-xs text-content-muted uppercase tracking-wide">
                  Auto-Save time gap
                </span>
                <select
                  className="w-full rounded-md border border-border-subtle bg-surface-base px-2 py-1.5 text-sm"
                  value={autoSaveValue}
                  onChange={(event) => {
                    const next =
                      event.target.value === 'off'
                        ? null
                        : Number(event.target.value)
                    setAutoSaveInterval(next)
                  }}
                >
                  {autoSaveOptions.map((option) => (
                    <option
                      key={option.label}
                      value={option.value === null ? 'off' : option.value}
                    >
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </SettingsSection>

            <SettingsSection
              id="account"
              title="Account"
              description="Profile and security controls."
              isOpen={section === 'account'}
              onToggle={handleSectionToggle}
            >
              <div className="space-y-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => {
                    if (onModifyUsername) onModifyUsername()
                    else window.alert('Username update is not available.')
                  }}
                >
                  Modify username
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => {
                    if (onChangePassword) onChangePassword()
                    else window.alert('Password update is not available.')
                  }}
                >
                  Change password
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => {
                    if (onDeleteAccount) onDeleteAccount()
                    else window.alert('Account deletion is not available.')
                  }}
                >
                  Delete account
                </Button>
              </div>
            </SettingsSection>
          </div>
        </div>
      )}
    </div>
  )
}
