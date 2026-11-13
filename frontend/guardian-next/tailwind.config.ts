import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#0F0708",
        s1: "#190C0D",
        s2: "#241213",
        line: "rgba(255, 226, 220, 0.11)",
        t1: "#F7ECE8",
        t2: "#CDB9B3",
        t3: "#9B8780",
        blood: {
          DEFAULT: "#B0121B",
          hover: "#C8161F",
        },
        deep: "#3A080C",
        redhi: "#F2675F",
        yellow: "#F5B82E",
        orange: "#F2675F",
      },
      fontFamily: {
        sans: ["var(--font-space-grotesk)", "Space Grotesk", "system-ui", "-apple-system", "sans-serif"],
        mono: ["var(--font-ibm-plex-mono)", "IBM Plex Mono", "ui-monospace", "Menlo", "Consolas", "monospace"],
      },
      transitionTimingFunction: {
        custom: "cubic-bezier(0.2, 0.7, 0.2, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
