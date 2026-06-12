import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "hsl(var(--primary))",
        },
        'cadet-blue': {
          DEFAULT: "hsl(var(--cadet-blue))",
        },
        'pale-blue': {
          DEFAULT: "hsl(var(--pale-blue))",
        },
        'alice-blue': {
          DEFAULT: "hsl(var(--alice-blue))",
        },
        'silver-blue': {
          DEFAULT: "hsl(var(--silver-blue))",
        },
        'bluish-gray': {
          DEFAULT: "hsl(var(--bluish-gray))",
        },
        'blue-grey': {
          DEFAULT: "hsl(var(--blue-grey))",
        },
        'dark-indigo': {
          DEFAULT: "hsl(var(--dark-indigo))",
        },
        'sand': {
          DEFAULT: "hsl(var(--sand))",
        },
        'deep-cyan': {
          DEFAULT: "hsl(var(--deep-cyan))",
        }
      },
      screens: {
        'xs': '375px',
      },
      fontFamily: {
        sans: ['var(--font-dm-sans)', 'sans-serif'],
        serif: ['var(--font-dm-serif)', 'serif'],
      },
      scale: {
        '99': '0.99',
      },
      fontSize: {
        '4xl-clamp': 'clamp(2em, 5vw, 2.25rem)',
        '3xl-clamp': 'clamp(1.25em, 5vw, 1.875rem)',
        '2xl-clamp': 'clamp(1.125rem, 5vw, 1.5rem)',
        'sm-clamp': 'clamp(0.75rem, 5vw, 0.875rem)',
      }
    },
  },
  plugins: [require('@tailwindcss/typography')],
};

export default config;
