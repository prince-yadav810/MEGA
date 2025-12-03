/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#DFF2EB',   // Lightest green
          100: '#B9E5E8',  // Light blue-green
          500: '#7AB2D3',  // Medium blue
          600: '#6BA4C7', // Slightly darker blue
          700: '#4A628A', // Dark blue
          800: '#3A4F6F', // Darker blue
          900: '#2A3B55', // Darkest blue
        },
        secondary: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
        success: {
          50: '#DFF2EB',
          100: '#dcfce7',
          500: '#10B981',
          600: '#059669',
          800: '#166534',
        },
        warning: {
          50: '#FEF3C7',
          100: '#fef3c7',
          500: '#F59E0B',
          600: '#D97706',
        },
        error: {
          50: '#FEE2E2',
          100: '#fee2e2',
          500: '#EF4444',
          600: '#DC2626',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      animation: {
        'slide-in': 'slideIn 0.2s ease-out',
        'fade-in': 'fadeIn 0.15s ease-out',
        'blob': 'blob 7s infinite',
      },
      keyframes: {
        slideIn: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        blob: {
          "0%": {
            transform: "translate(0px, 0px) scale(1)",
          },
          "33%": {
            transform: "translate(30px, -50px) scale(1.1)",
          },
          "66%": {
            transform: "translate(-20px, 20px) scale(0.9)",
          },
          "100%": {
            transform: "translate(0px, 0px) scale(1)",
          },
        }
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    // Custom plugin for smooth scrolling utilities
    function({ addUtilities, addBase, theme }) {
      // Add smooth scrolling to all overflow utilities by default
      addBase({
        // Global smooth scrolling for mobile
        '@media (max-width: 768px)': {
          '.overflow-auto, .overflow-y-auto, .overflow-x-auto, .overflow-scroll, .overflow-y-scroll, .overflow-x-scroll': {
            '-webkit-overflow-scrolling': 'touch',
            'overscroll-behavior': 'contain',
            'scroll-behavior': 'smooth',
            'transform': 'translateZ(0)',
            '-webkit-transform': 'translateZ(0)',
            'contain': 'layout style paint',
          }
        }
      });
      
      // Additional utility classes
      const newUtilities = {
        '.scroll-smooth-mobile': {
          '-webkit-overflow-scrolling': 'touch',
          'overscroll-behavior-y': 'contain',
          'scroll-behavior': 'smooth',
        },
        '.gpu-accelerated': {
          'transform': 'translateZ(0)',
          '-webkit-transform': 'translateZ(0)',
          'backface-visibility': 'hidden',
          '-webkit-backface-visibility': 'hidden',
        },
        '.touch-pan-y': {
          'touch-action': 'pan-y',
        },
        '.touch-manipulation': {
          'touch-action': 'manipulation',
        },
      }
      addUtilities(newUtilities, ['responsive'])
    }
  ],
}