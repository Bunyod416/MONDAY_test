# MONDAY Test

Imtihon jarayonlarini boshqarish uchun yaratilgan React + TypeScript web-ilova.
Ilovada imtihon sahifasi va admin sahifasi mavjud.

## Texnologiyalar

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Lucide React — ikonalar
- Supabase client — ma’lumotlar bilan ishlash uchun

## Talablar

- Node.js 18 yoki undan yangi versiya
- npm

## O‘rnatish

Repository’ni klonlang va dependency’larni o‘rnating:

```bash
git clone https://github.com/Bunyod416/MONDAY_test.git
cd MONDAY_test
npm install
```

## Ishga tushirish

Development server’ni ishga tushirish:

```bash
npm run dev
```

Keyin terminalda ko‘rsatilgan lokal manzilni brauzerda oching — odatda
`http://localhost:5173`.

## Npm skriptlar

| Buyruq              | Vazifasi                              |
| ------------------- | ------------------------------------- |
| `npm run dev`       | Development server’ni ishga tushiradi |
| `npm run build`     | Production build yaratadi             |
| `npm run preview`   | Production build’ni lokal ko‘rsatadi  |
| `npm run lint`      | ESLint tekshiruvini bajaradi          |
| `npm run typecheck` | TypeScript xatolarini tekshiradi      |

## Admin rejimi

Admin rejimiga o‘tish uchun ilova ochiq turgan paytda `Ctrl + Shift + U`
klavishlar birikmasidan foydalaning. Shu birikma exam va admin ko‘rinishlari
o‘rtasida almashadi.

## Loyiha tuzilmasi

```text
src/
├── components/   # ExamPage, AdminPage va qayta ishlatiladigan komponentlar
├── types/        # TypeScript turlari
├── utils/        # Yordamchi funksiyalar
├── App.tsx       # Asosiy ilova va ko‘rinishlar almashinuvi
├── index.css     # Global stillar
└── main.tsx      # React ilovasining kirish nuqtasi
```

## Tekshirish

Build va tekshiruvlarni bajarish:

```bash
npm run typecheck
npm run lint
npm run build
```
