import { useState } from 'react'
import { Modal, NumField, Icon, btn, field, statusText, useToast } from './ui'
import { useStore } from '../lib/store'
import { categoryStats } from '../lib/calc'
import { defaultDateFor, formatMoney, lastDayOfMonth, round2, uid } from '../lib/format'
import type { Category, Expense } from '../lib/types'

interface Props {
  month: string
  categories: Category[]
  editing?: Expense
  presetCategoryId?: string
  onClose: () => void
  onCategoryUsed: (id: string) => void
}

export function ExpenseSheet({ month, categories, editing, presetCategoryId, onClose, onCategoryUsed }: Props) {
  const { data, dispatch } = useStore()
  const notify = useToast()
  const cur = data.settings.currency

  const [amount, setAmount] = useState(editing?.amount ?? 0)
  const [categoryId, setCategoryId] = useState(editing?.categoryId ?? presetCategoryId ?? '')
  const [note, setNote] = useState(editing?.note ?? '')
  const [date, setDate] = useState(editing?.date ?? defaultDateFor(month))
  const [confirmDelete, setConfirmDelete] = useState(false)

  const selected = categories.find(c => c.id === categoryId)
  const canSave = amount > 0 && !!selected && date.startsWith(month)

  // Remaining if this expense were saved (excluding its own previous value when editing).
  let after: number | null = null
  if (selected) {
    const st = categoryStats(selected, data.expenses)
    const own = editing && editing.categoryId === selected.id ? editing.amount : 0
    after = round2(st.remaining + own - amount)
  }

  const save = () => {
    if (!canSave || !selected) return
    if (editing) {
      dispatch({ type: 'updateExpense', id: editing.id, patch: { amount: round2(amount), categoryId, note: note.trim(), date } })
      notify('Expense updated')
    } else {
      dispatch({ type: 'addExpense', expense: { id: uid(), categoryId, amount: round2(amount), note: note.trim(), date, createdAt: new Date().toISOString() } })
      notify(`Saved ${formatMoney(amount, cur)} to ${selected.name}. ${formatMoney(after ?? 0, cur)} left.`)
    }
    onCategoryUsed(categoryId)
    onClose()
  }

  const remove = () => {
    if (!editing) return
    const removed = editing
    dispatch({ type: 'deleteExpense', id: removed.id })
    notify('Expense deleted', { label: 'Undo', onClick: () => dispatch({ type: 'restore', expenses: [removed] }) })
    onClose()
  }

  return (
    <Modal title={editing ? 'Edit expense' : 'Add expense'} onClose={onClose}>
      <form onSubmit={e => { e.preventDefault(); save() }} className="space-y-5">
        <div>
          <label htmlFor="amt" className="mb-1.5 block text-sm font-medium text-muted">Amount</label>
          <div className="flex items-center gap-2 rounded-2xl border border-line bg-bg px-4 py-3 focus-within:border-accent">
            <span className="text-3xl font-semibold text-muted">{cur}</span>
            <NumField id="amt" autoFocus value={amount} onChange={setAmount} placeholder="0" className="num w-full bg-transparent text-4xl font-bold outline-none placeholder:text-muted/40" />
          </div>
        </div>

        <div>
          <span className="mb-1.5 block text-sm font-medium text-muted">Category</span>
          {categories.length === 0 ? (
            <p className="rounded-xl bg-bg p-4 text-sm text-muted">This month has no categories yet. Add some in Budget first.</p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {categories.map(c => {
                const st = categoryStats(c, data.expenses)
                const on = c.id === categoryId
                return (
                  <button
                    type="button"
                    key={c.id}
                    aria-pressed={on}
                    onClick={() => setCategoryId(c.id)}
                    className={`flex min-h-[3.5rem] flex-col items-start justify-center rounded-xl border-2 px-3 py-2 text-left transition ${on ? 'border-accent bg-accent/10' : 'border-line bg-surface hover:bg-track'}`}
                  >
                    <span className="flex w-full items-center gap-2 font-semibold">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: c.color }} />
                      <span className="truncate">{c.name}</span>
                    </span>
                    <span className={`num text-xs font-medium ${statusText[st.status]}`}>{formatMoney(st.remaining, cur)} left</span>
                  </button>
                )
              })}
            </div>
          )}
          {after !== null && amount > 0 && (
            <p className={`mt-2 text-sm font-medium ${after < 0 ? 'text-bad' : 'text-muted'}`}>
              {after < 0 ? `This puts ${selected!.name} ${formatMoney(-after, cur)} over budget.` : `${formatMoney(after, cur)} will be left in ${selected!.name}.`}
            </p>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="note" className="mb-1.5 block text-sm font-medium text-muted">Note (optional)</label>
            <input id="note" className={field} value={note} onChange={e => setNote(e.target.value)} placeholder="Lunch, bus pass..." maxLength={120} />
          </div>
          <div>
            <label htmlFor="date" className="mb-1.5 block text-sm font-medium text-muted">Date</label>
            <input id="date" type="date" className={field} value={date} min={`${month}-01`} max={lastDayOfMonth(month)} onChange={e => e.target.value && setDate(e.target.value)} />
          </div>
        </div>

        <button type="submit" disabled={!canSave} className={`${btn.primary} w-full py-4 text-lg`}>
          {editing ? 'Save changes' : 'Save expense'}
        </button>

        {editing && (
          confirmDelete ? (
            <div className="flex gap-2">
              <button type="button" onClick={() => setConfirmDelete(false)} className={`${btn.secondary} flex-1`}>Keep expense</button>
              <button type="button" onClick={remove} className={`${btn.danger} flex-1`}>Delete expense</button>
            </div>
          ) : (
            <button type="button" onClick={() => setConfirmDelete(true)} className={`${btn.ghost} w-full text-bad hover:text-bad`}>
              <Icon name="trash" className="h-4 w-4" /> Delete expense
            </button>
          )
        )}
      </form>
    </Modal>
  )
}
