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
        surface: "#f4f5f3",
        line: "#e1e4e1",
        ink: "#1f2a24",
        muted: "#5f6a63",
        severity: {
          low: "#2f855a",
          medium: "#d97706",
          high: "#dc2626",
          critical: "#991b1b",
        },
      },
      borderRadius: {
        card: "0.5rem",
      },
      boxShadow: {
        card: "0 1px 2px rgba(20, 28, 23, 0.04)",
        float: "0 18px 40px -28px rgba(20, 28, 23, 0.4)",
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
