import type { AppData } from './types'
import { exportJSON } from './storage'

/** Downloads a JSON backup and returns the ISO timestamp to record as the last backup. */
export function downloadBackup(data: AppData): string {
  const now = new Date().toISOString()
  const json = exportJSON({ ...data, settings: { ...data.settings, lastBackupAt: now } })
  const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }))
  const a = document.createElement('a')
  a.href = url
  a.download = `budget-backup-${now.slice(0, 10)}.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  return now
}
