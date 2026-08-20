import { useState, useEffect, useCallback, useRef } from "react";
import {
  Maximize,
  AlertTriangle,
  CheckCircle,
  Download,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import ExamHeader from "./ExamHeader";
import MCQQuestionCard from "./MCQQuestionCard";
import DragDropCard from "./DragDropCard";
import Timer from "./Timer";
import {
  loadSession,
  saveSession,
  createSession,
  clearSession,
  getQuestionById,
  type ExamSession,
  type SessionAnswer,
} from "../utils/session";
import { encodeResult } from "../utils/encoding";
import { CATEGORIES, getByCategory, type Category } from "../utils/data/questions";

// ─── Animatsiya stillari (global bir marta inject qilinadi) ───
const ANIM_STYLES = `
  @keyframes slideDown {
    from { transform: translateY(-100%); opacity: 0; }
    to   { transform: translateY(0);     opacity: 1; }
  }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0);    }
  }
  @keyframes slideUp {
    from { transform: translateY(100%); }
    to   { transform: translateY(0);    }
  }
  @keyframes cardIn {
    from { opacity: 0; transform: translateY(16px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0)    scale(1);    }
  }
  @keyframes pulseRing {
    0%,100% { box-shadow: 0 0 0 0   rgba(0,100,0,0.15); }
    50%      { box-shadow: 0 0 0 10px rgba(0,100,0,0);   }
  }
  @keyframes scaleIn {
    from { transform: scale(0.85); opacity: 0; }
    to   { transform: scale(1);    opacity: 1; }
  }
  .anim-slide-down  { animation: slideDown 0.45s cubic-bezier(0.34,1.56,0.64,1) both; }
  .anim-fade-up     { animation: fadeUp   0.4s  ease                              both; }
  .anim-card-in     { animation: cardIn   0.4s  cubic-bezier(0.34,1.56,0.64,1)   both; }
  .anim-slide-up    { animation: slideUp  0.4s  cubic-bezier(0.34,1.56,0.64,1)   both; }
  .anim-scale-in    { animation: scaleIn  0.5s  cubic-bezier(0.34,1.56,0.64,1)   both; }
  .anim-pulse-ring  { animation: pulseRing 2s   ease-in-out infinite; }

  /* Dots scroll bar yashirish */
  .dots-scroll { scrollbar-width: none; -ms-overflow-style: none; }
  .dots-scroll::-webkit-scrollbar { display: none; }

  /* Option hover slide */
  .option-btn { transition: transform 0.2s cubic-bezier(0.34,1.56,0.64,1),
                            border-color 0.2s, background 0.2s, box-shadow 0.2s; }
  .option-btn:hover { transform: translateX(5px); }

  /* Tab transition */
  .tab-btn { transition: border-color 0.25s, color 0.25s; }

  /* Input focus ring */
  .input-field:focus {
    border-color: #006400 !important;
    box-shadow: 0 0 0 3px rgba(0,100,0,0.1);
    outline: none;
  }
`;

function useInjectStyles() {
  useEffect(() => {
    if (document.getElementById("exam-anim-styles")) return;
    const el = document.createElement("style");
    el.id = "exam-anim-styles";
    el.textContent = ANIM_STYLES;
    document.head.appendChild(el);
  }, []);
}

// ─── Icons ───
function HtmlIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
}

function CssIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M8 14s1.5 2 4 2 4-2 4-2" />
      <line x1="9" y1="9" x2="9.01" y2="9" />
      <line x1="15" y1="9" x2="15.01" y2="9" />
    </svg>
  );
}

function JsIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

