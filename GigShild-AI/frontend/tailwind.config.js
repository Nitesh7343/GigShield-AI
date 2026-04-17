/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        primary: '#4f46e5', // Indigo 600
        secondary: '#8b5cf6', // Violet 500
        success: '#10b981', // Emerald 500
        danger: '#ef4444', // Red 500
        warning: '#f59e0b', // Amber 500
      }
    },
  },
  plugins: [],
}
