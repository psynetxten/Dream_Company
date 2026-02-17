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
      },
      fontFamily: {
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
