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
        'syne': ['Syne', 'sans-serif'],
        'inter': ['Inter', 'sans-serif'],
      },
      colors: {
        'vibe': {
          'bg': '#0A0A0F',
          'card': '#111118',
          'input': '#1A1A24',
          'purple': '#7C3AED',
          'teal': '#14B8A6',
          'text': '#F1F0FF',
          'muted': '#9490A8',
          'border': 'rgba(255,255,255,0.07)',
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float-up': 'floatUp 2s ease-out forwards',
        'eq1': 'eq 0.8s ease-in-out infinite alternate',
        'eq2': 'eq 1.1s ease-in-out infinite alternate',
        'eq3': 'eq 0.6s ease-in-out infinite alternate',
        'eq4': 'eq 0.9s ease-in-out infinite alternate',
      },
      keyframes: {
        floatUp: {
          '0%': { transform: 'translateY(0)', opacity: '1' },
          '100%': { transform: 'translateY(-100px)', opacity: '0' }
        },
        eq: {
          '0%': { height: '4px' },
          '100%': { height: '20px' }
        }
      }
    },
  },
  plugins: [],
}
