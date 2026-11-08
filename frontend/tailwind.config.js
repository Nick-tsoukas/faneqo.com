/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      './components/**/*.{vue,js}',
      './layouts/**/*.vue',
      './pages/**/*.vue',
      './plugins/**/*.{js,ts}',
      './nuxt.config.{js,ts}',
    ],
    theme: {
      extend: {
        typography: (theme) => ({
          invert: {
            css: {
              color: theme('colors.gray.100'),
              a: { color: theme('colors.pink.400') },
              h1: { color: theme('colors.white') },
              h2: { color: theme('colors.white') },
              strong: { color: theme('colors.white') },
              blockquote: {
                borderLeftColor: theme('colors.pink.500'),
                color: theme('colors.pink.100'),
              },
              // etc.
            },
          },
        }),
        keyframes: {
          slideinview: {
            '0%, 100%': { transform: 'rotate(-3deg)' },
            '50%': { transform: 'rotate(3deg)' },
          }
        },
        fontFamily: {
          sans: ['Poppins', 'sans-serif'],
        },
        textColor: {
          DEFAULT: '#2C2C2C',
        },
        colors: {
          'darkgray': '#282a2a',
          'lightgray': '#1d1c20',
          'off-black': '#191414',
          'off-white': '#F5F5F5',
          // Override default black and white
          black: '#000',
          white: '#fff',
          green: '#1db954',
          'neon-green': '#39FF14',
          'neon-purple': '#9100FF',
          'accent': '#FF00FF',
          'complementary1': '#00FFFF',
          'complementary2': '#FFD700',
        },
        textColor: {
          'default-black': '#2C2C2C',
          'default-white': '#F5F5F5',
        },
        backgroundColor: {
          'default-black': '#2C2C2C',
          'default-white': '#F5F5F5',
        },
      },
    },
    plugins: [require('@tailwindcss/typography')],
  };
  