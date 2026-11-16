/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        toxic: "#39ff14",
        radioactive: "#ffff00",
        ink: { 950: "#050505", 900: "#0a0a0a", 850: "#101210", 800: "#171a17" },
        hazard: { amber: "#ffb000", orange: "#ff6b00", red: "#ff3030" }
      },
      fontFamily: {
        display: ["Orbitron", "sans-serif"],
        body: ["Rajdhani", "sans-serif"],
        mono: ["Share Tech Mono", "monospace"]
      },
      boxShadow: {
        toxic: "0 0 24px rgba(57,255,20,.14)",
        panel: "0 12px 40px rgba(0,0,0,.35)"
      }
    }
  },
  plugins: []
};