export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        serif: ['Playfair Display', 'Georgia', 'Cambria', 'Times New Roman', 'serif'],
      },
      colors: {
        sura: {
          // Night palette
          night0: '#060d16',
          night1: '#0c1722',
          night2: '#142233',
          night3: '#1c2c3f',
          night4: '#243950',

          // Brand
          navy:   '#2F4156',
          teal:   '#567C8D',
          sky:    '#C8D9E6',
          beige:  '#F5EFEB',
          white:  '#FFFFFF',
          dark:   '#0c1722',
          ink:    '#F5EFEB',

          // legacy aliases repointed to the night palette
          gold:    '#C8D9E6',
          ivory:   '#F5EFEB',
          cream:   'rgba(245,239,235,0.05)',
          brown:   '#567C8D',
          border:  'rgba(245,239,235,0.12)',
          muted:   'rgba(245,239,235,0.6)',
          canvas:  'rgba(245,239,235,0.05)',
          line:    'rgba(245,239,235,0.12)',
        }
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        soft: '0 8px 32px rgba(0,0,0,0.25)',
        card: '0 8px 32px rgba(0,0,0,0.25)',
        glow: '0 0 40px rgba(245,239,235,0.2)',
        'glow-blue': '0 0 40px rgba(200,217,230,0.25)',
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      }
    }
  },
  plugins: []
};
