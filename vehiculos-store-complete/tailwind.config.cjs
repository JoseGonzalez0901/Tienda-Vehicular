/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html","./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        text: "var(--text)",
        muted: "var(--muted)",
        border: "var(--border)",
        primary: "var(--primary)",
        "primary-contrast": "var(--primary-contrast)",
        success: "var(--success)",
        warning: "var(--warning)",
      },
      fontFamily: {
        heading: ["Manrope","Inter","system-ui","sans-serif"],
        body: ["Inter","system-ui","sans-serif"],
      },
      borderRadius: { xl: "14px", "2xl": "20px" },
      boxShadow: {
        card: "0 6px 28px rgba(0,0,0,.25)",
        overlay: "0 8px 36px rgba(10,132,255,.18)",
      }
    },
  },
  plugins: [],
}
