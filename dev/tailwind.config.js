/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["../*.html"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Inter', 'ui-sans-serif', 'system-ui', '-apple-system',
          'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue',
          'Arial', 'sans-serif'
        ],
        mono: [
          'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas',
          'Liberation Mono', 'Courier New', 'monospace'
        ],
      },
      colors: {
        paper: 'var(--paper)',
        'paper-raised': 'var(--paper-raised)',
        'paper-sunken': 'var(--stone-50)',
        'paper-hover': 'var(--stone-100)',

        ink: 'var(--ink)',
        'ink-hover': 'var(--stone-700)',
        'ink-secondary': 'var(--stone-600)',
        'ink-muted': 'var(--stone-500)',
        'ink-faint': 'var(--stone-400)',

        line: 'var(--stone-200)',
        'line-strong': 'var(--stone-300)',
        'line-soft': 'var(--stone-100)',

        scrim: 'var(--stone-900)',

        danger: {
          50: 'var(--danger-50)',
          100: 'var(--danger-100)',
          200: 'var(--danger-200)',
          300: 'var(--danger-300)',
          400: 'var(--danger-400)',
          500: 'var(--danger-500)',
          600: 'var(--danger-600)',
          700: 'var(--danger-700)',
          800: 'var(--danger-800)',
        },
        warning: {
          50: 'var(--warning-50)',
          200: 'var(--warning-200)',
          300: 'var(--warning-300)',
          500: 'var(--warning-500)',
          600: 'var(--warning-600)',
          700: 'var(--warning-700)',
          800: 'var(--warning-800)',
          900: 'var(--warning-900)',
        },
        'accent-ai': {
          50: 'var(--accent-ai-50)',
          100: 'var(--accent-ai-100)',
          200: 'var(--accent-ai-200)',
          400: 'var(--accent-ai-400)',
          500: 'var(--accent-ai-500)',
          600: 'var(--accent-ai-600)',
          700: 'var(--accent-ai-700)',
        },
        'ai-finding': {
          50: 'var(--ai-finding-50)',
          100: 'var(--ai-finding-100)',
          200: 'var(--ai-finding-200)',
          400: 'var(--ai-finding-400)',
          600: 'var(--ai-finding-600)',
          700: 'var(--ai-finding-700)',
        },
        brand: {
          50: 'var(--brand-50)',
          100: 'var(--brand-100)',
          200: 'var(--brand-200)',
          300: 'var(--brand-300)',
          400: 'var(--brand-400)',
          500: 'var(--brand-500)',
          600: 'var(--brand-600)',
          700: 'var(--brand-700)',
          800: 'var(--brand-800)',
          900: 'var(--brand-900)',
        },
      },
    },
  },
  plugins: [],
};
