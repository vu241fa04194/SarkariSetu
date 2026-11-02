/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        gov: {
          blue: {
            DEFAULT: '#1e3a8a',
            dark: '#0f2942',
            light: '#3b82f6',
            50: '#eff6ff',
            100: '#dbeafe',
            900: '#1e293b',
          },
          saffron: {
            DEFAULT: '#ea580c',
            light: '#f97316',
            50: '#fff7ed',
          },
          green: {
            DEFAULT: '#047857',
            light: '#059669',
            50: '#ecfdf5',
          },
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'Oxygen',
          'Ubuntu',
          'Cantarell',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
};
