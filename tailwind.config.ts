import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#fffdf7",
        ink: "#262626",
        mist: "#eef4f2",
        moss: "#3f6f61",
        lake: "#355f8a",
        plum: "#71608f",
        sand: "#e8dcc7"
      },
      boxShadow: {
        soft: "0 12px 30px rgba(38, 38, 38, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
