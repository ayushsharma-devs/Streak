import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  // Disable media dark mode — we use a fixed light theme
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        bg:      "#FDFCF5",
        ink:     "#111111",
        accent:  "#FF6B00",
        muted:   "#6b6b6b",
        border:  "#e2e0d8",
        surface: "#FFFFFF",
      },
      fontFamily: {
        sans:  ["Inter", "system-ui", "-apple-system", "sans-serif"],
        serif: ["Georgia", "serif"],
        mono:  ["JetBrains Mono", "monospace"],
      },
      borderRadius: {
        xl:  "0.75rem",
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
    },
  },
  plugins: [],
};

export default config;
