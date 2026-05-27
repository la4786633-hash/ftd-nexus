import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    container: { center: true, padding: '1rem' },
    extend: {
      colors: {
        brand: {
          navy: '#0A1628',
          royal: '#1A3A6B',
          blue: '#1565C0',
          'blue-light': '#E3F2FD',
          coral: '#FF7A59',
          'coral-light': '#FFF0EC',
        },
        surface: {
          page: '#F4F5F7',
          card: '#FFFFFF',
          secondary: '#F9FAFB',
          border: 'rgba(9, 30, 66, 0.10)',
          'border-strong': 'rgba(9, 30, 66, 0.25)',
        },
        ink: {
          primary: '#172B4D',
          secondary: '#6B778C',
          tertiary: '#B3BAC5',
          inverse: '#FFFFFF',
          'inverse-muted': '#7A8BA4',
        },
        status: {
          'ok': '#00875A',
          'ok-bg': '#E3FCEF',
          'ok-text': '#006644',
          'ok-border': '#ABF5D1',
          'warning': '#FF991F',
          'warning-bg': '#FFFAE6',
          'warning-text': '#974F0C',
          'warning-border': '#FFE380',
          'danger': '#DE350B',
          'danger-bg': '#FFEBE6',
          'danger-text': '#BF2600',
          'danger-border': '#FFBDAD',
          'info': '#1565C0',
          'info-bg': '#E3F2FD',
          'info-text': '#0D47A1',
        },
        profile: {
          'hybrid-bg': '#E3F2FD',
          'hybrid-text': '#0D47A1',
          'farmer-bg': '#E3FCEF',
          'farmer-text': '#006644',
          'hunter-bg': '#FFEBE6',
          'hunter-text': '#BF2600',
          'inside-bg': '#EAE6FF',
          'inside-text': '#403294',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        '2xs': ['10px', { lineHeight: '14px' }],
        xs: ['11px', { lineHeight: '16px' }],
        sm: ['12px', { lineHeight: '18px' }],
        base: ['13px', { lineHeight: '20px' }],
        md: ['14px', { lineHeight: '22px' }],
        lg: ['16px', { lineHeight: '24px' }],
        xl: ['18px', { lineHeight: '28px' }],
        '2xl': ['22px', { lineHeight: '32px' }],
        '3xl': ['28px', { lineHeight: '38px' }],
      },
      borderRadius: {
        sm: '4px',
        DEFAULT: '6px',
        md: '8px',
        lg: '10px',
        xl: '12px',
        '2xl': '16px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(9, 30, 66, 0.13), 0 0 0 1px rgba(9, 30, 66, 0.08)',
        'card-hover': '0 3px 8px rgba(9, 30, 66, 0.18), 0 0 0 1px rgba(9, 30, 66, 0.10)',
        dropdown: '0 4px 16px rgba(9, 30, 66, 0.20), 0 0 0 1px rgba(9, 30, 66, 0.08)',
      },
      animation: {
        'fade-in': 'fadeIn 0.15s ease-out',
        'slide-up': 'slideUp 0.2s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 2s linear infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { transform: 'translateY(8px)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
