import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        chat: {
          sidebar: "#f7faf9",
          panel: "#ffffff",
          line: "#d8e1df",
          incoming: "#ffffff",
          outgoing: "#d9fdd3",
          accent: "#008069",
          blueTick: "#34b7f1"
        }
      },
      boxShadow: {
        bubble: "0 1px 1px rgba(11, 20, 26, 0.08)"
      }
    }
  },
  plugins: []
} satisfies Config;
