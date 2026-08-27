import { useState, useEffect, useCallback, useRef } from "react";
import {
  Maximize,
  AlertTriangle,
  CheckCircle,
  Download,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Users,
  KeyRound,
  ShieldAlert,
  ShieldCheck,
  FileText,
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
import {
  saveConfig,
  defaultConfig,
  clampConfig,
  fetchRemoteExamSettings,
  type ExamConfig,
} from "../utils/config";
import { verifyAdminPassword } from "../utils/auth";
import {
  CATEGORIES,
  questions as localQuestions,
  type Category,
  type Question,
} from "../utils/data/questions";
import { fetchQuestions } from "../services/questionService";
import { submitExamToSupabase } from "../services/submissionService";
import {
  fetchGroupByCode,
  getGroupSubmissionsCount,
  subscribeToGroupParticipants,
  type GroupParticipantsCount,
} from "../services/groupService";
import {
  initLiveMonitoring,
  broadcastStudentLiveState,
  closeLiveMonitoring,
} from "../services/liveMonitoringService";
import { supabase } from "../utils/supabase";
import type { ExamGroup } from "../types";

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

  .dots-scroll { scrollbar-width: none; -ms-overflow-style: none; }
  .dots-scroll::-webkit-scrollbar { display: none; }

  .tab-btn { transition: border-color 0.18s ${EASE}, color 0.18s ${EASE}; }

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
  Python: {
    label: "PY",
    icon: <span className="text-[10px] font-bold">PY</span>,
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
  },
};

type Phase = "register" | "fullscreen" | "exam" | "submitted";
type GroupCheckStatus = "idle" | "checking" | "found" | "not_found" | "inactive" | "full";

const BLOCKED_STUDENTS_KEY = "exam_blocked_students_v1";
const ACTIVE_STUDENT_KEY = "exam_active_student_v1";
const DEFAULT_MAX_VIOLATIONS = 3;
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

function clearAllBlocks() {
  try {
    localStorage.removeItem(BLOCKED_STUDENTS_KEY);
    localStorage.removeItem(ACTIVE_STUDENT_KEY);
    localStorage.removeItem("exam_device_blocked_v1");
  } catch {
    /* ignore */
  }
}

