// Imtihon jarayonida ekanligini bildiruvchi global bayroq.
// App.tsx dagi Ctrl+Shift+U admin yorlig'i imtihon vaqtida ishlamasligi uchun.

let active = false;

export function setExamActive(value: boolean) {
  active = value;
}

export function isExamActive(): boolean {
  return active;
}
