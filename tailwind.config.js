/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#9F9586', // The requested Olive/Taupe
          light: '#B7AD9E',
          dark: '#8A8173',
        },
        secondary: {
          DEFAULT: '#EFECE5', // Cream/Beige for backgrounds
          light: '#FDFBF7',
          dark: '#DCD8CF',
        },
        text: {
          main: '#5C5548', // Deep Earth Tone
          light: '#9F9586',
          inverse: '#FDFBF7',
        },
        accent: {
          DEFAULT: '#A67C52', // Warm wood/brown accent
          hover: '#8C6842',
        }
      },
      fontFamily: {
        sans: ['"Noto Sans TC"', 'sans-serif'],
        serif: ['"Playfair Display"', 'serif'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}