/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: "#0ea5e9", dark: "#38bdf8" }
      },
      boxShadow: { soft: '0 10px 30px -12px rgba(0,0,0,.15)' },
      borderRadius: { xl: '1rem', '2xl': '1.25rem' }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('tailwindcss-animate'),
    require('tailwindcss-rtl')
  ],
}


