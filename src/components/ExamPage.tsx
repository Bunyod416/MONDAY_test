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
import QuestionResponseCard from "./QuestionResponseCard";
import Timer from "./Timer";
import {
  loadSession,
  saveSession,
  clearSession,
  createSession,
  getQuestionById,
  isAnswered,
  type ExamSession,
  type SessionAnswer,
} from "../utils/session";
import { encodeResult } from "../utils/encoding";
import { loadConfig, totalSelectedQuestions } from "../utils/config";
import { verifyAdminPassword } from "../utils/auth";
import { setExamActive } from "../utils/examLock";
import { CATEGORIES, type Category } from "../utils/data/questions";

// ─── Animatsiya stillari (global bir marta inject qilinadi) ───
// Barcha o'tishlar `cubic-bezier(0.2,0,0,1)` — sakramaydigan, o'lchovli egri.
// Ilgari hamma joyda `cubic-bezier(0.34,1.56,0.64,1)` ishlatilardi: u oxirida
// oshib ketadi (overshoot) va imtihon interfeysiga o'yinchoq tusini berardi.
const EASE = "cubic-bezier(0.2, 0, 0, 1)";
const ANIM_STYLES = `
  @keyframes slideDown {
    from { transform: translateY(-8px); opacity: 0; }
    to   { transform: translateY(0);    opacity: 1; }
  }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0);   }
  }
  @keyframes slideUp {
    from { transform: translateY(12px); opacity: 0; }
    to   { transform: translateY(0);    opacity: 1; }
  }
  @keyframes cardIn {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0);   }
  }
  @keyframes scaleIn {
    from { transform: scale(0.98); opacity: 0; }
    to   { transform: scale(1);    opacity: 1; }
  }
  .anim-slide-down { animation: slideDown 0.28s ${EASE} both; }
  .anim-fade-up    { animation: fadeUp    0.28s ${EASE} both; }
  .anim-card-in    { animation: cardIn    0.24s ${EASE} both; }
  .anim-slide-up   { animation: slideUp   0.28s ${EASE} both; }
  .anim-scale-in   { animation: scaleIn   0.24s ${EASE} both; }

  /* Dots scroll bar yashirish */
  .dots-scroll { scrollbar-width: none; -ms-overflow-style: none; }
  .dots-scroll::-webkit-scrollbar { display: none; }

  .tab-btn { transition: border-color 0.18s ${EASE}, color 0.18s ${EASE}; }

  /* Fokus halqasi — brend yashilida, jimgina */
  .input-field { transition: border-color 0.15s ${EASE}, box-shadow 0.15s ${EASE}; }
  .input-field:focus {
    border-color: #2C684F !important;
    box-shadow: 0 0 0 3px rgba(27, 94, 63, 0.12);
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
const BLOCKED_STUDENTS_KEY = "exam_blocked_students_v1";
const ACTIVE_STUDENT_KEY = "exam_active_student_v1";
const MAX_VIOLATIONS = 5;
/** Fokus yo'qolganini qoidabuzarlik deb hisoblashdan oldin kutiladigan vaqt. */
const BLUR_GRACE_MS = 1500;

function normalizeStudentName(name: string) {
  return name.trim().replace(/\s+/g, " ").toLocaleLowerCase();
}

function getBlockedStudents(): string[] {
  try {
    const value = localStorage.getItem(BLOCKED_STUDENTS_KEY);
    const students = value ? JSON.parse(value) : [];
    return Array.isArray(students) ? students.filter((s) => typeof s === "string") : [];
  } catch {
    return [];
  }
}

// Bloklash faqat AYNAN SHU talabaga tegishli.
// Ilgari bir talaba bloklansa butun qurilma hamma uchun yopilardi — kompyuter
// sinfida bu birinchi qoidabuzarlikdan keyin imtihonni to'xtatib qo'yardi.
function blockStudent(name: string) {
  const student = normalizeStudentName(name);
  if (!student) return;
  try {
    localStorage.setItem(ACTIVE_STUDENT_KEY, student);
    const blocked = getBlockedStudents();
    if (!blocked.includes(student)) {
      localStorage.setItem(BLOCKED_STUDENTS_KEY, JSON.stringify([...blocked, student]));
    }
  } catch {
    /* ignore */
  }
}

function isStudentBlocked(name: string) {
  const student = normalizeStudentName(name);
  return student !== "" && getBlockedStudents().includes(student);
}

/** O'qituvchi uchun: barcha bloklarni tozalash (parol bilan himoyalangan). */
function clearAllBlocks() {
  try {
    localStorage.removeItem(BLOCKED_STUDENTS_KEY);
    localStorage.removeItem(ACTIVE_STUDENT_KEY);
    // Eski versiyadan qolgan "qurilma bloklandi" bayrog'i
    localStorage.removeItem("exam_device_blocked_v1");
  } catch {
    /* ignore */
  }
}

export default function ExamPage() {
  useInjectStyles();

  const [phase, setPhase] = useState<Phase>("register");
  const [session, setSession] = useState<ExamSession | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [registrationError, setRegistrationError] = useState("");
  const [storageWarning, setStorageWarning] = useState(false);
  const [activeCategory, setActiveCategory] = useState<Category>("HTML");
  const [currentIdx, setCurrentIdx] = useState(0);
  const [fsWarning, setFsWarning] = useState(false);
  const [fsBlocked, setFsBlocked] = useState(false);
  const [downloadCountdown, setDownloadCountdown] = useState(0);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [unlockOpen, setUnlockOpen] = useState(false);
  const [unlockPassword, setUnlockPassword] = useState("");
  const [unlockError, setUnlockError] = useState(false);
  const fsViolations = useRef(0);
  const ignoreFullscreenChange = useRef(false);
  const backgroundViolationLock = useRef(false);
  const blurTimer = useRef<number | null>(null);
  const autoDownloadDone = useRef(false);

  // Savollar soni va imtihon davomiyligi admin panelda belgilanadi —
  // talaba ularni o'zgartira olmaydi. useState initializer bilan bir marta
  // o'qiladi: har render'da localStorage'ga murojaat qilish shart emas.
  const [config] = useState(loadConfig);

  useEffect(() => {
    const s = loadSession();
    if (s) {
      setSession(s);
      fsViolations.current = s.violationCount ?? 0;
      if (isStudentBlocked(s.studentName) || fsViolations.current >= MAX_VIOLATIONS) {
        blockStudent(s.studentName);
        setFsBlocked(true);
        setPhase("exam");
      } else if (s.submitted) setPhase("submitted");
      else setPhase("fullscreen");
      return;
    }

    const activeStudent = localStorage.getItem(ACTIVE_STUDENT_KEY) ?? "";
    if (activeStudent && isStudentBlocked(activeStudent)) {
      setRegistrationError("Bu o'quvchi bloklangan va qayta test topshira olmaydi.");
    }
  }, []);

  // App.tsx dagi Ctrl+Shift+U admin yorlig'i imtihon vaqtida ishlamasin.
  useEffect(() => {
    setExamActive(phase === "exam");
    return () => setExamActive(false);
  }, [phase]);

  /** Sessiyani saqlaydi; joy yetmasa talabani ogohlantiradi. */
  const persist = useCallback((updated: ExamSession) => {
    setStorageWarning(!saveSession(updated));
  }, []);

  const registerViolation = useCallback(() => {
    fsViolations.current += 1;
    setSession((prev) => {
      if (!prev) return prev;
      const updated = {
        ...prev,
        violationCount: fsViolations.current,
        pausedAt: prev.pausedAt ?? Date.now(),
      };
      if (updated.violationCount >= MAX_VIOLATIONS) blockStudent(updated.studentName);
      persist(updated);
      return updated;
    });
    if (fsViolations.current >= MAX_VIOLATIONS) setFsBlocked(true);
    else setFsWarning(true);
  }, [persist]);

  const registerBackgroundViolation = useCallback(() => {
    if (backgroundViolationLock.current) return;
    backgroundViolationLock.current = true;
    registerViolation();
  }, [registerViolation]);

  // Ctrl+H — o'qituvchi uchun blokni ochish. Endi admin paroli so'raladi:
  // ilgari bu yorliq hech qanday tekshiruvsiz hamma bloklarni o'chirardi,
  // ya'ni istalgan talaba o'zini blokdan chiqarib olardi.
  useEffect(() => {
    const handleUnlockShortcut = (event: KeyboardEvent) => {
      if (!event.ctrlKey || event.key.toUpperCase() !== "H") return;
      event.preventDefault();
      event.stopPropagation();
      setUnlockPassword("");
      setUnlockError(false);
      setUnlockOpen(true);
    };

    window.addEventListener("keydown", handleUnlockShortcut, true);
    return () => window.removeEventListener("keydown", handleUnlockShortcut, true);
  }, []);

  function handleUnlockSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!verifyAdminPassword(unlockPassword)) {
      setUnlockError(true);
      return;
    }
    clearAllBlocks();
    clearSession();
    fsViolations.current = 0;
    backgroundViolationLock.current = false;
    autoDownloadDone.current = false;
    setUnlockOpen(false);
    setUnlockPassword("");
    setSession(null);
    setFsBlocked(false);
    setFsWarning(false);
    setRegistrationError("");
    setStorageWarning(false);
    setPhase("register");
  }

  const onFsChange = useCallback(() => {
    if (ignoreFullscreenChange.current) {
      ignoreFullscreenChange.current = false;
      return;
    }
    if (phase !== "exam") return;
    if (!document.fullscreenElement) {
      registerViolation();
    } else {
      setFsWarning(false);
    }
  }, [phase, registerViolation]);

  useEffect(() => {
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, [onFsChange]);

  useEffect(() => {
    if (phase !== "exam") return;
    const blockContextMenu = (event: MouseEvent) => event.preventDefault();
    const blockExamShortcuts = (event: KeyboardEvent) => {
      const isFunctionKey = event.key === "F11" || event.key === "F12";
      const isAltTab = event.altKey && event.key === "Tab";
      const isReload = event.ctrlKey && ["r", "R"].includes(event.key);
      if (isFunctionKey || isAltTab || isReload) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    document.addEventListener("contextmenu", blockContextMenu);
    window.addEventListener("keydown", blockExamShortcuts, true);
    return () => {
      document.removeEventListener("contextmenu", blockContextMenu);
      window.removeEventListener("keydown", blockExamShortcuts, true);
    };
  }, [phase]);

  useEffect(() => {
    if (phase !== "exam") return;

    const cancelBlurTimer = () => {
      if (blurTimer.current !== null) {
        window.clearTimeout(blurTimer.current);
        blurTimer.current = null;
      }
    };

    // Sahifa haqiqatan yashirilgan (boshqa tabga o'tish, minimallashtirish) —
    // bu aniq qoidabuzarlik, darhol hisoblanadi.
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        cancelBlurTimer();
        registerBackgroundViolation();
      } else {
        backgroundViolationLock.current = false;
      }
    };

    // blur esa juda sezgir: brauzer manzil qatoriga bosish, ikkinchi monitor,
    // bildirishnoma — bularning hammasi blur beradi. Shuning uchun darhol emas,
    // fokus BLUR_GRACE_MS davomida qaytmasagina qoidabuzarlik deb yoziladi.
    const handleWindowBlur = () => {
      cancelBlurTimer();
      blurTimer.current = window.setTimeout(() => {
        blurTimer.current = null;
        if (!document.hasFocus()) registerBackgroundViolation();
      }, BLUR_GRACE_MS);
    };

    const handleWindowFocus = () => {
      cancelBlurTimer();
      backgroundViolationLock.current = false;
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);
    window.addEventListener("focus", handleWindowFocus);
    return () => {
      cancelBlurTimer();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
      window.removeEventListener("focus", handleWindowFocus);
    };
  }, [phase, registerBackgroundViolation]);

  async function requestFullscreen() {
    try { await document.documentElement.requestFullscreen(); } catch { return; }
  }

  function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) return;
    const name = `${firstName.trim()} ${lastName.trim()}`;
    if (isStudentBlocked(name)) {
      setRegistrationError("Bu o'quvchi bloklangan va qayta test topshira olmaydi.");
      return;
    }
    if (totalSelectedQuestions(config) === 0) {
      setRegistrationError(
        "Imtihon sozlanmagan: savollar soni 0. O'qituvchiga murojaat qiling.",
      );
      return;
    }
    try {
      localStorage.setItem(ACTIVE_STUDENT_KEY, normalizeStudentName(name));
    } catch {
      /* ignore */
    }
    setRegistrationError("");
    const s = createSession(name, config);
    persist(s);
    setSession(s);
    setPhase("fullscreen");
  }

  async function handleStartExam() {
    try {
      await document.documentElement.requestFullscreen();
    } catch {
      return;
    }
    setPhase("exam");
    setFsWarning(false);
    setFsBlocked(false);
  }

  async function handleResumeFullscreen() {
    await requestFullscreen();
    if (document.fullscreenElement) {
      setSession((prev) => {
        if (!prev || prev.pausedAt === null) return prev;
        const updated = {
          ...prev,
          pausedAt: null,
          pausedDuration: prev.pausedDuration + (Date.now() - prev.pausedAt),
        };
        persist(updated);
        return updated;
      });
    }
    setFsWarning(false);
  }

  function handleViolationAction() {
    void handleResumeFullscreen();
  }

  function updateAnswer(questionId: number, answer: SessionAnswer) {
    if (!session) return;
    const updated: ExamSession = {
      ...session,
      answers: { ...session.answers, [questionId]: answer },
    };
    setSession(updated);
    persist(updated);
  }

  const handleSubmit = useCallback(() => {
    ignoreFullscreenChange.current = true;
    setSession((prev) => {
      if (!prev) return prev;
      const updated: ExamSession = { ...prev, submitted: true };
      persist(updated);
      return updated;
    });
    setPhase("submitted");
    setDownloadCountdown(5);
    if (document.fullscreenElement) document.exitFullscreen().catch(() => { });
  }, [persist]);

  useEffect(() => {
    if (phase !== "submitted" || downloadCountdown <= 0) return;
    const timer = setTimeout(() => setDownloadCountdown(downloadCountdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [phase, downloadCountdown]);

  useEffect(() => {
    const shouldWarn = phase === "exam" || (phase === "submitted" && downloadCountdown > 0);
    if (!shouldWarn) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (phase === "exam") registerBackgroundViolation();
      e.preventDefault();
      e.returnValue = "Imtihon yakunlanmagan. Chiqishni xohlaysizmi?";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [phase, downloadCountdown, registerBackgroundViolation]);

  function handleDownload() {
    if (!session) return;
    const payload = {
      studentName: session.studentName,
      startTime: session.startTime,
      pausedDuration: session.pausedDuration,
      submitTime: Date.now(),
      violationCount: session.violationCount,
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
    const blob = new Blob([encoded], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    // Ba'zi brauzerlar (Firefox) yuklashni darhol revoke qilinsa bekor qiladi —
    // shuning uchun tozalash keyingi tick'ga qoldiriladi.
    window.setTimeout(() => {
      URL.revokeObjectURL(url);
      a.remove();
    }, 2000);
  }

  useEffect(() => {
    if (phase !== "submitted" || !session || autoDownloadDone.current) return;
    // Bayroq timeout ICHIDA qo'yiladi. Ilgari u effekt boshida qo'yilardi:
    // StrictMode effektni ikki marta chaqirganda cleanup timerni o'chirar,
    // ikkinchi chaqiruv esa bayroq tufayli darhol qaytar edi — natijada
    // dev rejimda fayl umuman yuklanmasdi.
    const timer = window.setTimeout(() => {
      autoDownloadDone.current = true;
      handleDownload();
    }, 10);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, session]);



  // Ctrl+H bilan ochiladigan o'qituvchi oynasi. Komponent emas, oddiy JSX
  // o'zgaruvchisi — aks holda har render'da qayta mount bo'lib, input fokusi
  // yo'qolib turardi.
  const unlockModal = unlockOpen ? (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-6">
      <form
        onSubmit={handleUnlockSubmit}
        className="anim-scale-in w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl"
      >
        <h3 className="text-lg font-semibold text-gray-800">O'qituvchi kirishi</h3>
        <p className="mt-1 mb-4 text-sm text-gray-500">
          Bloklarni tozalash va imtihonni qaytadan boshlash uchun admin parolini kiriting.
        </p>
        <input
          type="password"
          autoFocus
          value={unlockPassword}
          onChange={(e) => {
            setUnlockPassword(e.target.value);
            setUnlockError(false);
          }}
          placeholder="Admin paroli"
          className={`input-field w-full rounded-2xl border-[1.5px] px-4 py-3 text-sm text-gray-800 ${unlockError ? "border-red-400 bg-red-50" : "border-gray-200"
            }`}
        />
        {unlockError && (
          <p className="mt-1.5 text-xs font-semibold text-red-600">Noto'g'ri parol</p>
        )}
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => setUnlockOpen(false)}
            className="flex-1 rounded-2xl border-[1.5px] border-gray-200 py-3 text-sm font-semibold text-gray-600 transition-colors hover:border-gray-300"
          >
            Bekor qilish
          </button>
          <button
            type="submit"
            className="flex-1 rounded-2xl bg-green-700 py-3 text-sm font-semibold text-white transition-colors hover:bg-green-800"
          >
            Blokni ochish
          </button>
        </div>
      </form>
    </div>
  ) : null;

  // localStorage yozib bo'lmasa (kvota to'lgan / private rejim) talaba buni
  // BILISHI kerak — aks holda javoblari jimgina yo'qoladi.
  const storageBanner = storageWarning ? (
    <div className="bg-red-600 px-4 py-2 text-center text-xs font-semibold text-white">
      ⚠️ Javoblaringizni brauzer xotirasiga saqlab bo'lmayapti. Sahifani yangilamang!
    </div>
  ) : null;

  // ════════════════════════════════════════════════════════
  // REGISTER
  // ════════════════════════════════════════════════════════
  if (phase === "register") {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Header */}
        <div className="bg-green-700 text-white py-3 px-6 relative overflow-hidden anim-slide-down">
          <div className="text-center">
            <h1 className="text-[clamp(13px,3.5vw,18px)] font-semibold tracking-wide">
              Web Development — Final Exam
            </h1>
            <p className="text-green-100 text-xs mt-0.5">Talaba ma'lumotlarini kiriting</p>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
          <div className="anim-card-in bg-white rounded-3xl shadow-lg border border-green-100 w-full max-w-md p-6 sm:p-8">
            {/* Icon */}
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-full bg-green-50 ring-1 ring-green-200 flex items-center justify-center mx-auto mb-4 text-green-700">
                <ExamDocIcon size={30} />
              </div>
              <h2 className="text-2xl font-semibold text-gray-800">Ro'yxatdan o'tish</h2>
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

            {/* Savollar soni endi FAQAT admin panelda belgilanadi — bu yerda
                shunchaki ko'rsatiladi, talaba o'zgartira olmaydi. */}
            <div className="mb-6 rounded-2xl border border-green-100 bg-green-50/50 p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-800">Imtihon tarkibi</h3>
                <span className="text-xs font-semibold text-gray-500">
                  {config.durationMinutes} daqiqa
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {CATEGORIES.map((cat) => (
                  <div key={cat} className="rounded-xl border-[1.5px] border-gray-200 bg-white px-2 py-2.5 text-center">
                    <span className="mb-1 block text-xs font-semibold text-gray-600">
                      {cat === "JavaScript" ? "JS" : cat}
                    </span>
                    <span className="text-sm font-semibold text-gray-800">{config.counts[cat]}</span>
                  </div>
                ))}
              </div>
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
                  className="input-field w-full border-[1.5px] border-gray-200 rounded-2xl px-4 py-3 text-gray-800 transition-colors text-sm"
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
                  className="input-field w-full border-[1.5px] border-gray-200 rounded-2xl px-4 py-3 text-gray-800 transition-colors text-sm"
                />
              </div>

              <div className="bg-green-50 border border-green-100 rounded-2xl p-3.5 text-xs text-green-800 space-y-1">
                <p className="font-semibold text-[13px]">⚠️ Muhim eslatmalar:</p>
                <p>• Imtihon to'liq ekranda o'tkaziladi</p>
                <p>• {MAX_VIOLATIONS} ta qoidabuzarlikdan keyin imtihon bloklanadi</p>
                <p>• Har bir qoidabuzarlik uchun 1 ball jarima olinadi</p>
                <p>• Sahifa yangilansa ham javoblaringiz saqlanadi</p>
              </div>

              {registrationError && (
                <p className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm font-semibold text-red-700">
                  {registrationError}
                </p>
              )}

              <button
                type="submit"
                className="w-full bg-green-700 hover:bg-green-800 text-white font-semibold py-3.5 rounded-2xl transition-colors text-sm shadow-sm hover:shadow-md"
              >
                Imtihonni Boshlash
              </button>
            </form>
          </div>
        </div>
        {unlockModal}
      </div>
    );
  }

  // ════════════════════════════════════════════════════════
  // FULLSCREEN PROMPT
  // ════════════════════════════════════════════════════════
  if (phase === "fullscreen") {
    return (
      <div className="min-h-screen bg-green-700 flex flex-col items-center justify-center p-6">
        <div className="anim-scale-in bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-green-50 ring-1 ring-green-200 flex items-center justify-center mx-auto mb-6 text-green-700">
            <Maximize size={34} />
          </div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">To'liq Ekran Rejimi</h2>
          <p className="text-gray-600 text-sm mb-2">
            Salom, <strong>{session?.studentName}</strong>!
          </p>
          <p className="text-gray-500 text-sm mb-7">
            Imtihon faqat to'liq ekran rejimida o'tkaziladi.
          </p>
          <button
            onClick={handleStartExam}
            className="w-full bg-green-700 hover:bg-green-800 text-white font-semibold py-3.5 rounded-2xl transition-colors text-sm shadow-sm hover:shadow-md"
          >
            To'liq Ekranga Kirish va Boshlash
          </button>
        </div>
        {unlockModal}
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
          <div className="w-16 h-16 rounded-full bg-green-50 ring-1 ring-green-200 flex items-center justify-center mx-auto mb-6 text-green-700">
            <CheckCircle size={34} />
          </div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Imtihon Topshirildi!</h2>
          <p className="text-gray-600 text-sm mb-2">
            <strong>{session?.studentName}</strong>
          </p>
          <p className="text-gray-500 text-sm mb-8">
            Javoblaringiz muvaffaqiyatli saqlandi. Natijani o'qituvchiga yuboring.
          </p>
          <div className="space-y-3">
            <button
              onClick={handleDownload}
              className="w-full flex items-center justify-center gap-2 bg-green-700 hover:bg-green-800 text-white font-semibold py-3.5 rounded-2xl transition-colors text-sm shadow-sm hover:shadow-md"
            >
              <Download size={17} />
              Natijani Yuklab Olish
            </button>

          </div>
        </div>
        {unlockModal}
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

  const activeSession = session;

  function catAnsweredCount(cat: Category): number {
    const ids = activeSession.categoryOrder[cat] ?? [];
    return ids.filter((id) => isAnswered(activeSession.answers[id])).length;
  }

  function catTotalCount(cat: Category): number {
    return (activeSession.categoryOrder[cat] ?? []).length;
  }

  const totalAnswered = CATEGORIES.reduce((s, c) => s + catAnsweredCount(c), 0);
  const totalAll = CATEGORIES.reduce((s, c) => s + catTotalCount(c), 0);
  const progressPct = totalAll > 0 ? Math.round((totalAnswered / totalAll) * 100) : 0;

  function switchCategory(cat: Category) {
    setActiveCategory(cat);
    setCurrentIdx(0);
  }

  const meta = CATEGORY_META[activeCategory];

  // Sarlavhadagi raqamlar endi haqiqiy sessiyadan olinadi —
  // ilgari "30 savol • 120 ball" deb qattiq yozilgan edi.
  const selectedTotalPoints = CATEGORIES.reduce(
    (sum, cat) =>
      sum +
      (activeSession.categoryOrder[cat] ?? []).reduce(
        (s, id) => s + (getQuestionById(id)?.points ?? 0),
        0,
      ),
    0,
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {storageBanner}
      {unlockModal}

      {/* ── Fullscreen blocked ── */}
      {fsBlocked && (
        <div className="fixed inset-0 z-50 bg-red-700 flex flex-col items-center justify-center text-white p-8 text-center">
          <AlertTriangle size={60} className="mb-4" />
          <h2 className="text-2xl sm:text-3xl font-semibold mb-3">Imtihon Bloklab Qo'yildi</h2>
          <p className="text-red-200 text-base max-w-sm">
            {MAX_VIOLATIONS} ta qoidabuzarlik qayd etildi. Blokni faqat o'qituvchi ocha oladi.
          </p>
        </div>
      )}

      {/* ── Fullscreen warning ── */}
      {fsWarning && !fsBlocked && (
        <div className="fixed inset-0 z-40 bg-black/80 flex flex-col items-center justify-center text-white p-8 text-center">
          <AlertTriangle size={52} className="mb-4 text-yellow-400" />
          <h2 className="text-xl sm:text-2xl font-semibold mb-2">
            To'liq Ekrandan Chiqdingiz!
          </h2>
          <p className="text-gray-300 mb-1 text-sm">Ogohlantirish: {fsViolations.current}/{MAX_VIOLATIONS}</p>
          <p className="text-gray-400 text-sm mb-6 max-w-xs">
            Yana {MAX_VIOLATIONS - fsViolations.current} marta qoidani buzsangiz imtihon bloklanadi.
          </p>
          <button
            onClick={handleViolationAction}
            className="bg-green-700 hover:bg-green-800 text-white font-semibold px-8 py-3.5 rounded-2xl transition-colors"
          >
            To'liq Ekranga Qaytish
          </button>
        </div>
      )}

      {/* ── Header ── */}
      <div className="anim-slide-down">
        <ExamHeader
          studentName={session.studentName}
          totalQuestions={totalAll}
          totalPoints={selectedTotalPoints}
        />
      </div>

      {/* ── Timer bar ── */}
      <div className="anim-fade-up bg-white border-b border-gray-100 px-4 py-2 flex justify-end" style={{ animationDelay: "0.1s" }}>
        <Timer
          startTime={session.startTime}
          durationMinutes={session.durationMinutes}
          pausedAt={session.pausedAt}
          pausedDuration={session.pausedDuration}
          onTimeUp={handleSubmit}
        />
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
                    ? "border-green-700 text-green-700"
                    : "border-transparent text-gray-400 hover:text-gray-600"
                    }`}
                >
                  {/* Icon + label — icon only on tiny screens */}
                  <span className={`flex items-center gap-1 sm:gap-1.5 ${active ? "text-green-700" : ""}`}>
                    <span className={active ? "text-green-700" : m.color}>{m.icon}</span>
                    <span className="hidden xs:inline sm:inline">{m.label}</span>
                    {/* Fallback: show on all screens but truncate */}
                    <span className="xs:hidden sm:hidden truncate max-w-[40px]">{m.label}</span>
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap ${allDone
                    ? "bg-green-100 text-green-700"
                    : active
                      ? "bg-green-50 text-green-700"
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
              className="h-full rounded-full transition-[width] duration-300"
              style={{
                width: `${progressPct}%`,
                background: "#2C684F",
              }}
            />
          </div>
        </div>
      </div>

      {/* ── Section header ── */}
      <div className={`border-b ${meta.bg} ${meta.border} py-2 px-4`}>
        <div className="max-w-3xl mx-auto flex items-center gap-2">
          <span className={meta.color}>{meta.icon}</span>
          <span className={`text-sm font-semibold ${meta.color}`}>{CATEGORY_META[activeCategory].label === "JS" ? "JavaScript" : meta.label} Bo'limi</span>
          <span className="text-xs text-gray-400 ml-auto">
            {catIds.length === 0
              ? "Bu bo'limda savol yo'q"
              : `Savol ${currentIdx + 1} / ${catIds.length}`}
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
          ) : currentQ && currentQ.type === "drag" ? (
            <div className="anim-card-in" key={currentQ.id}>
              <DragDropCard
                question={currentQ}
                questionNumber={currentIdx + 1}
                currentOrder={session.answers[currentQ.id]?.type === "dragdrop"
                  ? (session.answers[currentQ.id] as { type: "dragdrop"; order: number[] }).order
                  : session.dragOrders[currentQ.id] ?? currentQ.tokens.map((_, i) => i)}
                onReorder={(order) =>
                  updateAnswer(currentQ.id, { type: "dragdrop", order, touched: true })
                }
              />
            </div>
          ) : currentQ ? (
            <div className="anim-card-in" key={currentQ.id}>
              <QuestionResponseCard
                question={currentQ}
                questionNumber={currentIdx + 1}
                answer={session.answers[currentQ.id]}
                onAnswer={(answer) => updateAnswer(currentQ.id, answer)}
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
            className="flex-shrink-0 flex items-center gap-1 px-3 sm:px-4 py-2.5 border-[1.5px] border-gray-200 rounded-2xl text-sm font-semibold text-gray-600 disabled:opacity-35 hover:border-green-700 hover:text-green-700 transition-colors whitespace-nowrap"
          >
            <ChevronLeft size={15} />
            <span className="hidden sm:inline">Oldingi</span>
          </button>

          {/* Dots */}
          <div className="flex-1 flex items-center justify-center gap-1 dots-scroll overflow-x-auto py-1">
            {catIds.map((id, i) => {
              const answered = isAnswered(session.answers[id]);
              const isActive = i === currentIdx;
              return (
                <button
                  key={id}
                  onClick={() => setCurrentIdx(i)}
                  className={`flex-shrink-0 w-7 h-7 rounded-full text-[11px] font-semibold transition-colors ${isActive
                    ? "bg-green-700 text-white shadow-sm"
                    : answered
                      ? "bg-green-100 text-green-700 border-[1.5px] border-green-300"
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
              className="flex-shrink-0 flex items-center gap-1 px-3 sm:px-4 py-2.5 bg-green-700 hover:bg-green-800 rounded-2xl text-sm font-semibold text-white transition-colors whitespace-nowrap shadow-sm"
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
              className="flex-shrink-0 flex items-center gap-1 px-3 sm:px-4 py-2.5 bg-green-700 hover:bg-green-800 rounded-2xl text-sm font-semibold text-white transition-colors whitespace-nowrap shadow-sm"
            >
              <span className="hidden sm:inline">Keyingi Bo'lim</span>
              <span className="sm:hidden">Bo'lim</span>
              <ChevronRight size={15} />
            </button>
          ) : (
            <button
              onClick={() => setConfirmSubmit(true)}
              className="flex-shrink-0 flex items-center gap-1.5 px-4 sm:px-5 py-2.5 bg-green-700 hover:bg-green-800 rounded-2xl text-sm font-semibold text-white transition-colors whitespace-nowrap shadow-sm"
            >
              <CheckCircle size={15} />
              Topshirish
            </button>
          )}
        </div>
      </div>

      {/* Topshirish tugmasi ilgari FAQAT JS bo'limining oxirgi savolida
          chiqardi — JS'ni yechmoqchi bo'lmagan talaba ham butun bo'limni
          bosib o'tishga majbur edi. Endi u doim qo'l ostida. */}
      <button
        onClick={() => setConfirmSubmit(true)}
        className="fixed right-3 top-3 z-30 flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white/95 px-3 py-1.5 text-xs font-medium text-gray-600 shadow-sm backdrop-blur transition-colors hover:border-green-700 hover:text-green-700 sm:right-4"
      >
        <CheckCircle size={13} />
        Imtihonni yakunlash
      </button>

      {confirmSubmit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6">
          <div className="anim-scale-in w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-gray-900">Imtihonni yakunlaysizmi?</h3>

            {totalAnswered < totalAll ? (
              <p className="mt-2 text-sm leading-relaxed text-gray-600">
                <strong className="text-red-700">{totalAll - totalAnswered} ta savol</strong> javobsiz
                qoladi va ular uchun ball berilmaydi.
              </p>
            ) : (
              <p className="mt-2 text-sm text-gray-600">Barcha savollarga javob berdingiz.</p>
            )}

            <div className="mt-3 space-y-1.5 rounded-lg bg-gray-50 p-3 text-xs">
              {CATEGORIES.map((cat) => {
                const answered = catAnsweredCount(cat);
                const total = catTotalCount(cat);
                if (total === 0) return null;
                return (
                  <div key={cat} className="flex items-center justify-between">
                    <span className="text-gray-600">{cat}</span>
                    <span className={answered === total ? "font-medium text-green-700" : "font-medium text-gray-500"}>
                      {answered}/{total}
                    </span>
                  </div>
                );
              })}
            </div>

            <p className="mt-3 text-xs text-gray-500">
              Yakunlangandan keyin javoblarni o'zgartirib bo'lmaydi.
            </p>

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setConfirmSubmit(false)}
                className="flex-1 rounded-lg border border-gray-300 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
              >
                Davom etish
              </button>
              <button
                onClick={() => { setConfirmSubmit(false); handleSubmit(); }}
                className="flex-1 rounded-lg bg-green-700 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-800"
              >
                Ha, yakunlash
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}