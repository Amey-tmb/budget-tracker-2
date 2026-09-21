export interface Budget { id: string; month: string; totalAmount: number } // month = YYYY-MM
export interface Category { id: string; budgetId: string; name: string; allocatedAmount: number; color?: string }
export interface Expense { id: string; categoryId: string; amount: number; note: string; date: string; createdAt: string }
export type ThemeMode = 'light' | 'dark' | 'system'
export interface Settings { currency: string; theme: ThemeMode; lastBackupAt?: string }
export interface AppData {
  version: 1
  budgets: Budget[]
  categories: Category[]
  expenses: Expense[]
  settings: Settings
}
export type Status = 'ok' | 'warn' | 'bad'
