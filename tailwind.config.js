/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Nunito', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        navy: '#4B3428',
        ocean: '#F47B20',
        skysoft: '#FFE1C7',
        heat: '#FF9A4A',
        danger: '#A34F1B',
        safe: '#65A765',
        cream: '#FFF9F3',
        cocoa: '#4B3428',
        muted: '#806B60',
      },
      boxShadow: {
        soft: '0 18px 45px rgba(75, 52, 40, 0.1)',
      },
    },
  },
  plugins: [],
}
