/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{html,js,svelte,ts}",
    "./index.html",
  ],
  theme: {
    extend: {
      colors: {
        accent: "#6C63FF",
        primary: "#2D3748",
        secondary: "#4A5568",
        success: "#10B981",
        error: "#EF4444",
        warning: "#F59E0B",
        info: "#3B82F6",
        background: "#F7FAFC",
        "card-background": "#FFFFFF",
        border: "#E2E8F0",
      },
    },
  },
  plugins: [],
}