import { useEffect, useMemo, useState } from 'react'
import { Dashboard } from './screens/Dashboard'
import { BudgetSetup } from './screens/BudgetSetup'
import { History } from './screens/History'
import { Settings } from './screens/Settings'
import { ExpenseSheet } from './components/ExpenseSheet'
import { NewMonthSheet } from './components/NewMonthSheet'
import { MonthSwitcher } from './components/MonthSwitcher'
import { Icon, Notice, ToastProvider, btn, type IconName } from './components/ui'
import { useStore } from './lib/store'
import { useMonthData } from './lib/hooks'
import { monthOf } from './lib/format'
import type { Expense } from './lib/types'

type Screen = 'home' | 'history' | 'budget' | 'settings'
const NAV: { id: Screen; label: string; icon: IconName }[] = [
  { id: 'home', label: 'Home', icon: 'home' },
  { id: 'history', label: 'History', icon: 'list' },
  { id: 'budget', label: 'Budget', icon: 'pie' },
  { id: 'settings', label: 'Settings', icon: 'settings' },
]
const TITLES: Record<Screen, string> = { home: 'Home', history: 'History', budget: 'Budget', settings: 'Settings' }

type Sheet =
  | { kind: 'expense'; editing?: Expense; presetCategoryId?: string }
  | { kind: 'month' }
  | null

function Shell() {
  const { data, saveFailed } = useStore()
  const [screen, setScreen] = useState<Screen>('home')
  const [month, setMonth] = useState(monthOf())
  const [sheet, setSheet] = useState<Sheet>(null)
  const [lastCategoryId, setLastCategoryId] = useState<string>()
  const { budget, categories } = useMonthData(month)

  // Months you can switch between: every month that has a budget, plus the current one.
  const months = useMemo(() => [...new Set([...data.budgets.map(b => b.month), monthOf(), month])].sort(), [data.budgets, month])

  // Theme: light, dark or follow the device.
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = () => {
      const dark = data.settings.theme === 'dark' || (data.settings.theme === 'system' && mq.matches)
      document.documentElement.classList.toggle('dark', dark)
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#0D1017' : '#3347E0')
    }
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [data.settings.theme])

  const canAdd = !!budget
  const openAdd = (presetCategoryId?: string) => canAdd && setSheet({ kind: 'expense', presetCategoryId: presetCategoryId ?? lastCategoryId })

  // Keyboard shortcut for laptops: press N to add an expense.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (e.key.toLowerCase() !== 'n' || e.metaKey || e.ctrlKey || e.altKey || sheet) return
      if (t.closest('input, textarea, select, [contenteditable]')) return
      if (canAdd) { e.preventDefault(); openAdd() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const showMonthSwitcher = screen !== 'settings'

  return (
    <div className="min-h-dvh">
      {/* Sidebar (laptop) */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-line bg-surface p-5 lg:flex">
        <div className="mb-8 flex items-center gap-3 px-1">
          <img src="./favicon.svg" alt="" className="h-9 w-9" />
          <span className="text-lg font-bold">Budget</span>
        </div>
        <button onClick={() => openAdd()} disabled={!canAdd} className={`${btn.primary} mb-6 w-full`}>
          <Icon name="plus" /> Add expense
          <kbd className="ml-auto rounded bg-accent-ink/20 px-1.5 text-xs font-semibold">N</kbd>
        </button>
        <nav className="flex flex-col gap-1" aria-label="Main">
          {NAV.map(n => (
            <button key={n.id} onClick={() => setScreen(n.id)} aria-current={screen === n.id ? 'page' : undefined}
              className={`flex items-center gap-3 rounded-xl px-3 py-3 font-semibold transition ${screen === n.id ? 'bg-accent/10 text-accent' : 'text-muted hover:bg-track hover:text-ink'}`}>
              <Icon name={n.icon} /> {n.label}
            </button>
          ))}
        </nav>
      </aside>

      <main className="pb-40 pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] pt-[env(safe-area-inset-top)] lg:pb-12 lg:pl-64">
        <div className="mx-auto max-w-5xl px-4 pt-4 lg:px-10 lg:pt-8">
          <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">{TITLES[screen]}</h1>
            {showMonthSwitcher && <MonthSwitcher month={month} months={months} onChange={setMonth} />}
          </header>

          {saveFailed && (
            <div className="mb-4">
              <Notice tone="bad">This browser is not letting the app save data (private browsing or full storage). Changes will be lost when you close the tab. Export a backup from Settings.</Notice>
            </div>
          )}

          {screen === 'home' && <Dashboard month={month} onAdd={openAdd} onStartMonth={() => setSheet({ kind: 'month' })} onGoBudget={() => setScreen('budget')} />}
          {screen === 'history' && <History month={month} onEdit={e => setSheet({ kind: 'expense', editing: e })} onStartMonth={() => setSheet({ kind: 'month' })} />}
          {screen === 'budget' && <BudgetSetup month={month} onStartMonth={() => setSheet({ kind: 'month' })} />}
          {screen === 'settings' && <Settings />}
        </div>
      </main>

      {/* Bottom-anchored primary action + tab bar (phone) */}
      {canAdd && screen !== 'settings' && !sheet && (
        <button onClick={() => openAdd()} className={`${btn.primary} fixed right-4 z-30 gap-2 rounded-full px-6 py-4 text-base shadow-lg shadow-accent/30 lg:hidden bottom-[calc(4.5rem+env(safe-area-inset-bottom))]`}>
          <Icon name="plus" /> Add expense
        </button>
      )}
      <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-20 flex border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden">
        {NAV.map(n => (
          <button key={n.id} onClick={() => setScreen(n.id)} aria-current={screen === n.id ? 'page' : undefined}
            className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs font-semibold ${screen === n.id ? 'text-accent' : 'text-muted'}`}>
            <Icon name={n.icon} /> {n.label}
          </button>
        ))}
      </nav>

      {sheet?.kind === 'expense' && (
        <ExpenseSheet
          key={sheet.editing?.id ?? 'new'}
          month={month}
          categories={categories}
          editing={sheet.editing}
          presetCategoryId={sheet.presetCategoryId}
          onCategoryUsed={setLastCategoryId}
          onClose={() => setSheet(null)}
        />
      )}
      {sheet?.kind === 'month' && (
        <NewMonthSheet
          initialMonth={budget ? '' : month}
          onClose={() => setSheet(null)}
          onCreated={(m, copied) => { setMonth(m); setScreen(copied ? 'home' : 'budget') }}
        />
      )}
    </div>
  )
}

export default function App() {
  return (
    <ToastProvider>
      <Shell />
    </ToastProvider>
  )
}
