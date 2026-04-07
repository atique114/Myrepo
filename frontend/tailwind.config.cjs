module.exports = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#ecfeff',
          100: '#cffafe',
          300: '#67e8f9',
          500: '#06b6d4',
          600: '#0891b2',
          700: '#0e7490',
        },
        accent: {
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309'
        }
      },
      transitionProperty: {
        'height': 'height'
      }
    },
  },
  plugins: [],
}
