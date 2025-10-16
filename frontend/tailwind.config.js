/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bitcoin: '#F7931A',
        mezo: '#5B21B6',
      },
    },
  },
  plugins: [],
}



