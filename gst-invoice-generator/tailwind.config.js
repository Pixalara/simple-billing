/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // --- TYPE ---------------------------------------------------------
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      // A real type scale. Line-heights and tracking are baked in so headings
      // stay optically tight at large sizes and readable at small ones.
      fontSize: {
        'display-2xl': ['clamp(2.75rem, 6vw, 4.75rem)', { lineHeight: '1.02', letterSpacing: '-0.035em', fontWeight: '800' }],
        'display-xl': ['clamp(2.25rem, 4.6vw, 3.5rem)', { lineHeight: '1.06', letterSpacing: '-0.03em', fontWeight: '800' }],
        'display-lg': ['clamp(1.875rem, 3.4vw, 2.75rem)', { lineHeight: '1.12', letterSpacing: '-0.025em', fontWeight: '800' }],
        'display-md': ['clamp(1.5rem, 2.4vw, 2rem)', { lineHeight: '1.18', letterSpacing: '-0.02em', fontWeight: '700' }],
        'display-sm': ['1.25rem', { lineHeight: '1.3', letterSpacing: '-0.015em', fontWeight: '700' }],
        'body-lg': ['1.0625rem', { lineHeight: '1.65' }],
        'body': ['0.9375rem', { lineHeight: '1.65' }],
        'body-sm': ['0.875rem', { lineHeight: '1.6' }],
        'micro': ['0.75rem', { lineHeight: '1.5', letterSpacing: '0.02em' }],
        'eyebrow': ['0.6875rem', { lineHeight: '1', letterSpacing: '0.14em', fontWeight: '700' }],
      },
      // --- COLOUR -------------------------------------------------------
      // Extends the default palette, so existing pages keep working.
      colors: {
        ink: {
          50: '#F6F7F9',
          100: '#ECEEF2',
          200: '#D5DAE3',
          300: '#B0B9C9',
          400: '#7D8AA3',
          500: '#5A6880',
          600: '#414D63',
          700: '#2C3547',
          800: '#1A2133',
          900: '#0E1424',
          950: '#070A13',
        },
        brand: {
          50: '#EEF4FF',
          100: '#DCE7FF',
          200: '#BFD3FF',
          300: '#93B4FF',
          400: '#608CFF',
          500: '#3B66F5',
          600: '#2547E4',
          700: '#1D36C0',
          800: '#1C309B',
          900: '#1C2E7A',
        },
        mint: {
          50: '#ECFDF4',
          100: '#D2F9E3',
          200: '#A9F1CB',
          300: '#71E4AC',
          400: '#38CE8B',
          500: '#14B274',
          600: '#089060',
          700: '#07724F',
          800: '#085B41',
          900: '#074B37',
        },
        paper: '#FCFCFD',
        cream: '#FAF8F2',
      },
      // --- DEPTH --------------------------------------------------------
      // Layered, low-opacity shadows. One consistent light source.
      boxShadow: {
        'xs': '0 1px 2px 0 rgb(7 10 19 / 0.04)',
        'sm-soft': '0 1px 3px rgb(7 10 19 / 0.05), 0 1px 2px -1px rgb(7 10 19 / 0.04)',
        'soft': '0 4px 12px -2px rgb(7 10 19 / 0.05), 0 2px 6px -2px rgb(7 10 19 / 0.04)',
        'lift': '0 12px 28px -8px rgb(7 10 19 / 0.10), 0 4px 10px -4px rgb(7 10 19 / 0.05)',
        'float': '0 24px 48px -16px rgb(7 10 19 / 0.14), 0 8px 20px -8px rgb(7 10 19 / 0.06)',
        'hero': '0 40px 80px -24px rgb(7 10 19 / 0.20), 0 16px 32px -16px rgb(7 10 19 / 0.08)',
        'ring-brand': '0 0 0 4px rgb(59 102 245 / 0.14)',
        'inset-hairline': 'inset 0 0 0 1px rgb(7 10 19 / 0.06)',
      },
      borderRadius: {
        '4xl': '1.75rem',
        '5xl': '2.25rem',
      },
      // --- RHYTHM -------------------------------------------------------
      spacing: {
        '4.5': '1.125rem',
        '5.5': '1.375rem',
        '13': '3.25rem',
        '18': '4.5rem',
        '22': '5.5rem',
        '26': '6.5rem',
        '30': '7.5rem',
      },
      maxWidth: {
        'container': '1200px',
        'container-wide': '1320px',
        'prose-tight': '38rem',
        'prose-mid': '46rem',
      },
      screens: {
        'xs': '420px',
        // Explicit tablet band, so tablet is designed rather than inherited.
        'tab': '768px',
      },
      // --- MOTION -------------------------------------------------------
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'out-back': 'cubic-bezier(0.34, 1.4, 0.64, 1)',
      },
      keyframes: {
        'rise': {
          '0%': { opacity: '0', transform: 'translateY(14px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'marquee': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'sheen': {
          '0%': { transform: 'translateX(-120%)' },
          '60%, 100%': { transform: 'translateX(220%)' },
        },
        'caret': {
          '0%, 45%': { opacity: '1' },
          '50%, 95%': { opacity: '0' },
        },
      },
      animation: {
        'rise': 'rise 0.6s cubic-bezier(0.16, 1, 0.3, 1) both',
        'fade': 'fade 0.5s ease-out both',
        'marquee': 'marquee 42s linear infinite',
        'marquee-slow': 'marquee 64s linear infinite',
        'sheen': 'sheen 2.6s cubic-bezier(0.16, 1, 0.3, 1) infinite',
        'caret': 'caret 1.1s step-end infinite',
      },
      backgroundImage: {
        'grid-ink': 'linear-gradient(to right, rgb(7 10 19 / 0.045) 1px, transparent 1px), linear-gradient(to bottom, rgb(7 10 19 / 0.045) 1px, transparent 1px)',
        'dots-ink': 'radial-gradient(rgb(7 10 19 / 0.09) 1px, transparent 1px)',
      },
      backgroundSize: {
        'grid-lg': '64px 64px',
        'dots-sm': '18px 18px',
      },
    },
  },
  plugins: [],
}
