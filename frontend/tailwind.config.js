/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        serif: ['Cormorant Garamond', 'serif'],
        sans: ['DM Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        caveat: ['Caveat', 'cursive'],
      },
      colors: {
        bg: {
          primary: '#0A0A0A',
          surface: '#111111',
          elevated: '#1A1A1A',
        },
        accent: {
          gold: '#C9A84C',
          'gold-dim': '#8A6F32',
        },
        trust: {
          verified: '#2ECC71',
          trusted: '#C9A84C',
          neutral: '#8A8680',
          caution: '#E67E22',
          flagged: '#E74C3C',
        },
      },
      borderRadius: {
        lg: '6px',
        md: '4px',
        sm: '2px',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'ink-in': {
          from: { opacity: '0', transform: 'translateY(6px) rotate(var(--tilt))' },
          to: { opacity: '1', transform: 'translateY(0) rotate(var(--tilt))' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'ink-in': 'ink-in 350ms ease forwards',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
