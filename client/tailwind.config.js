/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        border: "rgba(0, 0, 0, 0.1)",
        input: "rgba(0, 0, 0, 0.05)",
        ring: "#000000",
        background: "#ffffff",
        foreground: "#09090b",
        zinc: {
          950: '#09090b',
          900: '#18181b',
          850: '#202024',
          800: '#27272a',
          700: '#3f3f46',
          600: '#52525b',
          500: '#71717a',
          400: '#a1a1aa',
          300: '#d4d4d8',
          200: '#e4e4e7',
          100: '#f4f4f5',
          50: '#fafafa',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'system-ui', 'sans-serif'],
        mono: ['Fira Code', 'Courier New', 'monospace'],
      },
      boxShadow: {
        'glass': '0 4px 20px 0 rgba(0, 0, 0, 0.05), inset 0 0 0 1px rgba(0, 0, 0, 0.06)',
        'glass-hover': '0 10px 30px 0 rgba(0, 0, 0, 0.1), inset 0 0 0 1px rgba(0, 0, 0, 0.12)',
        'glow-black': '0 4px 20px -2px rgba(0, 0, 0, 0.25)',
        'glow-black-strong': '0 8px 30px -4px rgba(0, 0, 0, 0.35)',
        'glow-white': '0 2px 10px -1px rgba(0, 0, 0, 0.1)',
        'glow-white-strong': '0 4px 20px -2px rgba(0, 0, 0, 0.15)',
      },
      animation: {
        'shimmer': 'shimmer 2.5s infinite linear',
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 5s ease-in-out infinite',
        'meteor-effect': 'meteor 5s linear infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        meteor: {
          '0%': { transform: 'rotate(215deg) translateX(0)', opacity: '1' },
          '70%': { opacity: '1' },
          '100%': {
            transform: 'rotate(215deg) translateX(-500px)',
            opacity: '0',
          },
        },
      }
    },
  },
  plugins: [],
}
