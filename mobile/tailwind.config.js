/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}", "./lib/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        field: {
          50: "#f4faf5",
          100: "#e5f3e6",
          500: "#3d8b55",
          700: "#24623b",
          900: "#123524"
        },
        soil: {
          100: "#f4e6cf",
          400: "#b77938",
          700: "#6b3f1d"
        },
        skyalert: "#dbeafe",
        sun: "#f5b642"
      }
    }
  },
  plugins: []
};
