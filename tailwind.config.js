/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        heading: ['Outfit', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        quiz: ['Lexend', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'sans-serif'],
      },
      backgroundImage: {
        'pastel-quiz': 'linear-gradient(135deg, rgba(6,146,133,0.08) 0%, #e0e7ff 25%, #fae8ff 50%, #dcfce7 100%)',
        'student-page': 'linear-gradient(135deg, rgba(6,146,133,0.06) 0%, rgba(6,146,133,0.02) 50%, #f8fafc 100%)',
      },
      colors: {
        primary: '#069285',
        'success-green': '#10b981',
        'background-light': '#F8FAFC',
        'background-dark': '#0F172A',
        'accent-teal': '#0E9F8E',
        'accent-blue': '#38BDF8',
      },
      animation: {
        'spin-slow': 'spin 20s linear infinite',
        'wave': 'wave 3s ease-in-out infinite',
        'slide-left': 'slideLeft 60s linear infinite',
        'float': 'float 6s ease-in-out infinite',
        'fade-in-up': 'fadeInUp 0.7s ease-out forwards',
        'blob': 'blob 8s ease-in-out infinite',
        'scale-in': 'scaleIn 0.6s ease-out forwards',
      },
      keyframes: {
        wave: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        slideLeft: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        blob: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(20px, -20px) scale(1.05)' },
          '66%': { transform: 'translate(-10px, 10px) scale(0.95)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
}

