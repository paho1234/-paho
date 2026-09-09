import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: "#FFFFFF",
        ink: {
          DEFAULT: "#5C1417",
          light: "#7A2020",
        },
        charcoal: "#1A1A1A",
        amber: {
          DEFAULT: "#E8A33D",
          dark: "#C7821F",
        },
        clay: "#E33A2E",
        moss: "#1F7A4D",
        line: "#EAEAEA",
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "serif"],
        body: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-jbmono)", "monospace"],
      },
      borderRadius: {
        stamp: "14px",
      },
    },
  },
  plugins: [],
};
export default config;
