/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Palantir-inspired dark theme
        'rosie-bg': '#0a0a0f',
        'rosie-surface': '#12121a',
        'rosie-surface-light': '#1a1a24',
        'rosie-border': '#2a2a36',
        'rosie-cyan': '#00d4ff',
        'rosie-green': '#00ff88',
        'rosie-yellow': '#ffd700',
        'rosie-red': '#ff4757',
        'rosie-purple': '#a855f7',
        'rosie-text': '#e4e4e7',
        'rosie-text-muted': '#71717a',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
}
