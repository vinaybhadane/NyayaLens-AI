/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        legal: {
          50: '#F0F4F8',
          100: '#D9E2EC',
          200: '#BCCCDC',
          300: '#9FB3C8',
          400: '#829AB1',
          500: '#627D98',
          600: '#486581',
          700: '#334E68',
          800: '#243B53',
          900: '#102A43',
        },
        risk: {
          low: '#047857',
          'low-bg': '#ECFDF5',
          'low-border': '#A7F3D0',
          med: '#B45309',
          'med-bg': '#FFFBEB',
          'med-border': '#FDE68A',
          high: '#B91C1C',
          'high-bg': '#FEF2F2',
          'high-border': '#FECACA',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
