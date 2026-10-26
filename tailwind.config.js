/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],

  presets: [require("nativewind/preset")],
  darkMode: "class",

  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background) / <alpha-value>)",
        foreground: "hsl(var(--foreground) / <alpha-value>)",

        card: {
          DEFAULT: "hsl(var(--card) / <alpha-value>)",
          foreground: "hsl(var(--card-foreground) / <alpha-value>)",
        },

        primary: {
          DEFAULT: "hsl(var(--primary) / <alpha-value>)",
          foreground: "hsl(var(--primary-foreground) / <alpha-value>)",
          soft: "hsl(var(--primary-soft) / <alpha-value>)",
        },

        secondary: {
          DEFAULT: "hsl(var(--secondary) / <alpha-value>)",
          foreground: "hsl(var(--secondary-foreground) / <alpha-value>)",
        },

        muted: {
          DEFAULT: "hsl(var(--muted) / <alpha-value>)",
          foreground: "hsl(var(--muted-foreground) / <alpha-value>)",
        },

        "subtle-foreground": "hsl(var(--subtle-foreground) / <alpha-value>)",

        accent: {
          DEFAULT: "hsl(var(--accent) / <alpha-value>)",
          foreground: "hsl(var(--accent-foreground) / <alpha-value>)",
        },

        success: {
          DEFAULT: "hsl(var(--success) / <alpha-value>)",
          foreground: "hsl(var(--success-foreground) / <alpha-value>)",
          soft: "hsl(var(--success-soft) / <alpha-value>)",
        },

        warning: {
          DEFAULT: "hsl(var(--warning) / <alpha-value>)",
          foreground: "hsl(var(--warning-foreground) / <alpha-value>)",
          soft: "hsl(var(--warning-soft) / <alpha-value>)",
        },

        destructive: {
          DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
          foreground: "hsl(var(--destructive-foreground) / <alpha-value>)",
          soft: "hsl(var(--destructive-soft) / <alpha-value>)",
        },

        border: "hsl(var(--border) / <alpha-value>)",
        input: "hsl(var(--input) / <alpha-value>)",
        ring: "hsl(var(--ring) / <alpha-value>)",
        track: "hsl(var(--track) / <alpha-value>)",

        chart: {
          normal: "hsl(var(--chart-normal) / <alpha-value>)",
          above: "hsl(var(--chart-above) / <alpha-value>)",
          peak: "hsl(var(--chart-peak) / <alpha-value>)",
          goal: "hsl(var(--chart-goal) / <alpha-value>)",
          grid: "hsl(var(--chart-grid) / <alpha-value>)",
        },
      },

      fontFamily: {
        sans: ["Poppins_400Regular"],
        medium: ["Poppins_500Medium"],
        semibold: ["Poppins_600SemiBold"],
        bold: ["Poppins_700Bold"],
      },

      fontSize: {
        overline: ["11px", "14px"],
        caption: ["12px", "16px"],
        footnote: ["13px", "18px"],
        body: ["15px", "22px"],
        callout: ["16px", "24px"],
        title3: ["18px", "24px"],
        title2: ["22px", "28px"],
        title1: ["26px", "32px"],
        display: ["30px", "36px"],
        metric: ["40px", "44px"],
      },

      borderRadius: {
        xs: "8px",
        sm: "12px",
        md: "14px",
        lg: "16px",
        xl: "20px",
        pill: "999px",
      },

      spacing: {
        screen: "20px",
        gutter: "16px",
        card: "18px",
      },
    },
  },

  plugins: [],
};
