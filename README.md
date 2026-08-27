# 🚀 MONDAY Test Platformasi

Imtihon jarayonlarini xavfsiz va samarali boshqarish uchun yaratilgan zamonaviy **React + TypeScript + Tailwind CSS** veb-ilovasi.

> 📖 **Batafsil rasmli foydalanuvchi qo'llanmasi:** [QOLLANMA.md](QOLLANMA.md) faylida to'liq keltirilgan.

---

## 📸 Tizim Ko'rinishi

| Ro'yxatdan O'tish | Imtihon Jarayoni |
| :---: | :---: |
| ![Ro'yxatdan o'tish](docs/images/01_kirish_royxat.png) | ![Imtihon jarayoni](docs/images/04_imtihon_mcq_savol.png) |

| Yakunlash Modali | O'qituvchi / Admin Paneli |
| :---: | :---: |
| ![Yakunlash](docs/images/07_yakunlash_tasdiqlash_modal.png) | ![Admin Panel](docs/images/10_admin_monitoring_va_boshqaruv.png) |

---

## 🛠 Texnologiyalar

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS
- **Ikonalar**: Lucide React
- **Backend / Real-time**: Supabase Client (Presence & Broadcast)
- **Anti-Cheat**: Fullscreen Enforcer, Blur/Tab-switch detector, ContextMenu blocker

---

## ⚙️ O'rnatish va Ishga Tushirish

### 1. Repository'ni klonlash va paketlarni o'rnatish:
```bash
git clone https://github.com/Bunyod416/MONDAY_test.git
cd MONDAY_test
npm install
```

### 2. Ishchi rejimda ishga tushirish (Dev server):
```bash
npm run dev
```
Lokal manzil: `http://localhost:5173`

---

## 📋 Npm Skriptlar

| Buyruq | Vazifasi |
| :--- | :--- |
| `npm run dev` | Development serverni ishga tushirish |
| `npm run build` | Production uchun build yaratish |
| `npm run preview` | Build natijasini lokal ko'rish |
| `npm run typecheck` | TypeScript xatoliklarini tekshirish |

---

## 🔐 Admin Rejimi

Admin rejimiga o'tish usullari:
- **Klaviatura yorlig'i**: `Ctrl + Shift + U` yoki `Ctrl + Shift + A`
- **URL orqali**: Brauzer manziliga `#admin` qo'shish
- **Standart parol**: `JAMSHID`

---

## 📁 Loyiha Tuzilmasi

```text
MONDAY_test/
├── docs/
│   └── images/       # Haqiqiy interfeys skrinshotlari
├── scripts/          # Skrinshot olish va avtomatlashtirish skriptlari
├── src/
│   ├── components/   # ExamPage, AdminPage va interfeys komponentlari
│   ├── data/         # Savollar bazasi (HTML, CSS, JS, Python)
│   ├── types/        # TypeScript interfeyslari
│   ├── utils/        # Yordamchi funksiyalar (shifrlash, xavfsizlik)
│   ├── App.tsx       # Asosiy marshrutlash
│   ├── index.css     # Maxsus stillar va animatsiyalar
│   └── main.tsx      # Kirish nuqtasi
├── QOLLANMA.md       # Batafsil rasmli qo'llanma
└── README.md         # Loyiha haqida umumiy ma'lumot
```

---
*© 2026 MONDAY Test Platformasi*
