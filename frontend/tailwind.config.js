/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        // We match 'primary' to Indigo to fit the "Stripe/Linear" aesthetic
        // This allows you to use 'bg-primary-600' or 'bg-indigo-600' interchangeably
        primary: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1', // Indigo 500
          600: '#4f46e5', // Indigo 600 (Main Brand Color)
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        // Explicitly defining Slate ensures consistency across browsers
        slate: {
          50: '#f8fafc',  // Ultra light background
          100: '#f1f5f9', // Card borders
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8', // Subtext
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b', // Sidebar Dark
          900: '#0f172a', // Sidebar Darker
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'), // <--- CRITICAL for the Search Bar
  ],
}