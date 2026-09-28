import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "var(--color-canvas)",
        surface: {
          DEFAULT: "var(--color-surface)",
          raised: "var(--color-surface-raised)",
          strong: "var(--color-surface-strong)",
          low: "var(--color-surface-low)",
        },
        ink: "var(--color-ink)",
        secondary: "var(--color-secondary)",
        muted: "var(--color-muted)",
        subtle: "var(--color-subtle)",
        line: "var(--color-line)",
        brand: {
          DEFAULT: "var(--color-brand)",
          light: "var(--color-brand-light)",
          soft: "var(--color-brand-soft)",
        },
        attention: "var(--color-attention)",
        danger: "var(--color-danger)",
        success: "var(--color-success)",
        info: "var(--color-info)",
      },
      fontFamily: {
        display: ["Bricolage Grotesque", "sans-serif"],
        sans: ["Plus Jakarta Sans", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
        neo: ["Inter", "Helvetica Neue", "Arial", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
