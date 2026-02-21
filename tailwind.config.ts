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
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          50: "#f0f9ff",
          100: "#e0f2fe",
          200: "#bae6fd",
          300: "#7dd3fc",
          400: "#38bdf8",
          500: "#0ea5e9",
          600: "#0284c7",
          700: "#0369a1",
          800: "#075985",
          900: "#0c4a6e",
          950: "#082f49",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
      spacing: {
        "128": "32rem",
        "144": "36rem",
      },
      borderRadius: {
        "4xl": "2rem",
      },
      keyframes: {
        "float-up": {
          "0%": { opacity: "1", transform: "translateX(-50%) translateY(0)" },
          "100%": {
            opacity: "0",
            transform: "translateX(-50%) translateY(-40px)",
          },
        },
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "25%": { transform: "translateX(-4px)" },
          "75%": { transform: "translateX(4px)" },
        },
        "card-play": {
          "0%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.5", transform: "scale(1.1) translateY(-20px)" },
          "100%": { opacity: "0", transform: "scale(0.8) translateY(-40px)" },
        },
        // Enemy acting: pulsing glow while the enemy prepares to attack
        "enemy-acting": {
          "0%, 100%": { boxShadow: "0 0 8px 2px rgba(251,146,60,0.4)", transform: "scale(1)" },
          "50%": { boxShadow: "0 0 20px 6px rgba(251,146,60,0.75)", transform: "scale(1.03)" },
        },
        // Enemy attack: quick lunge downward toward player
        "enemy-attack": {
          "0%":   { transform: "translateY(0) scale(1)" },
          "35%":  { transform: "translateY(16px) scale(1.06)" },
          "65%":  { transform: "translateY(16px) scale(1.06)" },
          "100%": { transform: "translateY(0) scale(1)" },
        },
        // Player hit flash: brief red tint when taking damage
        "player-hit": {
          "0%":   { boxShadow: "0 0 0 0 rgba(239,68,68,0)" },
          "20%":  { boxShadow: "0 0 0 4px rgba(239,68,68,0.8)" },
          "100%": { boxShadow: "0 0 0 0 rgba(239,68,68,0)" },
        },
      },
      animation: {
        "float-up": "float-up 0.8s ease-out forwards",
        shake: "shake 0.3s ease-in-out",
        "card-play": "card-play 0.4s ease-out forwards",
        "enemy-acting": "enemy-acting 0.7s ease-in-out infinite",
        "enemy-attack": "enemy-attack 0.35s ease-in-out forwards",
        "player-hit": "player-hit 0.5s ease-out forwards",
      },
    },
  },
  plugins: [],
};

export default config;
