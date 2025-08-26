/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: '#21c0e8',
        'brand-dark': '#3367D6',
      },
    },
  },
  plugins: [],
};
