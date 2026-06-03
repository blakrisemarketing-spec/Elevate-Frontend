/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/priority/**/*.{ts,tsx}', './src/checkout/**/*.{ts,tsx}', './scripts/build-priority-routes.mjs'],
  theme: {
    extend: {
      colors: {
        // Updated palette to match the Figma redesign
        primary: {
          DEFAULT: '#0077B6',
          50: '#e6f3fa',
          100: '#cce7f4',
          200: '#99d0e9',
          500: '#0077B6',
          600: '#005f92',
          700: '#00496f',
        },
        electric: {
          DEFAULT: '#3FA9F5',
          400: '#7dc4f9',
          600: '#1f8fdb',
        },
        navy: {
          DEFAULT: '#2A4876',
          700: '#1f3858',
          800: '#152740',
          900: '#0d182a',
        },
        canvas: '#F4F4F4',
        surface: {
          DEFAULT: '#FFFFFF',
          muted: '#EDEDED',
          tint: '#E8F2FA',
        },
        ink: {
          DEFAULT: '#1B1C28',
          muted: '#4A5168',
        },
      },
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif'],
        // Display font: Gilroy ExtraBold (self-hosted; currently Montserrat 800 as
        // a free stand-in — see @font-face note in src/priority/styles.css).
        display: ['"Gilroy ExtraBold"', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
      fontSize: {
        'display-xl': ['clamp(2.75rem, 6vw + 0.5rem, 4.5rem)', { lineHeight: '1.05', letterSpacing: '-0.02em', fontWeight: '800' }],
        'display-lg': ['clamp(2.25rem, 5vw + 0.5rem, 3.5rem)', { lineHeight: '1.1', letterSpacing: '-0.015em', fontWeight: '800' }],
        'headline-lg': ['clamp(1.75rem, 3vw + 0.5rem, 2.25rem)', { lineHeight: '1.2', letterSpacing: '-0.01em', fontWeight: '800' }],
        'headline-md': ['1.375rem', { lineHeight: '1.3', fontWeight: '800' }],
        'title-lg': ['1.125rem', { lineHeight: '1.4', fontWeight: '800' }],
      },
      maxWidth: {
        site: '1200px',
      },
      borderRadius: {
        DEFAULT: '0.5rem',
        xl: '1.25rem',
        '2xl': '1.75rem',
      },
      boxShadow: {
        soft: '0 12px 40px -16px rgba(42, 72, 118, 0.18)',
        card: '0 4px 16px -4px rgba(0, 0, 0, 0.08)',
      },
    },
  },
  plugins: [],
};
