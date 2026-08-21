import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  autoPair,
  autoCloseTag,
  handleEnter,
  handleBackspace,
  handleTab,
  completionsAt,
  applyCompletion,
  type EditAction,
  type CompletionContext,
} from "../utils/codeAssist";
import { highlight } from "../utils/highlight";
import type { CodeLang } from "../utils/answerMatch";

type Props = {
  value: string;
  onChange: (value: string) => void;
  lang: CodeLang;
  placeholder?: string;
  minLines?: number;
  ariaLabel?: string;
};

const LINE_HEIGHT = 20;
const MAX_VISIBLE_COMPLETIONS = 6;

/**
 * Talaba kod yozadigan maydon. Oddiy <textarea> ustiga VS Code'dan tanish
 * yordamchilar qo'shilgan:
 *   · qavs/qo'shtirnoq avtomatik yopiladi, belgilangan matn o'raladi
 *   · `<div` dan keyin `>` bosilsa `</div>` o'zi qo'shiladi
 *   · Enter blok ichida chekinishni to'g'ri hisoblaydi
 *   · Tab fokusni ko'chirmaydi, chekinish qo'yadi (Esc bosilsa — ko'chiradi)
 *   · Ctrl+Space yoki yozish paytida avtoto'ldirish ro'yxati chiqadi
 *
 * Bo'yash uchun matn ikki marta chiziladi: pastda rangli <pre>, ustida
 * matni shaffof <textarea>. Ikkalasining shrifti va oraliqlari bir xil.
 */
export default function CodeEditor({
  value,
  onChange,
  lang,
  placeholder,
  minLines = 5,
  ariaLabel,
}: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLPreElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);

  // Tab bilan fokusni ko'chirish uchun: Esc bosilsa keyingi Tab chiqib ketadi
  const escapeArmed = useRef(false);
  // React qayta chizgandan keyin kursorni tiklash uchun
  const pendingSelection = useRef<{ start: number; end: number } | null>(null);

  const [completion, setCompletion] = useState<CompletionContext | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const lineCount = useMemo(() => value.split("\n").length, [value]);
  const visibleLines = Math.max(minLines, lineCount);

  const highlighted = useMemo(() => {
    // Oxirgi qator bo'sh bo'lsa <pre> uni ko'rsatmaydi — bo'shliq qo'shamiz
    return highlight(value, lang) + (value.endsWith("\n") || value === "" ? " " : "");
  }, [value, lang]);

  useLayoutEffect(() => {
    const node = textareaRef.current;
    const selection = pendingSelection.current;
    if (node && selection) {
      node.setSelectionRange(selection.start, selection.end);
      pendingSelection.current = null;
    }
  });

  function apply(action: EditAction, refreshCompletion = true) {
    pendingSelection.current = { start: action.selStart, end: action.selEnd };
    onChange(action.value);
    if (refreshCompletion) {
      const next = completionsAt(action.value, action.selStart, lang);
      setCompletion(next);
      setActiveIndex(0);
    } else {
      setCompletion(null);
    }
  }

  function syncScroll() {
    const node = textareaRef.current;
    if (!node) return;
    if (highlightRef.current) {
      highlightRef.current.scrollLeft = node.scrollLeft;
      highlightRef.current.scrollTop = node.scrollTop;
    }
    if (gutterRef.current) gutterRef.current.scrollTop = node.scrollTop;
  }

  function acceptCompletion(index: number) {
    const node = textareaRef.current;
    if (!node || !completion) return;
    const item = completion.items[index];
    if (!item) return;
    apply(applyCompletion(value, completion, node.selectionStart, item), false);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    const node = event.currentTarget;
    const start = node.selectionStart;
    const end = node.selectionEnd;
    const open = completion !== null && completion.items.length > 0;

    // ─ Avtoto'ldirish ro'yxati ochiq bo'lganda ─
    if (open) {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((i) => (i + 1) % completion.items.length);
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((i) => (i - 1 + completion.items.length) % completion.items.length);
        return;
      }
      if (event.key === "Enter" || event.key === "Tab") {
        event.preventDefault();
        acceptCompletion(activeIndex);
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        setCompletion(null);
        return;
      }
    }

    // Ctrl+Space — ro'yxatni qo'lda chaqirish
    if (event.ctrlKey && event.code === "Space") {
      event.preventDefault();
      setCompletion(completionsAt(value, start, lang));
      setActiveIndex(0);
      return;
    }

    if (event.key === "Escape") {
      // Klaviatura bilan yuruvchilar tuzoqqa tushmasin:
      // Esc bosilgandan keyingi Tab fokusni keyingi elementga o'tkazadi.
      escapeArmed.current = true;
      setCompletion(null);
      return;
    }

    if (event.key === "Tab") {
      if (escapeArmed.current) {
        escapeArmed.current = false;
        return; // brauzerning odatiy xatti-harakati — fokusni ko'chirish
      }
      const action = handleTab(value, start, end, event.shiftKey);
      if (action) {
        event.preventDefault();
        apply(action, false);
      }
      return;
    }

    escapeArmed.current = false;

    if (event.key === "Enter" && !event.ctrlKey && !event.metaKey) {
      const action = handleEnter(value, start, end, lang);
      if (action) {
        event.preventDefault();
        apply(action, false);
      }
      return;
    }

    if (event.key === "Backspace") {
      const action = handleBackspace(value, start, end);
      if (action) {
        event.preventDefault();
        apply(action);
      }
      return;
    }

    if (event.key === ">") {
      const action = autoCloseTag(value, start, lang);
      if (action) {
        event.preventDefault();
        apply(action, false);
      }
      return;
    }

    if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      const action = autoPair(value, start, end, event.key);
      if (action) {
        event.preventDefault();
        apply(action);
      }
    }
  }

  function handleInput(event: React.ChangeEvent<HTMLTextAreaElement>) {
    const next = event.target.value;
    onChange(next);
    const context = completionsAt(next, event.target.selectionStart, lang);
    setCompletion(context);
    setActiveIndex(0);
  }

  useEffect(() => {
    syncScroll();
  }, [value]);

  const items = completion?.items.slice(0, MAX_VISIBLE_COMPLETIONS) ?? [];

  return (
    <div className="code-editor">
      <div className="code-editor__body" style={{ height: visibleLines * LINE_HEIGHT + 24 }}>
        <div className="code-editor__gutter" ref={gutterRef} aria-hidden>
          {Array.from({ length: visibleLines }, (_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>

        <div className="code-editor__area">
          <pre
            ref={highlightRef}
            className="code-editor__highlight"
            aria-hidden
            dangerouslySetInnerHTML={{ __html: highlighted }}
          />
          <textarea
            ref={textareaRef}
            className="code-editor__input"
            value={value}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            onScroll={syncScroll}
            onBlur={() => setCompletion(null)}
            placeholder={placeholder}
            aria-label={ariaLabel ?? "Kod yozish maydoni"}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            autoComplete="off"
          />
        </div>
      </div>

      {items.length > 0 && (
        <ul className="code-editor__completions" role="listbox">
          {items.map((item, index) => (
            <li key={item.label}>
              <button
                type="button"
                role="option"
                aria-selected={index === activeIndex}
                className={index === activeIndex ? "is-active" : undefined}
                // onMouseDown — onBlur ro'yxatni yopib ulgurmasin
                onMouseDown={(e) => {
                  e.preventDefault();
                  acceptCompletion(index);
                }}
                onMouseEnter={() => setActiveIndex(index)}
              >
                <span className="code-editor__completion-label">{item.label}</span>
                {item.detail && (
                  <span className="code-editor__completion-detail">{item.detail}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
