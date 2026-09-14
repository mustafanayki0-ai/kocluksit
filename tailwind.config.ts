import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Space Grotesk', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 1px 2px rgba(15, 23, 42, 0.04), 0 8px 24px -8px rgba(15, 23, 42, 0.08)',
        card: '0 1px 0 rgba(15, 23, 42, 0.03) inset, 0 10px 30px -15px rgba(15, 23, 42, 0.15)',
        'card-hover':
          '0 4px 6px -1px rgba(15, 23, 42, 0.05), 0 20px 40px -20px rgba(16, 185, 129, 0.25)',
        ring: '0 0 0 4px rgba(14, 165, 233, 0.12)',
        'ring-emerald': '0 0 0 4px rgba(16, 185, 129, 0.12)',
        'xl-soft':
          '0 10px 15px -3px rgba(15, 23, 42, 0.05), 0 4px 6px -4px rgba(15, 23, 42, 0.03)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'fade-in': 'fadeIn 0.4s ease-out both',
        'slide-up': 'slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      backgroundImage: {
        'hero-wash':
          'radial-gradient(circle at 20% 0%, rgba(16,185,129,0.08) 0%, transparent 45%), radial-gradient(circle at 80% 10%, rgba(14,165,233,0.08) 0%, transparent 45%), radial-gradient(circle at 50% 100%, rgba(249,115,22,0.06) 0%, transparent 55%)',
      },
    },
  },
  plugins: [],
};

export default config;
