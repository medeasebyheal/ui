/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#069285',
        'success-green': '#10b981',
      },
      fontFamily: {
        heading: ['Outfit', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        quiz: ['Lexend', 'sans-serif'],
      },
      backgroundImage: {
        'pastel-quiz': 'linear-gradient(135deg, #e0e7ff 0%, #fae8ff 50%, #dcfce7 100%)',
      },
      animation: {
        'spin-slow': 'spin 20s linear infinite',
        'wave': 'wave 3s ease-in-out infinite',
        'slide-left': 'slideLeft 60s linear infinite',
      },
      keyframes: {
        wave: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        slideLeft: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        }
      },
    },
  },
  plugins: [],
}

