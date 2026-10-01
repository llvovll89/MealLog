/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontSize: { xs: ['0.8125rem', '1.55'], sm: ['0.9375rem', '1.6'] },
      colors: {
        app: { bg: "var(--app-bg)", primary: "var(--app-primary)", text: "var(--app-text)", border: "var(--app-border)", tint: "var(--app-tint)" },
        red: { 500: '#bd3e4f', 600: '#a63242' },
        green: { 500: '#477360', 600: '#3c6b51' },
        blue: { 500: '#426b9c', 600: '#365b88' },
        pink: { 500: '#ad4473', 600: '#97365f' },
        yellow: { 500: '#86631c', 600: '#80601b' },
        orange: { 500: '#ad5826', 600: '#985025' },
        brand: {
          50: '#f3f8fc',
          100: '#e8f2fa',
          200: '#d8e6f0',
          300: '#aecbdf',
          400: '#7ba6c6',
          500: '#3974a6',  // MealLog blue
          600: '#2e6391',
          700: '#263f56',
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
        apple: {
          bg: '#f0f6fa',
          text: '#263f56',
          secondary: '#586b7a',
          border: '#c8dce9',
          'border-light': '#d8e6f0',
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
      boxShadow: {
        'soft': '0 1px 4px rgba(0, 0, 0, 0.06)',
        'medium': '0 2px 12px rgba(0, 0, 0, 0.08)',
        'strong': '0 4px 20px rgba(0, 0, 0, 0.10)',
        'glow': '0 2px 12px rgba(0, 0, 0, 0.08)',
        'glow-sm': '0 1px 6px rgba(0, 0, 0, 0.06)',
        'inner-soft': 'inset 0 1px 3px rgba(0, 0, 0, 0.04)',
        'card': '0 1px 3px rgba(0,0,0,0.05), 0 4px 16px rgba(0,0,0,0.04)',
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
