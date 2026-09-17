/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  // Tailwind v4 : les variantes dark / high-contrast sont déclarées en
  // CSS-first via @custom-variant dans src/styles/global.css.
  // Ce fichier reste fourni pour la compatibilité et l'extension des tokens.
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        glass: 'var(--glass)',
        primary: {
          DEFAULT: 'var(--blue)',
          soft: 'var(--blue-g)',
          bright: 'var(--blue-br)',
        },
        accent: 'var(--indigo)',
        text: {
          DEFAULT: 'var(--text)',
          muted: 'var(--text2)',
          faint: 'var(--text3)',
        },
      },
      borderRadius: {
        card: 'var(--radius)',
        sm: 'var(--radius-sm)',
        xs: 'var(--radius-xs)',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'spring-smooth': 'cubic-bezier(0.22, 1, 0.36, 1)',
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
};