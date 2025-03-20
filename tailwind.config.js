/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'media', // Enables dark mode based on system preferences
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1877F2', // Facebook blue
          dark: '#1153ab',
        }
      },
    },
  },
  plugins: [],
}