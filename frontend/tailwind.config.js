/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Inter",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
      colors: {
        brand: {
          50: "#f1f7f3",
          100: "#dcebe1",
          200: "#bcd8c6",
          300: "#92bda3",
          400: "#669d7d",
          500: "#46805f",
          600: "#356a4d",
          700: "#2c5540",
          800: "#264535",
          900: "#20392d",
        },
        charcoal: {
          700: "#2b3330",
          800: "#232a27",
          900: "#1b211f",
          950: "#141917",
        },
        surface: "#f6f7f6",
        line: "#e3e6e4",
        ink: "#1d2421",
        muted: "#68736d",
        severity: {
          low: "#2f855a",
          medium: "#d97706",
          high: "#dc2626",
          critical: "#991b1b",
        },
      },
      borderRadius: {
        card: "0.75rem",
      },
      boxShadow: {
        card: "0 1px 2px rgba(16, 24, 20, 0.04), 0 8px 24px -18px rgba(16, 24, 20, 0.25)",
        float: "0 12px 40px -16px rgba(16, 24, 20, 0.35)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 160ms ease-out",
      },
    },
  },
  plugins: [],
};
