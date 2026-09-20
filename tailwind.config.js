const c = (v) => `rgb(var(--${v}) / <alpha-value>)`
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: c('bg'), surface: c('surface'), ink: c('ink'), muted: c('muted'), line: c('line'),
        track: c('track'), accent: c('accent'), 'accent-ink': c('accent-ink'),
        ok: c('ok'), warn: c('warn'), bad: c('bad'),
      },
      fontFamily: {
        sans: ['"Schibsted Grotesk Variable"', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      keyframes: {
        sheet: { from: { transform: 'translateY(24px)', opacity: '0' }, to: { transform: 'none', opacity: '1' } },
        fade: { from: { opacity: '0' }, to: { opacity: '1' } },
      },
      animation: { sheet: 'sheet .18s ease-out', fade: 'fade .15s ease-out' },
    },
  },
  plugins: [],
}
