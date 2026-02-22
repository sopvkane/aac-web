/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "SF Pro Text", "Inter", "Arial", "sans-serif"],
      },
      minHeight: {
        // Compose textarea: ~120px
        30: "7.5rem",     // 120px
        // Suggestion buttons: ~56px
        14: "3.5rem",     // 56px
      },
    },
  },
  plugins: [],
};