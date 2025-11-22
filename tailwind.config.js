/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  theme: {
    extend: {
      colors: {
        'ton-blue': '#0098EA',
        'telegram-blue': '#0088cc',
      },
    },
  },
  plugins: [],
}

