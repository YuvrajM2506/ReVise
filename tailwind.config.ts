import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "#080911",
        surface: {
          50: "#1a1c2e",
          100: "#141628",
          200: "#0f1020",
          300: "#0b0c17",
          400: "#080911",
        },
        card: "#0d0e1c",
        "card-border": "rgba(255, 255, 255, 0.08)",
        "card-hover": "#121426",
        primary: {
          DEFAULT: "#6C5CE7",
          hover: "#5b4bc4",
          light: "#8172f3",
          glow: "rgba(108, 92, 231, 0.3)",
        },
        accent: {
          blue: "#38bdf8",
          purple: "#a855f7",
          pink: "#ec4899",
          red: "#ef4444",
          amber: "#f59e0b",
          green: "#10b981",
          teal: "#14b8a6",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "sans-serif"],
        mono: ["var(--font-jetbrains)", "JetBrains Mono", "monospace"],
      },
      boxShadow: {
        "glow-sm": "0 0 15px rgba(108, 92, 231, 0.2)",
        "glow-md": "0 0 25px rgba(108, 92, 231, 0.35)",
        "glow-red": "0 0 20px rgba(239, 68, 68, 0.25)",
        "glow-green": "0 0 20px rgba(16, 185, 129, 0.25)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [],
};
export default config;
