/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
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
