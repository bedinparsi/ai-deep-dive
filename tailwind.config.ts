import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#0f1115",
        panel: "#161a22",
        panel2: "#1d222c",
        edge: "#2a3140",
        accent: "#5b9dff",
        accent2: "#7ee0c0",
        warn: "#f0b45b",
        danger: "#f07171",
        muted: "#8a93a6",
      },
      fontFamily: {
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
