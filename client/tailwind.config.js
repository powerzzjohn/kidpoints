/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 植物大战僵尸主题色彩
        pvz: {
          green: '#4ade80',
          brown: '#a3a3a3',
          yellow: '#fbbf24',
          red: '#ef4444',
          purple: '#a855f7',
        },
        // 我的世界主题色彩
        minecraft: {
          grass: '#7cb342',
          dirt: '#8d6e63',
          stone: '#616161',
          diamond: '#03a9f4',
          gold: '#ffc107',
        },
      },
      fontFamily: {
        'game': ['Comic Sans MS', 'cursive'],
        'pixel': ['Courier New', 'monospace'],
      },
      animation: {
        'bounce-slow': 'bounce 2s infinite',
        'pulse-slow': 'pulse 3s infinite',
        'wiggle': 'wiggle 1s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
}