import { createContext, useContext, useEffect, useRef, useState, type ReactNode, type InputHTMLAttributes } from 'react'
import type { Status } from '../lib/types'

/* ---------- Icons ---------- */
const PATHS = {
  plus: 'M12 5v14M5 12h14',
  home: 'M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10',
  list: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
  pie: 'M21.21 15.89A10 10 0 1 1 8 2.83M22 12A10 10 0 0 0 12 2v10z',
  settings: 'M20 7h-9M14 17H5M17 17a3 3 0 1 0 6 0 3 3 0 0 0-6 0zM7 7a3 3 0 1 0-6 0 3 3 0 0 0 6 0z',
  left: 'M15 18l-6-6 6-6',
  right: 'M9 18l6-6-6-6',
  trash: 'M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6',
  x: 'M18 6L6 18M6 6l12 12',
  download: 'M21 15v4H3v-4M7 10l5 5 5-5M12 15V3',
  upload: 'M21 15v4H3v-4M17 8l-5-5-5 5M12 3v12',
  alert: 'M12 9v4M12 17h.01M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z',
  check: 'M20 6L9 17l-5-5',
  calendar: 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM12 14v4M10 16h4',
} as const
export type IconName = keyof typeof PATHS

export function Icon({ name, className = 'h-5 w-5' }: { name: IconName; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d={PATHS[name]} />
    </svg>
  )
}

/* ---------- Status helpers ---------- */
export const statusText: Record<Status, string> = { ok: 'text-ok', warn: 'text-warn', bad: 'text-bad' }
export const statusBg: Record<Status, string> = { ok: 'bg-ok', warn: 'bg-warn', bad: 'bg-bad' }

export function ProgressBar({ pct, status, label, className = 'h-2.5' }: { pct: number; status: Status; label: string; className?: string }) {
  const w = Math.max(0, Math.min(100, pct))
  return (
    <div className={`w-full overflow-hidden rounded-full bg-track ${className}`} role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(w)}>
      <div className={`h-full rounded-full transition-[width] duration-300 ${statusBg[status]}`} style={{ width: `${w}%` }} />
    </div>
  )
}

/* ---------- Buttons / fields (class helpers) ---------- */
export const btn = {
  primary: 'inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 font-semibold text-accent-ink transition active:scale-[0.98] disabled:opacity-40 disabled:active:scale-100',
  secondary: 'inline-flex items-center justify-center gap-2 rounded-xl border border-line bg-surface px-4 py-3 font-semibold text-ink transition hover:bg-track active:scale-[0.98] disabled:opacity-40',
  danger: 'inline-flex items-center justify-center gap-2 rounded-xl border border-bad/40 px-4 py-3 font-semibold text-bad transition hover:bg-bad/10 active:scale-[0.98]',
  ghost: 'inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 font-medium text-muted transition hover:bg-track hover:text-ink',
}
export const field = 'w-full rounded-xl border border-line bg-surface px-3.5 py-3 text-ink placeholder:text-muted/70 focus:border-accent'

/** Numeric text field: keeps what the user typed, reports a parsed number. */
export function NumField({ value, onChange, ...rest }: { value: number; onChange: (n: number) => void } & Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'>) {
  const show = (n: number) => (n ? String(n) : '')
  const [text, setText] = useState(show(value))
  const focused = useRef(false)
  useEffect(() => { if (!focused.current) setText(show(value)) }, [value])
  return (
    <input
      {...rest}
      type="text"
      inputMode="decimal"
      autoComplete="off"
      value={text}
      onFocus={e => { focused.current = true; rest.onFocus?.(e) }}
      onBlur={e => { focused.current = false; setText(show(value)); rest.onBlur?.(e) }}
      onChange={e => {
        const t = e.target.value.replace(/,/g, '')
        if (t === '' || /^\d*\.?\d{0,2}$/.test(t)) {
          setText(t)
          onChange(t === '' || t === '.' ? 0 : parseFloat(t))
        }
      }}
    />
  )
}

/* ---------- Modal (bottom sheet on phones, dialog on larger screens) ---------- */
export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 animate-fade bg-ink/40" onClick={onClose} />
      <div className="relative flex max-h-[92dvh] w-full animate-sheet flex-col rounded-t-3xl bg-surface shadow-2xl sm:max-w-md sm:rounded-3xl">
        <div className="flex items-center justify-between px-5 pb-2 pt-5">
          <h2 className="text-lg font-bold">{title}</h2>
          <button onClick={onClose} className="-mr-2 rounded-full p-2 text-muted hover:bg-track hover:text-ink" aria-label="Close">
            <Icon name="x" />
          </button>
        </div>
        <div className="overflow-y-auto px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-2">{children}</div>
      </div>
    </div>
  )
}

/* ---------- Toast ---------- */
export interface ToastAction { label: string; onClick: () => void }
const ToastContext = createContext<(msg: string, action?: ToastAction) => void>(() => {})
export const useToast = () => useContext(ToastContext)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{ msg: string; action?: ToastAction } | null>(null)
  const timer = useRef<number | undefined>(undefined)
  const notify = (msg: string, action?: ToastAction) => {
    setToast({ msg, action })
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setToast(null), action ? 7000 : 3200)
  }
  return (
    <ToastContext.Provider value={notify}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 top-[max(0.75rem,env(safe-area-inset-top))] z-[60] flex justify-center px-4">
        {toast && (
          <div className={`pointer-events-auto flex animate-sheet items-center gap-2 rounded-full bg-ink py-2.5 pl-4 text-sm font-medium text-bg shadow-lg ${toast.action ? 'pr-2' : 'pr-4'}`}>
            <Icon name="check" className="h-4 w-4 shrink-0" />
            {toast.msg}
            {toast.action && (
              <button
                onClick={() => { toast.action!.onClick(); notify('Restored') }}
                className="ml-1 rounded-full px-3 py-1 font-bold underline decoration-2 underline-offset-2 hover:bg-bg/15"
              >
                {toast.action.label}
              </button>
            )}
          </div>
        )}
      </div>
    </ToastContext.Provider>
  )
}

export function Notice({ tone, children }: { tone: 'warn' | 'bad' | 'info'; children: ReactNode }) {
  const cls = tone === 'bad' ? 'border-bad/40 bg-bad/10 text-bad' : tone === 'warn' ? 'border-warn/40 bg-warn/10 text-warn' : 'border-line bg-surface text-muted'
  return (
    <div className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm font-medium ${cls}`} role={tone === 'info' ? undefined : 'alert'}>
      <Icon name="alert" className="mt-0.5 h-5 w-5 shrink-0" />
      <div>{children}</div>
    </div>
  )
}
