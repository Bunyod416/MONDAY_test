export type Category = "HTML" | "CSS" | "JavaScript";
export type QuestionType =
  | "mcq"
  | "truefalse"
  | "code"
  | "drag"
  | "fix"
  | "dragdrop";

// ─── Base types ──────────────────────────────────────────────────────────────

export type MCQQuestion = {
  id: number;
  type: "mcq";
  category: Category;
  topic: string;
  question: string;
  options: string[];
  answer: string; // "A" | "B" | "C" | "D"
  hint: string;
  points: number;
};

export type TrueFalseQuestion = {
  id: number;
  type: "truefalse";
  category: Category;
  topic: string;
  question: string;
  answer: boolean;
  hint: string;
  points: number;
};

export type CodeQuestion = {
  id: number;
  type: "code";
  category: Category;
  topic: string;
  question: string;
  placeholder: string;
  accepted: string[];
  hint: string;
  points: number;
};

export type DragQuestion = {
  id: number;
  type: "drag";
  category: Category;
  topic: string;
  question: string;
  tokens: string[];
  correctOrder: string[];
  hint: string;
  points: number;
};

export type FixQuestion = {
  id: number;
  type: "fix";
  category: Category;
  topic: string;
  question: string;
  brokenCode: string;
  accepted: string[];
  hint: string;
  points: number;
};

export type Question =
  | MCQQuestion
  | TrueFalseQuestion
  | CodeQuestion
  | DragQuestion
  | FixQuestion;

// ─── ID generator: HTML 101–125, CSS 201–225, JS 301–325 ─────────────────────

