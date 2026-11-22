/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: '#071827', 950: '#040f19' },
        midnight: '#0B2239',
        electric: { DEFAULT: '#168BFF', 300: '#6fb8ff', 600: '#0b6fd6' },
        mist: '#F3F6F9',
        accent: { DEFAULT: '#FF8A32', 600: '#e9701a' },
      },
      fontFamily: {
        display: ['Sora', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      maxWidth: { site: '1240px' },
      boxShadow: {
        glow: '0 0 0 1px rgba(22,139,255,.25), 0 20px 60px -20px rgba(22,139,255,.45)',
        card: '0 20px 50px -25px rgba(7,24,39,.35)',
      },
      backgroundImage: {
        grid: 'linear-gradient(rgba(255,255,255,.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.045) 1px, transparent 1px)',
      },
      keyframes: {
        flow: { to: { strokeDashoffset: '-40' } },
        pulseRing: { '0%': { transform: 'scale(.8)', opacity: '.8' }, '100%': { transform: 'scale(2.2)', opacity: '0' } },
      },
      animation: {
        flow: 'flow 1.2s linear infinite',
        pulseRing: 'pulseRing 1.8s ease-out infinite',
      },
    },
  },
  plugins: [],
};
