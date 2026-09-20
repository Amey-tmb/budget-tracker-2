import { useMemo } from 'react'
import { useStore } from './store'
import { budgetTotals } from './calc'

/** Everything the screens need for one month, derived fresh from stored records. */
export function useMonthData(month: string) {
  const { data } = useStore()
  return useMemo(() => {
    const budget = data.budgets.find(b => b.month === month)
    const categories = budget ? data.categories.filter(c => c.budgetId === budget.id) : []
    const ids = new Set(categories.map(c => c.id))
    const expenses = data.expenses.filter(e => ids.has(e.categoryId))
    const totals = budget ? budgetTotals(budget, categories, expenses) : null
    return { budget, categories, expenses, totals }
  }, [data, month])
}
