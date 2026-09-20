import { Icon } from './ui'
import { monthLabel } from '../lib/format'

export function MonthSwitcher({ month, months, onChange }: { month: string; months: string[]; onChange: (m: string) => void }) {
  const i = months.indexOf(month)
  const prev = i > 0 ? months[i - 1] : null
  const next = i >= 0 && i < months.length - 1 ? months[i + 1] : null
  const arrow = 'rounded-full p-2 text-muted hover:bg-track hover:text-ink disabled:opacity-30 disabled:hover:bg-transparent'
  return (
    <div className="flex items-center gap-1">
      <button className={arrow} disabled={!prev} onClick={() => prev && onChange(prev)} aria-label="Previous month">
        <Icon name="left" />
      </button>
      <label className="relative">
        <span className="sr-only">Choose month</span>
        <select
          value={month}
          onChange={e => onChange(e.target.value)}
          className="cursor-pointer appearance-none rounded-xl bg-transparent px-2 py-1.5 text-center text-base font-semibold hover:bg-track"
        >
          {months.map(m => <option key={m} value={m}>{monthLabel(m)}</option>)}
        </select>
      </label>
      <button className={arrow} disabled={!next} onClick={() => next && onChange(next)} aria-label="Next month">
        <Icon name="right" />
      </button>
    </div>
  )
}
