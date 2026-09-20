import type { Budget, Category, Expense, Status } from './types'
import { round2 } from './format'

/** remaining is ALWAYS derived from expense records, never stored. */
export interface CategoryStats { allocated: number; spent: number; remaining: number; pct: number; status: Status }

export function statusFor(allocated: number, spent: number): Status {
  if (spent > allocated) return 'bad'
  if (allocated > 0 && spent / allocated >= 0.75) return 'warn'
  return 'ok'
}

export function categoryStats(cat: Category, expenses: Expense[]): CategoryStats {
  const spent = round2(expenses.filter(e => e.categoryId === cat.id).reduce((s, e) => s + e.amount, 0))
  const allocated = cat.allocatedAmount
  const pct = allocated > 0 ? (spent / allocated) * 100 : spent > 0 ? 100 : 0
  return { allocated, spent, remaining: round2(allocated - spent), pct, status: statusFor(allocated, spent) }
}

export interface BudgetTotals {
  total: number; allocated: number; unallocated: number; spent: number; remaining: number; pct: number; status: Status
}
export function budgetTotals(budget: Budget, cats: Category[], expenses: Expense[]): BudgetTotals {
  const ids = new Set(cats.map(c => c.id))
  const spent = round2(expenses.filter(e => ids.has(e.categoryId)).reduce((s, e) => s + e.amount, 0))
  const allocated = round2(cats.reduce((s, c) => s + c.allocatedAmount, 0))
  const total = budget.totalAmount
  return {
    total, allocated, unallocated: round2(total - allocated), spent, remaining: round2(total - spent),
    pct: total > 0 ? (spent / total) * 100 : spent > 0 ? 100 : 0, status: statusFor(total, spent),
  }
}
