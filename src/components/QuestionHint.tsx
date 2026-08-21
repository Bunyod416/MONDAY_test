import { useState } from "react";
import { Lightbulb, ChevronDown } from "lucide-react";

type Props = { hint: string };

/**
 * Har savolda `hint` maydoni bor edi, lekin u hech qayerda ko'rsatilmasdi.
 * Endi u yopiq holda turadi va talaba xohlasa ochadi — javob to'satdan
 * ko'rinib qolmasligi uchun.
 */
export default function QuestionHint({ hint }: Props) {
  const [open, setOpen] = useState(false);
  if (!hint) return null;

  return (
    <div className="mt-4 border-t border-gray-200 pt-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex items-center gap-1.5 text-xs font-medium text-gray-500 transition-colors hover:text-green-700"
      >
        <Lightbulb size={14} />
        Yordam
        <ChevronDown
          size={13}
          className={`transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>

      {open && (
        <p className="anim-fade-up mt-2 rounded-lg bg-green-50 px-3 py-2.5 text-xs leading-relaxed text-green-800">
          {hint}
        </p>
      )}
    </div>
  );
}
