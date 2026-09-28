/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
      },
      colors: {
        primary: {
          50: "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
          950: "#1e1b4b",
        },
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(to right, #6366f1, #8b5cf6, #d946ef)",
        "hero-glow":
          "radial-gradient(60% 50% at 50% 0%, rgba(99, 102, 241, 0.18) 0%, rgba(99, 102, 241, 0) 100%)",
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(99,102,241,0.15), 0 10px 40px -10px rgba(99,102,241,0.35)",
      },
      // `shimmer` and `fade-in` keyframes live in src/index.css
      keyframes: {
        "fade-in-scale": {
          "0%": { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "slide-in-right": {
          "0%": { opacity: "0", transform: "translateX(16px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "slide-in-left": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(0)" },
        },
      },
      animation: {
        shimmer: "shimmer 1.6s linear infinite",
        "in-scale": "fade-in-scale 0.2s ease-out both",
        "in-right": "slide-in-right 0.25s ease-out both",
        "in-left": "slide-in-left 0.25s ease-out both",
      },
    },
  },
  plugins: [],
};
