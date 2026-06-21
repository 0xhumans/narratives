/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#0a0f16",
          50: "#f3f5f8",
          100: "#e4e8ef",
          200: "#c5ced9",
          300: "#9aa8ba",
          400: "#6b7d94",
          500: "#4a5a70",
          600: "#384659",
          700: "#2a3444",
          800: "#1a2230",
          900: "#0f1520",
          950: "#070a10",
        },
        signal: {
          50: "#ecfeff",
          100: "#cffafe",
          200: "#a5f3fc",
          300: "#67e8f9",
          400: "#22d3ee",
          500: "#06b6d4",
          600: "#0891b2",
          700: "#0e7490",
          800: "#155e75",
          900: "#164e63",
        },
        brand: {
          50: "#ecfeff",
          100: "#cffafe",
          200: "#a5f3fc",
          400: "#22d3ee",
          500: "#06b6d4",
          600: "#0891b2",
          700: "#0e7490",
          800: "#155e75",
        },
        neutral: {
          850: "#1a2230",
          900: "#2a3444",
        },
        coral: {
          50: "#fff4f0",
          100: "#ffd9cc",
          800: "#c43302",
        },
        mist: "#f6f8fb",
      },
      fontFamily: {
        sans: ["DM Sans", "system-ui", "sans-serif"],
        display: ["Instrument Serif", "Georgia", "serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(10,15,22,0.04), 0 4px 16px rgba(10,15,22,0.06)",
        lift: "0 8px 30px rgba(10,15,22,0.12)",
        glow: "0 0 40px rgba(6,182,212,0.15)",
        dock: "0 -4px 24px rgba(10,15,22,0.08)",
      },
      backgroundImage: {
        "grid-fade":
          "linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px)",
        "aurora-radial":
          "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(6,182,212,0.22), transparent 55%), radial-gradient(ellipse 50% 40% at 90% 20%, rgba(99,102,241,0.12), transparent 50%)",
      },
      animation: {
        "fade-up": "fadeUp 0.7s ease-out both",
        "fade-up-delay": "fadeUp 0.9s ease-out 0.15s both",
        float: "float 8s ease-in-out infinite",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
      },
    },
  },
  plugins: [],
};
