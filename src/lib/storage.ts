import type { AppData, Settings } from './types'

const KEY = 'budget-tracker:v1'
export const DEFAULT_SETTINGS: Settings = { currency: '\u20B9', theme: 'system' }
export const emptyData = (): AppData => ({ version: 1, budgets: [], categories: [], expenses: [], settings: { ...DEFAULT_SETTINGS } })

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return emptyData()
    return normalize(JSON.parse(raw))
  } catch {
    return emptyData()
  }
}

/** Returns false if the browser refused the write (private mode, quota, etc.). */
export function saveData(data: AppData): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(data))
    return true
  } catch {
    return false
  }
}

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)
const isStr = (v: unknown): v is string => typeof v === 'string'

/** Validates an unknown value as AppData. Throws a readable Error when it is not usable. */
export function normalize(raw: unknown): AppData {
  if (!raw || typeof raw !== 'object') throw new Error('This file is not a Budget Tracker backup.')
  const r = raw as Record<string, unknown>
  if (!Array.isArray(r.budgets) || !Array.isArray(r.categories) || !Array.isArray(r.expenses))
    throw new Error('This file is missing budgets, categories or expenses.')

  const budgets = r.budgets.map((b: any) => {
    if (!b || !isStr(b.id) || !/^\d{4}-\d{2}$/.test(b.month) || !isNum(b.totalAmount)) throw new Error('A budget in this file is malformed.')
    return { id: b.id, month: b.month as string, totalAmount: b.totalAmount as number }
  })
  const budgetIds = new Set(budgets.map(b => b.id))
  const categories = r.categories.map((c: any) => {
    if (!c || !isStr(c.id) || !isStr(c.budgetId) || !isStr(c.name) || !isNum(c.allocatedAmount)) throw new Error('A category in this file is malformed.')
    if (!budgetIds.has(c.budgetId)) throw new Error('A category points to a budget that is not in this file.')
    return { id: c.id, budgetId: c.budgetId, name: c.name, allocatedAmount: c.allocatedAmount, color: isStr(c.color) ? c.color : undefined }
  })
  const catIds = new Set(categories.map(c => c.id))
  const expenses = r.expenses.map((e: any) => {
    if (!e || !isStr(e.id) || !isStr(e.categoryId) || !isNum(e.amount) || !/^\d{4}-\d{2}-\d{2}$/.test(e.date)) throw new Error('An expense in this file is malformed.')
    if (!catIds.has(e.categoryId)) throw new Error('An expense points to a category that is not in this file.')
    return { id: e.id, categoryId: e.categoryId, amount: e.amount, note: isStr(e.note) ? e.note : '', date: e.date, createdAt: isStr(e.createdAt) ? e.createdAt : new Date().toISOString() }
  })
  const s = (r.settings ?? {}) as Partial<Settings>
  const settings: Settings = {
    currency: isStr(s.currency) && s.currency.length <= 4 ? s.currency : DEFAULT_SETTINGS.currency,
    theme: s.theme === 'light' || s.theme === 'dark' || s.theme === 'system' ? s.theme : DEFAULT_SETTINGS.theme,
  }
  return { version: 1, budgets, categories, expenses, settings }
}

export function exportJSON(data: AppData): string {
  return JSON.stringify({ app: 'budget-tracker', exportedAt: new Date().toISOString(), ...data }, null, 2)
}

export function parseBackup(text: string): AppData {
  let parsed: unknown
  try { parsed = JSON.parse(text) } catch { throw new Error('This file is not valid JSON.') }
  return normalize(parsed)
}
