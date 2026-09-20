import { useRef, useState } from 'react'
import { Icon, Modal, Notice, btn, field, useToast } from '../components/ui'
import { useStore } from '../lib/store'
import { exportJSON, parseBackup } from '../lib/storage'
import { monthOf } from '../lib/format'
import type { AppData, ThemeMode } from '../lib/types'

const CURRENCIES = ['\u20B9', '$', '\u20AC', '\u00A3', '\u00A5']
const THEMES: { id: ThemeMode; label: string }[] = [
  { id: 'system', label: 'Match device' },
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
]

export function Settings() {
  const { data, dispatch } = useStore()
  const notify = useToast()
  const fileRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState<AppData | null>(null)

  const exportBackup = () => {
    const blob = new Blob([exportJSON(data)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `budget-backup-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a); a.click(); a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    notify('Backup downloaded')
  }

  const onFile = async (file: File | undefined) => {
    setError(null)
    if (!file) return
    try {
      setPending(parseBackup(await file.text()))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not read this file.')
    } finally {
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const seg = (on: boolean) => `flex-1 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${on ? 'bg-surface shadow-sm' : 'text-muted hover:text-ink'}`
  const card = 'rounded-3xl border border-line bg-surface p-5'

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Notice tone="warn">
        Your budget lives only in this browser. Clearing browser data or site data erases it. Export a backup regularly, and before switching devices.
      </Notice>

      <section className={card}>
        <h2 className="text-lg font-bold">Currency symbol</h2>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {CURRENCIES.map(c => (
            <button key={c} aria-pressed={data.settings.currency === c} onClick={() => dispatch({ type: 'setSettings', patch: { currency: c } })}
              className={`h-11 w-11 rounded-xl border text-lg font-semibold ${data.settings.currency === c ? 'border-accent bg-accent text-accent-ink' : 'border-line hover:bg-track'}`}>{c}</button>
          ))}
          <input aria-label="Custom currency symbol" className={`${field} !w-28`} maxLength={4} placeholder="Custom" value={CURRENCIES.includes(data.settings.currency) ? '' : data.settings.currency}
            onChange={e => dispatch({ type: 'setSettings', patch: { currency: e.target.value } })} />
        </div>
      </section>

      <section className={card}>
        <h2 className="text-lg font-bold">Appearance</h2>
        <div className="mt-3 flex gap-1 rounded-xl bg-track p-1" role="group" aria-label="Theme">
          {THEMES.map(t => (
            <button key={t.id} aria-pressed={data.settings.theme === t.id} className={seg(data.settings.theme === t.id)} onClick={() => dispatch({ type: 'setSettings', patch: { theme: t.id } })}>{t.label}</button>
          ))}
        </div>
      </section>

      <section className={card}>
        <h2 className="text-lg font-bold">Backup and restore</h2>
        <p className="mt-1 text-sm text-muted">
          {data.budgets.length} month{data.budgets.length === 1 ? '' : 's'}, {data.categories.length} categories and {data.expenses.length} expenses are stored on this device.
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <button onClick={exportBackup} className={`${btn.primary} flex-1`}><Icon name="download" /> Export backup</button>
          <button onClick={() => fileRef.current?.click()} className={`${btn.secondary} flex-1`}><Icon name="upload" /> Import backup</button>
          <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={e => onFile(e.target.files?.[0])} />
        </div>
        {error && <div className="mt-3"><Notice tone="bad">{error}</Notice></div>}
      </section>

      <p className="px-1 text-center text-xs text-muted">Current month: {monthOf()}. Works offline once loaded.</p>

      {pending && (
        <Modal title="Replace your data?" onClose={() => setPending(null)}>
          <div className="space-y-4">
            <p className="text-muted">
              This backup has {pending.budgets.length} month{pending.budgets.length === 1 ? '' : 's'}, {pending.categories.length} categories and {pending.expenses.length} expenses.
              Importing replaces everything currently in the app.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setPending(null)} className={`${btn.secondary} flex-1`}>Cancel</button>
              <button onClick={() => { dispatch({ type: 'replaceAll', data: pending }); setPending(null); notify('Backup restored') }} className={`${btn.primary} flex-1`}>Replace data</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
