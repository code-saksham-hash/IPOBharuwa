import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'sans-serif'],
      },
      colors: {
        surface: {
          page: '#FAFAFA',
          card: '#FFFFFF',
          sidebar: '#F5F5F4',
          hover: '#F5F5F5',
        },
        status: {
          green:  { bg: '#E1F5EE', text: '#0F6E56' },
          amber:  { bg: '#FAEEDA', text: '#854F0B' },
          red:    { bg: '#FCEBEB', text: '#A32D2D' },
          gray:   { bg: '#F1EFE8', text: '#5F5E5A' },
          blue:   { bg: '#E6F1FB', text: '#185FA5' },
          purple: { bg: '#EEEDFE', text: '#534AB7' },
        },
        statusDark: {
          green:  { bg: '#0A2E1A', text: '#4ADE80' },
          amber:  { bg: '#2D1E00', text: '#FBB040' },
          red:    { bg: '#2E0A0A', text: '#F87171' },
          gray:   { bg: '#1C1C1C', text: '#A3A3A3' },
          blue:   { bg: '#0A1929', text: '#60A5FA' },
          purple: { bg: '#16103A', text: '#A78BFA' },
        },
      },
      fontSize: {
        'stat': ['22px', { lineHeight: '1', fontWeight: '500' }],
      },
    },
  },
  plugins: [],
}

export default config
