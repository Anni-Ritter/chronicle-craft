/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        'fade-in-down': 'fadeInDown 0.5s ease-out forwards',
        'noise': 'noise 6s infinite alternate',
        'pulse-soft': 'pulse 3s ease-in-out infinite',
      },
      keyframes: {
        fadeInDown: {
          '0%': { opacity: 0, transform: 'translateY(-10px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        noise: {
          '0%': { transform: 'translate(0, 0)' },
          '10%': { transform: 'translate(-5%, -5%)' },
          '20%': { transform: 'translate(5%, -5%)' },
          '30%': { transform: 'translate(-5%, 5%)' },
          '40%': { transform: 'translate(5%, 5%)' },
          '50%': { transform: 'translate(0, 0)' },
          '100%': { transform: 'translate(0, 0)' },
        },
        pulse: {
          '0%, 100%': { opacity: '0.2' },
          '50%': { opacity: '0.5' },
        },
      },
    },
  },
  plugins: [
    function ({ addUtilities }) {
      addUtilities({
        '.no-scrollbar': {
          'scrollbar-width': 'none',
          '-ms-overflow-style': 'none',
        },
        '.no-scrollbar::-webkit-scrollbar': {
          display: 'none',
        },
      })
    },
  ],
}

