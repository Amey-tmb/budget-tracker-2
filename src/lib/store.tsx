import { createContext, useContext, useEffect, useMemo, useReducer, useState, type ReactNode } from 'react'
import type { AppData, Budget, Category, Expense, Settings } from './types'
import { loadData, saveData } from './storage'
import { round2 } from './format'

type CategoryPatch = Partial<Pick<Category, 'name' | 'allocatedAmount' | 'color'>>
type ExpensePatch = Partial<Pick<Expense, 'amount' | 'categoryId' | 'note' | 'date'>>

export type Action =
  | { type: 'createBudget'; budget: Budget; categories: Category[] }
  | { type: 'deleteBudget'; budgetId: string }
  | { type: 'setTotal'; budgetId: string; total: number }
  | { type: 'addCategory'; category: Category }
  | { type: 'updateCategory'; id: string; patch: CategoryPatch }
  | { type: 'deleteCategory'; id: string; expenses: 'delete' | { reassignTo: string } }
  | { type: 'addExpense'; expense: Expense }
  | { type: 'updateExpense'; id: string; patch: ExpensePatch }
  | { type: 'deleteExpense'; id: string }
  | { type: 'setSettings'; patch: Partial<Settings> }
  | { type: 'replaceAll'; data: AppData }
  | { type: 'restore'; budgets?: Budget[]; categories?: Category[]; expenses?: Expense[] }

function reducer(s: AppData, a: Action): AppData {
  switch (a.type) {
    case 'createBudget':
      return { ...s, budgets: [...s.budgets, a.budget], categories: [...s.categories, ...a.categories] }
    case 'deleteBudget': {
      const catIds = new Set(s.categories.filter(c => c.budgetId === a.budgetId).map(c => c.id))
      return {
        ...s,
        budgets: s.budgets.filter(b => b.id !== a.budgetId),
        categories: s.categories.filter(c => c.budgetId !== a.budgetId),
        expenses: s.expenses.filter(e => !catIds.has(e.categoryId)),
      }
    }
    case 'setTotal':
      return { ...s, budgets: s.budgets.map(b => (b.id === a.budgetId ? { ...b, totalAmount: round2(a.total) } : b)) }
    case 'addCategory':
      return { ...s, categories: [...s.categories, a.category] }
    case 'updateCategory':
      return { ...s, categories: s.categories.map(c => (c.id === a.id ? { ...c, ...a.patch } : c)) }
    case 'deleteCategory': {
      const categories = s.categories.filter(c => c.id !== a.id)
      const expenses =
        a.expenses === 'delete'
          ? s.expenses.filter(e => e.categoryId !== a.id)
          : s.expenses.map(e => (e.categoryId === a.id ? { ...e, categoryId: (a.expenses as { reassignTo: string }).reassignTo } : e))
      return { ...s, categories, expenses }
    }
    case 'addExpense':
      return { ...s, expenses: [...s.expenses, a.expense] }
    case 'updateExpense':
      return { ...s, expenses: s.expenses.map(e => (e.id === a.id ? { ...e, ...a.patch } : e)) }
    case 'deleteExpense':
      return { ...s, expenses: s.expenses.filter(e => e.id !== a.id) }
    case 'setSettings':
      return { ...s, settings: { ...s.settings, ...a.patch } }
    case 'replaceAll':
      return a.data
    case 'restore': {
      // Put back records removed by an undoable delete (upsert by id).
      const upsert = <T extends { id: string }>(list: T[], add?: T[]) => {
        if (!add?.length) return list
        const ids = new Set(add.map(x => x.id))
        return [...list.filter(x => !ids.has(x.id)), ...add]
      }
      return { ...s, budgets: upsert(s.budgets, a.budgets), categories: upsert(s.categories, a.categories), expenses: upsert(s.expenses, a.expenses) }
    }
  }
}

interface Ctx { data: AppData; dispatch: (a: Action) => void; saveFailed: boolean }
const StoreContext = createContext<Ctx | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, dispatch] = useReducer(reducer, undefined, loadData)
  const [saveFailed, setSaveFailed] = useState(false)

  // Autosave on every change.
  useEffect(() => { setSaveFailed(!saveData(data)) }, [data])

  // Ask the browser not to evict our storage under pressure (best effort).
  useEffect(() => { navigator.storage?.persist?.().catch(() => {}) }, [])

  const value = useMemo(() => ({ data, dispatch, saveFailed }), [data, saveFailed])
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): Ctx {
  const c = useContext(StoreContext)
  if (!c) throw new Error('useStore must be used inside StoreProvider')
  return c
}
