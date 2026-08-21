/**
 * Kod muharriri uchun yordamchi mantiq — VS Code'dagi kabi:
 * qavslarni avtomatik yopish, teg yopilishi, aqlli chekinish va avtoto'ldirish.
 *
 * Bu yerda faqat MATN ustida ishlaydigan sof funksiyalar bor — DOM yo'q,
 * shuning uchun har birini alohida sinash mumkin.
 */

import type { CodeLang } from "./answerMatch";

export const INDENT = "  ";

/** Muharrir amali: yangi matn va kursor holati. */
export type EditAction = { value: string; selStart: number; selEnd: number };

const OPEN_TO_CLOSE: Record<string, string> = {
  "(": ")",
  "[": "]",
  "{": "}",
  '"': '"',
  "'": "'",
  "`": "`",
};

const CLOSERS = new Set([")", "]", "}", '"', "'", "`"]);

const VOID_TAGS = new Set([
  "area", "base", "br", "col", "embed", "hr", "img", "input",
  "link", "meta", "param", "source", "track", "wbr",
]);

// ─── Qavs va qo'shtirnoqlarni avtomatik yopish ───────────────────────────────

/**
 * Ochuvchi belgi kiritilganda yopuvchisini ham qo'yadi.
 * Matn belgilangan bo'lsa — uni o'rab oladi (VS Code'dagi kabi).
 */
export function autoPair(
  value: string,
  selStart: number,
  selEnd: number,
  ch: string,
): EditAction | null {
  const close = OPEN_TO_CLOSE[ch];

  // Belgilangan matnni o'rash
  if (close && selStart !== selEnd) {
    const selected = value.slice(selStart, selEnd);
    return {
      value: value.slice(0, selStart) + ch + selected + close + value.slice(selEnd),
      selStart: selStart + 1,
      selEnd: selEnd + 1,
    };
  }

  // Yopuvchi belgi allaqachon turgan bo'lsa — ustidan sakrab o'tamiz
  if (CLOSERS.has(ch) && selStart === selEnd && value[selStart] === ch) {
    return { value, selStart: selStart + 1, selEnd: selStart + 1 };
  }

  if (!close) return null;

  // Qo'shtirnoqni so'z o'rtasida yopish shart emas: don't → don''t bo'lib qolmasin
  const before = value[selStart - 1] ?? "";
  const after = value[selStart] ?? "";
  const isQuote = ch === '"' || ch === "'" || ch === "`";
  if (isQuote && (/[\w$]/.test(before) || before === ch)) return null;
  if (isQuote && /[\w$]/.test(after)) return null;

  return {
    value: value.slice(0, selStart) + ch + close + value.slice(selEnd),
    selStart: selStart + 1,
    selEnd: selStart + 1,
  };
}

// ─── HTML tegini avtomatik yopish ────────────────────────────────────────────

/**
 * `<div` yozib `>` bosilganda `</div>` ni ham qo'yadi.
 * Bo'sh teglar (img, br, input...) va `/>` bilan yopilganlar chetlab o'tiladi.
 */
export function autoCloseTag(
  value: string,
  cursor: number,
  lang: CodeLang,
): EditAction | null {
  if (lang !== "html") return null;

  const head = value.slice(0, cursor);
  const open = head.lastIndexOf("<");
  if (open === -1) return null;
  if (head.indexOf(">", open) !== -1) return null; // teg allaqachon yopilgan

  const inner = head.slice(open + 1);
  if (inner.startsWith("/") || inner.startsWith("!")) return null;
  if (inner.trimEnd().endsWith("/")) return null; // <br />

  const nameMatch = /^([a-zA-Z][a-zA-Z0-9-]*)/.exec(inner);
  if (!nameMatch) return null;

  const name = nameMatch[1].toLowerCase();
  if (VOID_TAGS.has(name)) return null;

  const closing = `</${name}>`;
  // Yopuvchi teg allaqachon yozilgan bo'lsa takrorlamaymiz
  if (value.slice(cursor).trimStart().startsWith(closing)) return null;

  return {
    value: value.slice(0, cursor) + ">" + closing + value.slice(cursor),
    selStart: cursor + 1,
    selEnd: cursor + 1,
  };
}

