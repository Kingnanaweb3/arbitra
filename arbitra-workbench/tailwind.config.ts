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
        bg: {
          primary: "#0b0f18",
          secondary: "#080c14",
          card: "#0e1623",
          hover: "#111e30",
        },
        border: {
          primary: "#1a2234",
          card: "#1e2d45",
          hover: "#2a3f60",
        },
        text: {
          primary: "#f1f5f9",
          secondary: "#94a3b8",
          muted: "#475569",
          hint: "#334155",
        },
        blue: {
          primary: "#2563eb",
          light: "#60a5fa",
          border: "#2a4a7a",
          glow: "#1d4ed8",
        },
        amber: {
          primary: "#d97706",
          light: "#f59e0b",
        },
        green: {
          active: "#22c55e",
        },
        red: {
          danger: "#ef4444",
          dark: "#b91c1c",
        },
      },
      backgroundImage: {
        "blue-glow": "radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)",
      },
    },
  },
  plugins: [],
};

export default config;
