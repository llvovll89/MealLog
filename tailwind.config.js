/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        primary: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-brand': 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
        'gradient-warm': 'linear-gradient(135deg, #eff6ff 0%, #f0f4ff 50%, #f5f3ff 100%)',
      },
      boxShadow: {
        'soft': '0 1px 6px -1px rgba(0, 0, 0, 0.06), 0 2px 8px -2px rgba(0, 0, 0, 0.04)',
        'medium': '0 2px 14px -4px rgba(0, 0, 0, 0.1)',
        'strong': '0 4px 24px -4px rgba(37, 99, 235, 0.12), 0 2px 8px -2px rgba(0, 0, 0, 0.06)',
        'glow': '0 0 20px rgba(37, 99, 235, 0.4)',
        'glow-sm': '0 0 10px rgba(37, 99, 235, 0.25)',
        'inner-soft': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
        'card': '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(37,99,235,0.08)',
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'slide-up': 'slide-up 0.4s ease-out',
        'slide-down': 'slide-down 0.4s ease-out',
        'fade-in': 'fade-in 0.3s ease-in',
        'scale-in': 'scale-in 0.2s ease-out',
        'wiggle': 'wiggle 1s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        'slide-up': {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-down': {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-in': {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'wiggle': {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      }
    },
  },
  plugins: [],
}
