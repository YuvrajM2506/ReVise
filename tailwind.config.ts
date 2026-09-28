import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',

  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],

  theme: {
    extend: {
      colors: {
        background: '#071317',
        foreground: '#F2F5F4',

        surface: {
          DEFAULT: '#0E2229',
          2: '#112830',
          3: '#163842',
        },

        primary: {
          DEFAULT: '#02A0A0',
          foreground: '#071317',
        },

        secondary: {
          DEFAULT: '#FFBD65',
          foreground: '#071317',
        },

        accent: {
          turquoise: '#02A0A0',
          orange: '#FFBD65',
        },

        muted: '#8CA0A8',
        border: 'rgba(2, 160, 160, 0.12)',
      },

      fontFamily: {
        sans: [
          'var(--font-inter)',
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],

        display: [
          'var(--font-mont)',
          'Montserrat',
          'Arial',
          'sans-serif',
        ],

        mono: [
          'var(--font-jetbrains)',
          'JetBrains Mono',
          'Consolas',
          'Monaco',
          'monospace',
        ],
      },

      boxShadow: {
        'subtle-teal': '0 0 16px rgba(2, 160, 160, 0.08)',
        'subtle-orange': '0 0 16px rgba(255, 189, 101, 0.08)',
      },

      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },

  plugins: [],
};

