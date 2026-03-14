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
          hover: '#d4af7a',
          dim: 'rgba(193, 154, 107, 0.1)',
          active: 'rgba(193, 154, 107, 0.2)',
        },
        mentat: {
          bg: '#1A1A1B',
          'bg-page': '#0D0D0E',
          'bg-subtle': '#222222',
          'bg-card': '#131315',
          'bg-elevated': '#161618',
          'bg-section': '#0F0F10',
          'bg-gradient-start': '#121214',
          card: '#1E1E1F',
          border: '#3A3A3A',
          'border-weak': '#2A2A2A',
          'border-card': '#252528',
          'border-section': '#1E1E20',
          muted: '#999999',
          'muted-secondary': '#6B6B6E',
          'muted-tertiary': '#5C5C5E',
          text: '#E5E5E5',
          'text-secondary': '#8A8A8C',
          'text-faint': '#D4D4D6',
          danger: '#FF4444',
          warning: '#D4A55A',
          success: '#4CAF50',
          blue: '#5A9FD4',
          'accent-blue': '#9FB9E5',
          'accent-purple': '#9B8DC4',
          'error-border': '#8B2E2E',
        },
      },
    },
  },
  plugins: [],
}
