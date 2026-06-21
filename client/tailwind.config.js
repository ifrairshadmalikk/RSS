export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui']
      },
      colors: {
        ink: '#101828',
        frost: 'rgba(255,255,255,0.72)'
      },
      boxShadow: {
        soft: '0 12px 34px rgba(15, 23, 42, 0.08)',
        card: '0 8px 22px rgba(15, 23, 42, 0.045)'
      }
    }
  },
  plugins: []
};
