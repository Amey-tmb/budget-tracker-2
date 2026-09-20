import { useMemo, useState } from 'react'
import { Modal, NumField, btn, field, useToast } from './ui'
import { useStore } from '../lib/store'
import { monthLabel, monthOf, round2, shiftMonth, uid } from '../lib/format'

export function NewMonthSheet({ initialMonth, onClose, onCreated }: { initialMonth: string; onClose: () => void; onCreated: (month: string, copied: boolean) => void }) {
  const { data, dispatch } = useStore()
  const notify = useToast()
  const taken = useMemo(() => new Set(data.budgets.map(b => b.month)), [data.budgets])

  const options = useMemo(() => {
    const now = monthOf()
    const list: string[] = []
    for (let i = -6; i <= 12; i++) { const m = shiftMonth(now, i); if (!taken.has(m)) list.push(m) }
    return list
  }, [taken])

  const [month, setMonth] = useState(() => {
    if (options.includes(initialMonth)) return initialMonth
    // Otherwise suggest the first month from now on that has no budget yet.
    return options.find(m => m >= monthOf()) ?? options[0]
  })

  // Most recent budget before the chosen month, offered as a template.
  const previous = useMemo(
    () => [...data.budgets].filter(b => b.month < month).sort((a, b) => b.month.localeCompare(a.month))[0],
    [data.budgets, month],
  )
  const [total, setTotal] = useState(() => previous?.totalAmount ?? 0)
  const [touched, setTouched] = useState(false)
  const [copy, setCopy] = useState(true)
  const doCopy = copy && !!previous

  const changeMonth = (m: string) => {
    setMonth(m)
    if (!touched) {
      const prev = [...data.budgets].filter(b => b.month < m).sort((a, b) => b.month.localeCompare(a.month))[0]
      setTotal(prev?.totalAmount ?? 0)
    }
  }

  const create = () => {
    const id = uid()
    const cats = doCopy
      ? data.categories.filter(c => c.budgetId === previous!.id).map(c => ({ ...c, id: uid(), budgetId: id }))
      : []
    dispatch({ type: 'createBudget', budget: { id, month, totalAmount: round2(total) }, categories: cats })
    notify(`${monthLabel(month)} is ready`)
    onCreated(month, doCopy)
    onClose()
  }

  if (options.length === 0) {
    return <Modal title="Start a new month" onClose={onClose}><p className="text-muted">Every month in range already has a budget.</p></Modal>
  }

  return (
    <Modal title="Start a new month" onClose={onClose}>
      <form onSubmit={e => { e.preventDefault(); create() }} className="space-y-4">
        <div>
          <label htmlFor="nm-month" className="mb-1.5 block text-sm font-medium text-muted">Month</label>
          <select id="nm-month" className={field} value={month} onChange={e => changeMonth(e.target.value)}>
            {options.map(m => <option key={m} value={m}>{monthLabel(m)}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="nm-total" className="mb-1.5 block text-sm font-medium text-muted">Total budget</label>
          <div className="flex items-center gap-2 rounded-xl border border-line bg-surface px-3.5 py-3 focus-within:border-accent">
            <span className="text-muted">{data.settings.currency}</span>
            <NumField id="nm-total" autoFocus value={total} onChange={n => { setTotal(n); setTouched(true) }} placeholder="30,000" className="num w-full bg-transparent text-lg font-semibold outline-none" />
          </div>
        </div>
        {previous && (
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line p-3">
            <input type="checkbox" className="mt-1 h-4 w-4 accent-[rgb(var(--accent))]" checked={copy} onChange={e => setCopy(e.target.checked)} />
            <span>
              <span className="block font-semibold">Copy categories from {monthLabel(previous.month)}</span>
              <span className="text-sm text-muted">Names and allocations carry over. Expenses do not.</span>
            </span>
          </label>
        )}
        <button type="submit" className={`${btn.primary} w-full py-4 text-lg`}>Start {monthLabel(month)}</button>
      </form>
    </Modal>
  )
}

