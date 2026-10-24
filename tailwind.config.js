/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: { sans: ['"DM Sans"', "system-ui", "-apple-system", "sans-serif"] },
      colors: {
        ink: "rgb(var(--ink) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        page: "rgb(var(--page) / <alpha-value>)",
        band: "rgb(var(--band) / <alpha-value>)",
        panel: "rgb(var(--panel) / <alpha-value>)",
        line: "rgb(var(--line) / <alpha-value>)",
        accent: "rgb(var(--accent) / <alpha-value>)",
        safe: "rgb(var(--safe) / <alpha-value>)",
      },
      borderRadius: { panel: "28px" },
      letterSpacing: { tightest: "-0.045em" },
    },
  },
  plugins: [],
};
