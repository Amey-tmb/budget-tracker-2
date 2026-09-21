export const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100

export function formatMoney(n: number, symbol: string): string {
  const v = round2(n)
  const s = Math.abs(v).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })
  return `${v < 0 ? '\u2212' : ''}${symbol}${s}`
}

const pad = (n: number) => String(n).padStart(2, '0')
export const monthOf = (d: Date = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`
export const todayISO = () => {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function monthLabel(m: string): string {
  const [y, mo] = m.split('-').map(Number)
  return new Date(y, mo - 1, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
}
export function shiftMonth(m: string, delta: number): string {
  const [y, mo] = m.split('-').map(Number)
  return monthOf(new Date(y, mo - 1 + delta, 1))
}
export function dateLabel(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })
}
export function lastDayOfMonth(m: string): string {
  const [y, mo] = m.split('-').map(Number)
  return `${m}-${pad(new Date(y, mo, 0).getDate())}`
}
/** Default date for a new expense: today if inside the month, otherwise the month's first day. */
export function defaultDateFor(month: string): string {
  const t = todayISO()
  return t.startsWith(month) ? t : `${month}-01`
}

export function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10)
}

export const CATEGORY_COLORS = ['#3347E0', '#12A594', '#E5484D', '#F5A524', '#8E4EC6', '#0091FF', '#D6409F', '#6E8B3D']

/** Days left in the month including today, or null when `month` is not the current month. */
export function daysLeftInMonth(month: string): number | null {
  if (month !== monthOf()) return null
  const now = new Date()
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  return last - now.getDate() + 1
}
