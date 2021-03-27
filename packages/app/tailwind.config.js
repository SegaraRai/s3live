/* globals module */

module.exports = {
  future: {
    removeDeprecatedGapUtilities: true,
  },
  darkMode: 'class',
  purge: ['./src/**/*.vue'],
  theme: {
    extend: {
      colors: {
        gray: {
          100: '#f5f5f5',
          200: '#eeeeee',
          300: '#e0e0e0',
          400: '#bdbdbd',
          500: '#9e9e9e',
          600: '#757575',
          700: '#616161',
          800: '#424242',
          900: '#212121',
        },
      },
    },
  },
  variants: {
    opacity: ['dark', 'DEFAULT', 'disabled'],
    backgroundColor: ['dark', 'DEFAULT', 'hover', 'disabled'],
    cursor: ['DEFAULT', 'disabled'],
  },
  plugins: [
    //
    require('@tailwindcss/aspect-ratio'),
  ],
};
