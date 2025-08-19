/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx,html}"],
  theme: {
    extend: {
      width: {
        '1778': '1778px',
      },
      height: {
        '87': '87px',
      },
            fontFamily: {
        poppins: ["Poppins", "sans-serif"],
      },
      borderRadius: {
        '20': '20px'
      },
      screens: {
        'md-lg': '900px', // Novo breakpoint entre md e lg
      },
    },
  },
  plugins: [],
}