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
        // Card play: flies toward the enemy row. --tx / --ty set per-card via JS.
        "card-play": {
          "0%": { opacity: "1", transform: "translate(0, 0) scale(1)" },
          "55%": {
            opacity: "0.7",
            transform:
              "translate(calc(var(--tx, 0px) * 0.55), calc(var(--ty, -40px) * 0.55)) scale(1.1)",
          },
          "100%": {
            opacity: "0",
            transform:
              "translate(var(--tx, 0px), var(--ty, -40px)) scale(0.35)",
          },
        },
        // Enemy acting: pulsing glow while the enemy prepares to attack
        "enemy-acting": {
          "0%, 100%": {
            boxShadow: "0 0 8px 2px rgba(251,146,60,0.4)",
            transform: "scale(1)",
          },
          "50%": {
            boxShadow: "0 0 20px 6px rgba(251,146,60,0.75)",
            transform: "scale(1.03)",
          },
        },
        // Enemy attack: quick lunge downward toward player
        "enemy-attack": {
          "0%": { transform: "translateY(0) scale(1)" },
          "35%": { transform: "translateY(16px) scale(1.06)" },
          "65%": { transform: "translateY(16px) scale(1.06)" },
          "100%": { transform: "translateY(0) scale(1)" },
        },
        // Player hit flash: brief red tint when taking damage
        "player-hit": {
          "0%": { boxShadow: "0 0 0 0 rgba(239,68,68,0)" },
          "20%": { boxShadow: "0 0 0 4px rgba(239,68,68,0.8)" },
          "100%": { boxShadow: "0 0 0 0 rgba(239,68,68,0)" },
        },
        // Card discard: cards fly toward the discard pile button.
        // --tx / --ty are set dynamically per card via JS (HandArea.tsx).
        "card-discard": {
          "0%": { opacity: "1", transform: "translate(0, 0) scale(1)" },
          "100%": {
            opacity: "0",
            transform: "translate(var(--tx, 0px), var(--ty, 60px)) scale(0.35)",
          },
        },
        // Enemy summon: smooth arrival instead of hard pop
        "enemy-summon-enter": {
          "0%": { opacity: "0", transform: "translateY(-12px) scale(0.92)" },
          "60%": { opacity: "1", transform: "translateY(2px) scale(1.03)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        "title-glow": {
          "0%, 100%": {
            filter:
              "drop-shadow(0 0 12px rgba(245,158,11,0.55)) drop-shadow(0 0 35px rgba(245,158,11,0.18))",
          },
          "50%": {
            filter:
              "drop-shadow(0 0 24px rgba(245,158,11,0.85)) drop-shadow(0 0 70px rgba(245,158,11,0.32))",
          },
        },
        "ambient-float": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-12px)" },
        },
        "menu-line-in": {
          "0%": { width: "0", opacity: "0" },
          "100%": { width: "2rem", opacity: "1" },
        },
        scanline: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100vh)" },
        },
        // Enemy death: flash bright then dissolve
        "enemy-death": {
          "0%": {
            opacity: "1",
            transform: "scale(1)",
            filter: "grayscale(0) brightness(1)",
          },
          "22%": {
            opacity: "1",
            transform: "scale(1.07)",
            filter: "grayscale(0.2) brightness(2.2)",
          },
          "60%": {
            opacity: "0.55",
            transform: "scale(0.94)",
            filter: "grayscale(0.8) brightness(0.6)",
          },
          "100%": {
            opacity: "0.3",
            transform: "scale(1)",
            filter: "grayscale(1) brightness(1)",
          },
        },
        // Screen mount: fade + slide up
        "screen-enter": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        // Buff gained (positive): green inset flash
        "buff-gain-flash": {
          "0%": { backgroundColor: "rgba(34,197,94,0)" },
          "35%": { backgroundColor: "rgba(34,197,94,0.38)" },
          "100%": { backgroundColor: "rgba(34,197,94,0)" },
        },
        // Debuff gained (negative): red inset flash
        "debuff-gain-flash": {
          "0%": { backgroundColor: "rgba(239,68,68,0)" },
          "35%": { backgroundColor: "rgba(239,68,68,0.38)" },
          "100%": { backgroundColor: "rgba(239,68,68,0)" },
        },
        // Boss phase 2 trigger: dramatic gold-to-red flash
        "boss-phase-flash": {
          "0%": { opacity: "0" },
          "12%": { opacity: "0.85" },
          "45%": { opacity: "0.6" },
          "100%": { opacity: "0" },
        },
        "enemy-idle": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-5px)" },
        },
        // AOE card hit: staggered flash per enemy; backgroundColor set inline per card type
        "aoe-hit": {
          "0%": { opacity: "0" },
          "28%": { opacity: "0.9" },
          "100%": { opacity: "0" },
        },
        // Reward item staggered entry
        "reward-enter": {
          "0%": { opacity: "0", transform: "translateY(10px) scale(0.97)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        // POWER card outer glow pulse
        "power-pulse": {
          "0%, 100%": {
            boxShadow:
              "0 0 8px 2px rgba(167,139,250,0.32), 0 0 0 0 rgba(167,139,250,0)",
          },
          "50%": {
            boxShadow:
              "0 0 24px 7px rgba(167,139,250,0.62), 0 0 40px 10px rgba(167,139,250,0.18)",
          },
        },
      },
      animation: {
        "float-up": "float-up 0.8s ease-out forwards",
        shake: "shake 0.3s ease-in-out",
        "card-play": "card-play 0.28s ease-in forwards",
        "enemy-acting": "enemy-acting 0.7s ease-in-out infinite",
        "enemy-attack": "enemy-attack 0.35s ease-in-out forwards",
        "player-hit": "player-hit 0.5s ease-out forwards",
        "card-discard": "card-discard 0.35s ease-in forwards",
        "enemy-summon-enter": "enemy-summon-enter 0.55s ease-out forwards",
        "title-glow": "title-glow 4s ease-in-out infinite",
        "ambient-float": "ambient-float 7s ease-in-out infinite",
        "enemy-death": "enemy-death 0.5s ease-out forwards",
        "screen-enter": "screen-enter 0.32s ease-out both",
        "buff-gain-flash": "buff-gain-flash 0.55s ease-out both",
        "debuff-gain-flash": "debuff-gain-flash 0.55s ease-out both",
        "boss-phase-flash": "boss-phase-flash 1.0s ease-out forwards",
        "enemy-idle": "enemy-idle 3.6s ease-in-out infinite",
        "reward-enter": "reward-enter 0.36s ease-out both",
        "aoe-hit": "aoe-hit 0.28s ease-out both",
        "power-pulse": "power-pulse 2.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
