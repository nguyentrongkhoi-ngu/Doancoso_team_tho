/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-poppins)', 'sans-serif'],
        body: ['var(--font-inter)', 'sans-serif'],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: '#4F46E5', // Indigo-600
          foreground: '#ffffff',
        },
        'primary-focus': '#4338CA', // Indigo-700
        'primary-content': '#ffffff',
        secondary: {
          DEFAULT: '#EC4899', // Pink-500
          foreground: '#ffffff',
        },
        'secondary-focus': '#DB2777', // Pink-600
        'secondary-content': '#ffffff',
        accent: '#8B5CF6', // Violet-500
        'accent-focus': '#7C3AED', // Violet-600
        'accent-content': '#ffffff',
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        neutral: '#1F2937', // Gray-800
        'neutral-focus': '#111827', // Gray-900
        'neutral-content': '#F9FAFB', // Gray-50
        'base-100': '#FFFFFF', // White
        'base-200': '#F9FAFB', // Gray-50
        'base-300': '#F3F4F6', // Gray-100
        'base-content': '#1F2937', // Gray-800
        info: '#3B82F6', // Blue-500
        'info-content': '#ffffff',
        success: '#10B981', // Emerald-500
        'success-content': '#ffffff',
        warning: '#F59E0B', // Amber-500
        'warning-content': '#ffffff',
        error: '#EF4444', // Red-500
        'error-content': '#ffffff',
      },
      boxShadow: {
        'soft-xl': '0 20px 27px 0 rgba(0, 0, 0, 0.05)',
        'soft-md': '0 4px 7px -1px rgba(0, 0, 0, 0.11), 0 2px 4px -1px rgba(0, 0, 0, 0.07)',
      },
      animation: {
        'bounce-slow': 'bounce 3s infinite',
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
      container: {
        center: true,
        padding: {
          DEFAULT: '1rem',
          sm: '2rem',
          lg: '4rem',
          xl: '5rem',
          '2xl': '6rem',
        },
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [require('daisyui')],
  daisyui: {
    themes: [
      {
        light: {
          "primary": "#4F46E5",
          "secondary": "#EC4899",
          "accent": "#8B5CF6",
          "neutral": "#1F2937",
          "base-100": "#FFFFFF",
          "info": "#3B82F6",
          "success": "#10B981",
          "warning": "#F59E0B",
          "error": "#EF4444",
        },
        dark: {
          "primary": "#6366F1",          // Indigo-500 (sáng hơn một chút so với light theme)
          "primary-focus": "#4F46E5",    // Indigo-600
          "primary-content": "#F9FAFB",  // Gray-50
          "secondary": "#F472B6",        // Pink-400 (sáng hơn một chút so với light theme)
          "secondary-focus": "#EC4899",  // Pink-500
          "secondary-content": "#F9FAFB",// Gray-50
          "accent": "#A78BFA",           // Violet-400 (sáng hơn một chút so với light theme)
          "accent-focus": "#8B5CF6",     // Violet-500
          "accent-content": "#F9FAFB",   // Gray-50
          "neutral": "#374151",          // Gray-700
          "neutral-focus": "#1F2937",    // Gray-800
          "neutral-content": "#F9FAFB",  // Gray-50
          "base-100": "#1E293B",         // Slate-800 (nền chính)
          "base-200": "#0F172A",         // Slate-900 (nền tối hơn)
          "base-300": "#020617",         // Slate-950 (nền tối nhất)
          "base-content": "#F1F5F9",     // Slate-100 (văn bản chính)
          "info": "#60A5FA",             // Blue-400 (sáng hơn một chút so với light theme)
          "info-content": "#F9FAFB",     // Gray-50
          "success": "#34D399",          // Emerald-400 (sáng hơn một chút so với light theme)
          "success-content": "#F9FAFB",  // Gray-50
          "warning": "#FBBF24",          // Amber-400 (sáng hơn một chút so với light theme)
          "warning-content": "#1F2937",  // Gray-800
          "error": "#F87171",            // Red-400 (sáng hơn một chút so với light theme)
          "error-content": "#F9FAFB",    // Gray-50
        },
      },
    ],
  },
}