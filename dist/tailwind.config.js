const config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: "#0a0a0a",
          main: "#161622",
          secondary: "#1e1e2e",
          tertiary: "#252538",
          card: "#1e1e2e",
          hover: "#252538",
        },
        cyan: { DEFAULT: "#00FFFF", dim: "#00b8b8", dark: "#006666" },
        amber: { DEFAULT: "#FFBF00", dim: "#cc9900", dark: "#664d00" },
        border: { DEFAULT: "#27273a" },
        muted: { DEFAULT: "#71717a" },
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        mono: ["Roboto Mono", "monospace"],
      },
      maxWidth: {
        site: "1200px",
      },
    },
  },
  plugins: [],
};
export default config;
