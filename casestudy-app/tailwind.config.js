/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "primary": "#1349ec",
        "background-light": "#f6f6f8",
        "background-dark": "#0f172a", // Standard dark background
        "background-darker": "#0a0e17", // Used in mapper canvas
      },
      fontFamily: {
        "display": ["Lexend", "sans-serif"],
        "sans": ["Lexend", "sans-serif"]
      },
      borderRadius: {
        "DEFAULT": "0.25rem", 
        "lg": "0.5rem", 
        "xl": "0.75rem", 
        "full": "9999px"
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/container-queries')
  ],
}
