import { useState } from 'react'
import { Icon, Notice, NumField, btn, field, useToast } from '../components/ui'
import { DeleteCategorySheet } from '../components/DeleteCategorySheet'
import { useStore } from '../lib/store'
import { useMonthData } from '../lib/hooks'
import { CATEGORY_COLORS, formatMoney, monthLabel, uid } from '../lib/format'
import type { Category } from '../lib/types'

export function BudgetSetup({ month, onStartMonth }: { month: string; onStartMonth: () => void }) {
  const { data, dispatch } = useStore()
  const notify = useToast()
  const cur = data.settings.currency
  const { budget, categories, expenses, totals } = useMonthData(month)
  const [newName, setNewName] = useState('')
  const [newAmt, setNewAmt] = useState(0)
  const [deleting, setDeleting] = useState<Category | null>(null)
  const [confirmMonthDelete, setConfirmMonthDelete] = useState(false)
  const m = (n: number) => formatMoney(n, cur)

  if (!budget || !totals) {
    return (
      <div className="mx-auto mt-10 max-w-md rounded-3xl border border-line bg-surface p-8 text-center">
        <h2 className="text-xl font-bold">No budget for {monthLabel(month)}</h2>
        <p className="mt-2 text-muted">Start this month to set a total and add categories.</p>
        <button onClick={onStartMonth} className={`${btn.primary} mt-6 w-full`}>Set up {monthLabel(month)}</button>
      </div>
    )
  }

  const addCategory = () => {
    const name = newName.trim()
    if (!name) return
    dispatch({
      type: 'addCategory',
      category: { id: uid(), budgetId: budget.id, name, allocatedAmount: newAmt, color: CATEGORY_COLORS[categories.length % CATEGORY_COLORS.length] },
    })
    setNewName(''); setNewAmt(0)
  }

  const askDelete = (c: Category) => setDeleting(c)
  const expenseCountFor = (id: string) => data.expenses.filter(e => e.categoryId === id).length

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
      <div className="space-y-6">
        <section className="rounded-3xl border border-line bg-surface p-5">
          <label htmlFor="total" className="text-sm font-medium text-muted">Total budget for {monthLabel(month)}</label>
          <div className="mt-2 flex items-center gap-2 rounded-2xl border border-line bg-bg px-4 py-3 focus-within:border-accent">
            <span className="text-2xl font-semibold text-muted">{cur}</span>
            <NumField id="total" value={budget.totalAmount} onChange={n => dispatch({ type: 'setTotal', budgetId: budget.id, total: n })} placeholder="30,000" className="num w-full bg-transparent text-3xl font-bold outline-none placeholder:text-muted/40" />
          </div>
        </section>

        <section className="rounded-3xl border border-line bg-surface p-5">
          <h2 className="text-lg font-bold">Categories</h2>
          <p className="text-sm text-muted">Changes save as you type.</p>

          {categories.length === 0 && <p className="mt-4 rounded-xl bg-bg p-4 text-sm text-muted">Add your first category below, for example Rent, Food or Transport.</p>}

          <ul className="mt-4 space-y-3">
            {categories.map(c => (
              <li key={c.id} className="flex items-center gap-2">
                <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: c.color }} />
                <input
                  aria-label={`Name of ${c.name}`}
                  className={`${field} min-w-0 flex-1`}
                  value={c.name}
                  onChange={e => dispatch({ type: 'updateCategory', id: c.id, patch: { name: e.target.value } })}
                  onBlur={e => { if (!e.target.value.trim()) dispatch({ type: 'updateCategory', id: c.id, patch: { name: 'Untitled' } }) }}
                />
                <div className="flex w-32 shrink-0 items-center gap-1 rounded-xl border border-line bg-surface px-3 focus-within:border-accent sm:w-40">
                  <span className="text-muted">{cur}</span>
                  <NumField aria-label={`Allocation for ${c.name}`} value={c.allocatedAmount} onChange={n => dispatch({ type: 'updateCategory', id: c.id, patch: { allocatedAmount: n } })} placeholder="0" className="num w-full bg-transparent py-3 text-right font-semibold outline-none" />
                </div>
                <button onClick={() => askDelete(c)} className="rounded-xl p-3 text-muted hover:bg-bad/10 hover:text-bad" aria-label={`Delete ${c.name}`}>
                  <Icon name="trash" />
                </button>
              </li>
            ))}
          </ul>

          <form onSubmit={e => { e.preventDefault(); addCategory() }} className="mt-5 flex items-center gap-2 border-t border-line pt-5">
            <input aria-label="New category name" className={`${field} min-w-0 flex-1`} placeholder="New category" value={newName} onChange={e => setNewName(e.target.value)} maxLength={40} />
            <div className="flex w-32 shrink-0 items-center gap-1 rounded-xl border border-line bg-surface px-3 focus-within:border-accent sm:w-40">
              <span className="text-muted">{cur}</span>
              <NumField aria-label="New category amount" value={newAmt} onChange={setNewAmt} placeholder="0" className="num w-full bg-transparent py-3 text-right font-semibold outline-none" />
            </div>
            <button type="submit" disabled={!newName.trim()} className={`${btn.primary} shrink-0 px-4`} aria-label="Add category"><Icon name="plus" /></button>
          </form>
        </section>
      </div>

      <aside className="space-y-4 lg:sticky lg:top-6">
        <section className="rounded-3xl border border-line bg-surface p-5">
          <dl className="space-y-3">
            <div className="flex justify-between"><dt className="text-muted">Total budget</dt><dd className="num font-semibold">{m(totals.total)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Allocated</dt><dd className="num font-semibold">{m(totals.allocated)}</dd></div>
            <div className="flex justify-between border-t border-line pt-3 text-lg">
              <dt className="font-semibold">Unallocated</dt>
              <dd className={`num font-bold ${totals.unallocated < 0 ? 'text-bad' : totals.unallocated === 0 ? 'text-ok' : ''}`}>{m(totals.unallocated)}</dd>
            </div>
          </dl>
        </section>
        {totals.unallocated < 0 && <Notice tone="bad">Allocations exceed your total by {m(-totals.unallocated)}. Lower a category or raise the total.</Notice>}
        <button onClick={onStartMonth} className={`${btn.secondary} w-full`}><Icon name="calendar" /> Start a new month</button>
        {confirmMonthDelete ? (
          <div className="rounded-2xl border border-bad/40 p-4">
            <p className="text-sm font-medium">Delete {monthLabel(month)} with its {categories.length} categories and every expense in them?</p>
            <div className="mt-3 flex gap-2">
              <button onClick={() => setConfirmMonthDelete(false)} className={`${btn.secondary} flex-1 py-2`}>Keep</button>
              <button onClick={() => {
                dispatch({ type: 'deleteBudget', budgetId: budget.id })
                notify(`Deleted ${monthLabel(month)}`, { label: 'Undo', onClick: () => dispatch({ type: 'restore', budgets: [budget], categories, expenses }) })
              }} className={`${btn.danger} flex-1 py-2`}>Delete</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setConfirmMonthDelete(true)} className={`${btn.ghost} w-full text-bad hover:text-bad`}>Delete this month</button>
        )}
      </aside>

      {deleting && (
        <DeleteCategorySheet
          category={deleting}
          siblings={categories.filter(c => c.id !== deleting.id)}
          expenseCount={expenseCountFor(deleting.id)}
          onClose={() => setDeleting(null)}
        />
      )}
    </div>
  )
}
