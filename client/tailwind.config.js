/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#8B5CF6',    // Purple
        secondary: '#A78BFA',  // Light Purple
        accent: '#7C3AED',     // Dark Purple
        neutral: '#F3F4F6',    // Light Gray
        'base-100': '#FFFFFF', // White
        'base-content': '#000000', // Black text
      },
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [{
      light: {
        ...require("daisyui/src/theming/themes")["light"],
        "primary": "#8B5CF6",
        "secondary": "#A78BFA",
        "accent": "#7C3AED",
        "neutral": "#F3F4F6",
        "base-100": "#FFFFFF",
        "base-content": "#000000",
      },
    }],
  },
}; 