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
        // 状态色彩
        status: {
          'not-started': '#64748b',  // 灰色
          'in-progress': '#3b82f6',  // 蓝色
          'completed': '#22c55e',    // 绿色
          'paused': '#f59e0b',       // 橙色
          'cancelled': '#ef4444',    // 红色
        },
        // 优先级色彩
        priority: {
          low: '#64748b',      // 灰色
          medium: '#3b82f6',   // 蓝色
          high: '#f59e0b',     // 橙色
          urgent: '#ef4444',   // 红色
        }
      },
      fontFamily: {
        sans: ['system-ui', 'ui-sans-serif', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      boxShadow: {
        'soft': '0 2px 8px 0 rgba(0, 0, 0, 0.06)',
        'medium': '0 4px 12px 0 rgba(0, 0, 0, 0.1)',
        'strong': '0 8px 24px 0 rgba(0, 0, 0, 0.15)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
  darkMode: 'class',
};