function ExamDocIcon({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

// ─── Header corner decorators ───
function HeaderCorners() {
  const base = "absolute w-[18px] h-[18px] border-white/70";
  return (
    <>
      <span className={`${base} top-1.5 left-1.5 border-t-[3px] border-l-[3px] rounded-tl`} />
      <span className={`${base} top-1.5 right-1.5 border-t-[3px] border-r-[3px] rounded-tr`} />
      <span className={`${base} bottom-1.5 left-1.5 border-b-[3px] border-l-[3px] rounded-bl`} />
      <span className={`${base} bottom-1.5 right-1.5 border-b-[3px] border-r-[3px] rounded-br`} />
    </>
  );
}

const CATEGORY_META: Record<Category, { label: string; icon: React.ReactNode; color: string; bg: string; border: string }> = {
  HTML: {
    label: "HTML",
    icon: <HtmlIcon size={14} />,
    color: "text-orange-700",
    bg: "bg-orange-50",
    border: "border-orange-200",
  },
  CSS: {
    label: "CSS",
    icon: <CssIcon size={14} />,
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
  },
  JavaScript: {
    label: "JS",
    icon: <JsIcon size={14} />,
    color: "text-yellow-700",
    bg: "bg-yellow-50",
    border: "border-yellow-200",
  },
};

type Phase = "register" | "fullscreen" | "exam" | "submitted";

export default function ExamPage() {
  useInjectStyles();

  const [phase, setPhase] = useState<Phase>("register");
  const [session, setSession] = useState<ExamSession | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [activeCategory, setActiveCategory] = useState<Category>("HTML");
  const [currentIdx, setCurrentIdx] = useState(0);
  const [fsWarning, setFsWarning] = useState(false);
  const [fsBlocked, setFsBlocked] = useState(false);
  const [downloadCountdown, setDownloadCountdown] = useState(0);
  const fsViolations = useRef(0);

  useEffect(() => {
    const s = loadSession();
    if (s) {
      setSession(s);
      if (s.submitted) setPhase("submitted");
      else setPhase("fullscreen");
    }
  }, []);

  const onFsChange = useCallback(() => {
    if (!document.fullscreenElement) {
      fsViolations.current += 1;
      if (fsViolations.current >= 3) setFsBlocked(true);
      else setFsWarning(true);
    } else {
      setFsWarning(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, [onFsChange]);

  useEffect(() => {
    if (phase !== "exam") return;
    const block = (e: Event) => e.preventDefault();
    document.addEventListener("contextmenu", block);
    document.addEventListener("copy", block);
    document.addEventListener("cut", block);
    return () => {
      document.removeEventListener("contextmenu", block);
      document.removeEventListener("copy", block);
      document.removeEventListener("cut", block);
    };
  }, [phase]);

  async function requestFullscreen() {
    try { await document.documentElement.requestFullscreen(); } catch { }
  }

  function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) return;
    const name = `${firstName.trim()} ${lastName.trim()}`;
    const s = createSession(name);
    saveSession(s);
    setSession(s);
    setPhase("fullscreen");
  }

  async function handleStartExam() {
    await requestFullscreen();
    setPhase("exam");
    setFsWarning(false);
    setFsBlocked(false);
  }

  async function handleResumeFullscreen() {
    await requestFullscreen();
    setFsWarning(false);
  }

  function updateAnswer(questionId: number, answer: SessionAnswer) {
    if (!session) return;
    const updated: ExamSession = {
      ...session,
      answers: { ...session.answers, [questionId]: answer },
    };
    setSession(updated);
    saveSession(updated);
  }

  const handleSubmit = useCallback(() => {
    setSession((prev) => {
      if (!prev) return prev;
      const updated: ExamSession = { ...prev, submitted: true };
      saveSession(updated);
      return updated;
    });
    setPhase("submitted");
    setDownloadCountdown(5);
    if (document.fullscreenElement) document.exitFullscreen().catch(() => { });
  }, []);

  useEffect(() => {
    if (phase !== "submitted" || downloadCountdown <= 0) return;
    const timer = setTimeout(() => setDownloadCountdown(downloadCountdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [phase, downloadCountdown]);

  useEffect(() => {
    if (phase !== "submitted" || downloadCountdown === 0) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "Faylni yuklab oling! Balki chiqib ketmoqdasiz?";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [phase, downloadCountdown]);

  function handleDownload() {
    if (!session) return;
    const payload = {
      studentName: session.studentName,
      startTime: session.startTime,
      submitTime: Date.now(),
      answers: session.answers,
      categoryOrder: session.categoryOrder,
      optionOrders: session.optionOrders,
      dragOrders: session.dragOrders,
    };
    const encoded = encodeResult(payload);
    const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const parts = session.studentName.split(" ");
    const fname = parts[0] || "Student";
    const lname = parts.slice(1).join("_") || "Unknown";
    const filename = `${fname}_${lname}_${ts}.txt`;
    const blob = new Blob([encoded], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleNewExam() {
    clearSession();
    setSession(null);
    setPhase("register");
    setFirstName("");
    setLastName("");
    fsViolations.current = 0;
  }

  // ════════════════════════════════════════════════════════
  // REGISTER
  // ════════════════════════════════════════════════════════
  if (phase === "register") {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Header */}
        <div className="bg-[#006400] text-white py-3 px-6 relative overflow-hidden anim-slide-down">
          <HeaderCorners />
          <div className="text-center">
            <h1 className="text-[clamp(13px,3.5vw,18px)] font-bold tracking-widest uppercase">
              Web Development — Final Exam
            </h1>
            <p className="text-green-200 text-xs mt-0.5">Talaba ma'lumotlarini kiriting</p>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
          <div className="anim-card-in bg-white rounded-3xl shadow-lg border border-green-100 w-full max-w-md p-6 sm:p-8">
            {/* Icon */}
            <div className="text-center mb-6">
              <div className="anim-pulse-ring w-16 h-16 rounded-full bg-green-50 border-2 border-[#006400] flex items-center justify-center mx-auto mb-4 text-[#006400]">
                <ExamDocIcon size={30} />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Ro'yxatdan o'tish</h2>
              <p className="text-gray-500 text-sm mt-1">Imtihon 3 bo'lim: HTML • CSS • JavaScript</p>
            </div>

            {/* Category badges */}
            <div className="flex gap-2 justify-center flex-wrap mb-6">
              {CATEGORIES.map((cat, i) => {
                const m = CATEGORY_META[cat];
                return (
                  <span
                    key={cat}
                    className={`anim-fade-up flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold ${m.color} ${m.bg} ${m.border}`}
                    style={{ animationDelay: `${i * 0.08}s` }}
                  >
                    {m.icon} {m.label}
                  </span>
                );
              })}
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Ism</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Ismingizni kiriting"
                  required
                  className="input-field w-full border-[1.5px] border-gray-200 rounded-2xl px-4 py-3 text-gray-800 transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Familiya</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Familiyangizni kiriting"
                  required
                  className="input-field w-full border-[1.5px] border-gray-200 rounded-2xl px-4 py-3 text-gray-800 transition-all text-sm"
                />
              </div>

              <div className="bg-green-50 border border-green-100 rounded-2xl p-3.5 text-xs text-green-800 space-y-1">
                <p className="font-bold text-[13px]">⚠️ Muhim eslatmalar:</p>
                <p>• Imtihon to'liq ekranda o'tkaziladi</p>
                <p>• To'liq ekrandan chiqqanda imtihon bloklanadi</p>
                <p>• Sahifa yangilansa ham javoblaringiz saqlanadi</p>
              </div>

              <button
                type="submit"
                className="w-full bg-[#006400] hover:bg-green-800 active:scale-[0.98] text-white font-bold py-3.5 rounded-2xl transition-all duration-200 text-sm tracking-wide uppercase shadow-sm hover:shadow-md"
              >
                Imtihonni Boshlash
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════
  // FULLSCREEN PROMPT
  // ════════════════════════════════════════════════════════
  if (phase === "fullscreen") {
    return (
      <div className="min-h-screen bg-[#006400] flex flex-col items-center justify-center p-6">
        <div className="anim-scale-in bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 text-center">
          <div className="anim-pulse-ring w-20 h-20 rounded-full bg-green-50 border-[3px] border-[#006400] flex items-center justify-center mx-auto mb-6 text-[#006400]">
            <Maximize size={34} />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">To'liq Ekran Rejimi</h2>
          <p className="text-gray-600 text-sm mb-2">
            Salom, <strong>{session?.studentName}</strong>!
          </p>
          <p className="text-gray-500 text-sm mb-7">
            Imtihon faqat to'liq ekran rejimida o'tkaziladi.
          </p>
          <button
            onClick={handleStartExam}
            className="w-full bg-[#006400] hover:bg-green-800 active:scale-[0.98] text-white font-bold py-4 rounded-2xl transition-all duration-200 text-sm tracking-wide uppercase shadow-sm hover:shadow-md"
          >
            To'liq Ekranga Kirish va Boshlash
          </button>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════
  // SUBMITTED
  // ════════════════════════════════════════════════════════
  if (phase === "submitted") {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
        <div className="anim-scale-in bg-white rounded-3xl shadow-lg border border-green-100 w-full max-w-md p-8 text-center">
          <div className="anim-pulse-ring w-20 h-20 rounded-full bg-green-50 border-[3px] border-[#006400] flex items-center justify-center mx-auto mb-6 text-[#006400]">
            <CheckCircle size={34} />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Imtihon Topshirildi!</h2>
          <p className="text-gray-600 text-sm mb-2">
            <strong>{session?.studentName}</strong>
          </p>
          <p className="text-gray-500 text-sm mb-8">
            Javoblaringiz muvaffaqiyatli saqlandi. Natijani o'qituvchiga yuboring.
          </p>
          <div className="space-y-3">
            <button
              onClick={handleDownload}
              className="w-full flex items-center justify-center gap-2 bg-[#006400] hover:bg-green-800 active:scale-[0.98] text-white font-bold py-3.5 rounded-2xl transition-all duration-200 text-sm shadow-sm hover:shadow-md"
            >
              <Download size={17} />
              Natijani Yuklab Olish
            </button>

          </div>
        </div>
      </div>
    );
  }

  if (!session) return null;

  // ════════════════════════════════════════════════════════
  // EXAM
  // ════════════════════════════════════════════════════════
  const catIds = session.categoryOrder[activeCategory] ?? [];
  const currentQuestionId = catIds[currentIdx];
  const currentQ = currentQuestionId != null ? getQuestionById(currentQuestionId) : null;

  function catAnsweredCount(cat: Category): number {
    const ids = session!.categoryOrder[cat] ?? [];
    return ids.filter((id) => {
      const a = session!.answers[id];
      return a?.type === "mcq" ? a.selected !== null : true;
    }).length;
  }

  function catTotalCount(cat: Category): number {
    return (session!.categoryOrder[cat] ?? []).length;
  }

  const totalAnswered = CATEGORIES.reduce((s, c) => s + catAnsweredCount(c), 0);
  const totalAll = CATEGORIES.reduce((s, c) => s + catTotalCount(c), 0);
  const progressPct = totalAll > 0 ? Math.round((totalAnswered / totalAll) * 100) : 0;

  function switchCategory(cat: Category) {
    setActiveCategory(cat);
    setCurrentIdx(0);
  }

  const meta = CATEGORY_META[activeCategory];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* ── Fullscreen blocked ── */}
      {fsBlocked && (
        <div className="fixed inset-0 z-50 bg-red-700 flex flex-col items-center justify-center text-white p-8 text-center">
          <AlertTriangle size={60} className="mb-4" />
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">Imtihon Bloklab Qo'yildi</h2>
          <p className="text-red-200 text-base max-w-sm">
            Siz 3 marta to'liq ekrandan chiqdingiz. O'qituvchingizga murojaat qiling.
          </p>
        </div>
      )}

      {/* ── Fullscreen warning ── */}
      {fsWarning && !fsBlocked && (
        <div className="fixed inset-0 z-40 bg-black/80 flex flex-col items-center justify-center text-white p-8 text-center">
          <AlertTriangle size={52} className="mb-4 text-yellow-400" />
          <h2 className="text-xl sm:text-2xl font-bold mb-2">To'liq Ekrandan Chiqdingiz!</h2>
          <p className="text-gray-300 mb-1 text-sm">Ogohlantirish: {fsViolations.current}/3</p>
          <p className="text-gray-400 text-sm mb-6 max-w-xs">
            Yana {3 - fsViolations.current} marta chiqsangiz imtihon bloklanadi.
          </p>
          <button
            onClick={handleResumeFullscreen}
            className="bg-[#006400] hover:bg-green-700 text-white font-bold px-8 py-3.5 rounded-2xl transition-all duration-200 active:scale-[0.98]"
          >
            To'liq Ekranga Qaytish
          </button>
        </div>
      )}

      {/* ── Header ── */}
      <div className="anim-slide-down">
        <ExamHeader studentName={session.studentName} />
      </div>

      {/* ── Timer bar ── */}
      <div className="anim-fade-up bg-white border-b border-gray-100 px-4 py-2 flex justify-end" style={{ animationDelay: "0.1s" }}>
        <Timer startTime={session.startTime} onTimeUp={handleSubmit} />
      </div>

      {/* ── Category tabs ── */}
      <div className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-3 sm:px-4">
          <div className="flex">
            {CATEGORIES.map((cat) => {
              const m = CATEGORY_META[cat];
              const answered = catAnsweredCount(cat);
              const total = catTotalCount(cat);
              const active = cat === activeCategory;
              const allDone = answered === total;
              return (
                <button
                  key={cat}
                  onClick={() => switchCategory(cat)}
                  className={`tab-btn flex-1 flex flex-col items-center py-2.5 sm:py-3 px-1 border-b-[3px] text-[11px] sm:text-xs font-semibold gap-1 min-w-0 ${active
                    ? "border-[#006400] text-[#006400]"
                    : "border-transparent text-gray-400 hover:text-gray-600"
                    }`}
                >
                  {/* Icon + label — icon only on tiny screens */}
                  <span className={`flex items-center gap-1 sm:gap-1.5 ${active ? "text-[#006400]" : ""}`}>
                    <span className={active ? "text-[#006400]" : m.color}>{m.icon}</span>
                    <span className="hidden xs:inline sm:inline">{m.label}</span>
                    {/* Fallback: show on all screens but truncate */}
                    <span className="xs:hidden sm:hidden truncate max-w-[40px]">{m.label}</span>
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap ${allDone
                    ? "bg-green-100 text-[#006400]"
                    : active
                      ? "bg-green-50 text-[#006400]"
                      : "bg-gray-100 text-gray-500"
                    }`}>
                    {answered}/{total}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Overall progress */}
        <div className="max-w-3xl mx-auto px-4 pb-2.5">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-1.5">
            <span>Umumiy: {totalAnswered}/{totalAll}</span>
            <span className="font-semibold text-gray-500">{progressPct}%</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${progressPct}%`,
                background: "linear-gradient(90deg, #006400, #4caf50)",
              }}
            />
          </div>
        </div>
      </div>

      {/* ── Section header ── */}
      <div className={`border-b ${meta.bg} ${meta.border} py-2 px-4`}>
        <div className="max-w-3xl mx-auto flex items-center gap-2">
          <span className={meta.color}>{meta.icon}</span>
          <span className={`text-sm font-bold ${meta.color}`}>{CATEGORY_META[activeCategory].label === "JS" ? "JavaScript" : meta.label} Bo'limi</span>
          <span className="text-xs text-gray-400 ml-auto">
            Savol {currentIdx + 1} / {catIds.length}
          </span>
        </div>
      </div>

      {/* ── Question area ── */}
      {/* pb-28 ensures content isn't hidden behind fixed nav on mobile */}
      <div className="flex-1 py-4 sm:py-6 px-3 sm:px-4 pb-28">
        <div className="max-w-3xl mx-auto">
          {currentQ && currentQ.type === "mcq" ? (
            <div className="anim-card-in" key={currentQ.id}>
              <MCQQuestionCard
                question={currentQ}
                questionNumber={currentIdx + 1}
                optionOrder={session.optionOrders[currentQ.id] ?? currentQ.options.map((_, i) => i)}
                selectedOption={
                  (session.answers[currentQ.id] as { type: "mcq"; selected: number | null })?.selected ?? null
                }
                onSelect={(opt) =>
                  updateAnswer(currentQ.id, { type: "mcq", selected: opt })
                }
              />
            </div>
          ) : null}
        </div>
      </div>

      {/* ── Navigation bar (fixed bottom) ── */}
      <div className="anim-slide-up bg-white border-t-[1.5px] border-gray-100 px-3 sm:px-4 py-3 fixed bottom-0 left-0 right-0 z-20 shadow-[0_-4px_20px_rgba(0,100,0,0.08)]">
        <div className="max-w-3xl mx-auto flex items-center gap-2 sm:gap-3">

          {/* Prev button */}
          <button
            onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
            disabled={currentIdx === 0}
            className="flex-shrink-0 flex items-center gap-1 px-3 sm:px-4 py-2.5 border-[1.5px] border-gray-200 rounded-2xl text-sm font-semibold text-gray-600 disabled:opacity-35 hover:border-[#006400] hover:text-[#006400] transition-all duration-200 active:scale-[0.97] whitespace-nowrap"
          >
            <ChevronLeft size={15} />
            <span className="hidden sm:inline">Oldingi</span>
          </button>

          {/* Dots */}
          <div className="flex-1 flex items-center justify-center gap-1 dots-scroll overflow-x-auto py-1">
            {catIds.map((id, i) => {
              const ans = session.answers[id];
              const isAnswered = ans?.type === "mcq" ? ans.selected !== null : true;
              const isActive = i === currentIdx;
              return (
                <button
                  key={id}
                  onClick={() => setCurrentIdx(i)}
                  className={`flex-shrink-0 w-7 h-7 rounded-full text-[11px] font-bold transition-all duration-200 active:scale-90 ${isActive
                    ? "bg-[#006400] text-white scale-110 shadow-sm"
                    : isAnswered
                      ? "bg-green-100 text-[#006400] border-[1.5px] border-green-300"
                      : "bg-gray-100 text-gray-500 border-[1.5px] border-gray-200"
                    }`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>

          {/* Next / Next section / Submit */}
          {currentIdx < catIds.length - 1 ? (
            <button
              onClick={() => setCurrentIdx((i) => Math.min(catIds.length - 1, i + 1))}
              className="flex-shrink-0 flex items-center gap-1 px-3 sm:px-4 py-2.5 bg-[#006400] hover:bg-green-800 rounded-2xl text-sm font-semibold text-white transition-all duration-200 active:scale-[0.97] whitespace-nowrap shadow-sm"
            >
              <span className="hidden sm:inline">Keyingi</span>
              <ChevronRight size={15} />
            </button>
          ) : activeCategory !== "JavaScript" ? (
            <button
              onClick={() => {
                const nextCat = CATEGORIES[CATEGORIES.indexOf(activeCategory) + 1];
                switchCategory(nextCat);
              }}
              className="flex-shrink-0 flex items-center gap-1 px-3 sm:px-4 py-2.5 bg-[#006400] hover:bg-green-800 rounded-2xl text-sm font-semibold text-white transition-all duration-200 active:scale-[0.97] whitespace-nowrap shadow-sm"
            >
              <span className="hidden sm:inline">Keyingi Bo'lim</span>
              <span className="sm:hidden">Bo'lim</span>
              <ChevronRight size={15} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="flex-shrink-0 flex items-center gap-1.5 px-4 sm:px-5 py-2.5 bg-[#006400] hover:bg-green-800 rounded-2xl text-sm font-bold text-white transition-all duration-200 active:scale-[0.97] whitespace-nowrap shadow-sm"
            >
              <CheckCircle size={15} />
              Topshirish
            </button>
          )}
        </div>
      </div>
    </div>
  );
}