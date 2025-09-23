/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#6637ec',
          50: '#f3f1ff',
          100: '#e9e5ff',
          200: '#d6ceff',
          300: '#b8a6ff',
          400: '#9574ff',
          500: '#6637ec',
          600: '#5a2dd9',
          700: '#4c22b8',
          800: '#3f1d96',
          900: '#351a7a',
          950: '#1f0e47',
        },
      },
    },
  },
  plugins: [],
}
