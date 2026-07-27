import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0B1220",
        body: "#334155",
        muted: "#64748B",
        subtle: "#94A3B8",
        line: "#E2E8F0",
        surface: "#F1F5FB",
        card: "#FFFFFF",
        brand: {
          DEFAULT: "#1E88F0",
          dark: "#136FD1",
          light: "#E3F0FE",
        },
      },
      fontFamily: {
        sans: ["'Inter'", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 1px 2px rgba(15, 23, 42, 0.04), 0 8px 24px rgba(15, 23, 42, 0.06)",
      },
      backgroundImage: {
        "hero-gradient": "linear-gradient(135deg, #1E88F0 0%, #0B1220 100%)",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        dotPulse: {
          "0%, 80%, 100%": { opacity: "0.25" },
          "40%": { opacity: "1" },
        },
      },
      animation: {
        fadeUp: "fadeUp 0.5s ease-out",
        dotPulse: "dotPulse 1.2s infinite ease-in-out",
      },
    },
  },
  plugins: [],
};
export default config;
