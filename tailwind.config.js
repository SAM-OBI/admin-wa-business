/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--bg-background)',
        surface: 'var(--bg-surface)',
        'surface-elevated': 'var(--bg-surface-elevated)',
        primary: {
          DEFAULT: 'var(--color-primary)',
          hover: 'var(--color-primary-hover)',
          active: 'var(--color-primary-active)',
          subtle: 'var(--color-primary-subtle)',
        },
        semantic: {
          success: 'var(--color-success)',
          warning: 'var(--color-warning)',
          danger: 'var(--color-danger)',
          info: 'var(--color-info)',
        },
        text: {
          heading: 'var(--text-heading)',
          body: 'var(--text-body)',
          muted: 'var(--text-muted)',
          inverse: 'var(--text-inverse)',
        },
        border: {
          DEFAULT: 'var(--border-default)',
          subtle: 'var(--border-subtle)',
        },
        gold: {
          DEFAULT: '#D4AF37',
          light: '#E5C048',
          dark: '#B3902E',
        },
        sage: {
          DEFAULT: '#B2C2B2',
          light: '#C3D3C3',
          dark: '#91A191',
        },
        brown: {
          DEFAULT: '#4A3728',
          light: '#5D4634',
          dark: '#35251C',
        },
        cream: '#F5F5DC',
        beige: '#D8C3A5',
        // ShopVia Color System v2 — canonical redesign tokens, CSS-variable
        // backed (see src/index.css). Prefer these over raw Tailwind grays.
        sv: {
          primary: 'var(--sv-primary)',
          'primary-hover': 'var(--sv-primary-hover)',
          accent: 'var(--sv-accent)',
          'accent-soft': 'var(--sv-accent-soft)',
          gold: 'var(--sv-gold)',
          'gold-soft': 'var(--sv-gold-soft)',
          bg: 'var(--sv-bg)',
          surface: 'var(--sv-surface)',
          'surface-muted': 'var(--sv-surface-muted)',
          'surface-elevated': 'var(--sv-surface-elevated)',
          border: 'var(--sv-border)',
          'text-primary': 'var(--sv-text-primary)',
          'text-secondary': 'var(--sv-text-secondary)',
          'text-muted': 'var(--sv-text-muted)',
          'text-inverse': 'var(--sv-text-inverse)',
          success: 'var(--sv-success)',
          'success-soft': 'var(--sv-success-soft)',
          warning: 'var(--sv-warning)',
          'warning-soft': 'var(--sv-warning-soft)',
          danger: 'var(--sv-danger)',
          'danger-soft': 'var(--sv-danger-soft)',
          info: 'var(--sv-info)',
          'info-soft': 'var(--sv-info-soft)',
          tag: 'var(--sv-tag)',
          'tag-soft': 'var(--sv-tag-soft)',
        },
      }
    },
  },
  plugins: [],
}
