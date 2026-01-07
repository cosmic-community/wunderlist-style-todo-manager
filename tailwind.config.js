/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#3b82f6',
          foreground: '#ffffff',
        },
        secondary: {
          DEFAULT: '#f3f4f6',
          foreground: '#111827',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
      },
      // Changed: Updated animation with circular pattern
      animation: {
        confetti: 'confetti 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards',
      },
      keyframes: {
        confetti: {
          '0%': {
            transform: 'translate(-50%, -50%) rotate(0deg) translateX(0) scale(1)',
            opacity: '1',
          },
          '20%': {
            opacity: '1',
          },
          '100%': {
            transform: 'translate(-50%, -50%) rotate(calc(var(--confetti-angle) + 180deg)) translateX(80px) scale(0.3)',
            opacity: '0',
          },
        },
      },
      // Changed: Added custom scale for smoother transitions
      scale: {
        '98': '0.98',
      },
      // Changed: Added max-height for smoother collapse
      maxHeight: {
        '20': '5rem',
      },
    },
  },
  plugins: [],
}