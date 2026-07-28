import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#F2F6F2',
          100: '#E2EEE3',
          200: '#C4DDC7',
          300: '#94BFA0',
          400: '#5C9470',
          500: '#1E4B2C',
          600: '#173E24',
          700: '#11321C',
          800: '#0C2615',
          900: '#07190E',
        },
        gold: {
          50: '#FBF6E8',
          100: '#F4E8C0',
          200: '#EAD791',
          300: '#DEC368',
          400: '#CEB268',
          500: '#B6954A',
          600: '#947634',
        },
        ink: {
          50: '#F6F7F4',
          100: '#E7E9E2',
          200: '#C9CEC2',
          300: '#9BA498',
          400: '#6A7368',
          500: '#3F473D',
          600: '#2C3229',
          700: '#1F2A24',
          800: '#131916',
          900: '#0A0D0B',
        },
        warn: { 500: '#D2913A' },
        danger: { 500: '#C84A3A' },
        ok: { 500: '#2F8F5D' },
      },
      fontFamily: {
        sans: ['"PingFang SC"', '"Hiragino Sans GB"', '"Microsoft YaHei"', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(17, 50, 28, 0.06), 0 8px 24px rgba(17, 50, 28, 0.06)',
      },
    },
  },
  plugins: [],
};
export default config;
