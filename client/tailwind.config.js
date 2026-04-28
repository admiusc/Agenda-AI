export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#080f1e',
          900: '#0d1526',
          800: '#141f33',
          700: '#1e2d45',
          600: '#2a3d57',
          500: '#374f6b',
        },
        brand: {
          DEFAULT: '#6366f1',
          dark:    '#4f46e5',
          light:   '#818cf8',
          blue:    '#3b82f6',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)',
        'gradient-brand-soft': 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(59,130,246,0.15) 100%)',
      },
      boxShadow: {
        'glow-brand': '0 0 20px rgba(99,102,241,0.4)',
        'glow-sm':    '0 0 10px rgba(99,102,241,0.25)',
        'card':       '0 1px 3px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)',
      },
      animation: {
        'fade-in':    'fadeIn 0.3s ease-out both',
        'slide-up':   'slideUp 0.4s ease-out both',
        'slide-in':   'slideIn 0.3s ease-out both',
        'scale-in':   'scaleIn 0.3s ease-out both',
        'bounce-in':  'bounceIn 0.5s cubic-bezier(0.34,1.56,0.64,1) both',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'spin-slow':  'spin 3s linear infinite',
      },
      keyframes: {
        fadeIn:    { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp:   { from: { opacity: '0', transform: 'translateY(20px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideIn:   { from: { opacity: '0', transform: 'translateX(-16px)' }, to: { opacity: '1', transform: 'translateX(0)' } },
        scaleIn:   { from: { opacity: '0', transform: 'scale(0.95)' }, to: { opacity: '1', transform: 'scale(1)' } },
        bounceIn:  {
          '0%':   { opacity: '0', transform: 'scale(0.5)' },
          '60%':  { transform: 'scale(1.1)' },
          '80%':  { transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pulseSoft: { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.6' } },
      },
    },
  },
  plugins: [],
};
