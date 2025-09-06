/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx,html}"],
  theme: {
    extend: {
      width: {
        '1778': '1778px',
        '2.5/5': '40%',
      },
      height: {
        '87': '87px',
      },
      fontFamily: {
        poppins: ["Poppins", "sans-serif"],
        GT: ["GT Walsheim Pro", "sans-serif"],
      },
      borderRadius: {
        '20': '20px'
      },
      screens: {
        'md-lg': '900px',
        'xl-2xl': '1800px',
      },
      colors: {
        azulEscuro: '#191B40',
        roxo: '#494594',
        claro: '#9F9CE8',
        cinza: '#2B2B2B',
        verde: '#B2F5A3',
      },
    },
  },
  plugins: [],
}