// ─── Enter: aqlli chekinish ──────────────────────────────────────────────────

function lineIndent(value: string, position: number): string {
  const lineStart = value.lastIndexOf("\n", position - 1) + 1;
  const match = /^[ \t]*/.exec(value.slice(lineStart, position));
  return match ? match[0] : "";
}

/**
 * `{|}` yoki `<ul>|</ul>` orasida Enter bosilsa — ochiq blok yasaydi:
 *   {
 *     |
 *   }
 * Aks holda joriy qator chekinishini saqlaydi va blok ochilsa bittaga oshiradi.
 */
export function handleEnter(
  value: string,
  selStart: number,
  selEnd: number,
  lang: CodeLang,
): EditAction | null {
  const indent = lineIndent(value, selStart);
  const before = value.slice(0, selStart);
  const after = value.slice(selEnd);

  const prevChar = before.slice(-1);
  const opensBlock =
    prevChar === "{" ||
    (lang === "html" && /<[a-zA-Z][^<>]*>$/.test(before) && !/<\/[a-zA-Z]/.test(prevChar));

  const closesRightAfter =
    (prevChar === "{" && after.startsWith("}")) ||
    (lang === "html" && /^<\//.test(after) && /<[a-zA-Z][^<>]*>$/.test(before));

  if (closesRightAfter) {
    const inner = "\n" + indent + INDENT;
    const tail = "\n" + indent;
    return {
      value: before + inner + tail + after,
      selStart: selStart + inner.length,
      selEnd: selStart + inner.length,
    };
  }

  const nextIndent = opensBlock ? indent + INDENT : indent;
  const inserted = "\n" + nextIndent;
  return {
    value: before + inserted + after,
    selStart: selStart + inserted.length,
    selEnd: selStart + inserted.length,
  };
}

// ─── Backspace: juftlikni birga o'chirish ────────────────────────────────────

export function handleBackspace(
  value: string,
  selStart: number,
  selEnd: number,
): EditAction | null {
  if (selStart !== selEnd || selStart === 0) return null;

  const before = value[selStart - 1];
  const after = value[selStart];

  // `(|)` → ikkalasi ham o'chadi
  if (before && after && OPEN_TO_CLOSE[before] === after) {
    return {
      value: value.slice(0, selStart - 1) + value.slice(selStart + 1),
      selStart: selStart - 1,
      selEnd: selStart - 1,
    };
  }

  // Chekinish ichida bo'lsa — bir pog'ona (2 probel) o'chadi
  const lineStart = value.lastIndexOf("\n", selStart - 1) + 1;
  const head = value.slice(lineStart, selStart);
  if (head.length > 0 && /^ +$/.test(head)) {
    const remove = head.length % INDENT.length === 0 ? INDENT.length : head.length % INDENT.length;
    return {
      value: value.slice(0, selStart - remove) + value.slice(selStart),
      selStart: selStart - remove,
      selEnd: selStart - remove,
    };
  }

  return null;
}

// ─── Tab: chekinish (fokusni ko'chirmaydi) ───────────────────────────────────

export function handleTab(
  value: string,
  selStart: number,
  selEnd: number,
  shift: boolean,
): EditAction | null {
  const multiline = value.slice(selStart, selEnd).includes("\n");

  if (!multiline && !shift) {
    return {
      value: value.slice(0, selStart) + INDENT + value.slice(selEnd),
      selStart: selStart + INDENT.length,
      selEnd: selStart + INDENT.length,
    };
  }

  // Bir nechta qatorni birga surish / qaytarish
  const blockStart = value.lastIndexOf("\n", selStart - 1) + 1;
  const blockEndRaw = value.indexOf("\n", selEnd);
  const blockEnd = blockEndRaw === -1 ? value.length : blockEndRaw;
  const block = value.slice(blockStart, blockEnd);

  let removedFirst = 0;
  let removedTotal = 0;
  const lines = block.split("\n").map((line, index) => {
    if (shift) {
      const match = /^ {1,2}/.exec(line);
      const cut = match ? match[0].length : 0;
      if (index === 0) removedFirst = cut;
      removedTotal += cut;
      return line.slice(cut);
    }
    if (index === 0) removedFirst = -INDENT.length;
    removedTotal -= INDENT.length;
    return INDENT + line;
  });

  const updated = lines.join("\n");
  return {
    value: value.slice(0, blockStart) + updated + value.slice(blockEnd),
    selStart: Math.max(blockStart, selStart - removedFirst),
    selEnd: Math.max(blockStart, selEnd - removedTotal),
  };
}

// ─── Avtoto'ldirish ──────────────────────────────────────────────────────────

export type Completion = {
  /** Ro'yxatda ko'rinadigan nom */
  label: string;
  /** O'ng tomonda ko'rsatiladigan izoh */
  detail?: string;
  /** Kiritiladigan matn */
  insert: string;
  /** Kiritilgandan keyin kursor turadigan joy (insert ichidagi indeks) */
  caret?: number;
};

export type CompletionContext = {
  items: Completion[];
  /** Almashtiriladigan qismning boshlanishi */
  from: number;
  /** Foydalanuvchi yozgan prefiks */
  prefix: string;
};

// Teg → tavsiya etiladigan atributlar bilan birga.
// Foydalanuvchi so'raganidek: <a tanlansa href="" o'zi qo'shiladi.
const HTML_TAGS: Array<[string, string, string]> = [
  ["a", '<a href="•"></a>', "havola"],
  ["img", '<img src="•" alt="">', "rasm"],
  ["input", '<input type="•">', "kiritish maydoni"],
  ["div", "<div>•</div>", "blok konteyner"],
  ["span", "<span>•</span>", "ichki matn"],
  ["p", "<p>•</p>", "paragraf"],
  ["h1", "<h1>•</h1>", "1-daraja sarlavha"],
  ["h2", "<h2>•</h2>", "2-daraja sarlavha"],
  ["h3", "<h3>•</h3>", "3-daraja sarlavha"],
  ["ul", "<ul>\n  <li>•</li>\n</ul>", "tartibsiz ro'yxat"],
  ["ol", "<ol>\n  <li>•</li>\n</ol>", "tartibli ro'yxat"],
  ["li", "<li>•</li>", "ro'yxat elementi"],
  ["button", "<button>•</button>", "tugma"],
  ["form", '<form action="•"></form>', "forma"],
  ["label", '<label for="•"></label>', "maydon nomi"],
  ["select", "<select>\n  <option>•</option>\n</select>", "tanlash ro'yxati"],
  ["option", "<option>•</option>", "variant"],
  ["textarea", "<textarea>•</textarea>", "ko'p qatorli matn"],
  ["table", "<table>\n  <tr>\n    <td>•</td>\n  </tr>\n</table>", "jadval"],
  ["tr", "<tr>•</tr>", "jadval qatori"],
  ["td", "<td>•</td>", "jadval katagi"],
  ["th", "<th>•</th>", "jadval sarlavhasi"],
  ["br", "<br>•", "qator tashlash"],
  ["hr", "<hr>•", "ajratuvchi chiziq"],
  ["header", "<header>•</header>", "sahifa boshi"],
  ["nav", "<nav>•</nav>", "navigatsiya"],
  ["main", "<main>•</main>", "asosiy qism"],
  ["section", "<section>•</section>", "bo'lim"],
  ["article", "<article>•</article>", "maqola"],
  ["footer", "<footer>•</footer>", "sahifa oxiri"],
  ["strong", "<strong>•</strong>", "qalin matn"],
  ["em", "<em>•</em>", "kursiv matn"],
  ["link", '<link rel="stylesheet" href="•">', "tashqi fayl"],
  ["meta", '<meta charset="•">', "meta ma'lumot"],
  ["script", '<script src="•"></script>', "skript"],
  ["style", "<style>•</style>", "ichki CSS"],
];

const HTML_ATTRS: Array<[string, string]> = [
  ["href", "havola manzili"],
  ["src", "fayl manzili"],
  ["alt", "muqobil matn"],
  ["id", "noyob identifikator"],
  ["class", "klass nomi"],
  ["type", "tur"],
  ["value", "qiymat"],
  ["name", "nom"],
  ["placeholder", "vaqtinchalik matn"],
  ["title", "tooltip"],
  ["target", "qayerda ochilsin"],
  ["width", "kenglik"],
  ["height", "balandlik"],
  ["disabled", "o'chirilgan"],
  ["required", "majburiy"],
  ["checked", "belgilangan"],
];

const CSS_PROPS: Array<[string, string]> = [
  ["color", "matn rangi"],
  ["background-color", "fon rangi"],
  ["background", "fon"],
  ["display", "joylashuv turi"],
  ["flex-direction", "flex yo'nalishi"],
  ["justify-content", "gorizontal tekislash"],
  ["align-items", "vertikal tekislash"],
  ["gap", "elementlar orasi"],
  ["grid-template-columns", "grid ustunlari"],
  ["padding", "ichki bo'shliq"],
  ["margin", "tashqi bo'shliq"],
  ["width", "kenglik"],
  ["height", "balandlik"],
  ["border", "chegara"],
  ["border-radius", "burchak yumaloqligi"],
  ["font-size", "shrift o'lchami"],
  ["font-weight", "shrift qalinligi"],
  ["font-family", "shrift turi"],
  ["text-align", "matn tekislash"],
  ["position", "joylashuv"],
  ["top", "yuqoridan"],
  ["left", "chapdan"],
  ["box-shadow", "soya"],
  ["opacity", "shaffoflik"],
  ["overflow", "chiqib ketgan qism"],
  ["cursor", "kursor ko'rinishi"],
  ["transition", "silliq o'tish"],
];

const CSS_VALUES: Record<string, string[]> = {
  display: ["flex", "grid", "block", "inline-block", "inline", "none"],
  "justify-content": ["center", "flex-start", "flex-end", "space-between", "space-around"],
  "align-items": ["center", "flex-start", "flex-end", "stretch", "baseline"],
  "flex-direction": ["row", "column", "row-reverse", "column-reverse"],
  position: ["relative", "absolute", "fixed", "sticky", "static"],
  "text-align": ["left", "center", "right", "justify"],
  cursor: ["pointer", "default", "text", "not-allowed"],
  overflow: ["hidden", "auto", "scroll", "visible"],
  "font-weight": ["400", "500", "600", "700", "bold", "normal"],
};

const JS_SNIPPETS: Array<[string, string, string]> = [
  ["console.log", "console.log(•)", "konsolga chiqarish"],
  ["document.getElementById", 'document.getElementById("•")', "id bo'yicha topish"],
  ["document.querySelector", 'document.querySelector("•")', "selektor bo'yicha topish"],
  ["addEventListener", 'addEventListener("click", () => {\n  •\n})', "hodisa qo'shish"],
  ["localStorage.setItem", 'localStorage.setItem("•", "")', "xotiraga saqlash"],
  ["localStorage.getItem", 'localStorage.getItem("•")', "xotiradan o'qish"],
  ["textContent", "textContent = •", "element matni"],
  ["innerHTML", "innerHTML = •", "element HTML'i"],
  ["function", "function •() {\n  \n}", "funksiya"],
  ["const", "const • = ", "o'zgarmas"],
  ["let", "let • = ", "o'zgaruvchi"],
  ["return", "return •", "qiymat qaytarish"],
  ["if", "if (•) {\n  \n}", "shart"],
  ["for", "for (let i = 0; i < •; i++) {\n  \n}", "takrorlash"],
  ["forEach", "forEach((item) => {\n  •\n})", "har element uchun"],
  ["map", "map((item) => •)", "o'zgartirib qaytarish"],
  ["filter", "filter((item) => •)", "saralash"],
  ["push", "push(•)", "massivga qo'shish"],
  ["length", "length•", "uzunlik"],
  ["JSON.stringify", "JSON.stringify(•)", "obyekt → matn"],
  ["JSON.parse", "JSON.parse(•)", "matn → obyekt"],
  ["alert", "alert(•)", "ogohlantirish oynasi"],
];

/** `•` belgisi kursor turadigan joyni bildiradi. */
function toCompletion(label: string, template: string, detail: string): Completion {
  const caret = template.indexOf("•");
  return {
    label,
    detail,
    insert: template.replace("•", ""),
    caret: caret === -1 ? undefined : caret,
  };
}

/** Kursor turgan joyga mos takliflarni qaytaradi. */
export function completionsAt(
  value: string,
  cursor: number,
  lang: CodeLang,
): CompletionContext | null {
  const head = value.slice(0, cursor);

  if (lang === "html") {
    // `<di` → teg nomi
    const tagMatch = /<([a-zA-Z][a-zA-Z0-9-]*)?$/.exec(head);
    if (tagMatch) {
      const prefix = (tagMatch[1] ?? "").toLowerCase();
      const items = HTML_TAGS.filter(([name]) => name.startsWith(prefix)).map(
        ([name, template, detail]) => toCompletion(name, template, detail),
      );
      return items.length ? { items, from: cursor - (tagMatch[0].length), prefix } : null;
    }

    // Ochiq teg ichida — atribut nomi
    const open = head.lastIndexOf("<");
    if (open !== -1 && head.indexOf(">", open) === -1) {
      const attrMatch = /[\s]([a-zA-Z-]*)$/.exec(head.slice(open));
      if (attrMatch) {
        const prefix = attrMatch[1].toLowerCase();
        const items = HTML_ATTRS.filter(([name]) => name.startsWith(prefix)).map(
          ([name, detail]) => toCompletion(name, `${name}="•"`, detail),
        );
        return items.length ? { items, from: cursor - prefix.length, prefix } : null;
      }
    }
    return null;
  }

  if (lang === "css") {
    // `display: fl` → qiymat taklifi
    const valueMatch = /([a-z-]+)\s*:\s*([a-zA-Z-]*)$/.exec(head);
    if (valueMatch) {
      const options = CSS_VALUES[valueMatch[1].toLowerCase()];
      if (options) {
        const prefix = valueMatch[2].toLowerCase();
        const items = options
          .filter((option) => option.startsWith(prefix))
          .map((option) => toCompletion(option, `${option};•`, valueMatch[1]));
        return items.length ? { items, from: cursor - prefix.length, prefix } : null;
      }
      return null;
    }

    // Xossa nomi
    const propMatch = /(^|[{;\n])\s*([a-z-]*)$/.exec(head);
    if (propMatch) {
      const prefix = propMatch[2].toLowerCase();
      if (!prefix) return null;
      const items = CSS_PROPS.filter(([name]) => name.startsWith(prefix)).map(
        ([name, detail]) => toCompletion(name, `${name}: •;`, detail),
      );
      return items.length ? { items, from: cursor - prefix.length, prefix } : null;
    }
    return null;
  }

  // JavaScript
  const wordMatch = /([A-Za-z_$][\w$.]*)$/.exec(head);
  if (!wordMatch) return null;
  const prefix = wordMatch[1];
  if (prefix.length < 2) return null;

  const lower = prefix.toLowerCase();
  const items = JS_SNIPPETS.filter(([label]) => {
    const name = label.toLowerCase();
    // `getElementById` ni `document.getElementById` sifatida ham topsin
    return name.startsWith(lower) || name.split(".").pop()!.startsWith(lower);
  }).map(([label, template, detail]) => toCompletion(label, template, detail));

  return items.length ? { items, from: cursor - prefix.length, prefix } : null;
}

/** Tanlangan taklifni matnga qo'yadi. */
export function applyCompletion(
  value: string,
  context: CompletionContext,
  cursor: number,
  completion: Completion,
): EditAction {
  const indent = lineIndent(value, context.from);
  // Ko'p qatorli qoliplar joriy chekinishga moslashadi
  const insert = completion.insert.replace(/\n/g, "\n" + indent);
  const caretShift =
    completion.caret === undefined
      ? insert.length
      : completion.insert.slice(0, completion.caret).replace(/\n/g, "\n" + indent).length;

  return {
    value: value.slice(0, context.from) + insert + value.slice(cursor),
    selStart: context.from + caretShift,
    selEnd: context.from + caretShift,
  };
}
