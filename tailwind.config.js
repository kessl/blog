module.exports = {
  content: [
    './_includes/**/*.html',
    './_layouts/**/*.html',
    './_posts/*.md',
    './*.html',
    './*.md',
  ],
  darkMode: 'class',
  theme: {
    screens: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
    spacing: {
      0: '0px',
      15: '15px',
      30: '30px',
      60: '60px',
      90: '90px',
      120: '120px',
      150: '150px',
      180: '180px',
    },
    colors: {
      white: '#fff',
      light: '#eee',
      'dark-20': '#c5c5c5',
      'dark-40': '#9c9c9c',
      'dark-60': '#747474',
      'dark-80': '#4b4b4b',
      dark: '#222',
      transparent: 'transparent',
    },
    fontSize: {
      '2xs': ['0.64rem', { lineHeight: '1rem' }],
      xs: ['0.75rem', { lineHeight: '1rem' }],
      sm: ['0.875rem', { lineHeight: '1.25rem' }],
      base: ['18px', { lineHeight: '30px' }],
      lg: ['1.125rem', { lineHeight: '1.75rem' }],
      xl: ['1.25rem', { lineHeight: '1.75rem' }],
      '2xl': ['1.5rem', { lineHeight: '2rem' }],
      '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
      '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
      '5xl': ['3rem', { lineHeight: '1' }],
      '6xl': ['3.75rem', { lineHeight: '1' }],
      '7xl': ['4.5rem', { lineHeight: '1' }],
      '8xl': ['6rem', { lineHeight: '1' }],
      '9xl': ['8rem', { lineHeight: '1' }],
    },
    fontFamily: {
      mono: [
        'Inconsolata',
        'ui-monospace',
        'SFMono-Regular',
        'Menlo',
        'Monaco',
        'Consolas',
        '"Liberation Mono"',
        '"Courier New"',
        'monospace',
      ],
      heading: [
        'Noah',
        'ui-monospace',
        'SFMono-Regular',
        'Menlo',
        'Monaco',
        'Consolas',
        '"Liberation Mono"',
        '"Courier New"',
        'monospace',
      ],
    },
    maxWidth: ({ theme, breakpoints }) => ({
      ...theme('spacing'),
      none: 'none',
      0: '0rem',
      full: '100%',
      min: 'min-content',
      max: 'max-content',
      fit: 'fit-content',
    }),
    extend: {
      typography: {
        DEFAULT: {
          css: {
            a: 'dark:text-light underline',
            strong: 'dark:text-light',
            pre: null,
            code: null,
            'code::before': null,
            'code::after': null,
          },
        },
      },
    },
  },
  variants: {},
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
