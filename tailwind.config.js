/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      keyframes: {
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(28px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "glow-pulse": {
          "0%, 100%": { boxShadow: "0 0 15px 0 rgba(229,9,20,0.3)" },
          "50%": { boxShadow: "0 0 30px 8px rgba(229,9,20,0.5)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.92)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "fade-in-up": "fade-in-up 0.7s ease-out both",
        "fade-in-up-delay-1": "fade-in-up 0.7s ease-out 0.15s both",
        "fade-in-up-delay-2": "fade-in-up 0.7s ease-out 0.3s both",
        "fade-in-up-delay-3": "fade-in-up 0.7s ease-out 0.45s both",
        "fade-in": "fade-in 0.6s ease-out both",
        shimmer: "shimmer 3s linear infinite",
        "glow-pulse": "glow-pulse 3s ease-in-out infinite",
        float: "float 4s ease-in-out infinite",
        "scale-in": "scale-in 0.5s ease-out both",
      },
    },
  },
  plugins: [],
};
