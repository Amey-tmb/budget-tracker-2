import { useMemo, useState } from 'react'
import { btn, field } from '../components/ui'
import { useStore } from '../lib/store'
import { useMonthData } from '../lib/hooks'
import { dateLabel, formatMoney, monthLabel, round2 } from '../lib/format'
import type { Expense } from '../lib/types'

export function History({ month, onEdit, onStartMonth }: { month: string; onEdit: (e: Expense) => void; onStartMonth: () => void }) {
  const { data } = useStore()
  const cur = data.settings.currency
  const { budget, categories, expenses } = useMonthData(month)
  const [filter, setFilter] = useState<string>('all')
  const [query, setQuery] = useState('')
  const activeFilter = filter === 'all' || categories.some(c => c.id === filter) ? filter : 'all'

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    const amountQ = q.replace(/,/g, '')
    return expenses
      .filter(e => activeFilter === 'all' || e.categoryId === activeFilter)
      .filter(e => !q || e.note.toLowerCase().includes(q) || (categories.find(c => c.id === e.categoryId)?.name.toLowerCase().includes(q) ?? false) || String(e.amount).includes(amountQ))
      .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
  }, [expenses, categories, activeFilter, query])
  const groups = useMemo(() => {
    const map = new Map<string, Expense[]>()
    rows.forEach(e => map.set(e.date, [...(map.get(e.date) ?? []), e]))
    return [...map.entries()]
  }, [rows])
  const total = round2(rows.reduce((s, e) => s + e.amount, 0))
  const catById = (id: string) => categories.find(c => c.id === id)

  if (!budget) {
    return (
      <div className="mx-auto mt-10 max-w-md rounded-3xl border border-line bg-surface p-8 text-center">
        <h2 className="text-xl font-bold">No budget for {monthLabel(month)}</h2>
        <p className="mt-2 text-muted">There are no expenses to show yet.</p>
        <button onClick={onStartMonth} className={`${btn.primary} mt-6 w-full`}>Set up {monthLabel(month)}</button>
      </div>
    )
  }

  const chip = (on: boolean) => `shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition ${on ? 'border-accent bg-accent text-accent-ink' : 'border-line bg-surface hover:bg-track'}`

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <input type="search" aria-label="Search expenses" placeholder="Search notes, categories or amounts" className={field} value={query} onChange={e => setQuery(e.target.value)} />
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-wrap lg:px-0" role="group" aria-label="Filter by category">
        <button className={chip(activeFilter === 'all')} aria-pressed={activeFilter === 'all'} onClick={() => setFilter('all')}>All categories</button>
        {categories.map(c => (
          <button key={c.id} className={chip(activeFilter === c.id)} aria-pressed={activeFilter === c.id} onClick={() => setFilter(c.id)}>{c.name}</button>
        ))}
      </div>

      <p className="num text-sm text-muted">
        {rows.length} expense{rows.length === 1 ? '' : 's'} totalling <span className="font-semibold text-ink">{formatMoney(total, cur)}</span>
      </p>

      {rows.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-line p-10 text-center">
          <p className="font-semibold">No expenses here</p>
          <p className="mt-1 text-muted">{activeFilter === 'all' ? `Nothing logged in ${monthLabel(month)} yet.` : 'Nothing logged in this category yet.'}{query.trim() && ' Try a different search.'}</p>
        </div>
      ) : (
        groups.map(([date, list]) => (
          <section key={date} aria-label={dateLabel(date)}>
            <h3 className="mb-2 flex justify-between px-1 text-sm font-semibold text-muted">
              <span>{dateLabel(date)}</span>
              <span className="num">{formatMoney(round2(list.reduce((s, e) => s + e.amount, 0)), cur)}</span>
            </h3>
            <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
              {list.map(e => {
                const c = catById(e.categoryId)
                return (
                  <li key={e.id}>
                    <button onClick={() => onEdit(e)} className="flex w-full items-center gap-3 px-4 py-3.5 text-left hover:bg-track" aria-label={`Edit ${e.note || c?.name} ${formatMoney(e.amount, cur)}`}>
                      <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: c?.color }} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold">{e.note || c?.name}</span>
                        {e.note && <span className="block truncate text-sm text-muted">{c?.name}</span>}
                      </span>
                      <span className="num font-bold">{formatMoney(e.amount, cur)}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>
        ))
      )}
    </div>
  )
}
