import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-instrument)', 'system-ui', 'sans-serif'],
        doc: ['var(--font-doc-default)', 'system-ui', 'sans-serif'],
      },
      colors: {
        velr: {
          paper: '#ffffff',
          canvas: '#f8fafe',
          surface: '#f8fafe',
          'surface-container': '#f1f5f9',
          rule: '#c6c6c6',
          ink: '#202124',
          accent: '#1a73e8',
          'accent-hover': '#1765cc',
          subtle: '#5f6368',
          chip: '#e8f0fe',
          'chip-text': '#1967d2',
        },
      },
      boxShadow: {
        page: '0 1px 3px 1px rgba(60,64,67,0.15)',
        toolbar: 'inset 0 -1px 0 rgba(0,0,0,0.06)',
      },
    },
  },
  plugins: [],
};

export default config;
