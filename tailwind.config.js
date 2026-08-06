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
      }
    },
  },
  plugins: [],
}
