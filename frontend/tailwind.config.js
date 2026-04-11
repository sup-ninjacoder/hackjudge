/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        avax: {
          red:   "#E84142",
          dark:  "#0F0F0F",
          card:  "#161616",
          border:"#2A2A2A",
          muted: "#666666",
        },
      },
      fontFamily: {
        mono: ["'JetBrains Mono'", "monospace"],
        display: ["'Space Grotesk'", "sans-serif"],
      },
      animation: {
        "fade-in":   "fadeIn 0.4s ease forwards",
        "slide-up":  "slideUp 0.4s ease forwards",
        "pulse-red": "pulseRed 2s infinite",
      },
      keyframes: {
        fadeIn:  { from: { opacity: 0 },                    to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: "translateY(12px)" }, to: { opacity: 1, transform: "translateY(0)" } },
        pulseRed:{ "0%,100%": { boxShadow: "0 0 0 0 rgba(232,65,66,0)" }, "50%": { boxShadow: "0 0 0 6px rgba(232,65,66,0.2)" } },
      },
    },
  },
  plugins: [],
};
