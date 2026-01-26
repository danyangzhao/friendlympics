import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Spring pastel palette
        background: "#FFFBF5",
        foreground: "#5D4E60",
        
        // Primary pastels
        peach: {
          50: "#FFF5F0",
          100: "#FFE8DD",
          200: "#FFD5C2",
          300: "#FFBEA3",
          400: "#FFA07A",
          500: "#FF8B5E",
          DEFAULT: "#FFB5A7",
        },
        butter: {
          50: "#FFFEF5",
          100: "#FFFCE8",
          200: "#FFF8CC",
          300: "#FFF3B0",
          400: "#FFE066",
          500: "#FFD93D",
          DEFAULT: "#FFF3B0",
        },
        mint: {
          50: "#F5FFFA",
          100: "#E8FFF3",
          200: "#C7F5DC",
          300: "#B5EAD7",
          400: "#98D8AA",
          500: "#7BC9A3",
          DEFAULT: "#B5EAD7",
        },
        sky: {
          50: "#F5FCFF",
          100: "#E8F7FF",
          200: "#C7ECFF",
          300: "#A8D8EA",
          400: "#8BD3E6",
          500: "#6BC5D9",
          DEFAULT: "#A8D8EA",
        },
        lavender: {
          50: "#FAF5FF",
          100: "#F3E8FF",
          200: "#E9D5FF",
          300: "#D8B4FE",
          400: "#C4A1E8",
          500: "#A78BDB",
          DEFAULT: "#E2D1F9",
        },
        
        // Team colors (softer pastels)
        "team-peach": {
          light: "#FFE5DC",
          DEFAULT: "#FFB5A7",
          dark: "#E89B8E",
        },
        "team-mint": {
          light: "#D4F5E9",
          DEFAULT: "#B5EAD7",
          dark: "#8ED4BE",
        },
        
        // Neutrals
        cream: {
          50: "#FFFDFB",
          100: "#FFFBF5",
          200: "#FFF7ED",
          300: "#FFF3E4",
          400: "#FFEBD4",
          DEFAULT: "#FFFBF5",
        },
        warm: {
          50: "#FAF8F5",
          100: "#F5F0EB",
          200: "#EBE4DC",
          300: "#DDD4C8",
          400: "#C7BAA8",
          500: "#A69888",
          600: "#7D7168",
          700: "#5D5248",
          800: "#3D3632",
          900: "#2A2523",
        },
      },
      fontFamily: {
        sans: ['var(--font-nunito)', 'Nunito', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'blob': '60% 40% 50% 50% / 50% 50% 40% 60%',
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(93, 78, 96, 0.08)',
        'soft-lg': '0 8px 30px -4px rgba(93, 78, 96, 0.12)',
        'soft-xl': '0 12px 40px -6px rgba(93, 78, 96, 0.15)',
        'glow-peach': '0 0 30px rgba(255, 181, 167, 0.4)',
        'glow-mint': '0 0 30px rgba(181, 234, 215, 0.4)',
        'glow-sky': '0 0 30px rgba(168, 216, 234, 0.4)',
        'glow-pink': '0 0 30px rgba(255, 182, 193, 0.4)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'float-slow': 'float 8s ease-in-out infinite',
        'wiggle': 'wiggle 3s ease-in-out infinite',
        'sparkle': 'sparkle 2s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
        sparkle: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.5', transform: 'scale(0.8)' },
        },
      },
    },
  },
  plugins: [],
};
export default config;
