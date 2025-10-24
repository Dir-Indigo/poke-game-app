/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        'poke-red': '#ff1b1b',
        'poke-yellow': '#ffcb05',
        'poke-blue': '#3b4cca',
        'poke-dark-blue': '#1f2a38',
        'poke-light-bg': '#f0f8ff',
        'poke-dark-text': '#213547',
        'poke-light-text': '#f1f1f1',
      },
    },
  },
  plugins: [],
}
