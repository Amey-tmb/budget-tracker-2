import { Icon, Notice, ProgressBar, btn, statusText } from '../components/ui'
import { useStore } from '../lib/store'
import { useMonthData } from '../lib/hooks'
import { categoryStats } from '../lib/calc'
import { daysLeftInMonth, formatMoney, monthLabel } from '../lib/format'

interface Props {
  month: string
  onAdd: (categoryId?: string) => void
  onStartMonth: () => void
  onGoBudget: () => void
}

export function Dashboard({ month, onAdd, onStartMonth, onGoBudget }: Props) {
  const { data } = useStore()
  const cur = data.settings.currency
  const { budget, categories, expenses, totals } = useMonthData(month)
  const m = (n: number) => formatMoney(n, cur)

  if (!budget || !totals) {
    return (
      <div className="mx-auto mt-10 max-w-md rounded-3xl border border-line bg-surface p-8 text-center">
        <h2 className="text-xl font-bold">No budget for {monthLabel(month)}</h2>
        <p className="mt-2 text-muted">Set a total and split it into categories. Then logging a payment takes a few taps.</p>
        <button onClick={onStartMonth} className={`${btn.primary} mt-6 w-full`}>Set up {monthLabel(month)}</button>
      </div>
    )
  }

  const over = totals.remaining < 0
  const daysLeft = daysLeftInMonth(month)
  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-line bg-surface p-5 sm:p-7">
        <p className="text-sm font-medium text-muted">{over ? 'Over budget by' : 'Left to spend'}</p>
        <p className={`num mt-1 text-5xl font-bold tracking-tight sm:text-6xl ${over ? 'text-bad' : ''}`}>{m(Math.abs(totals.remaining))}</p>
        <div className="mt-5"><ProgressBar pct={totals.pct} status={totals.status} label="Total budget used" className="h-3" /></div>
        <dl className="mt-5 grid grid-cols-3 gap-3 text-sm">
          <div><dt className="text-muted">Budget</dt><dd className="num text-base font-semibold sm:text-lg">{m(totals.total)}</dd></div>
          <div><dt className="text-muted">Spent</dt><dd className={`num text-base font-semibold sm:text-lg ${statusText[totals.status]}`}>{m(totals.spent)}</dd></div>
          <div><dt className="text-muted">Unallocated</dt><dd className={`num text-base font-semibold sm:text-lg ${totals.unallocated < 0 ? 'text-bad' : ''}`}>{m(totals.unallocated)}</dd></div>
        </dl>
        {daysLeft !== null && totals.remaining > 0 && (
          <p className="num mt-5 border-t border-line pt-4 text-sm text-muted">
            About <span className="font-semibold text-ink">{m(Math.floor(totals.remaining / daysLeft))}</span> a day for the next {daysLeft} day{daysLeft === 1 ? '' : 's'}.
          </p>
        )}
      </section>

      {totals.unallocated < 0 && (
        <Notice tone="bad">
          Your allocations add up to {m(totals.allocated)}, which is {m(-totals.unallocated)} more than your {m(totals.total)} budget.{' '}
          <button onClick={onGoBudget} className="font-bold underline">Fix allocations</button>
        </Notice>
      )}

      {categories.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-line p-8 text-center">
          <p className="font-semibold">No categories yet</p>
          <p className="mt-1 text-muted">Add categories like Food, Transport and Rent, and give each an amount.</p>
          <button onClick={onGoBudget} className={`${btn.primary} mt-4`}>Add categories</button>
        </div>
      ) : (
        <section aria-label="Categories" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {categories.map(c => {
            const st = categoryStats(c, expenses)
            return (
              <button
                key={c.id}
                onClick={() => onAdd(c.id)}
                className="group rounded-2xl border border-line bg-surface p-4 text-left transition hover:border-accent/60 active:scale-[0.99]"
                aria-label={`${c.name}: ${m(st.remaining)} remaining. Add expense.`}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="flex min-w-0 items-center gap-2 font-semibold">
                    <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: c.color }} />
                    <span className="truncate">{c.name}</span>
                  </span>
                  <Icon name="plus" className="h-5 w-5 shrink-0 text-muted group-hover:text-accent" />
                </div>
                <p className={`num mt-3 text-3xl font-bold tracking-tight ${statusText[st.status]}`}>{m(st.remaining)}</p>
                <p className="text-sm text-muted">{st.remaining < 0 ? 'over budget' : 'remaining'}</p>
                <div className="mt-3"><ProgressBar pct={st.pct} status={st.status} label={`${c.name} used`} /></div>
                <p className="num mt-2 flex justify-between text-sm text-muted">
                  <span>Spent {m(st.spent)}</span>
                  <span>of {m(st.allocated)}</span>
                </p>
              </button>
            )
          })}
        </section>
      )}
    </div>
  )
}
