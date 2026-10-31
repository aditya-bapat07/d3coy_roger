/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: {
          DEFAULT: 'var(--bg-primary)',
          secondary: 'var(--bg-secondary)',
          elevated: 'var(--bg-elevated)',
          graph: 'var(--bg-graph)',
        },
        ink: {
          DEFAULT: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          tertiary: 'var(--text-tertiary)',
        },
        risk: {
          critical: 'var(--risk-critical)',
          high: 'var(--risk-high)',
          medium: 'var(--risk-medium)',
          low: 'var(--risk-low)',
          minimal: 'var(--risk-minimal)',
        },
        accent: {
          DEFAULT: 'var(--accent-primary)',
          hover: 'var(--accent-hover)',
          glow: 'var(--accent-glow)',
        },
        line: {
          DEFAULT: 'var(--border-default)',
          subtle: 'var(--border-subtle)',
          hover: 'var(--border-hover)',
        },
        cybrix: {
          bg: '#0A0706',
          surface: '#120D0B',
          elevated: '#18120F',
          orange: '#F26A1B',
          'orange-bright': '#FF7A2B',
          gold: '#FFB340',
          text: '#FFFFFF',
          muted: '#A09A96',
          subtle: '#6F6863',
        },
      },
      fontFamily: {
        sans: ['Manrope', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'glass-hover': '0 0 30px rgba(242, 106, 27, 0.15)',
        'orange-glow': '0 0 25px rgba(242, 106, 27, 0.35)',
        'orange-glow-sm': '0 0 12px rgba(242, 106, 27, 0.25)',
        'star-glow': '0 0 10px rgba(255, 179, 64, 0.6)',
      },
      borderRadius: {
        'glass': '18px',
      },
      backdropBlur: {
        'glass': '12px',
      },
    },
  },
  plugins: [],
}
