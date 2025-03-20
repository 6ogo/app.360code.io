/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'hsl(217, 91%, 60%)',
          hover: 'hsl(217, 91%, 55%)',
          light: 'hsla(217, 91%, 60%, 0.1)',
          dark: 'hsl(224, 76%, 48%)',
        },
        background: 'hsl(222, 47%, 5%)',
        foreground: 'hsl(210, 40%, 98%)',
        card: 'hsl(222, 47%, 7%)',
        'card-foreground': 'hsl(210, 40%, 98%)',
        border: 'hsla(217, 32%, 17%, 0.5)',
        muted: 'hsl(217, 32%, 17%)',
        'muted-foreground': 'hsl(215, 20%, 65%)',
      },
      boxShadow: {
        glow: '0 0 20px rgba(59, 130, 246, 0.3)',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out',
        pulse: 'pulse 8s infinite alternate',
        spin: 'spin 1s linear infinite',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulse: {
          '0%': { opacity: '0.4' },
          '100%': { opacity: '0.7' },
        },
      },
    },
  },
  plugins: [],
}