/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        card: 'hsl(0 0% 100%)',
        'card-foreground': 'hsl(222.2 84% 4.9%)',
      },
    },
  },
  plugins: [],
}