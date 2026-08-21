/**
 * Yengil sintaksis bo'yash. Tashqi kutubxona ishlatilmaydi — bundle hajmi
 * oshmasin va imtihon oflayn ham ishlasin.
 *
 * Natija <pre> ichiga qo'yiladi va uning ustiga shaffof <textarea> tushadi,
 * shuning uchun chiqish matni KIRISH matni bilan belgi-ma-belgi bir xil
 * bo'lishi shart — hech narsa qo'shilmaydi va tashlab ketilmaydi.
 */

import type { CodeLang } from "./answerMatch";

type Token = { text: string; cls: string };

const ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
};

function escapeHtml(text: string): string {
  return text.replace(/[&<>]/g, (ch) => ESCAPES[ch]);
}

export function highlight(source: string, lang: CodeLang): string {
  const tokens =
    lang === "html" ? tokenizeHtml(source)
      : lang === "css" ? tokenizeCss(source)
        : tokenizeJs(source);

  return tokens
    .map((token) =>
      token.cls
        ? `<span class="tok-${token.cls}">${escapeHtml(token.text)}</span>`
        : escapeHtml(token.text),
    )
    .join("");
}

function push(tokens: Token[], text: string, cls: string) {
  if (text) tokens.push({ text, cls });
}

// ─── HTML ────────────────────────────────────────────────────────────────────

function tokenizeHtml(src: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < src.length) {
    if (src.startsWith("<!--", i)) {
      const end = src.indexOf("-->", i);
      const stop = end === -1 ? src.length : end + 3;
      push(tokens, src.slice(i, stop), "comment");
      i = stop;
      continue;
    }

    if (src[i] === "<") {
      const end = src.indexOf(">", i);
      const stop = end === -1 ? src.length : end + 1;
      tokenizeTag(tokens, src.slice(i, stop));
      i = stop;
      continue;
    }

    const next = src.indexOf("<", i);
    const stop = next === -1 ? src.length : next;
    push(tokens, src.slice(i, stop), "");
    i = stop;
  }

  return tokens;
}

function tokenizeTag(tokens: Token[], raw: string) {
  const match = /^(<\/?)([a-zA-Z][a-zA-Z0-9-]*)?([\s\S]*?)(\/?>)?$/.exec(raw);
  if (!match) {
    push(tokens, raw, "punct");
    return;
  }

  push(tokens, match[1], "punct");
  push(tokens, match[2] ?? "", "tag");

  const body = match[3] ?? "";
  const attrRe = /([a-zA-Z-]+)|(=)|("[^"]*"|'[^']*')|(\s+)|([\s\S])/g;
  let m: RegExpExecArray | null;
  while ((m = attrRe.exec(body)) !== null) {
    if (m[1]) push(tokens, m[1], "attr");
    else if (m[2]) push(tokens, m[2], "punct");
    else if (m[3]) push(tokens, m[3], "string");
    else push(tokens, m[0], "");
  }

  push(tokens, match[4] ?? "", "punct");
}

// ─── CSS ─────────────────────────────────────────────────────────────────────

function tokenizeCss(src: string): Token[] {
  const tokens: Token[] = [];
  const re =
    /(\/\*[\s\S]*?\*\/)|("[^"]*"|'[^']*')|(#[0-9a-fA-F]{3,8}\b)|(-?\d+(?:\.\d+)?(?:px|em|rem|%|vh|vw|s|fr|deg)?)|([a-zA-Z-]+)(?=\s*:)|([{};:,()])|([\s\S])/g;

  let m: RegExpExecArray | null;
  let inBlock = false;

  while ((m = re.exec(src)) !== null) {
    if (m[1]) push(tokens, m[1], "comment");
    else if (m[2]) push(tokens, m[2], "string");
    else if (m[3]) push(tokens, m[3], "number");
    else if (m[4]) push(tokens, m[4], "number");
    else if (m[5]) push(tokens, m[5], inBlock ? "attr" : "tag");
    else if (m[6]) {
      if (m[6] === "{") inBlock = true;
      if (m[6] === "}") inBlock = false;
      push(tokens, m[6], "punct");
    } else {
      // Blokdan tashqaridagi matn — selektor
      push(tokens, m[0], inBlock ? "" : "tag");
    }
  }

  return tokens;
}

// ─── JavaScript ──────────────────────────────────────────────────────────────

const JS_KEYWORDS = new Set([
  "const", "let", "var", "function", "return", "if", "else", "for", "while",
  "do", "break", "continue", "new", "class", "extends", "this", "typeof",
  "instanceof", "true", "false", "null", "undefined", "async", "await",
  "try", "catch", "finally", "throw", "switch", "case", "default", "of", "in",
]);

const JS_GLOBALS = new Set([
  "console", "document", "window", "localStorage", "sessionStorage",
  "JSON", "Math", "Array", "Object", "String", "Number", "Boolean", "Date",
]);

function tokenizeJs(src: string): Token[] {
  const tokens: Token[] = [];
  const re =
    /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|("(?:[^"\\]|\\[\s\S])*"|'(?:[^'\\]|\\[\s\S])*'|`(?:[^`\\]|\\[\s\S])*`)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_$][\w$]*)|([\s\S])/g;

  let m: RegExpExecArray | null;
  while ((m = re.exec(src)) !== null) {
    if (m[1]) { push(tokens, m[1], "comment"); continue; }
    if (m[2]) { push(tokens, m[2], "string"); continue; }
    if (m[3]) { push(tokens, m[3], "number"); continue; }

    if (m[4]) {
      const word = m[4];
      const after = src.slice(re.lastIndex);
      const before = src.slice(0, m.index);
      if (JS_KEYWORDS.has(word)) push(tokens, word, "keyword");
      else if (JS_GLOBALS.has(word)) push(tokens, word, "tag");
      else if (/^\s*\(/.test(after)) push(tokens, word, "func");
      else if (before.endsWith(".")) push(tokens, word, "attr");
      else push(tokens, word, "");
      continue;
    }

    push(tokens, m[0], /[{}()[\];:,.=+\-*/<>!&|?]/.test(m[0]) ? "punct" : "");
  }

  return tokens;
}
