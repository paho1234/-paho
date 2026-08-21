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
        paper: "#FAF6EF",
        ink: {
          DEFAULT: "#1B2A3D",
          light: "#2C4258",
        },
        charcoal: "#23201B",
        amber: {
          DEFAULT: "#E8A33D",
          dark: "#C7821F",
        },
        clay: "#D65F4C",
        moss: "#3C7A5E",
        line: "#E4DCC9",
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "serif"],
        body: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-jbmono)", "monospace"],
      },
      borderRadius: {
        stamp: "3px",
      },
    },
  },
  plugins: [],
};
export default config;
