import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#2B9BF4",
        "primary-dark": "#1a7fd4",
        "primary-light": "#EBF5FF",
        ink: "#0D0D0D",
        body: "#4A5568",
        muted: "#9AA5B4",
        border: "#E2ECF8",
        cloud: "#F0F7FF",
        surface: "#FFFFFF",
        success: "#22C55E",
        warning: "#F59E0B",
        danger: "#EF4444"
      },
      boxShadow: {
        soft: "0 2px 16px rgba(43, 155, 244, 0.08)",
        button: "0 4px 14px rgba(43, 155, 244, 0.35)"
      }
    }
  },
  plugins: []
} satisfies Config;
