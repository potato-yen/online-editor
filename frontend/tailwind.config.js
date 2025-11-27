// frontend/tailwind.config.js
const defaultTheme = require('tailwindcss/defaultTheme');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class', 
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Noto Sans TC', ...defaultTheme.fontFamily.sans],
        mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'Courier New', 'monospace'],
      },
      // --- 新增動畫設定 ---
      animation: {
        blob: "blob 24s ease-in-out infinite",
        "blob-slow": "blob-slow 32s ease-in-out infinite",
        "blob-reverse": "blob-reverse 28s ease-in-out infinite", // 新增反向動畫
      },
      keyframes: {
        // 原本的動畫 (往右上方跑) - 適合放在左邊的球
        blob: {
          "0%": { transform: "translate3d(0, 0, 0) scale(1)" },
          "20%": { transform: "translate3d(20vw, -18vh, 0) scale(1.12)" },
          "45%": { transform: "translate3d(35vw, 8vh, 0) scale(0.92)" },
          "70%": { transform: "translate3d(-18vw, 12vh, 0) scale(1.05)" },
          "100%": { transform: "translate3d(0, 0, 0) scale(1)" },
        },
        // 慢速柔和動畫，讓色塊更自然
        "blob-slow": {
          "0%": { transform: "translate3d(-5vw, 6vh, 0) scale(0.95)" },
          "25%": { transform: "translate3d(18vw, 28vh, 0) scale(1.08)" },
          "55%": { transform: "translate3d(-22vw, 35vh, 0) scale(1.15)" },
          "80%": { transform: "translate3d(-10vw, -25vh, 0) scale(0.9)" },
          "100%": { transform: "translate3d(-5vw, 6vh, 0) scale(0.95)" },
        },
        // 新增：反向動畫 (往左上方跑) - 適合放在右邊的球 (第四象限)
        "blob-reverse": {
          "0%": { transform: "translate3d(0, 0, 0) scale(1)" },
          "25%": { transform: "translate3d(-25vw, -20vh, 0) scale(1.08)" },
          "55%": { transform: "translate3d(-35vw, 15vh, 0) scale(0.94)" },
          "80%": { transform: "translate3d(22vw, -10vh, 0) scale(1.06)" },
          "100%": { transform: "translate3d(0, 0, 0) scale(1)" },
        },
      },
      // ------------------
      colors: {
        brand: {
          DEFAULT: '#0ea5e9', 
          hover: '#38bdf8',   
          active: '#0284c7',  
          muted: 'rgba(14, 165, 233, 0.1)', 
        },
        surface: {
          base: '#0a0a0a',    
          layer: '#171717',   
          panel: '#262626',   
          elevated: '#404040',
        },
        content: {
          primary: '#f5f5f5',   
          secondary: '#a3a3a3', 
          muted: '#525252',     
          inverse: '#0a0a0a',   
        },
        border: {
          base: '#262626',      
          subtle: '#171717',    
          highlight: '#404040', 
        },
        status: {
          error: '#ef4444',   
          success: '#22c55e', 
          warning: '#eab308', 
          info: '#3b82f6',    
        }
      },
      typography: (theme) => ({
        DEFAULT: {
          css: {
            color: theme('colors.content.primary'),
            a: {
              color: theme('colors.brand.DEFAULT'),
              '&:hover': {
                color: theme('colors.brand.hover'),
              },
            },
            'code::before': { content: '""' },
            'code::after': { content: '""' },
            code: {
              backgroundColor: theme('colors.surface.panel'),
              color: theme('colors.content.primary'),
              padding: '0.2em 0.4em',
              borderRadius: '0.25rem',
              fontWeight: '400',
            },
          },
        },
      }),
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