export default function ExamPage() {
  useInjectStyles();

  const [phase, setPhase] = useState<Phase>("register");
  const [session, setSession] = useState<ExamSession | null>(null);
  const sessionRef = useRef<ExamSession | null>(null);
  sessionRef.current = session;
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [registrationError, setRegistrationError] = useState("");
  const [storageWarning, setStorageWarning] = useState(false);
  const [activeCategory, setActiveCategory] = useState<Category>("HTML");
  const [currentIdx, setCurrentIdx] = useState(0);
  const [fsWarning, setFsWarning] = useState(false);
  const [fsBlocked, setFsBlocked] = useState(false);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [unlockOpen, setUnlockOpen] = useState(false);
  const [unlockPassword, setUnlockPassword] = useState("");
  const [unlockError, setUnlockError] = useState(false);
  const fsViolations = useRef(0);
  const lastViolationTimeRef = useRef(0);
  const ignoreFullscreenChange = useRef(false);
  const backgroundViolationLock = useRef(false);
  const blurTimer = useRef<number | null>(null);
  const [downloaded, setDownloaded] = useState(false);

  const [questionsList, setQuestionsList] = useState<Question[]>(localQuestions);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  // ─── Group Management State ───
  const [groupCode, setGroupCode] = useState<string>("");
  const [groupInfo, setGroupInfo] = useState<ExamGroup | null>(null);
  const [groupCount, setGroupCount] = useState<number>(0);
  const [groupStats, setGroupStats] = useState<GroupParticipantsCount>({
    activeTaking: 0,
    submittedCount: 0,
    totalOccupied: 0,
  });
  const [groupCheckStatus, setGroupCheckStatus] = useState<GroupCheckStatus>("idle");
  const [config, setConfig] = useState<ExamConfig>(() => defaultConfig(localQuestions));

  // Function to verify group code in real-time
  const checkAndApplyGroup = useCallback(async (code: string) => {
    const clean = code.trim().toUpperCase();
    if (!clean) {
      setGroupInfo(null);
      setGroupCount(0);
      setGroupStats({ activeTaking: 0, submittedCount: 0, totalOccupied: 0 });
      setGroupCheckStatus("idle");
      return null;
    }

    setGroupCheckStatus("checking");
    const found = await fetchGroupByCode(clean);

    if (!found) {
      setGroupInfo(null);
      setGroupCheckStatus("not_found");
      return null;
    }

    const cnt = await getGroupSubmissionsCount(found.group_code);
    setGroupInfo(found);
    setGroupCount(cnt);

    if (!found.is_active) {
      setGroupCheckStatus("inactive");
    } else if (cnt >= found.max_students) {
      setGroupCheckStatus("full");
    } else {
      setGroupCheckStatus("found");
      setConfig((prev) => ({
        ...prev,
        counts: found.counts,
        durationMinutes: found.duration_minutes,
      }));
    }

    return found;
  }, []);

  // Subscribe to live participants count whenever groupCode changes
  useEffect(() => {
    if (!groupCode.trim()) return;
    const unsub = subscribeToGroupParticipants(groupCode, (stats) => {
      setGroupStats(stats);
      setGroupCount(stats.totalOccupied);
    });
    return unsub;
  }, [groupCode]);

  // Track presence when student is taking the exam
  const currentStudentName = session?.studentName;
  const currentGroupCode = session?.groupCode;
  const currentStartTime = session?.startTime;

  useEffect(() => {
    if (phase === "exam" && currentStudentName && currentGroupCode) {
      const clean = currentGroupCode.trim().toUpperCase();
      const presenceCh = supabase.channel(`presence_${clean}`, {
        config: { presence: { key: `student_${normalizeStudentName(currentStudentName)}` } },
      });

      presenceCh.subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await presenceCh.track({
            studentName: currentStudentName,
            groupCode: clean,
            startedAt: currentStartTime,
          });
        }
      });

      return () => {
        supabase.removeChannel(presenceCh);
      };
    }
  }, [phase, currentStudentName, currentGroupCode, currentStartTime]);

  // 1. Initial Data Fetch & URL params
  useEffect(() => {
    fetchQuestions().then((loaded) => {
      if (loaded && loaded.length > 0) {
        setQuestionsList(loaded);
      }
    });

    fetchRemoteExamSettings().then((remote) => {
      if (remote) {
        setConfig((prev) => clampConfig({ ...prev, ...remote }));
      }
    });

    const params = new URLSearchParams(window.location.search);
    const codeParam = params.get("group") || params.get("g") || "";
    if (codeParam) {
      const clean = codeParam.trim().toUpperCase();
      setGroupCode(clean);
      checkAndApplyGroup(clean);
    }
  }, [checkAndApplyGroup]);

  // 2. Realtime Listener for Group and Submissions
  useEffect(() => {
    const channelName = `exam_student_feed_${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "exam_groups" },
        (payload) => {
          const group = payload.new as Partial<ExamGroup> | null;
          if (group && group.group_code) {
            const cleanCode = group.group_code.trim().toUpperCase();
            if (groupCode.trim().toUpperCase() === cleanCode) {
              checkAndApplyGroup(cleanCode);
            }
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "results" },
        (payload) => {
          const inserted = payload.new as {
            group_code?: string;
            answers?: { _meta?: { group_code?: string } };
          } | null;
          const insertedGroup = (
            inserted?.group_code || inserted?.answers?._meta?.group_code || ""
          ).toString().trim().toUpperCase();

          if (groupCode && insertedGroup === groupCode.trim().toUpperCase()) {
            setGroupCount((prev) => prev + 1);
          }
        }
      )
      .on("broadcast", { event: "group_updated" }, (msg) => {
        const updated = msg.payload as ExamGroup;
        if (updated && updated.group_code) {
          const clean = updated.group_code.trim().toUpperCase();
          if (groupCode.trim().toUpperCase() === clean) {
            setGroupInfo(updated);
            setConfig((prev) => ({
              ...prev,
              counts: updated.counts,
              durationMinutes: updated.duration_minutes,
            }));
            if (!updated.is_active) {
              setGroupCheckStatus("inactive");
            } else {
              setGroupCheckStatus("found");
            }
          }
        }
      })
      .on("broadcast", { event: "all_groups_sync" }, () => {
        if (groupCode.trim()) {
          checkAndApplyGroup(groupCode.trim().toUpperCase());
        }
      })
      .on("broadcast", { event: "new_submission" }, (msg) => {
        const payload = msg.payload as {
          group_code?: string;
          answers?: { _meta?: { group_code?: string } };
        } | null;
        const gCode = (payload?.group_code || payload?.answers?._meta?.group_code || "").toString().trim().toUpperCase();
        if (groupCode && gCode === groupCode.trim().toUpperCase()) {
          setGroupCount((prev) => prev + 1);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupCode, checkAndApplyGroup]);

  // Handle typing group code with debounce
  useEffect(() => {
    if (!groupCode.trim()) {
      setGroupInfo(null);
      setGroupCheckStatus("idle");
      return;
    }

    const timer = setTimeout(() => {
      checkAndApplyGroup(groupCode);
    }, 300);

    return () => clearTimeout(timer);
  }, [groupCode, checkAndApplyGroup]);

  // Session recovery (F5 / Refresh)
  useEffect(() => {
    const s = loadSession();
    if (s) {
      setSession(s);
      if (s.groupCode) {
        setGroupCode(s.groupCode);
      }
      const firstCategory = CATEGORIES.find((category) => (s.categoryOrder[category] ?? []).length > 0);
      if (firstCategory) setActiveCategory(firstCategory);
      fsViolations.current = s.violationCount ?? 0;
      const maxLimit = config.maxViolations || DEFAULT_MAX_VIOLATIONS;
      if (isStudentBlocked(s.studentName) || fsViolations.current >= maxLimit) {
        blockStudent(s.studentName);
        setFsBlocked(true);
        setPhase("exam");
      } else if (s.submitted) {
        setPhase("submitted");
      } else {
        setPhase("fullscreen");
      }
      return;
    }

    const activeStudent = localStorage.getItem(ACTIVE_STUDENT_KEY) ?? "";
    if (activeStudent && isStudentBlocked(activeStudent)) {
      setRegistrationError("Bu o'quvchi bloklangan va qayta test topshira olmaydi.");
    }
  }, [config.maxViolations]);

  // Live telemetry channel initialization
  useEffect(() => {
    if (phase === "exam" && currentStudentName) {
      initLiveMonitoring(currentStudentName, currentGroupCode || "");
      return () => {
        closeLiveMonitoring();
      };
    }
  }, [phase, currentStudentName, currentGroupCode]);

  // Live telemetry state broadcast on every action
  useEffect(() => {
    if (phase !== "exam" || !session) return;

    const catIds = session.categoryOrder[activeCategory] ?? [];
    const currentQuestionId = catIds[currentIdx] ?? 0;
    const answeredCount = Object.keys(session.answers).filter(
      (k) => k !== "_meta" && isAnswered(session.answers[Number(k)])
    ).length;
    const totalQuestions = CATEGORIES.reduce(
      (sum, c) => sum + (session.categoryOrder[c]?.length ?? 0),
      0
    );
    const progressPercent = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;
    const elapsedSeconds = Math.max(0, Math.floor((Date.now() - session.startTime - session.pausedDuration) / 1000));
    const totalLimitSec = (session.durationMinutes || 60) * 60;
    const remainingSeconds = Math.max(0, totalLimitSec - elapsedSeconds);

    broadcastStudentLiveState({
      studentName: session.studentName,
      groupCode: session.groupCode || "",
      category: activeCategory,
      questionIndex: currentIdx + 1,
      questionId: currentQuestionId,
      categoryTotal: catIds.length,
      answeredCount,
      totalQuestions,
      progressPercent,
      remainingSeconds,
      elapsedSeconds,
      violationCount: session.violationCount || 0,
      status: fsBlocked ? "blocked" : fsWarning ? "warning" : "in_exam",
      lastActiveAt: Date.now(),
    });
  }, [
    phase,
    session,
    activeCategory,
    currentIdx,
    fsWarning,
    fsBlocked,
  ]);

  const persist = useCallback((updated: ExamSession) => {
    setStorageWarning(!saveSession(updated));
  }, []);

  const maxViolationsLimit = config.maxViolations || DEFAULT_MAX_VIOLATIONS;

  const triggerViolation = useCallback((_source?: string) => {
    if (phase !== "exam" || fsBlocked) return;
    const now = Date.now();
    // 2.5 soniya ichida kelgan takroriy kaskad hodisalarni bitta qoidabuzarlik deb hisoblash
    if (now - lastViolationTimeRef.current < 2500) return;
    if (backgroundViolationLock.current) return;

    lastViolationTimeRef.current = now;
    backgroundViolationLock.current = true;

    fsViolations.current += 1;
    const currentCount = fsViolations.current;
    const maxLimit = config.maxViolations || DEFAULT_MAX_VIOLATIONS;

    setSession((prev) => {
      if (!prev) return prev;
      const updated = {
        ...prev,
        violationCount: currentCount,
        pausedAt: prev.pausedAt ?? Date.now(),
      };
      if (updated.violationCount >= maxLimit) {
        blockStudent(updated.studentName);
      }
      persist(updated);
      return updated;
    });

    if (currentCount >= maxLimit) {
      setFsBlocked(true);
      setFsWarning(false);
    } else {
      setFsWarning(true);
    }
  }, [phase, fsBlocked, config.maxViolations, persist]);

  // Teacher unlock (Ctrl+H)
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
    fsViolations.current = 0;
    lastViolationTimeRef.current = 0;
    backgroundViolationLock.current = false;
    setDownloaded(false);
    setUnlockOpen(false);
    setUnlockPassword("");
    setUnlockError(false);
    setFsBlocked(false);
    setFsWarning(false);
    setRegistrationError("");
    setStorageWarning(false);

    if (session) {
      const unblockedSession: ExamSession = {
        ...session,
        violationCount: 0,
        pausedAt: null,
      };
      persist(unblockedSession);
      setSession(unblockedSession);
      if (config.enforceFullscreen) {
        setPhase("fullscreen");
      } else {
        setPhase("exam");
      }
    } else {
      clearSession();
      setPhase("register");
    }
  }

  const onFsChange = useCallback(() => {
    if (ignoreFullscreenChange.current) {
      ignoreFullscreenChange.current = false;
      return;
    }
    if (phase !== "exam") return;
    if (!config.enforceFullscreen) return;
    if (!document.fullscreenElement) {
      triggerViolation("fullscreen_exit");
    } else {
      setFsWarning(false);
      window.setTimeout(() => {
        backgroundViolationLock.current = false;
      }, 1000);
    }
  }, [phase, triggerViolation, config.enforceFullscreen]);

  useEffect(() => {
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, [onFsChange]);

  useEffect(() => {
    if (phase !== "exam") return;
    const blockContextMenu = (event: MouseEvent) => event.preventDefault();
    const blockExamShortcuts = (event: KeyboardEvent) => {
      const isAlt = event.altKey || event.key === "Alt" || (event.code && event.code.startsWith("Alt"));
      const isTab = event.key === "Tab" || event.code === "Tab";
      const isAltTab = (event.altKey && isTab) || (isAlt && isTab);
      const isMeta = event.key === "Meta" || event.key === "OS" || (event.code && event.code.startsWith("Meta"));
      const isFunctionKey = [
        "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12"
      ].includes(event.key);
      const isReload = event.ctrlKey && ["r", "R", "F5"].includes(event.key);
      const isDevTools =
        (event.ctrlKey && event.shiftKey && ["I", "i", "J", "j", "C", "c"].includes(event.key)) ||
        event.key === "F12";
      const isTabControl = event.ctrlKey && ["w", "W", "t", "T", "n", "N", "Tab"].includes(event.key);

      if (isAltTab || isMeta || isFunctionKey || isReload || isDevTools || isTabControl) {
        event.preventDefault();
        event.stopPropagation();
      }

      if (isAltTab) {
        triggerViolation("alt_tab_shortcut");
      }
    };

    document.addEventListener("contextmenu", blockContextMenu, { capture: true });
    window.addEventListener("keydown", blockExamShortcuts, { capture: true });
    window.addEventListener("keyup", blockExamShortcuts, { capture: true });
    return () => {
      document.removeEventListener("contextmenu", blockContextMenu, { capture: true });
      window.removeEventListener("keydown", blockExamShortcuts, { capture: true });
      window.removeEventListener("keyup", blockExamShortcuts, { capture: true });
    };
  }, [phase, triggerViolation]);

  useEffect(() => {
    if (phase !== "exam") return;

    const cancelBlurTimer = () => {
      if (blurTimer.current !== null) {
        window.clearTimeout(blurTimer.current);
        blurTimer.current = null;
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        cancelBlurTimer();
        triggerViolation("visibility_hidden");
      } else {
        window.setTimeout(() => {
          backgroundViolationLock.current = false;
        }, 1000);
      }
    };

    const handleWindowBlur = () => {
      cancelBlurTimer();
      blurTimer.current = window.setTimeout(() => {
        blurTimer.current = null;
        if (!document.hasFocus()) {
          triggerViolation("window_blur");
        }
      }, BLUR_GRACE_MS);
    };

    const handleWindowFocus = () => {
      cancelBlurTimer();
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
  }, [phase, triggerViolation]);

  async function requestFullscreen() {
    try { await document.documentElement.requestFullscreen(); } catch { return; }
  }

  // Registration handler with STRICT GROUP CODE REQUIREMENT
  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setRegistrationError("");

    if (!firstName.trim() || !lastName.trim()) {
      setRegistrationError("Iltimos, ism va familiyangizni to'liq kiriting.");
      return;
    }

    const cleanGroupCode = groupCode.trim().toUpperCase();
    if (!cleanGroupCode) {
      setRegistrationError("⚠️ Guruh kodi kiritilishi majburiy! Iltimos, o'qituvchingiz bergan guruh kodini kiriting.");
      return;
    }

    const name = `${firstName.trim()} ${lastName.trim()}`;
    if (isStudentBlocked(name)) {
      setRegistrationError("Bu o'quvchi bloklangan va qayta test topshira olmaydi.");
      return;
    }

    // Validate Group in real time
    const activeGroup = await checkAndApplyGroup(cleanGroupCode);
    if (!activeGroup) {
      setRegistrationError(`❌ "${cleanGroupCode}" guruh kodi topilmadi! Iltimos, to'g'ri guruh kodini kiriting.`);
      return;
    }

    if (!activeGroup.is_active) {
      setRegistrationError("🔒 Ushbu guruh uchun imtihon yakunlangan yoki o'qituvchi tomonidan yopilgan.");
      return;
    }

    const currentCnt = await getGroupSubmissionsCount(activeGroup.group_code);
    if (currentCnt >= activeGroup.max_students) {
      setRegistrationError(
        `🚫 Ushbu guruhda talabalar soni to'lgan (Maksimal ${activeGroup.max_students} ta talaba topshirishi mumkin).`
      );
      return;
    }

    const groupConfig: ExamConfig = {
      ...config,
      counts: activeGroup.counts,
      durationMinutes: activeGroup.duration_minutes,
    };

    let currentQuestions = questionsList;
    if (currentQuestions.length === 0) {
      const loaded = await fetchQuestions();
      if (loaded && loaded.length > 0) {
        currentQuestions = loaded;
        setQuestionsList(loaded);
      } else {
        currentQuestions = localQuestions;
      }
    }

    const savedConfig = saveConfig(groupConfig, currentQuestions);

    try {
      localStorage.setItem(ACTIVE_STUDENT_KEY, normalizeStudentName(name));
    } catch {
      /* ignore */
    }

    const s = createSession(name, savedConfig, currentQuestions, cleanGroupCode);
    persist(s);
    setSession(s);
    const firstCategory = CATEGORIES.find((category) => (s.categoryOrder[category] ?? []).length > 0);
    if (firstCategory) setActiveCategory(firstCategory);

    if (savedConfig.enforceFullscreen === false) {
      setPhase("exam");
    } else {
      setPhase("fullscreen");
    }
  }

  async function handleStartExam() {
    try {
      await document.documentElement.requestFullscreen();
    } catch {
      // Fullscreen might fail in headless/restricted environments, proceed anyway
    }
    setPhase("exam");
    setFsWarning(false);
    setFsBlocked(false);
  }

  async function handleResumeFullscreen() {
    try {
      await requestFullscreen();
    } catch {
      // Fullscreen might fail in restricted environments
    }
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
    setFsWarning(false);
    window.setTimeout(() => {
      backgroundViolationLock.current = false;
    }, 1200);
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

  const handleSubmit = useCallback(async () => {
    ignoreFullscreenChange.current = true;
    const currentSession = sessionRef.current || session || loadSession();
    if (!currentSession) return;

    const updatedSession: ExamSession = {
      ...currentSession,
      submitted: true,
    };

    setSession(updatedSession);
    persist(updatedSession);
    sessionRef.current = updatedSession;

    setPhase("submitted");
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => { });
    }

    const totQuestions = CATEGORIES.reduce(
      (sum, c) => sum + (updatedSession.categoryOrder[c]?.length ?? 0),
      0
    );

    try {
      broadcastStudentLiveState({
        studentName: updatedSession.studentName,
        groupCode: updatedSession.groupCode || "",
        category: activeCategory,
        questionIndex: currentIdx + 1,
        questionId: 0,
        categoryTotal: 0,
        answeredCount: Object.keys(updatedSession.answers).filter((k) => k !== "_meta").length,
        totalQuestions: totQuestions,
        progressPercent: 100,
        remainingSeconds: 0,
        elapsedSeconds: Math.max(0, Math.floor((Date.now() - updatedSession.startTime) / 1000)),
        violationCount: updatedSession.violationCount || 0,
        status: "submitted",
        lastActiveAt: Date.now(),
      });
    } catch (e) {
      console.warn("Broadcast error:", e);
    }

    setSubmitStatus("submitting");
    try {
      const res = await submitExamToSupabase(updatedSession, questionsList, config.penaltyPerViolation ?? 1);
      console.log("Exam submitted successfully to Supabase:", res);
      setSubmitStatus("success");
    } catch (err) {
      console.error("Supabase submission failed:", err);
      setSubmitStatus("error");
    }
  }, [session, persist, questionsList, activeCategory, currentIdx, config.penaltyPerViolation]);

  useEffect(() => {
    if (phase !== "exam") return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      triggerViolation("beforeunload");
      e.preventDefault();
      e.returnValue = "Imtihon yakunlanmagan. Chiqishni xohlaysizmi?";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [phase, triggerViolation]);

  const handleDownload = useCallback(() => {
    const currentSession = sessionRef.current || session;
    if (!currentSession) return;
    const payload = {
      studentName: currentSession.studentName,
      startTime: currentSession.startTime,
      pausedDuration: currentSession.pausedDuration,
      submitTime: Date.now(),
      violationCount: currentSession.violationCount,
      answers: currentSession.answers,
      categoryOrder: currentSession.categoryOrder,
      optionOrders: currentSession.optionOrders,
      dragOrders: currentSession.dragOrders,
      groupCode: currentSession.groupCode,
    };
    const encoded = encodeResult(payload);
    const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const parts = currentSession.studentName.split(" ");
    const fname = parts[0] || "Student";
    const lname = parts.slice(1).join("_") || "Unknown";
    const groupPrefix = currentSession.groupCode ? `${currentSession.groupCode}_` : "";
    const filename = `${groupPrefix}${fname}_${lname}_${ts}.txt`;
    const blob = new Blob([encoded], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    setDownloaded(true);
    window.setTimeout(() => {
      URL.revokeObjectURL(url);
      a.remove();
    }, 2000);
  }, [session]);

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

  const storageBanner = storageWarning ? (
    <div className="bg-red-600 px-4 py-2 text-center text-xs font-semibold text-white">
      ⚠️ Javoblaringizni brauzer xotirasiga saqlab bo'lmayapti. Sahifani yangilamang!
    </div>
  ) : null;

  // ════════════════════════════════════════════════════════
  // REGISTER PHASE
  // ════════════════════════════════════════════════════════
  if (phase === "register") {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Header */}
        <div className="bg-green-700 text-white py-3.5 px-6 relative overflow-hidden anim-slide-down shadow-md">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div>
              <h1 className="text-[clamp(13px,3.5vw,18px)] font-bold tracking-wide">
                Web Development — Final Exam
              </h1>
              <p className="text-green-100 text-xs mt-0.5">Online Imtihon va Baholash Tizimi</p>
            </div>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
          <div className="anim-card-in bg-white rounded-3xl shadow-lg border border-green-100 w-full max-w-xl p-5 sm:p-8">
            {/* Icon */}
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-full bg-green-50 ring-1 ring-green-200 flex items-center justify-center mx-auto mb-3 text-green-700">
                <ExamDocIcon size={30} />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Ro'yxatdan o'tish</h2>
              <p className="text-gray-500 text-xs mt-1">
                Imtihonni boshlash uchun ism-familiya va <strong>Guruh kodi</strong>ni kiriting
              </p>
            </div>

            {/* Category badges */}
            <div className="flex gap-2 justify-center flex-wrap mb-5">
              {CATEGORIES.map((cat, i) => {
                const m = CATEGORY_META[cat] ?? CATEGORY_META.HTML;
                return (
                  <span
                    key={cat}
                    className={`anim-fade-up flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold ${m.color} ${m.bg} ${m.border}`}
                    style={{ animationDelay: `${i * 0.05}s` }}
                  >
                    {m.icon} {m.label}
                  </span>
                );
              })}
            </div>

            {/* Live Group Info Banner */}
            {groupInfo && groupCheckStatus === "found" && (
              <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50/90 p-3.5 anim-scale-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>{groupInfo.group_name}</span>
                    <span className="text-xs bg-emerald-200/80 text-emerald-900 px-2 py-0.5 rounded-md font-mono">
                      {groupInfo.group_code}
                    </span>
                  </div>

                </div>
                <div className="mt-2 grid grid-cols-3 gap-2 text-center text-xs text-emerald-800 border-t border-emerald-200/60 pt-2 font-medium">
                  <div>
                    <span className="text-[11px] text-emerald-600 block">Vaqt:</span>
                    <strong>{groupInfo.duration_minutes} daqiqa</strong>
                  </div>
                  <div>
                    <span className="text-[11px] text-emerald-600 block">Savollar:</span>
                    <strong>{Object.values(groupInfo.counts || {}).reduce((s, n) => s + (Number(n) || 0), 0)} ta</strong>
                  </div>
                  <div>
                    <span className="text-[11px] text-emerald-600 block">Talabalar Sig'imi:</span>
                    <strong>{groupStats.totalOccupied || groupCount} / {groupInfo.max_students}</strong>
                    {groupStats.activeTaking > 0 && (
                      <span className="block text-[10px] text-emerald-700 font-semibold">
                        ({groupStats.activeTaking} ta jarayonda)
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Ism <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Ismingizni kiriting"
                    required
                    className="input-field w-full border-[1.5px] border-gray-200 rounded-2xl px-4 py-2.5 text-gray-800 transition-colors text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Familiya <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Familiyangizni kiriting"
                    required
                    className="input-field w-full border-[1.5px] border-gray-200 rounded-2xl px-4 py-2.5 text-gray-800 transition-colors text-sm"
                  />
                </div>
              </div>

              {/* MANDATORY GROUP CODE SECTION */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center justify-between">
                  <span>
                    Guruh Kodi <span className="text-red-500">*</span> <span className="text-xs font-normal text-red-600">(Majburiy)</span>
                  </span>
                  <span className="text-[11px] text-gray-400 font-normal">O'qituvchi bergan kod</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={groupCode}
                    onChange={(e) => {
                      setGroupCode(e.target.value.toUpperCase());
                      setRegistrationError("");
                    }}
                    placeholder="Guruh kodini kiriting..."
                    required
                    className={`input-field w-full border-[1.5px] rounded-2xl pl-4 pr-10 py-2.5 text-gray-800 transition-colors text-sm font-mono font-bold uppercase tracking-wider ${groupCheckStatus === "found"
                      ? "border-emerald-500 bg-emerald-50/30"
                      : groupCheckStatus === "not_found" || groupCheckStatus === "inactive" || groupCheckStatus === "full"
                        ? "border-red-400 bg-red-50/40"
                        : "border-gray-300"
                      }`}
                  />
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                    {groupCheckStatus === "checking" && (
                      <div className="w-4 h-4 border-2 border-green-700 border-t-transparent rounded-full animate-spin" />
                    )}
                    {groupCheckStatus === "found" && <Check size={18} className="text-emerald-600 font-bold" />}
                    {(groupCheckStatus === "not_found" || groupCheckStatus === "inactive" || groupCheckStatus === "full") && (
                      <X size={18} className="text-red-500 font-bold" />
                    )}
                  </div>
                </div>

                {/* Live validation feedback message */}
                {groupCode.trim() && groupCheckStatus === "not_found" && (
                  <p className="mt-1.5 text-xs font-semibold text-red-600 flex items-center gap-1">
                    <X size={13} /> Bunday guruh kodi topilmadi. O'qituvchingizdan to'g'ri kodni oling.
                  </p>
                )}
                {groupCheckStatus === "inactive" && (
                  <p className="mt-1.5 text-xs font-semibold text-amber-700 flex items-center gap-1">
                    <AlertTriangle size={13} /> Ushbu guruh uchun imtihon yopilgan yoki nofaol holatda.
                  </p>
                )}
                {groupCheckStatus === "full" && (
                  <p className="mt-1.5 text-xs font-semibold text-red-600 flex items-center gap-1">
                    <Users size={13} /> Ushbu guruhda talabalar soni to'lgan ({groupCount}/{groupInfo?.max_students}).
                  </p>
                )}
              </div>

              {/* Rules summary */}
              <div className="bg-green-50 border border-green-100 rounded-2xl p-3 text-xs text-green-800 space-y-1">
                <p className="font-bold text-[12px]">⚠️ Qoidalar va Eslatmalar:</p>
                <p>• Guruh kodi kiritilmaguncha test boshlanmaydi</p>
                <p>• Imtihon faqat to'liq ekranda o'tkaziladi</p>
                <p>• {maxViolationsLimit} ta qoidabuzarlikdan keyin imtihon bloklanadi</p>
                <p>• Sahifa yangilansa ham javoblaringiz 100% saqlanadi</p>
              </div>

              {registrationError && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-700 flex items-center gap-2">
                  <AlertTriangle size={16} className="flex-shrink-0" />
                  <span>{registrationError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={groupCheckStatus === "not_found" || groupCheckStatus === "inactive" || groupCheckStatus === "full"}
                className="w-full bg-green-700 hover:bg-green-800 disabled:opacity-50 text-white font-bold py-3.5 rounded-2xl transition-all text-sm shadow-sm hover:shadow-md cursor-pointer disabled:cursor-not-allowed"
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
          <div className="w-16 h-16 rounded-full bg-green-50 ring-1 ring-green-200 flex items-center justify-center mx-auto mb-5 text-green-700">
            <Maximize size={34} />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-1">To'liq Ekran Rejimi</h2>
          <p className="text-gray-600 text-sm mb-1">
            Salom, <strong>{session?.studentName}</strong>!
          </p>
          {session?.groupCode && (
            <p className="text-xs font-semibold text-green-700 bg-green-50 inline-block px-2.5 py-1 rounded-lg mb-4 border border-green-200">
              Guruh: {session.groupCode}
            </p>
          )}
          <p className="text-gray-500 text-xs mb-6">
            Imtihon faqat to'liq ekran rejimida o'tkaziladi. Boshqa ilovaga o'tish qoidabuzarlik deb hisoblanadi.
          </p>
          <button
            onClick={handleStartExam}
            className="w-full bg-green-700 hover:bg-green-800 text-white font-bold py-3.5 rounded-2xl transition-colors text-sm shadow-sm hover:shadow-md"
          >
            To'liq Ekranga Kirish va Boshlash
          </button>
        </div>
        {unlockModal}
      </div>
    );
  }

  // ════════════════════════════════════════════════════════
  // SUBMITTED PHASE
  // ════════════════════════════════════════════════════════
  if (phase === "submitted") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 flex flex-col items-center justify-center p-4 sm:p-6">
        <div className="anim-scale-in bg-white rounded-3xl shadow-xl shadow-slate-200/70 border border-slate-100 w-full max-w-md p-6 sm:p-8 text-center relative overflow-hidden">
          {/* Top subtle glow */}
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

          {/* Success Check Badge */}
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-600/25">
            <CheckCircle size={38} className="stroke-[2.2]" />
          </div>

          <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight mb-1">
            Imtihon Yakunlandi!
          </h2>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100/80 border border-slate-200/80 mb-4">
            <span className="text-xs font-semibold text-slate-700">
              {session?.studentName}
            </span>
            {session?.groupCode && (
              <>
                <span className="w-1 h-1 rounded-full bg-slate-400" />
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                  Guruh: {session.groupCode}
                </span>
              </>
            )}
          </div>

          {/* Server Sync State Box */}
          {submitStatus === "submitting" && (
            <div className="my-3.5 rounded-2xl bg-blue-50/90 border border-blue-200/80 p-3.5 text-xs text-blue-800 font-medium flex items-center justify-center gap-2.5">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin flex-shrink-0" />
              <span>Natijalar serverga xavfsiz yuklanmoqda...</span>
            </div>
          )}

          {submitStatus === "success" && (
            <div className="my-3.5 rounded-2xl bg-emerald-50/90 border border-emerald-200/80 p-3.5 text-xs text-emerald-800 font-semibold flex items-center justify-center gap-2">
              <ShieldCheck size={18} className="text-emerald-600 flex-shrink-0" />
              <span>Javoblaringiz serverda muvaffaqiyatli saqlandi!</span>
            </div>
          )}

          {submitStatus === "error" && (
            <div className="my-3.5 rounded-2xl bg-amber-50 border border-amber-200 p-3.5 text-xs text-amber-900 font-medium text-left flex items-start gap-2.5">
              <AlertTriangle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <span>
                Serverga ulanishda uzilish bo'ldi. Iltimos, pastdagi tugma orqali zaxira faylni yuklab olib o'qituvchiga topshiring.
              </span>
            </div>
          )}

          {/* Optional Backup Download Card */}
          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="flex items-start gap-2.5 bg-slate-50 border border-slate-200/70 rounded-2xl p-3.5 mb-4 text-left">
              <FileText size={17} className="text-slate-500 flex-shrink-0 mt-0.5" />
              <p className="text-slate-600 text-xs leading-relaxed">
                Javoblaringiz serverda qayd etildi. Zaxira nusxa uchun shifrlangan faylni ham <strong className="font-semibold text-slate-800">ixtiyoriy ravishda</strong> yuklab olishingiz mumkin.
              </p>
            </div>

            <button
              type="button"
              onClick={handleDownload}
              className={`w-full flex items-center justify-center gap-2 font-bold py-3.5 px-4 rounded-2xl transition-all duration-200 text-sm shadow-sm active:scale-[0.99] ${downloaded
                ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300"
                : "bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white shadow-emerald-700/20 hover:shadow-md"
                }`}
            >
              {downloaded ? (
                <>
                  <Check size={18} className="text-emerald-600" />
                  <span>Zaxira fayli yuklab olindi (Qayta yuklash)</span>
                </>
              ) : (
                <>
                  <Download size={18} />
                  <span>Zaxira Nusxasini Yuklab Olish</span>
                </>
              )}
            </button>
          </div>
        </div>
        {unlockModal}
      </div>
    );
  }

  if (!session) return null;

  // ════════════════════════════════════════════════════════
  // EXAM TAKING PHASE
  // ════════════════════════════════════════════════════════
  const currentSession = session;
  const catIds = currentSession.categoryOrder[activeCategory] ?? [];
  const activeCategories = CATEGORIES.filter(
    (category) => (currentSession.categoryOrder[category] ?? []).length > 0
  );
  const currentQuestionId = catIds[currentIdx];
  const currentQ = currentQuestionId != null ? getQuestionById(currentQuestionId, questionsList) : null;

  function catAnsweredCount(cat: Category): number {
    const ids = currentSession.categoryOrder[cat] ?? [];
    return ids.filter((id) => isAnswered(currentSession.answers[id])).length;
  }

  function catTotalCount(cat: Category): number {
    return (currentSession.categoryOrder[cat] ?? []).length;
  }

  const totalAnswered = CATEGORIES.reduce((s, c) => s + catAnsweredCount(c), 0);
  const totalAll = CATEGORIES.reduce((s, c) => s + catTotalCount(c), 0);
  const progressPct = totalAll > 0 ? Math.round((totalAnswered / totalAll) * 100) : 0;

  function switchCategory(cat: Category) {
    setActiveCategory(cat);
    setCurrentIdx(0);
  }

  const meta = CATEGORY_META[activeCategory] ?? CATEGORY_META.HTML;

  const selectedTotalPoints = CATEGORIES.reduce(
    (sum, cat) =>
      sum +
      (currentSession.categoryOrder[cat] ?? []).reduce(
        (s, id) => s + (getQuestionById(id, questionsList)?.points ?? 0),
        0
      ),
    0
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {storageBanner}
      {unlockModal}

      {/* Fullscreen blocked */}
      {fsBlocked && (
        <div className="fixed inset-0 z-50 bg-red-700 flex flex-col items-center justify-center text-white p-8 text-center anim-fade-up">
          <ShieldAlert size={64} className="mb-4 text-red-200" />
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">Imtihon Bloklab Qo'yildi</h2>
          <p className="text-red-100 text-sm max-w-sm font-semibold mb-1">
            {session?.violationCount ?? fsViolations.current} ta qoidabuzarlik qayd etildi.
          </p>
          <p className="text-red-200 text-xs max-w-sm mb-6">
            (Ruxsat etilgan limit: {maxViolationsLimit} ta). Blokni faqat o'qituvchi ocha oladi.
          </p>

        </div>
      )}

      {/* Fullscreen warning */}
      {fsWarning && !fsBlocked && (
        <div className="fixed inset-0 z-40 bg-black/80 flex flex-col items-center justify-center text-white p-8 text-center anim-scale-in">
          <AlertTriangle size={52} className="mb-4 text-yellow-400" />
          <h2 className="text-xl sm:text-2xl font-bold mb-2">To'liq Ekrandan Chiqdingiz!</h2>
          <p className="text-gray-300 mb-1 text-sm font-semibold">
            Ogohlantirish: {session?.violationCount ?? fsViolations.current}/{maxViolationsLimit}
          </p>
          <p className="text-gray-400 text-xs mb-6 max-w-xs">
            Yana {Math.max(0, maxViolationsLimit - (session?.violationCount ?? fsViolations.current))} marta qoidani buzsangiz imtihon bloklanadi.
          </p>
          <button
            onClick={handleResumeFullscreen}
            className="bg-green-700 hover:bg-green-800 text-white font-bold px-8 py-3.5 rounded-2xl transition-colors cursor-pointer"
          >
            To'liq Ekranga Qaytish
          </button>
        </div>
      )}

      {/* Header */}
      <div className="anim-slide-down">
        <ExamHeader
          studentName={session.studentName}
          totalQuestions={totalAll}
          totalPoints={selectedTotalPoints}
        />
      </div>

      {/* Timer & Group info bar */}
      <div className="anim-fade-up bg-white border-b border-gray-100 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {session.groupCode && (
            <span className="text-xs font-bold bg-blue-50 text-blue-800 px-2.5 py-1 rounded-lg border border-blue-200">
              Guruh: {session.groupCode}
            </span>
          )}
          {session.violationCount > 0 && (
            <span className="text-xs font-bold bg-red-50 text-red-700 px-2 py-1 rounded-lg border border-red-200 flex items-center gap-1">
              <AlertTriangle size={12} /> Jarima: -{session.violationCount} ball
            </span>
          )}
        </div>

        <Timer
          startTime={session.startTime}
          durationMinutes={session.durationMinutes}
          pausedAt={session.pausedAt}
          pausedDuration={session.pausedDuration}
          onTimeUp={handleSubmit}
        />
      </div>

      {/* Category tabs */}
      <div className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-3 sm:px-4">
          <div className="flex">
            {activeCategories.map((cat) => {
              const m = CATEGORY_META[cat] ?? CATEGORY_META.HTML;
              const answered = catAnsweredCount(cat);
              const total = catTotalCount(cat);
              const active = cat === activeCategory;
              const allDone = answered === total;
              return (
                <button
                  key={cat}
                  onClick={() => switchCategory(cat)}
                  className={`tab-btn flex-1 flex flex-col items-center py-2.5 sm:py-3 px-1 border-b-[3px] text-[11px] sm:text-xs font-bold gap-1 min-w-0 ${active
                    ? "border-green-700 text-green-700"
                    : "border-transparent text-gray-400 hover:text-gray-600"
                    }`}
                >
                  <span className={`flex items-center gap-1 sm:gap-1.5 ${active ? "text-green-700" : ""}`}>
                    <span className={active ? "text-green-700" : m.color}>{m.icon}</span>
                    <span className="hidden xs:inline sm:inline">{m.label}</span>
                    <span className="xs:hidden sm:hidden truncate max-w-[40px]">{m.label}</span>
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap ${allDone
                      ? "bg-green-100 text-green-700"
                      : active
                        ? "bg-green-50 text-green-700"
                        : "bg-gray-100 text-gray-500"
                      }`}
                  >
                    {answered}/{total}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Overall progress */}
        <div className="max-w-3xl mx-auto px-4 pb-2">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
            <span>
              Umumiy: {totalAnswered}/{totalAll}
            </span>
            <span className="font-bold text-gray-600">{progressPct}%</span>
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

      {/* Section header */}
      <div className={`border-b ${meta.bg} ${meta.border} py-2 px-4`}>
        <div className="max-w-3xl mx-auto flex items-center gap-2">
          <span className={meta.color}>{meta.icon}</span>
          <span className={`text-xs sm:text-sm font-bold ${meta.color}`}>
            {meta.label === "JS" ? "JavaScript" : meta.label} Bo'limi
          </span>
          <span className="text-xs text-gray-500 font-medium ml-auto">
            {catIds.length === 0 ? "Bu bo'limda savol yo'q" : `Savol ${currentIdx + 1} / ${catIds.length}`}
          </span>
        </div>
      </div>

      {/* Question area */}
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
                onSelect={(opt) => updateAnswer(currentQ.id, { type: "mcq", selected: opt })}
              />
            </div>
          ) : currentQ && currentQ.type === "drag" ? (
            <div className="anim-card-in" key={currentQ.id}>
              <DragDropCard
                question={currentQ}
                questionNumber={currentIdx + 1}
                currentOrder={
                  session.answers[currentQ.id]?.type === "dragdrop"
                    ? (session.answers[currentQ.id] as { type: "dragdrop"; order: number[] }).order
                    : session.dragOrders[currentQ.id] ?? currentQ.tokens.map((_, i) => i)
                }
                onReorder={(order) => updateAnswer(currentQ.id, { type: "dragdrop", order, touched: true })}
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

      {/* Fixed bottom navigation */}
      <div className="anim-slide-up bg-white border-t-[1.5px] border-gray-100 px-3 sm:px-4 py-3 fixed bottom-0 left-0 right-0 z-20 shadow-[0_-4px_20px_rgba(0,100,0,0.08)]">
        <div className="max-w-3xl mx-auto flex items-center gap-2 sm:gap-3">
          {/* Prev button */}
          <button
            onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
            disabled={currentIdx === 0}
            className="flex-shrink-0 flex items-center gap-1 px-3 sm:px-4 py-2.5 border-[1.5px] border-gray-200 rounded-2xl text-xs sm:text-sm font-bold text-gray-600 disabled:opacity-35 hover:border-green-700 hover:text-green-700 transition-colors whitespace-nowrap"
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
                  className={`flex-shrink-0 w-7 h-7 rounded-full text-[11px] font-bold transition-colors ${isActive
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
              className="flex-shrink-0 flex items-center gap-1 px-3 sm:px-4 py-2.5 bg-green-700 hover:bg-green-800 rounded-2xl text-xs sm:text-sm font-bold text-white transition-colors whitespace-nowrap shadow-sm"
            >
              <span className="hidden sm:inline">Keyingi</span>
              <ChevronRight size={15} />
            </button>
          ) : activeCategories.indexOf(activeCategory) < activeCategories.length - 1 ? (
            <button
              onClick={() => {
                const nextCat = activeCategories[activeCategories.indexOf(activeCategory) + 1];
                switchCategory(nextCat);
              }}
              className="flex-shrink-0 flex items-center gap-1 px-3 sm:px-4 py-2.5 bg-green-700 hover:bg-green-800 rounded-2xl text-xs sm:text-sm font-bold text-white transition-colors whitespace-nowrap shadow-sm"
            >
              <span className="hidden sm:inline">Keyingi Bo'lim</span>
              <span className="sm:hidden">Bo'lim</span>
              <ChevronRight size={15} />
            </button>
          ) : (
            <button
              onClick={() => setConfirmSubmit(true)}
              className="flex-shrink-0 flex items-center gap-1.5 px-4 sm:px-5 py-2.5 bg-green-700 hover:bg-green-800 rounded-2xl text-xs sm:text-sm font-bold text-white transition-colors whitespace-nowrap shadow-sm"
            >
              <CheckCircle size={15} />
              Topshirish
            </button>
          )}
        </div>
      </div>

      {/* Floating Finish Button */}
      <button
        onClick={() => setConfirmSubmit(true)}
        className="fixed right-3 top-3 z-30 flex items-center gap-1.5 rounded-xl border border-gray-300 bg-white/95 px-3 py-1.5 text-xs font-bold text-gray-700 shadow-sm backdrop-blur transition-colors hover:border-green-700 hover:text-green-700 sm:right-4"
      >
        <CheckCircle size={13} />
        Imtihonni yakunlash
      </button>

      {confirmSubmit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6">
          <div className="anim-scale-in w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900">Imtihonni yakunlaysizmi?</h3>

            {totalAnswered < totalAll ? (
              <p className="mt-2 text-xs leading-relaxed text-gray-600">
                <strong className="text-red-700">{totalAll - totalAnswered} ta savol</strong> javobsiz qoladi va ular uchun ball berilmaydi.
              </p>
            ) : (
              <p className="mt-2 text-xs text-gray-600">Barcha savollarga javob berdingiz.</p>
            )}

            <div className="mt-3 space-y-1.5 rounded-2xl bg-gray-50 p-3 text-xs">
              {CATEGORIES.map((cat) => {
                const answered = catAnsweredCount(cat);
                const total = catTotalCount(cat);
                if (total === 0) return null;
                return (
                  <div key={cat} className="flex items-center justify-between">
                    <span className="text-gray-600 font-medium">{cat}</span>
                    <span className={answered === total ? "font-bold text-green-700" : "font-semibold text-gray-500"}>
                      {answered}/{total}
                    </span>
                  </div>
                );
              })}
            </div>

            <p className="mt-3 text-[11px] text-gray-500">
              Yakunlangandan keyin javoblarni qayta o'zgartirib bo'lmaydi.
            </p>

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setConfirmSubmit(false)}
                className="flex-1 rounded-xl border border-gray-300 py-2.5 text-xs font-bold text-gray-600 transition-colors hover:bg-gray-50"
              >
                Davom etish
              </button>
              <button
                onClick={() => {
                  setConfirmSubmit(false);
                  handleSubmit();
                }}
                className="flex-1 rounded-xl bg-green-700 py-2.5 text-xs font-bold text-white transition-colors hover:bg-green-800"
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