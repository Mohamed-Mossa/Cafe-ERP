/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eef2ff',
          100: '#e0e7ff',
          500: '#2E75B6',
          600: '#1B3A6B',
          700: '#1e3a8a',
        },
        success: '#16A34A',
        danger: '#DC2626',
        warning: '#D97706',
      },
      fontFamily: {
        // Cairo covers both Arabic and Latin - single font for whole app
        sans: ['Cairo', 'Segoe UI', 'Tahoma', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
