# Budget Tracker

A monthly budget tracker built as an installable, offline-first PWA.
React + TypeScript + Vite + Tailwind CSS. No backend, no accounts: all data stays in the browser's localStorage.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build in dist/
npm run preview    # test the built PWA (service worker only runs on the build)
```

## Deploy (any static host)

- **Vercel / Netlify**: import the repo. Build command `npm run build`, output directory `dist`.
- **GitHub Pages**: push to `main` with Pages set to "GitHub Actions". A workflow is included in `.github/workflows/pages.yml`.

The build uses relative asset paths (`base: './'`), so it also works under a `/repo-name/` subpath.

## Using it

- **Home**: totals and one card per category. Tap a card to add an expense to that category, or use the Add expense button (press `N` on a laptop).
- **Budget**: set the total, add/rename/edit/delete categories. Unallocated is shown live, with a warning when allocations exceed the total.
- **History**: filter by category, switch months, tap an expense to edit or delete it.
- **Start a new month**: from the Budget screen or the empty state. Optionally copies last month's categories and allocations.
- **Settings**: currency symbol, light/dark/device theme, export and import a JSON backup.

## How it's built

- `remaining = allocated - sum(expenses)` is always computed in `src/lib/calc.ts` from expense records. It is never stored.
- `src/lib/store.tsx` is a reducer over the whole data set. Every change is saved to localStorage (`budget-tracker:v1`) and reloaded on start.
- Deleting a category that has expenses asks you to move them to another category or delete them.
- Import validates the file (including that every expense points to a real category) before replacing anything.
- Overspending is allowed; the category turns red and shows a negative balance.
- Status colours: green under 75% used, amber from 75% to 100%, red over budget.

## Project layout

```
src/lib        types, calculations, storage + backup validation, state store
src/screens    Dashboard, BudgetSetup, History, Settings
src/components shared UI, expense sheet, new-month sheet, delete-category sheet
```

## Notes

- Clearing browser/site data erases the budget. The Settings screen says so; back up regularly.
- Replace `public/pwa-*.png` and `favicon.svg` with your own icons if you like.
- Out of scope for v1: bank sync, accounts, cloud sync, sharing, recurring expenses, charts, notifications.
