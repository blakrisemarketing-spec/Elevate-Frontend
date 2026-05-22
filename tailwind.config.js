/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/priority/**/*.{ts,tsx}', './scripts/build-priority-routes.mjs'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#006BA6',
          50: '#e6f1f8',
          100: '#cee3f1',
          500: '#006BA6',
          600: '#005281',
          700: '#003e62',
        },
        electric: {
          DEFAULT: '#4CC3FF',
          600: '#1aa3e8',
        },
        navy: {
          DEFAULT: '#002E47',
          700: '#001e30',
          800: '#001423',
        },
        canvas: '#F6F4ED',
        surface: {
          DEFAULT: '#FFFFFF',
          muted: '#F0EEE7',
        },
        ink: {
          DEFAULT: '#1B1C18',
          muted: '#404750',
        },
      },
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif'],
        display: ['ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
      fontSize: {
        'display-lg': ['clamp(2.25rem, 5vw + 0.5rem, 3rem)', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '700' }],
        'headline-lg': ['clamp(1.75rem, 3vw + 0.5rem, 2rem)', { lineHeight: '1.2', letterSpacing: '-0.01em', fontWeight: '600' }],
        'headline-md': ['1.5rem', { lineHeight: '1.3', fontWeight: '600' }],
        'title-lg': ['1.25rem', { lineHeight: '1.4', fontWeight: '700' }],
      },
      maxWidth: {
        site: '1200px',
      },
      borderRadius: {
        DEFAULT: '0.5rem',
        xl: '1.5rem',
      },
      boxShadow: {
        soft: '0 8px 32px -16px rgba(0, 107, 166, 0.18)',
      },
    },
  },
  plugins: [],
};
