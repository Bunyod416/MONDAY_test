import { hmacSha256, timingSafeEqual, utf8 } from "./crypto";

// DIQQAT: bu kalit build natijasiga (dist/assets/*.js) tushadi va uni
// DevTools orqali o'qish mumkin. HMAC imzo natija faylini "shunchaki tahrirlab"
// o'zgartirishning oldini oladi, lekin bundle'ni o'qiy oladigan odam uchun
// bu to'siq emas. Haqiqiy himoya faqat server tomonda baholash bilan bo'ladi.
const SECRET_KEY =
  import.meta.env.VITE_EXAM_SECRET ?? "WEBCOURSE_EXAM_2024_SECURE_KEY_XYZ";

const PREFIX = "EXAMv2";
const SIG_LEN = 16;

const keyBytes = utf8(SECRET_KEY);

export class TamperedResultError extends Error {
  constructor() {
    super("Natija fayli o'zgartirilgan — imzo mos kelmadi.");
    this.name = "TamperedResultError";
  }
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

function xorInPlace(bytes: Uint8Array): Uint8Array {
  const out = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) {
    out[i] = bytes[i] ^ keyBytes[i % keyBytes.length];
  }
  return out;
}

export function encodeResult(data: object): string {
  // TextEncoder → UTF-8 baytlar. charCodeAt dan farqli, bu kirill/uzbek
  // harflarini ham, emoji ham to'g'ri kodlaydi.
  const payload = xorInPlace(utf8(JSON.stringify(data)));
  const sig = hmacSha256(keyBytes, payload).subarray(0, SIG_LEN);
  return `${PREFIX}.${bytesToBase64(payload)}.${bytesToBase64(sig)}`;
}

export function decodeResult(encoded: string): object {
  const text = encoded.trim();
  if (!text.startsWith(`${PREFIX}.`)) return decodeLegacy(text);

  const [, payloadB64, sigB64] = text.split(".");
  if (!payloadB64 || !sigB64) throw new Error("Format noto'g'ri.");

  const payload = base64ToBytes(payloadB64);
  const expected = hmacSha256(keyBytes, payload).subarray(0, SIG_LEN);
  if (!timingSafeEqual(base64ToBytes(sigB64), expected)) {
    throw new TamperedResultError();
  }

  return JSON.parse(new TextDecoder().decode(xorInPlace(payload)));
}

/**
 * Eski (v1) format — imzosiz, hex + btoa.
 * Faqat ASCII fayllar uchun ishlagan; oldin yig'ilgan natijalar
 * yo'qolmasligi uchun qoldirilgan. Yangi fayllar hech qachon bu yo'ldan o'tmaydi.
 */
function decodeLegacy(encoded: string): object {
  const hex = atob(encoded);
  let json = "";
  for (let i = 0, n = 0; i < hex.length; i += 2, n++) {
    const byte = parseInt(hex.slice(i, i + 2), 16);
    json += String.fromCharCode(byte ^ SECRET_KEY.charCodeAt(n % SECRET_KEY.length));
  }
  return JSON.parse(json);
}
