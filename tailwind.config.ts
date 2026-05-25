import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["DM Sans", "sans-serif"],
      },
      colors: {
        "aegis-bg": "#0b0f18",
        "aegis-sidebar": "#080c14",
        "aegis-card": "#0e1623",
        "aegis-card-hover": "#111e30",
        "aegis-border": "#1a2234",
        "aegis-border-card": "#1e2d45",
        "aegis-border-hover": "#2a3f60",
        "aegis-text": "#f1f5f9",
        "aegis-text-secondary": "#94a3b8",
        "aegis-text-muted": "#475569",
        "aegis-text-hint": "#334155",
        "aegis-blue": "#2563eb",
        "aegis-blue-light": "#60a5fa",
        "aegis-blue-border": "#2a4a7a",
        "aegis-amber": "#d97706",
        "aegis-amber-light": "#f59e0b",
        "aegis-green": "#22c55e",
        "aegis-red": "#ef4444",
      },
    },
  },
  plugins: [],
};

export default config;
