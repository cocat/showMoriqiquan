/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          DEFAULT: '#C19A6B',
          dim: 'rgba(193, 154, 107, 0.1)',
          active: 'rgba(193, 154, 107, 0.2)',
        },
        mentat: {
          bg: '#1A1A1B',
          card: '#1E1E1F',
          border: '#3A3A3A',
          muted: '#999999',
        },
      },
    },
  },
  plugins: [],
}
