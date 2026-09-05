import defaultTheme from 'tailwindcss/defaultTheme.js';

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', ...defaultTheme.fontFamily.sans],
        mono: ['JetBrains Mono', ...defaultTheme.fontFamily.mono],
      },
      colors: {
        codecred: {
          accent: '#10b981',
          accentHover: '#059669',
        }
      }
    },
  },
  plugins: [],
};
