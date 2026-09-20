import { useState } from 'react'
import { Modal, btn, field, useToast } from './ui'
import { useStore } from '../lib/store'
import type { Category } from '../lib/types'

export function DeleteCategorySheet({ category, siblings, expenseCount, onClose }: { category: Category; siblings: Category[]; expenseCount: number; onClose: () => void }) {
  const { dispatch } = useStore()
  const notify = useToast()
  const [mode, setMode] = useState<'reassign' | 'delete'>(siblings.length > 0 ? 'reassign' : 'delete')
  const [target, setTarget] = useState(siblings[0]?.id ?? '')

  const confirm = () => {
    dispatch({ type: 'deleteCategory', id: category.id, expenses: mode === 'reassign' ? { reassignTo: target } : 'delete' })
    notify(`Deleted ${category.name}`)
    onClose()
  }
  const n = `${expenseCount} expense${expenseCount === 1 ? '' : 's'}`

  return (
    <Modal title={`Delete ${category.name}?`} onClose={onClose}>
      <div className="space-y-4">
        {expenseCount === 0 ? (
          <p className="text-muted">This category has no expenses. Its allocation will return to Unallocated.</p>
        ) : (
          <>
            <p className="text-muted">{category.name} has {n}. Choose what happens to them.</p>
            <div className="space-y-2">
              {siblings.length > 0 && (
                <label className={`flex cursor-pointer items-start gap-3 rounded-xl border-2 p-3 ${mode === 'reassign' ? 'border-accent bg-accent/10' : 'border-line'}`}>
                  <input type="radio" name="mode" className="mt-1 accent-[rgb(var(--accent))]" checked={mode === 'reassign'} onChange={() => setMode('reassign')} />
                  <span className="flex-1">
                    <span className="block font-semibold">Move them to another category</span>
                    {mode === 'reassign' && (
                      <select className={`${field} mt-2`} value={target} onChange={e => setTarget(e.target.value)} aria-label="Move expenses to">
                        {siblings.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    )}
                  </span>
                </label>
              )}
              <label className={`flex cursor-pointer items-start gap-3 rounded-xl border-2 p-3 ${mode === 'delete' ? 'border-bad bg-bad/10' : 'border-line'}`}>
                <input type="radio" name="mode" className="mt-1 accent-[rgb(var(--bad))]" checked={mode === 'delete'} onChange={() => setMode('delete')} />
                <span>
                  <span className="block font-semibold">Delete the expenses too</span>
                  <span className="text-sm text-muted">This cannot be undone.</span>
                </span>
              </label>
            </div>
          </>
        )}
        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className={`${btn.secondary} flex-1`}>Cancel</button>
          <button onClick={confirm} className={`${btn.danger} flex-1`}>Delete category</button>
        </div>
      </div>
    </Modal>
  )
}
