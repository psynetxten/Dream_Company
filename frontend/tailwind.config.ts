import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // 신문 테마 컬러
        newsprint: {
          50: "#fafaf7",
          100: "#f5f5ef",
          200: "#e8e8d8",
          300: "#d4d4b8",
          400: "#b8b890",
          500: "#9a9a6a",
          600: "#7a7a50",
          700: "#5c5c3c",
          800: "#3e3e28",
          900: "#1e1e14",
        },
        ink: {
          DEFAULT: "#1a1a2e",
          light: "#2d2d44",
          muted: "#4a4a5a",
        },
        // AI Pro 테마 컬러 (ComfyUI 인스파이어드)
        pro: {
          bg: "#0b0b0f",
          surface: "#16161d",
          accent: "#3a86ff",
          border: "#2d2d3a",
          text: "#e0e0e6",
          "text-muted": "#8e8e9a",
          "node-bg": "#1e1e26",
        },
        // 앱 디자인 시스템 컬러
        app: {
          bg: "#F4F3EE",
          surface: "#FFFFFF",
          "surface-2": "#F2F1EB",
          border: "#E0DFD8",
          text: "#1A1A1A",
          "text-2": "#6B6869",
          "text-3": "#AEAAA5",
          red: "#CC2200",
          green: "#22C55E",
          orange: "#F59E0B",
        },
      },
      fontFamily: {
        sans: [
          "Noto Serif KR",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
        serif: ["Georgia", "Cambria", "Times New Roman", "serif"],
        headline: ["'Noto Serif KR'", "Georgia", "serif"],
      },
      backgroundImage: {
        "newspaper-texture": "url('/images/paper-texture.png')",
      },
    },
  },
  plugins: [],
};

export default config;