export const questions: Question[] = [
  // ══════════════════════════════════════════════════════════════════════════════
  // HTML (25 savol | ~100 ball)
  // 10 MCQ + 5 TrueFalse + 5 Code + 3 Drag + 2 Fix
  // ══════════════════════════════════════════════════════════════════════════════

  // ─── HTML MCQ ────────────────────────────────────────────────────────────────
  {
    id: 101,
    type: "mcq",
    category: "HTML",
    topic: "HTML asoslari",
    question: "UTF-8 nima uchun kerak?",
    options: [
      "A) Unicode kodlash usuli",
      "B) HTML5 versiyasi",
      "C) Veb-brauzer nomi",
      "D) Home Tool Markup Language",
    ],
    answer: "A",
    hint: "UTF-8 — Unicode uchun kodlash usuli, turli xil tillar uchun.",
    points: 4,
  },
  {
    id: 102,
    type: "mcq",
    category: "HTML",
    topic: "HTML teglar",
    question: "Eng katta sarlavha tegi qaysi?",
    options: ["A) h6", "B) h3", "C) h1", "D) header"],
    answer: "C",
    hint: "Sarlavha teglari h1 dan h6 gacha bo'ladi — h1 eng katta.",
    points: 4,
  },
  {
    id: 103,
    type: "mcq",
    category: "HTML",
    topic: "HTML teglar",
    question: "Paragraf (matn bo'limi) uchun qaysi teg ishlatiladi?",
    options: ["A) text", "B) p", "C) para", "D) div"],
    answer: "B",
    hint: "<p> — paragraph degan ma'noni anglatadi.",
    points: 4,
  },
  {
    id: 104,
    type: "mcq",
    category: "HTML",
    topic: "Rasmlar",
    question: "Rasmni sahifaga qo'shish uchun qaysi teg ishlatiladi?",
    options: ["A) picture", "B) photo", "C) image", "D) img"],
    answer: "D",
    hint: "<img> — self-closing teg, yopilmaydi.",
    points: 4,
  },
  {
    id: 105,
    type: "mcq",
    category: "HTML",
    topic: "Havolalar",
    question: "Havola (link) yaratish uchun qaysi teg ishlatiladi?",
    options: ["A) link", "B) a", "C) href", "D) url"],
    answer: "B",
    hint: "<a> — anchor degan ma'noni anglatadi.",
    points: 4,
  },
  {
    id: 106,
    type: "mcq",
    category: "HTML",
    topic: "Ro'yxatlar",
    question: "Tartibsiz ro'yxat (bullet list) uchun qaysi teg ishlatiladi?",
    options: ["A) ol", "B) list", "C) ul", "D) li"],
    answer: "C",
    hint: "ul — unordered list, ol — ordered list.",
    points: 4,
  },
  {
    id: 107,
    type: "mcq",
    category: "HTML",
    topic: "Formalar",
    question: "Foydalanuvchi ma'lumot kiritishi uchun qaysi teg ishlatiladi?",
    options: ["A) input", "B) field", "C) enter", "D) data"],
    answer: "A",
    hint: "<input> turli xil type atributlari bilan ishlaydi.",
    points: 4,
  },
  {
    id: 108,
    type: "mcq",
    category: "HTML",
    topic: "Semantik teglar",
    question:
      "Sahifaning asosiy navigatsiya qismi uchun qaysi semantik teg ishlatiladi?",
    options: ["A) header", "B) menu", "C) nav", "D) section"],
    answer: "C",
    hint: "<nav> — navigation degan ma'noni anglatadi.",
    points: 4,
  },
  {
    id: 109,
    type: "mcq",
    category: "HTML",
    topic: "Atributlar",
    question:
      "Rasmning muqobil matni (screen reader uchun) qaysi atribut orqali beriladi?",
    options: ["A) title", "B) src", "C) alt", "D) name"],
    answer: "C",
    hint: "alt — alternative text. Rasm yuklanmasa ko'rsatiladi.",
    points: 4,
  },
  {
    id: 110,
    type: "mcq",
    category: "HTML",
    topic: "Formalar",
    question:
      "Foydalanuvchiga bir nechta variantdan faqat bittasini tanlash imkoniyatini beruvchi input turi qaysi?",
    options: [
      "A) type='checkbox'",
      "B) type='radio'",
      "C) type='select'",
      "D) type='button'",
    ],
    answer: "B",
    hint: "type='radio' — bir xil name atributiga ega guruhdan faqat bitta variantni tanlash uchun.",
    points: 4,
  },

  // ─── HTML TrueFalse ──────────────────────────────────────────────────────────
  {
    id: 111,
    type: "truefalse",
    category: "HTML",
    topic: "HTML asoslari",
    question: "HTML — dasturlash tili hisoblanadi.",
    answer: false,
    hint: "HTML — belgilash tili (markup language), dasturlash tili emas.",
    points: 4,
  },
  {
    id: 112,
    type: "truefalse",
    category: "HTML",
    topic: "HTML teglar",
    question: "<br> tegi yangi qator yaratadi.",
    answer: true,
    hint: "br — line break, matnni keyingi qatordan davom ettiradi.",
    points: 4,
  },
  {
    id: 113,
    type: "truefalse",
    category: "HTML",
    topic: "HTML tuzilishi",
    question: "<!DOCTYPE html> deklaratsiyasi <html> tegidan keyin yoziladi.",
    answer: false,
    hint: "<!DOCTYPE html> — HTML faylning eng birinchi qatorida bo'lishi shart.",
    points: 4,
  },
  {
    id: 114,
    type: "truefalse",
    category: "HTML",
    topic: "Atributlar",
    question:
      "<a> tegida target='_blank' atributi havolani yangi tabda ochadi.",
    answer: true,
    hint: "_blank — yangi tab yoki oyna ochadi.",
    points: 4,
  },
  {
    id: 115,
    type: "truefalse",
    category: "HTML",
    topic: "Jadvallar",
    question: "HTML jadvalda <td> tegi sarlavha katakchasini bildiradi.",
    answer: false,
    hint: "Sarlavha uchun <th>, oddiy katak uchun <td> ishlatiladi.",
    points: 4,
  },

  // ─── HTML Code ───────────────────────────────────────────────────────────────
  {
    id: 116,
    type: "code",
    category: "HTML",
    topic: "Havolalar",
    question:
      "'Google' deb yoziladigan, https://google.com ga boradigan havola yozing.",
    placeholder: "<!-- Havolani shu yerga yozing -->",
    accepted: [
      `<a href="https://google.com">Google</a>`,
      `<a href='https://google.com'>Google</a>`,
    ],
    hint: 'href="https://google.com" — havola yaratishning asosiy shakli.',
    points: 4,
  },
  {
    id: 117,
    type: "code",
    category: "HTML",
    topic: "Rasmlar",
    question: "logo.png rasmini qo'shing. alt matni 'Logo' bo'lsin.",
    placeholder: "<!-- Rasm tegini shu yerga yozing -->",
    accepted: [
      `<img src="logo.png" alt="Logo">`,
      `<img src='logo.png' alt='Logo'>`,
      `<img src="logo.png" alt="Logo" />`,
    ],
    hint: "img src='fayl' alt='matn' — rasm tegining asosiy shakli.",
    points: 4,
  },
  {
    id: 118,
    type: "code",
    category: "HTML",
    topic: "Sarlavhalar",
    question: "'Salom Dunyo!' deb yozilgan birinchi darajali sarlavha yozing.",
    placeholder: "<!-- Sarlavhani shu yerga yozing -->",
    accepted: [`<h1>Salom Dunyo!</h1>`],
    hint: "Birinchi darajali sarlavha: <h1>matn</h1>.",
    points: 4,
  },
  {
    id: 119,
    type: "code",
    category: "HTML",
    topic: "Ro'yxatlar",
    question: "Olma, Nok, Banan — tartibsiz (bullet) ro'yxat yozing.",
    placeholder: "<!-- Ro'yxatni shu yerga yozing -->",
    accepted: [
      `<ul>\n  <li>Olma</li>\n  <li>Nok</li>\n  <li>Banan</li>\n</ul>`,
      `<ul>\n<li>Olma</li>\n<li>Nok</li>\n<li>Banan</li>\n</ul>`,
    ],
    hint: "Tartibsiz ro'yxat: <ul> ichida <li> elementlar.",
    points: 4,
  },
  {
    id: 120,
    type: "code",
    category: "HTML",
    topic: "Formalar",
    question: "Parol kiritish uchun to'g'ri <input> tegini yozing.",
    placeholder: "<!-- Input tegini shu yerga yozing -->",
    accepted: [
      `<input type="password">`,
      `<input type='password'>`,
      `<input type="password" />`,
    ],
    hint: "type='password' — kiritilgan belgilar yashirin ko'rinadi.",
    points: 4,
  },

  // ─── HTML Drag ───────────────────────────────────────────────────────────────
  {
    id: 121,
    type: "drag",
    category: "HTML",
    topic: "Havola tegi",
    question:
      "Tokenlarni to'g'ri tartibga qo'ying — to'liq havola hosil qiling:",
    tokens: [`</a>`, `<a`, `href="https://google.com"`, `>`, `Google`],
    correctOrder: [`<a`, `href="https://google.com"`, `>`, `Google`, `</a>`],
    hint: "a tegi: ochilish, atribut, >, matn, yopilish.",
    points: 4,
  },
  {
    id: 122,
    type: "drag",
    category: "HTML",
    topic: "Jadval tuzilishi",
    question: "Jadval elementlarini to'g'ri tartibda joylashtiring:",
    tokens: [`</table>`, `<table>`, `</tr>`, `<td>Ma'lumot</td>`, `<tr>`],
    correctOrder: [`<table>`, `<tr>`, `<td>Ma'lumot</td>`, `</tr>`, `</table>`],
    hint: "Jadval tartibi: table → tr → td.",
    points: 4,
  },
  {
    id: 123,
    type: "drag",
    category: "HTML",
    topic: "HTML skelet",
    question: "HTML5 skeletini to'g'ri tartibda joylashtiring:",
    tokens: [
      `<body></body>`,
      `<!DOCTYPE html>`,
      `</html>`,
      `<html>`,
      `<head></head>`,
    ],
    correctOrder: [
      `<!DOCTYPE html>`,
      `<html>`,
      `<head></head>`,
      `<body></body>`,
      `</html>`,
    ],
    hint: "DOCTYPE birinchi, so'ng html, ichida head va body.",
    points: 4,
  },

  // ─── HTML Fix ────────────────────────────────────────────────────────────────
  {
    id: 124,
    type: "fix",
    category: "HTML",
    topic: "Rasm tegi",
    question:
      'Quyidagi kodda xato bor. Toping va to\'g\'irlang:\n<img src="rasm.jpg" alt="Rasm>',
    brokenCode: `<img src="rasm.jpg" alt="Rasm>`,
    accepted: [
      `<img src="rasm.jpg" alt="Rasm">`,
      `<img src="rasm.jpg" alt="Rasm" />`,
    ],
    hint: 'Har bir atribut qiymati qo\'shtirnoq ichida yopilishi kerak: alt="Rasm"',
    points: 4,
  },
  {
    id: 125,
    type: "fix",
    category: "HTML",
    topic: "Ro'yxat",
    question:
      "Quyidagi kodda xato bor. Toping va to'g'irlang:\n<ul>\n  <li>Olma\n  <li>Nok</li>\n</ul>",
    brokenCode: `<ul>\n  <li>Olma\n  <li>Nok</li>\n</ul>`,
    accepted: [`<ul>\n  <li>Olma</li>\n  <li>Nok</li>\n</ul>`],
    hint: "Har bir <li> tegi </li> bilan yopilishi shart.",
    points: 4,
  },

  // ══════════════════════════════════════════════════════════════════════════════
  // CSS (25 savol | ~100 ball)
  // 10 MCQ + 5 TrueFalse + 5 Code + 3 Drag + 2 Fix
  // ══════════════════════════════════════════════════════════════════════════════

  // ─── CSS MCQ ─────────────────────────────────────────────────────────────────
  {
    id: 201,
    type: "mcq",
    category: "CSS",
    topic: "CSS Joylashuv (Position)",
    question:
      "Foydalanuvchi sahifani skrol qilganda ham ekranning bir joyida qotib turadigan element yaratish uchun qaysi xususiyat ishlatiladi?",
    options: [
      "A) position: static",
      "B) position: relative",
      "C) position: absolute",
      "D) position: fixed",
    ],
    answer: "D",
    hint: "Fixed — ekranga yopishib oladi va scroll bilan siljimaydi.",
    points: 5,
  },
  {
    id: 202,
    type: "mcq",
    category: "CSS",
    topic: "Selektorlar",
    question: "Class selektori qaysi belgi bilan boshlanadi?",
    options: ["A) #", "B) *", "C) .", "D) @"],
    answer: "C",
    hint: "Class selektori nuqta (.) bilan, ID selektori # bilan boshlanadi.",
    points: 4,
  },
  {
    id: 203,
    type: "mcq",
    category: "CSS",
    topic: "Selektorlar",
    question: "ID selektori qaysi belgi bilan boshlanadi?",
    options: ["A) .", "B) @", "C) *", "D) #"],
    answer: "D",
    hint: "ID selektori # bilan boshlanadi: #elementId { }",
    points: 4,
  },
  {
    id: 204,
    type: "mcq",
    category: "CSS",
    topic: "Box model",
    question: "Elementning ichki bo'shlig'i qaysi xususiyat bilan beriladi?",
    options: ["A) margin", "B) spacing", "C) padding", "D) border"],
    answer: "C",
    hint: "padding — content va border orasidagi ichki bo'shliq.",
    points: 4,
  },
  {
    id: 205,
    type: "mcq",
    category: "CSS",
    topic: "Box model",
    question: "Elementning tashqi bo'shlig'i qaysi xususiyat bilan beriladi?",
    options: ["A) padding", "B) margin", "C) gap", "D) space"],
    answer: "B",
    hint: "margin — elementlar orasidagi tashqi bo'shliq.",
    points: 4,
  },
  {
    id: 206,
    type: "mcq",
    category: "CSS",
    topic: "Flexbox",
    question: "Flexbox ni yoqish uchun qaysi xususiyat ishlatiladi?",
    options: [
      "A) display: block",
      "B) display: inline",
      "C) display: flex",
      "D) flex: true",
    ],
    answer: "C",
    hint: "display: flex — elementni flex konteynerga aylantiradi.",
    points: 4,
  },
  {
    id: 207,
    type: "mcq",
    category: "CSS",
    topic: "Flexbox",
    question:
      "Flex elementlarni gorizontal o'rtaga tekislash uchun qaysi xususiyat ishlatiladi?",
    options: [
      "A) align-items: center",
      "B) text-align: center",
      "C) justify-content: center",
      "D) flex-align: middle",
    ],
    answer: "C",
    hint: "justify-content — asosiy o'q (gorizontal) bo'ylab tekislaydi.",
    points: 4,
  },
  {
    id: 208,
    type: "mcq",
    category: "CSS",
    topic: "Ranglar",
    question: "CSS da oq rangni qaysi qiymat bilan berish mumkin?",
    options: [
      "A) color: white yoki #ffffff",
      "B) color: #000000",
      "C) color: blank",
      "D) color: light",
    ],
    answer: "A",
    hint: "Oq rang: white yoki #ffffff yoki rgb(255,255,255).",
    points: 4,
  },
  {
    id: 209,
    type: "mcq",
    category: "CSS",
    topic: "Border-radius",
    question:
      "Elementning burchaklarini yumaloq qilish uchun qaysi xususiyat ishlatiladi?",
    options: [
      "A) corner-radius",
      "B) round-border",
      "C) border-radius",
      "D) border-curve",
    ],
    answer: "C",
    hint: "border-radius: 8px — burchaklarni yumaloqlashtiradi.",
    points: 4,
  },
  {
    id: 210,
    type: "mcq",
    category: "CSS",
    topic: "Grid",
    question: "CSS Grid ni yoqish uchun qaysi xususiyat ishlatiladi?",
    options: [
      "A) display: table",
      "B) display: grid",
      "C) layout: grid",
      "D) grid: true",
    ],
    answer: "B",
    hint: "display: grid — elementni grid konteynerga aylantiradi.",
    points: 4,
  },

  // ─── CSS TrueFalse ───────────────────────────────────────────────────────────
  {
    id: 211,
    type: "truefalse",
    category: "CSS",
    topic: "CSS asoslari",
    question: "CSS faylini HTML ga ulash uchun <style> tegi ishlatiladi.",
    answer: false,
    hint: "Tashqi CSS faylni ulash uchun <link rel='stylesheet' href='style.css'> ishlatiladi.",
    points: 4,
  },
  {
    id: 212,
    type: "truefalse",
    category: "CSS",
    topic: "Flexbox",
    question:
      "align-items: center — flex elementlarni vertikal o'rtaga tekislaydi.",
    answer: true,
    hint: "align-items — kross o'q (vertikal) bo'ylab tekislaydi.",
    points: 4,
  },
  {
    id: 213,
    type: "truefalse",
    category: "CSS",
    topic: "Box model",
    question: "margin: auto — elementni gorizontal o'rtaga tekislaydi.",
    answer: true,
    hint: "margin: auto — kenglik belgilangan blok elementni markazlaydi.",
    points: 4,
  },
  {
    id: 214,
    type: "truefalse",
    category: "CSS",
    topic: "Selektorlar",
    question: "* selektori faqat div elementlarni tanlaydi.",
    answer: false,
    hint: "* — universal selektor, sahifadagi BARCHA elementlarni tanlaydi.",
    points: 4,
  },
  {
    id: 215,
    type: "truefalse",
    category: "CSS",
    topic: "Transition",
    question:
      "transition xususiyati CSS o'zgarishlarini silliq animatsiya qiladi.",
    answer: true,
    hint: "transition: xususiyat vaqt — o'zgarish animatsiyali bo'ladi.",
    points: 4,
  },

  // ─── CSS Code ────────────────────────────────────────────────────────────────
  {
    id: 216,
    type: "code",
    category: "CSS",
    topic: "Selektorlar",
    question: ".title klassidagi elementning rangini #2e7d32 qiling.",
    placeholder: "/* CSS kodini shu yerga yozing */",
    accepted: [`.title {\n  color: #2e7d32;\n}`, `.title{color:#2e7d32;}`],
    hint: "Class selektori: .klassNomi { xususiyat: qiymat; }",
    points: 4,
  },
  {
    id: 217,
    type: "code",
    category: "CSS",
    topic: "Flexbox",
    question:
      ".box elementini flex qiling va elementlarni gorizontal va vertikal o'rtaga tekislang.",
    placeholder: "/* CSS kodini shu yerga yozing */",
    accepted: [
      `.box {\n  display: flex;\n  justify-content: center;\n  align-items: center;\n}`,
      `.box{display:flex;justify-content:center;align-items:center;}`,
    ],
    hint: "justify-content — gorizontal, align-items — vertikal tekislash.",
    points: 4,
  },
  {
    id: 218,
    type: "code",
    category: "CSS",
    topic: "Box model",
    question:
      ".card elementiga ichki bo'shliq 16px va tashqi bo'shliq 8px bering.",
    placeholder: "/* CSS kodini shu yerga yozing */",
    accepted: [
      `.card {\n  padding: 16px;\n  margin: 8px;\n}`,
      `.card{padding:16px;margin:8px;}`,
    ],
    hint: "padding — ichki, margin — tashqi bo'shliq.",
    points: 4,
  },
  {
    id: 219,
    type: "code",
    category: "CSS",
    topic: "Hover",
    question:
      ".btn tugmasi hover bo'lganda fon rangini #1b5e20 ga o'zgartiring.",
    placeholder: "/* CSS kodini shu yerga yozing */",
    accepted: [
      `.btn:hover {\n  background-color: #1b5e20;\n}`,
      `.btn:hover{background-color:#1b5e20;}`,
      `.btn:hover {\n  background: #1b5e20;\n}`,
    ],
    hint: ":hover — sichqoncha ustiga kelganda ishlaydi.",
    points: 4,
  },
  {
    id: 220,
    type: "code",
    category: "CSS",
    topic: "Grid",
    question:
      ".grid elementini 3 ustunli grid ga aylantiring. Oraliq 24px bo'lsin.",
    placeholder: "/* CSS kodini shu yerga yozing */",
    accepted: [
      `.grid {\n  display: grid;\n  grid-template-columns: repeat(3, 1fr);\n  gap: 24px;\n}`,
      `.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;}`,
    ],
    hint: "repeat(3, 1fr) — 3 ta teng kenglikdagi ustun.",
    points: 4,
  },

  // ─── CSS Drag ────────────────────────────────────────────────────────────────
  {
    id: 221,
    type: "drag",
    category: "CSS",
    topic: "Flexbox",
    question:
      "Tokenlarni to'g'ri tartibga qo'ying — flex markazlash kodini hosil qiling:",
    tokens: [`center;`, `display: flex;`, `justify-content:`, `.box {`, `}`],
    correctOrder: [
      `.box {`,
      `display: flex;`,
      `justify-content:`,
      `center;`,
      `}`,
    ],
    hint: "display: flex avval yoziladi, keyin justify-content.",
    points: 4,
  },
  {
    id: 222,
    type: "drag",
    category: "CSS",
    topic: "Grid",
    question:
      "Tokenlarni to'g'ri tartibga qo'ying — 3 ustunli grid hosil qiling:",
    tokens: [
      `1fr);`,
      `.grid {`,
      `grid-template-columns: repeat(3,`,
      `display: grid;`,
      `}`,
    ],
    correctOrder: [
      `.grid {`,
      `display: grid;`,
      `grid-template-columns: repeat(3,`,
      `1fr);`,
      `}`,
    ],
    hint: "display: grid avval, keyin grid-template-columns.",
    points: 4,
  },
  {
    id: 223,
    type: "drag",
    category: "CSS",
    topic: "Hover va Transition",
    question:
      "Tokenlarni to'g'ri tartibga qo'ying — hover effekti hosil qiling:",
    tokens: [`background: #1b5e20;`, `.btn:hover {`, `}`],
    correctOrder: [`.btn:hover {`, `background: #1b5e20;`, `}`],
    hint: ":hover pseudo-klass elementga sichqoncha tekkanda ishlaydi.",
    points: 4,
  },

  // ─── CSS Fix ─────────────────────────────────────────────────────────────────
  {
    id: 224,
    type: "fix",
    category: "CSS",
    topic: "CSS sintaksis",
    question:
      "Quyidagi kodda xato bor. Toping va to'g'irlang:\n.title {\n  color: #2e7d32\n  font-size: 24px;\n}",
    brokenCode: `.title {\n  color: #2e7d32\n  font-size: 24px;\n}`,
    accepted: [`.title {\n  color: #2e7d32;\n  font-size: 24px;\n}`],
    hint: "Har bir CSS qoidasi nuqta-vergul (;) bilan tugatilishi shart.",
    points: 4,
  },
  {
    id: 225,
    type: "fix",
    category: "CSS",
    topic: "Flexbox",
    question:
      "Quyidagi kodda xato bor. Toping va to'g'irlang:\n.nav {\n  display: flexbox;\n  gap: 12px;\n}",
    brokenCode: `.nav {\n  display: flexbox;\n  gap: 12px;\n}`,
    accepted: [`.nav {\n  display: flex;\n  gap: 12px;\n}`],
    hint: "To'g'ri qiymat 'flexbox' emas, 'flex' deb yoziladi.",
    points: 4,
  },

  // ══════════════════════════════════════════════════════════════════════════════
  // JAVASCRIPT (25 savol | ~100 ball)
  // 10 MCQ + 5 TrueFalse + 5 Code + 3 Drag + 2 Fix
  // ══════════════════════════════════════════════════════════════════════════════

  // ─── JS MCQ ──────────────────────────────────────────────────────────────────
  {
    id: 301,
    type: "mcq",
    category: "JavaScript",
    topic: "O'zgaruvchilar",
    question:
      "Qayta o'zgartirib bo'lmaydigan o'zgaruvchi qaysi kalit so'z bilan e'lon qilinadi?",
    options: ["A) var", "B) let", "C) const", "D) fixed"],
    answer: "C",
    hint: "const — constant, ya'ni doimiy qiymat. Bir marta beriladi, o'zgartirilmaydi.",
    points: 4,
  },
  {
    id: 302,
    type: "mcq",
    category: "JavaScript",
    topic: "Ma'lumot turlari",
    question: "JavaScript da matn (string) qanday yoziladi?",
    options: [
      "A) 'Salom' yoki \"Salom\"",
      "B) [Salom]",
      "C) Salom",
      "D) {Salom}",
    ],
    answer: "A",
    hint: "String — bitta yoki ikkita qo'shtirnoq ichida yoziladi.",
    points: 4,
  },
  {
    id: 303,
    type: "mcq",
    category: "JavaScript",
    topic: "Funksiyalar",
    question: "Funksiyani e'lon qilish uchun qaysi kalit so'z ishlatiladi?",
    options: ["A) def", "B) func", "C) method", "D) function"],
    answer: "D",
    hint: "JavaScript da funksiya function kalit so'zi bilan e'lon qilinadi.",
    points: 4,
  },
  {
    id: 304,
    type: "mcq",
    category: "JavaScript",
    topic: "DOM",
    question: "id='sarlavha' elementini tanlash uchun qaysi kod to'g'ri?",
    options: [
      "A) document.getElement('sarlavha')",
      "B) document.getElementById('sarlavha')",
      "C) document.selectId('sarlavha')",
      "D) document.findId('sarlavha')",
    ],
    answer: "B",
    hint: "getElementById — id bo'yicha elementni topadi.",
    points: 4,
  },
  {
    id: 305,
    type: "mcq",
    category: "JavaScript",
    topic: "Massivlar",
    question: "Massivga yangi element qo'shish uchun qaysi metod ishlatiladi?",
    options: ["A) add()", "B) append()", "C) push()", "D) insert()"],
    answer: "C",
    hint: "push() — massiv oxiriga yangi element qo'shadi.",
    points: 4,
  },
  {
    id: 306,
    type: "mcq",
    category: "JavaScript",
    topic: "Event",
    question: "Tugma bosilganda ishga tushadigan event qaysi?",
    options: [
      "A) onpress",
      "B) ontouch",
      "C) onclick yoki click",
      "D) onsubmit",
    ],
    answer: "C",
    hint: "click — eng ko'p ishlatiladigan event. addEventListener('click', ...) ko'rinishida.",
    points: 4,
  },
  {
    id: 307,
    type: "mcq",
    category: "JavaScript",
    topic: "localStorage",
    question: "localStorage ga ma'lumot saqlash uchun qaysi metod ishlatiladi?",
    options: [
      "A) localStorage.save()",
      "B) localStorage.set()",
      "C) localStorage.setItem()",
      "D) localStorage.store()",
    ],
    answer: "C",
    hint: "setItem(kalit, qiymat) — saqlash. getItem(kalit) — o'qish.",
    points: 4,
  },
  {
    id: 308,
    type: "mcq",
    category: "JavaScript",
    topic: "Shartlar",
    question: "if-else dan qisqaroq yozish uchun qaysi operator ishlatiladi?",
    options: [
      "A) switch",
      "B) ternary operator (?:)",
      "C) for loop",
      "D) try-catch",
    ],
    answer: "B",
    hint: "shart ? true_qiymat : false_qiymat — ternary operator.",
    points: 4,
  },
  {
    id: 309,
    type: "mcq",
    category: "JavaScript",
    topic: "JSON",
    question:
      "JavaScript ob'ektini JSON formatiga o'tkazish uchun qaysi metod ishlatiladi?",
    options: [
      "A) JSON.parse()",
      "B) JSON.convert()",
      "C) JSON.stringify()",
      "D) JSON.format()",
    ],
    answer: "C",
    hint: "stringify — ob'ektdan string. parse — stringdan ob'ekt.",
    points: 4,
  },
  {
    id: 310,
    type: "mcq",
    category: "JavaScript",
    topic: "Clipboard",
    question:
      "Matnni foydalanuvchi clipboard'iga yozish uchun qaysi API ishlatiladi?",
    options: [
      "A) document.clipboard.write()",
      "B) window.copy()",
      "C) navigator.clipboard.writeText()",
      "D) clipboard.setText()",
    ],
    answer: "C",
    hint: "navigator.clipboard.writeText(matn) — zamonaviy Clipboard API.",
    points: 4,
  },

  // ─── JS TrueFalse ────────────────────────────────────────────────────────────
  {
    id: 311,
    type: "truefalse",
    category: "JavaScript",
    topic: "O'zgaruvchilar",
    question:
      "let bilan e'lon qilingan o'zgaruvchini qayta o'zgartirish mumkin.",
    answer: true,
    hint: "let — qayta tayinlash mumkin. const esa tayinlanmaydi.",
    points: 4,
  },
  {
    id: 312,
    type: "truefalse",
    category: "JavaScript",
    topic: "Funksiyalar",
    question: "Funksiyani chaqirish uchun faqat nomini yozish kifoya: salom",
    answer: false,
    hint: "Funksiyani chaqirish uchun qavslar kerak: salom()",
    points: 4,
  },
  {
    id: 313,
    type: "truefalse",
    category: "JavaScript",
    topic: "Massivlar",
    question:
      "JavaScript massividagi birinchi element indeksi 1 dan boshlanadi.",
    answer: false,
    hint: "Massiv indeksi 0 dan boshlanadi: arr[0] — birinchi element.",
    points: 4,
  },
  {
    id: 314,
    type: "truefalse",
    category: "JavaScript",
    topic: "DOM",
    question: "textContent xususiyati elementning matnini o'zgartiradi.",
    answer: true,
    hint: "element.textContent = 'yangi matn' — elementdagi matnni almashtiradi.",
    points: 4,
  },
  {
    id: 315,
    type: "truefalse",
    category: "JavaScript",
    topic: "JSON",
    question: "JSON.parse() — stringni JavaScript ob'ektiga aylantiradi.",
    answer: true,
    hint: "parse — tahlil qilish. JSON stringni ob'ektga o'tkazadi.",
    points: 4,
  },

  // ─── JS Code ─────────────────────────────────────────────────────────────────
  {
    id: 316,
    type: "code",
    category: "JavaScript",
    topic: "O'zgaruvchilar",
    question:
      "'Jasur' qiymatini saqlaydiganconst o'zgaruvchi e'lon qiling va konsolga chiqaring.",
    placeholder: "// Kodingizni shu yerga yozing",
    accepted: [
      `const ism = "Jasur";\nconsole.log(ism);`,
      `const ism = 'Jasur';\nconsole.log(ism);`,
      `const name = "Jasur";\nconsole.log(name);`,
    ],
    hint: "const o'zgaruvchi = qiymat; — e'lon qilish. console.log() — konsolga chiqarish.",
    points: 4,
  },
  {
    id: 317,
    type: "code",
    category: "JavaScript",
    topic: "Funksiyalar",
    question: "Ikkita sonni ko'paytiruvchi multiply(a, b) funksiyasini yozing.",
    placeholder: "// Funksiyani shu yerga yozing",
    accepted: [
      `function multiply(a, b) {\n  return a * b;\n}`,
      `const multiply = (a, b) => a * b;`,
      `const multiply = (a, b) => {\n  return a * b;\n};`,
    ],
    hint: "return — funksiyadan natijani qaytaradi.",
    points: 4,
  },
  {
    id: 318,
    type: "code",
    category: "JavaScript",
    topic: "DOM",
    question: "id='matn' elementining matnini 'Yangi matn!' ga o'zgartiring.",
    placeholder: "// Kodingizni shu yerga yozing",
    accepted: [
      `document.getElementById('matn').textContent = 'Yangi matn!';`,
      `document.getElementById("matn").textContent = "Yangi matn!";`,
      `const el = document.getElementById('matn');\nel.textContent = 'Yangi matn!';`,
    ],
    hint: "getElementById — elementni topadi. textContent — matnni o'zgartiradi.",
    points: 4,
  },
  {
    id: 319,
    type: "code",
    category: "JavaScript",
    topic: "localStorage",
    question:
      "'til' kaliti bilan 'JavaScript' qiymatini localStorage ga saqlang.",
    placeholder: "// Kodingizni shu yerga yozing",
    accepted: [
      `localStorage.setItem('til', 'JavaScript');`,
      `localStorage.setItem("til", "JavaScript");`,
    ],
    hint: "localStorage.setItem(kalit, qiymat) — saqlash uchun.",
    points: 4,
  },
  {
    id: 320,
    type: "code",
    category: "JavaScript",
    topic: "Event",
    question:
      "id='tugma' elementiga click eventi qo'shing. Bosilganda konsolga 'Bosildi!' chiqsin.",
    placeholder: "// Kodingizni shu yerga yozing",
    accepted: [
      `document.getElementById('tugma').addEventListener('click', () => {\n  console.log('Bosildi!');\n});`,
      `document.getElementById("tugma").addEventListener("click", function() {\n  console.log("Bosildi!");\n});`,
    ],
    hint: "addEventListener('click', callback) — click eventini ulaydi.",
    points: 4,
  },

  // ─── JS Drag ─────────────────────────────────────────────────────────────────
  {
    id: 321,
    type: "drag",
    category: "JavaScript",
    topic: "O'zgaruvchi e'loni",
    question:
      "Tokenlarni to'g'ri tartibga qo'ying — o'zgaruvchi e'loni hosil qiling:",
    tokens: [`"Jasur";`, `const`, `=`, `ism`],
    correctOrder: [`const`, `ism`, `=`, `"Jasur";`],
    hint: "const o'zgaruvchiNomi = qiymat; — e'lon qilish tartibi.",
    points: 4,
  },
  {
    id: 322,
    type: "drag",
    category: "JavaScript",
    topic: "localStorage",
    question:
      "Tokenlarni to'g'ri tartibga qo'ying — localStorage saqlash kodini hosil qiling:",
    tokens: [`'qiymat');`, `.setItem(`, `'kalit',`, `localStorage`],
    correctOrder: [`localStorage`, `.setItem(`, `'kalit',`, `'qiymat');`],
    hint: "localStorage.setItem(kalit, qiymat) tartibi.",
    points: 4,
  },
  {
    id: 323,
    type: "drag",
    category: "JavaScript",
    topic: "Event listener",
    question:
      "Tokenlarni to'g'ri tartibga qo'ying — click event ulash kodini hosil qiling:",
    tokens: [
      `'click',`,
      `() => console.log('OK'));`,
      `.addEventListener(`,
      `document.getElementById('btn')`,
    ],
    correctOrder: [
      `document.getElementById('btn')`,
      `.addEventListener(`,
      `'click',`,
      `() => console.log('OK'));`,
    ],
    hint: "addEventListener(event, callback) — ikki argument oladi.",
    points: 4,
  },

  // ─── JS Fix ──────────────────────────────────────────────────────────────────
  {
    id: 324,
    type: "fix",
    category: "JavaScript",
    topic: "Funksiya chaqiruvi",
    question:
      "Quyidagi kodda xato bor. Toping va to'g'irlang:\nfunction salom() {\n  console.log(\"Salom!\");\n}\nsalom;",
    brokenCode: `function salom() {\n  console.log("Salom!");\n}\nsalom;`,
    accepted: [`function salom() {\n  console.log("Salom!");\n}\nsalom();`],
    hint: "Funksiyani chaqirish uchun nomdan keyin () qo'shiladi: salom()",
    points: 4,
  },
  {
    id: 325,
    type: "fix",
    category: "JavaScript",
    topic: "O'zgaruvchi",
    question:
      "Quyidagi kodda xato bor. Toping va to'g'irlang:\nconst yosh = 20;\nyosh = 25;",
    brokenCode: `const yosh = 20;\nyosh = 25;`,
    accepted: [`let yosh = 20;\nyosh = 25;`],
    hint: "const o'zgartirilmaydi. Qayta tayinlash uchun let ishlatiladi.",
    points: 4,
  },
];

// ─── Helper functions ────────────────────────────────────────────────────────

export const CATEGORIES: Category[] = ["HTML", "CSS", "JavaScript"];

export function getByCategory(cat: Category): Question[] {
  return questions.filter((q) => q.category === cat);
}

export function getQuestionById(id: number): Question | undefined {
  return questions.find((q) => q.id === id);
}

export function totalPoints(): number {
  return questions.reduce((s, q) => s + q.points, 0);
}

// ─── Category-level stats ────────────────────────────────────────────────────
// HTML:  id 101–125 | 25 savol | ~100 ball
// CSS:   id 201–225 | 25 savol | ~100 ball
// JS:    id 301–325 | 25 savol | ~100 ball
// JAMI:             | 75 savol | ~300 ball
