import { sha256Hex } from "./crypto";

const SALT = "EXAM_ADMIN_v1::";

// Parolning o'zi emas, uning SHA-256 hash'i saqlanadi — bundle ichida
// "JAMSHID" degan matn endi yo'q.
// Parolni almashtirish uchun .env faylga qo'shing:
//   VITE_ADMIN_PASSWORD_HASH=<sha256("EXAM_ADMIN_v1::yangiparol")>
// Hash'ni hisoblash:  node -e "console.log(require('crypto').createHash('sha256').update('EXAM_ADMIN_v1::yangiparol').digest('hex'))"
//
// ESLATMA: bu faqat "tasodifan ko'rib qolish" dan himoya qiladi. Client-side
// tekshiruvni React DevTools orqali chetlab o'tish mumkin — admin panelni
// haqiqiy himoyalash uchun server kerak.
const DEFAULT_HASH =
  "ac26a6eee6204fca6c589ee8a56ac9426f59d352575322bfb04ccbf5439700bd"; // "JAMSHID"

const PASSWORD_HASH = import.meta.env.VITE_ADMIN_PASSWORD_HASH ?? DEFAULT_HASH;

export function verifyAdminPassword(password: string): boolean {
  return sha256Hex(SALT + password) === PASSWORD_HASH;
}
