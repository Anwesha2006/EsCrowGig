import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#18202f",
        moss: "#46624a",
        gold: "#c8923d",
        coral: "#d8644f",
        cloud: "#f6f7f4"
      },
      boxShadow: {
        soft: "0 18px 60px rgba(24, 32, 47, 0.12)"
      }
    }
  },
  plugins: []
} satisfies Config;

