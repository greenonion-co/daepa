import type { Config } from "tailwindcss";

const config: Config = {
  theme: {
    extend: {
      fontFamily: {
        sans: ["Pretendard", "var(--font-geist-sans)", "sans-serif"],
      },
    },
  },
};

export default config;
