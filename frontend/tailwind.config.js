/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          DEFAULT: '#F5F1E8',
          paper: '#F5F1E8',
          light: '#FFFAF0',
        },
        espresso: {
          DEFAULT: '#4A3B32',
          text: '#4A3B32',
        },
        sepia: {
          DEFAULT: '#8D7458',
          dim: 'rgba(141, 116, 88, 0.5)',
        },
        porcelain: {
          DEFAULT: '#6B8B9E',
          hover: '#5A7A8D',
        },
        rose: {
          DEFAULT: '#C27E7E',
        },
        gold: {
          DEFAULT: '#C8A974',
        }
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'serif'],
        sans: ['"Inter"', 'sans-serif'], // Or Lora/Merriweather as per design, using Inter for UI text is safer for legibility initially, can swap.
        body: ['"Lora"', 'serif'],
      },
      boxShadow: {
        'vintage': '0 4px 20px -2px rgba(141, 116, 88, 0.25)', // Sepia shadow
      }
    },
  },
  plugins: [],
}
