/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{html,js,ts,tsx}"],
  theme: {
    extend: {
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.8s forwards',
        'fadeIn-100': 'fadeIn 0.8s forwards 0.1s',
        'fadeIn-300': 'fadeIn 0.8s forwards 0.3s',
        'fadeIn-500': 'fadeIn 0.8s forwards 0.5s',
      },
    },
  },
  plugins: [],
};
