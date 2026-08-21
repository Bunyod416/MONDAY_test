/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },

      // ─── Rang tizimi ──────────────────────────────────────────────────────
      // Tailwind shkalalari QAYTA belgilanadi. Shu sababli komponentlardagi
      // mavjud `green-700`, `gray-400` kabi klasslar avtomatik yangi
      // palitraga o'tadi — har bir faylni qo'lda tuzatish shart emas.
      colors: {
        // Akademik o'rmon yashili (~157°, 55% to'yinganlik).
        // Ilgari #006400 ishlatilardi — u 100% to'yingan va ekranda qo'pol.
        green: {
          50: '#F2F8F5',
          100: '#DCEDE4',
          200: '#BBDAC8',
          300: '#8FC0A6',
          400: '#5F9F80',
          500: '#3E8163',
          600: '#2C684F',
          700: '#1B5E3F',
          800: '#154A33',
          900: '#113B2A',
          950: '#092018',
        },

        // Neytral shkala. gray-400 endi oq fonda 4.6:1 kontrast beradi —
        // ilgari 2.6:1 edi va kichik matnlar deyarli o'qilmasdi.
        gray: {
          50: '#F8F9FB',
          100: '#F1F3F6',
          200: '#E3E6EC',
          300: '#CFD4DD',
          400: '#6B7488',
          500: '#565E70',
          600: '#414857',
          700: '#2F3542',
          800: '#1F242E',
          900: '#12161D',
          950: '#0A0D12',
        },

        // Bo'lim aksentlari — bosiq, akademik ohangda.
        orange: { 50: '#FBF4EE', 100: '#F5E6D8', 200: '#E8D0B6', 700: '#9A5426', 800: '#7C4320' },
        blue:   { 50: '#EFF4FA', 100: '#DCE7F4', 200: '#C3D6EC', 700: '#2C5282', 800: '#23416A' },
        yellow: { 50: '#FAF6EA', 100: '#F3EBD3', 200: '#E7D9B2', 700: '#7E5B14', 800: '#654910' },

        red: {
          50: '#FDF3F2', 100: '#FCE7E5', 200: '#F8CFCB', 300: '#F0A9A2',
          400: '#E07C72', 500: '#C4544A', 600: '#A63D34', 700: '#8C2F27',
          800: '#732722', 900: '#5E211D',
        },
      },

      // ─── Radius: 4 xil o'lchamdan 2 taga ──────────────────────────────────
      // lg/xl/2xl/3xl aralash ishlatilgan edi (8/12/16/24px) — sahifalar
      // boshqa-boshqa ilovadek ko'rinardi. Endi hammasi 10px yoki 12px.
      borderRadius: {
        md: '8px',
        lg: '10px',
        xl: '12px',
        '2xl': '12px',
        '3xl': '12px',
      },

      // ─── Soya: 5 darajadan 3 taga ─────────────────────────────────────────
      boxShadow: {
        sm: '0 1px 2px rgba(18, 22, 29, 0.04), 0 1px 3px rgba(18, 22, 29, 0.05)',
        DEFAULT: '0 1px 2px rgba(18, 22, 29, 0.04), 0 1px 3px rgba(18, 22, 29, 0.05)',
        md: '0 2px 4px rgba(18, 22, 29, 0.04), 0 4px 12px rgba(18, 22, 29, 0.06)',
        lg: '0 2px 4px rgba(18, 22, 29, 0.04), 0 4px 12px rgba(18, 22, 29, 0.06)',
        xl: '0 8px 28px rgba(18, 22, 29, 0.10)',
        '2xl': '0 8px 28px rgba(18, 22, 29, 0.10)',
      },
    },
  },
  plugins: [],
};
