import { useState, useRef, useMemo } from "react";
import { Upload, CheckCircle, XCircle, AlertTriangle, Lock, FileText, Settings, Save, RotateCcw } from "lucide-react";
import { decodeResult, TamperedResultError } from "../utils/encoding";
import { matchWithNearMiss, langForCategory, canonicalize, type MatchStatus } from "../utils/answerMatch";
import { diffChars } from "../utils/diff";
import { verifyAdminPassword } from "../utils/auth";
import {
  loadConfig,
  saveConfig,
  saveRemoteExamSettings,
  maxCount,
  MAX_DURATION_MINUTES,
  totalSelectedQuestions,
  type ExamConfig,
} from "../utils/config";
import { questions, CATEGORIES, type Category } from "../utils/data/questions";
import type { SessionAnswer } from "../utils/session";

type DecodedPayload = {
  studentName: string;
  startTime: number;
  submitTime: number;
  violationCount?: number;
  answers: Record<number, SessionAnswer>;
  categoryOrder: Record<Category, number[]>;
  optionOrders: Record<number, number[]>;
  dragOrders: Record<number, number[]>;
};

type GradedResult = {
  questionId: number;
  category: Category;
  displayOrder: number;
  correct: boolean;
  points: number;
  earned: number;
  studentAnswer: string;
  correctAnswer: string;
  /** Yozma savollarda: "deyarli to'g'ri" holatini belgilash uchun */
  status?: MatchStatus;
  similarity?: number;
  /** Farqni belgi-ma-belgi ko'rsatish mumkinmi (faqat yozma savollar) */
  diffable?: boolean;
};

const CATEGORY_COLORS: Record<Category, string> = {
  HTML: "bg-orange-50 text-orange-700 border-orange-200",
  CSS: "bg-blue-50 text-blue-700 border-blue-200",
  JavaScript: "bg-yellow-50 text-yellow-700 border-yellow-200",
  Python: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

export default function AdminPage({ onBack }: { onBack?: () => void }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState(false);
  const [fileContent, setFileContent] = useState("");
  const [decoded, setDecoded] = useState<DecodedPayload | null>(null);
  const [graded, setGraded] = useState<GradedResult[]>([]);
  // O'qituvchi qo'lda ball bergan savollar (savol ID -> ball berildi).
  // "Deyarli to'g'ri" javoblarni dastur o'zi qabul qilmaydi — qaror o'qituvchiniki.
  const [overrides, setOverrides] = useState<Record<number, boolean>>({});
  const [decodeError, setDecodeError] = useState("");
  const [config, setConfig] = useState<ExamConfig>(loadConfig);
  const [configSaved, setConfigSaved] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    // Parolning o'zi emas, SHA-256 hash'i taqqoslanadi — bundle ichida
    // ochiq matnli parol qolmaydi.
    if (verifyAdminPassword(password)) {
      setAuthenticated(true);
      setPasswordError(false);
      setPassword("");
    } else {
      setPasswordError(true);
    }
  }

  function updateCount(cat: Category, raw: string) {
    const value = Number(raw);
    setConfigSaved(false);
    setConfig((prev) => ({
      ...prev,
      counts: {
        ...prev.counts,
        [cat]: Number.isFinite(value)
          ? Math.max(0, Math.min(maxCount(cat), Math.floor(value)))
          : 0,
      },
    }));
  }

  async function handleSaveConfig() {
    const saved = saveConfig(config);
    setConfig(saved);
    setConfigSaved(true);
    await saveRemoteExamSettings(saved);
  }

  function handleFileDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) readFile(file);
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) readFile(file);
  }

  function readFile(file: File) {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = (ev.target?.result as string) || "";
      setFileContent(text.trim());
      setDecodeError("");
      setDecoded(null);
    };
    reader.readAsText(file);
  }

  function handleDecode() {
    setDecodeError("");
    setDecoded(null);
    const content = fileContent.trim();
    if (!content) {
      setDecodeError("Fayl mazmuni bo'sh.");
      return;
    }
    try {
      const payload = decodeResult(content) as DecodedPayload;
      if (!payload.studentName || !payload.answers) throw new Error("Invalid");
      setDecoded(payload);
      gradePayload(payload);
    } catch (error) {
      // Buzilgan fayl bilan QASDDAN o'zgartirilgan faylni farqlaymiz.
      setDecodeError(
        error instanceof TamperedResultError
          ? "⚠️ Bu fayl o'zgartirilgan — imzo mos kelmadi. Natijaga ishonib bo'lmaydi."
          : "Fayl o'qib bo'lmadi. Fayl buzilgan yoki noto'g'ri formatda.",
      );
    }
  }

  function gradePayload(payload: DecodedPayload) {
    const results: GradedResult[] = [];

    // Iterate in category order to preserve displayed ordering
    for (const cat of CATEGORIES) {
      const ids = payload.categoryOrder?.[cat] ?? questions.filter((q) => q.category === cat).map((q) => q.id);
      ids.forEach((id, displayIdx) => {
        const q = questions.find((qq) => qq.id === id);
        if (!q) return;
        const answer = payload.answers[id];
        let correct = false;
        let studentAnswer = "Javob berilmadi";
        let correctAnswer = "—";
        let status: MatchStatus | undefined;
        let score: number | undefined;
        let diffable = false;

        if (q.type === "mcq" && answer?.type === "mcq") {
          // q.answer = "A"|"B"|"C"|"D" → indeksga aylantirish
          const correctIdx = q.answer.charCodeAt(0) - 65; // "A"→0, "B"→1, ...
          correct = answer.selected === correctIdx;
          const optOrder = payload.optionOrders?.[id] ?? q.options.map((_, i) => i);
          const displayPos = answer.selected !== null ? optOrder.indexOf(answer.selected) : -1;
          const correctDisplayPos = optOrder.indexOf(correctIdx);
          studentAnswer =
            answer.selected !== null && displayPos >= 0
              ? `${String.fromCharCode(65 + displayPos)}) ${q.options[answer.selected]}`
              : "Javob berilmadi";
          correctAnswer = `${String.fromCharCode(65 + correctDisplayPos)}) ${q.options[correctIdx]}`;
        } else if (q.type === "truefalse" && answer?.type === "truefalse") {
          correct = answer.selected === q.answer;
          studentAnswer = answer.selected === null ? "Javob berilmadi" : answer.selected ? "To'g'ri" : "Noto'g'ri";
          correctAnswer = q.answer ? "To'g'ri" : "Noto'g'ri";
        } else if ((q.type === "code" || q.type === "fix") && answer?.type === q.type) {
          // Aniq matn tenglashtiruvi o'rniga til qoidalariga ko'ra taqqoslash.
          const match = matchWithNearMiss(answer.value, q.accepted, langForCategory(q.category));
          correct = match.status === "correct";
          status = match.status;
          score = match.similarity;
          diffable = answer.value.trim().length > 0;
          studentAnswer = answer.value || "Javob berilmadi";
          correctAnswer = match.closest || q.accepted[0] || "—";
        } else if (q.type === "drag" && answer?.type === "dragdrop") {
          const correctOrder = q.correctOrder.map((token) => q.tokens.indexOf(token));
          correct = JSON.stringify(answer.order) === JSON.stringify(correctOrder);
          studentAnswer = answer.order.map((i) => q.tokens[i]).join(" → ");
          correctAnswer = q.correctOrder.join(" → ");
        }

        results.push({
          questionId: id,
          category: cat,
          displayOrder: displayIdx + 1,
          correct,
          points: q.points,
          earned: correct ? q.points : 0,
          studentAnswer,
          correctAnswer,
          status,
          similarity: score,
          diffable,
        });
      });
    }

    setGraded(results);
    setOverrides({});
  }

  /** Savol uchun yakuniy ball — o'qituvchi qo'lda bergan ballni hisobga oladi. */
  function earnedFor(result: GradedResult): number {
    if (overrides[result.questionId] === true) return result.points;
    if (overrides[result.questionId] === false) return 0;
    return result.earned;
  }

  // Jami ballar `graded` va `overrides` dan HOSILA qilib hisoblanadi —
  // shuning uchun o'qituvchi ball berganda hamma raqam darhol yangilanadi.
  const totals = useMemo(() => {
    if (!decoded || graded.length === 0) return null;
    const earned = graded.reduce((sum, r) => sum + earnedFor(r), 0);
    const total = graded.reduce((sum, r) => sum + r.points, 0);
    const penalty = Math.min(decoded.violationCount ?? 0, earned);
    return { earned: earned - penalty, total, penalty, raw: earned };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graded, overrides, decoded]);

  const catTotals = useMemo(() => {
    const acc = {} as Record<Category, { earned: number; total: number }>;
    for (const cat of CATEGORIES) acc[cat] = { earned: 0, total: 0 };
    for (const r of graded) {
      acc[r.category].earned += earnedFor(r);
      acc[r.category].total += r.points;
    }
    return acc;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graded, overrides]);

  const nearMissCount = graded.filter(
    (r) => r.status === "near" && overrides[r.questionId] === undefined,
  ).length;

  /** total 0 bo'lsa 0/0 → NaN chiqib qolmasin. */
  function percent(earned: number, total: number): number {
    return total > 0 ? Math.round((earned / total) * 100) : 0;
  }

  function formatDuration(start: number, end: number) {
    const ms = end - start;
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    return `${mins} daqiqa ${secs} soniya`;
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-green-700 flex flex-col items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-full bg-green-50 border-2 border-green-700 flex items-center justify-center mx-auto mb-4 text-green-700">
              <Lock size={28} />
            </div>
            <h2 className="text-xl font-semibold text-gray-800">Admin Panel</h2>
            <p className="text-gray-500 text-sm mt-1">Imtihon natijalarini ko'rish</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Parol</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Admin parolini kiriting"
                required
                className={`w-full border-2 rounded-lg px-4 py-3 text-gray-800 focus:outline-none transition-colors ${passwordError ? "border-red-400 bg-red-50" : "border-gray-200 focus:border-green-700"
                  }`}
              />
              {passwordError && (
                <p className="text-red-600 text-xs mt-1">Noto'g'ri parol</p>
              )}
            </div>
            <button
              type="submit"
              className="w-full bg-green-700 hover:bg-green-800 text-white font-semibold py-3 rounded-xl transition-colors text-sm cursor-pointer"
            >
              Kirish
            </button>
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="w-full text-center text-xs text-gray-500 hover:text-gray-800 font-semibold py-2 transition-colors cursor-pointer"
              >
                ← Imtihon sahifasiga qaytish
              </button>
            )}
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-green-700 text-white py-4 px-6 relative">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-wide">Admin Panel</h1>
            <p className="text-green-100 text-xs mt-0.5">Imtihon natijalarini dekodlash</p>
          </div>
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="text-green-100 hover:text-white text-sm border border-green-500 hover:border-white px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                ← Imtihonga qaytish
              </button>
            )}
            <button
              onClick={() => setAuthenticated(false)}
              className="text-green-100 hover:text-white text-sm border border-green-500 hover:border-white px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              Chiqish
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Imtihon sozlamalari — ilgari bu inputlar talabaning ro'yxatdan
            o'tish sahifasida turardi va talaba o'ziga 1 savollik imtihon
            qo'yib olishi mumkin edi. */}
        <div className="bg-white rounded-xl border border-green-100 shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-1 flex items-center gap-2">
            <Settings size={18} className="text-green-700" /> Imtihon Sozlamalari
          </h2>
          <p className="text-xs text-gray-500 mb-4">
            Bu sozlamalar shu brauzerda ochiladigan imtihonga qo'llanadi. Talaba ularni
            o'zgartira olmaydi.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {CATEGORIES.map((cat) => (
              <label key={cat} className="block">
                <span className="mb-1.5 block text-xs font-semibold text-gray-600">
                  {cat} <span className="font-normal text-gray-400">(max {maxCount(cat)})</span>
                </span>
                <input
                  type="number"
                  min={0}
                  max={maxCount(cat)}
                  value={config.counts[cat]}
                  onChange={(e) => updateCount(cat, e.target.value)}
                  className="w-full rounded-lg border-2 border-gray-200 px-3 py-2 text-center text-sm font-semibold text-gray-800 focus:border-green-700 focus:outline-none"
                />
              </label>
            ))}
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-gray-600">
                Vaqt <span className="font-normal text-gray-400">(daqiqa)</span>
              </span>
              <input
                type="number"
                min={1}
                max={MAX_DURATION_MINUTES}
                value={config.durationMinutes}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  setConfigSaved(false);
                  setConfig((prev) => ({
                    ...prev,
                    durationMinutes: Number.isFinite(value)
                      ? Math.max(1, Math.min(MAX_DURATION_MINUTES, Math.floor(value)))
                      : prev.durationMinutes,
                  }));
                }}
                className="w-full rounded-lg border-2 border-gray-200 px-3 py-2 text-center text-sm font-semibold text-gray-800 focus:border-green-700 focus:outline-none"
              />
            </label>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={handleSaveConfig}
              className="flex items-center gap-2 rounded-xl bg-green-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-800"
            >
              <Save size={15} /> Saqlash
            </button>
            <span className="text-xs text-gray-500">
              Jami: <strong>{totalSelectedQuestions(config)}</strong> savol
            </span>
            {configSaved && (
              <span className="flex items-center gap-1 text-xs font-semibold text-green-700">
                <CheckCircle size={14} /> Saqlandi
              </span>
            )}
            {totalSelectedQuestions(config) === 0 && (
              <span className="text-xs font-semibold text-red-600">
                Savollar soni 0 — imtihon boshlanmaydi
              </span>
            )}
          </div>
        </div>

        {/* Upload */}
        <div className="bg-white rounded-xl border border-green-100 shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <FileText size={18} className="text-green-700" /> Natija Faylini Yuklash
          </h2>

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-green-200 rounded-xl p-8 text-center cursor-pointer hover:border-green-700 hover:bg-green-50/40 transition-colors"
          >
            <Upload size={32} className="text-green-500 mx-auto mb-3" />
            <p className="text-gray-600 font-medium text-sm">
              Faylni shu yerga tashlang yoki bosing
            </p>
            <p className="text-gray-400 text-xs mt-1">*.txt format (kodlangan natija fayli)</p>
            <input ref={fileRef} type="file" accept=".txt" onChange={handleFileInput} className="hidden" />
          </div>

          {fileContent && (
            <div className="mt-4">
              <p className="text-xs text-gray-500 mb-2">Fayl mazmuni (kodlangan):</p>
              <div className="bg-gray-50 rounded-lg p-3 font-mono text-xs text-gray-600 break-all max-h-20 overflow-y-auto border border-gray-200">
                {fileContent.slice(0, 200)}...
              </div>
            </div>
          )}

          <div className="mt-4">
            <textarea
              value={fileContent}
              onChange={(e) => setFileContent(e.target.value)}
              placeholder="Yoki kodlangan matnni bu yerga yapish (paste) qiling..."
              rows={3}
              className="w-full border-2 border-gray-200 rounded-lg px-3 py-2.5 text-xs font-mono text-gray-700 focus:outline-none focus:border-green-700 resize-none"
            />
          </div>

          {decodeError && (
            <p className="text-red-600 text-sm mt-2 flex items-center gap-1.5">
              <XCircle size={15} /> {decodeError}
            </p>
          )}

          <button
            onClick={handleDecode}
            disabled={!fileContent.trim()}
            className="mt-4 w-full bg-green-700 hover:bg-green-800 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
          >
            Dekodlash va Baholash
          </button>
        </div>

        {/* Results */}
        {decoded && totals && (
          <div className="space-y-4">
            {/* Summary */}
            <div className="bg-green-700 text-white rounded-xl p-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-green-100 text-xs font-medium">Talaba</p>
                  <p className="text-white font-semibold text-lg mt-0.5">{decoded.studentName}</p>
                </div>
                <div>
                  <p className="text-green-100 text-xs font-medium">Natija</p>
                  <p className="text-white font-semibold text-lg mt-0.5">{totals.earned} / {totals.total}</p>
                </div>
                <div>
                  <p className="text-green-100 text-xs font-medium">Foiz</p>
                  <p className="text-white font-semibold text-lg mt-0.5">
                    {percent(totals.earned, totals.total)}%
                  </p>
                </div>
                <div>
                  <p className="text-green-100 text-xs font-medium">Vaqt</p>
                  <p className="text-white font-semibold text-sm mt-0.5">
                    {decoded.submitTime ? formatDuration(decoded.startTime, decoded.submitTime) : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-green-100 text-xs font-medium">Jarima</p>
                  <p className="text-white font-semibold text-lg mt-0.5">
                    -{totals.penalty} ball
                  </p>
                </div>
              </div>
              <div className="h-3 bg-green-900/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-colors"
                  style={{ width: `${percent(totals.earned, totals.total)}%` }}
                />
              </div>

              {/* Per-category mini scores */}
              <div className="grid grid-cols-3 gap-3 mt-4">
                {CATEGORIES.map((cat) => (
                  <div key={cat} className="bg-green-900/30 rounded-lg p-3 text-center">
                    <p className="text-green-100 text-xs font-semibold">{cat}</p>
                    <p className="text-white font-semibold mt-0.5">
                      {catTotals[cat].earned}/{catTotals[cat].total}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Ko'rib chiqish talab qiladigan javoblar haqida ogohlantirish */}
            {nearMissCount > 0 && (
              <div className="flex items-start gap-2.5 rounded-xl border border-yellow-200 bg-yellow-50 p-4">
                <AlertTriangle size={18} className="mt-0.5 flex-shrink-0 text-yellow-700" />
                <p className="text-sm text-yellow-800">
                  <strong>{nearMissCount} ta javob to'g'ri javobga juda yaqin</strong> — masalan
                  bitta belgi farq qiladi. Ular avtomatik 0 ball oldi. Quyida sariq bilan
                  belgilangan; farqni ko'rib, o'zingiz ball berishingiz mumkin.
                </p>
              </div>
            )}

            {/* Per-category detailed results */}
            {CATEGORIES.map((cat) => {
              const catResults = graded.filter((r) => r.category === cat);
              return (
                <div key={cat} className="bg-white rounded-xl border border-green-100 shadow-sm overflow-hidden">
                  <div className={`px-6 py-3 border-b flex items-center gap-2 ${CATEGORY_COLORS[cat]}`}>
                    <h3 className="font-semibold text-sm">{cat} Bo'limi</h3>
                    <span className="ml-auto text-xs font-semibold">
                      {catTotals[cat].earned}/{catTotals[cat].total} ball
                    </span>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {catResults.map((r) => {
                      const q = questions.find((qq) => qq.id === r.questionId)!;
                      const awarded = earnedFor(r) > 0;
                      const overridden = overrides[r.questionId] !== undefined;
                      const isNear = r.status === "near";

                      return (
                        <div key={r.questionId} className={`px-6 py-4 ${isNear && !overridden ? "bg-yellow-50/50" : ""}`}>
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5 flex-shrink-0">
                              {awarded ? (
                                <CheckCircle size={18} className="text-green-700" />
                              ) : isNear ? (
                                <AlertTriangle size={18} className="text-yellow-700" />
                              ) : (
                                <XCircle size={18} className="text-red-500" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="mb-1.5 flex flex-wrap items-center gap-2">
                                <span className="text-xs font-semibold text-gray-500">#{r.displayOrder}</span>
                                <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${CATEGORY_COLORS[cat]}`}>
                                  {q.type === "drag" ? "Drag & Drop" : q.type.toUpperCase()}
                                </span>

                                {/* Deyarli to'g'ri javoblar o'qituvchi e'tiboridan
                                    chetda qolmasligi uchun ochiq belgilanadi. */}
                                {isNear && (
                                  <span className="rounded-full border border-yellow-200 bg-yellow-50 px-2 py-0.5 text-xs font-medium text-yellow-800">
                                    Deyarli to'g'ri · {Math.round((r.similarity ?? 0) * 100)}%
                                  </span>
                                )}
                                {overridden && (
                                  <span className="rounded-full border border-gray-300 bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                                    Qo'lda baholandi
                                  </span>
                                )}

                                <span className={`ml-auto text-sm font-semibold ${awarded ? "text-green-700" : "text-red-500"}`}>
                                  {earnedFor(r)}/{r.points}
                                </span>
                              </div>

                              <p className="mb-2 whitespace-pre-wrap text-sm font-medium text-gray-800">{q.question}</p>

                              {/* Yozma savollarda farqni belgi-ma-belgi ko'rsatamiz */}
                              {r.diffable && !r.correct ? (
                                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                                  <p className="mb-2 text-xs font-medium text-gray-600">
                                    Farq — <span className="rounded bg-red-100 px-1 text-red-800">yo'q</span>{" "}
                                    <span className="rounded bg-green-100 px-1 text-green-800">ortiqcha</span>
                                    <span className="ml-2 font-normal text-gray-500">
                                      (bo'shliq va qo'shtirnoq farqi hisobga olinmagan)
                                    </span>
                                  </p>
                                  {/* Farq KANONIK ko'rinishlar ustida hisoblanadi: aks holda
                                      baholashga ta'sir qilmaydigan ' ↔ " va chekinish farqlari
                                      ham bo'yalib, haqiqiy xatoni ko'rish qiyinlashardi. */}
                                  <pre className="overflow-x-auto whitespace-pre-wrap break-words font-mono text-xs leading-5 text-gray-700">
                                    {diffChars(
                                      canonicalize(r.correctAnswer, langForCategory(cat)),
                                      canonicalize(r.studentAnswer, langForCategory(cat)),
                                    ).map((part, i) => (
                                      <span
                                        key={i}
                                        className={
                                          part.kind === "removed"
                                            ? "rounded bg-red-100 text-red-800 line-through"
                                            : part.kind === "added"
                                              ? "rounded bg-green-100 text-green-800"
                                              : ""
                                        }
                                      >
                                        {part.text}
                                      </span>
                                    ))}
                                  </pre>
                                  <div className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
                                    <div>
                                      <p className="mb-0.5 font-medium text-gray-500">Talaba javobi</p>
                                      <pre className="overflow-x-auto whitespace-pre-wrap break-words rounded bg-white p-2 font-mono text-gray-700 ring-1 ring-gray-200">{r.studentAnswer}</pre>
                                    </div>
                                    <div>
                                      <p className="mb-0.5 font-medium text-gray-500">Kutilgan javob</p>
                                      <pre className="overflow-x-auto whitespace-pre-wrap break-words rounded bg-white p-2 font-mono text-gray-700 ring-1 ring-gray-200">{r.correctAnswer}</pre>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="grid gap-2 text-xs sm:grid-cols-2">
                                  <div className={`rounded-lg border p-2.5 ${awarded ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}>
                                    <p className="mb-0.5 font-medium text-gray-600">Talaba javobi:</p>
                                    <p className={`break-words font-medium ${awarded ? "text-green-700" : "text-red-700"}`}>
                                      {r.studentAnswer}
                                    </p>
                                  </div>
                                  {!r.correct && (
                                    <div className="rounded-lg border border-green-200 bg-green-50 p-2.5">
                                      <p className="mb-0.5 font-medium text-gray-600">To'g'ri javob:</p>
                                      <p className="break-words font-medium text-green-700">{r.correctAnswer}</p>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Yakuniy qaror o'qituvchida qoladi */}
                              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                                {!awarded && (
                                  <button
                                    onClick={() => setOverrides((prev) => ({ ...prev, [r.questionId]: true }))}
                                    className="rounded-lg border border-green-600 px-2.5 py-1 text-xs font-medium text-green-700 transition-colors hover:bg-green-50"
                                  >
                                    To'liq ball berish (+{r.points})
                                  </button>
                                )}
                                {awarded && (
                                  <button
                                    onClick={() => setOverrides((prev) => ({ ...prev, [r.questionId]: false }))}
                                    className="rounded-lg border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50"
                                  >
                                    Ballni olib tashlash
                                  </button>
                                )}
                                {overridden && (
                                  <button
                                    onClick={() =>
                                      setOverrides((prev) => {
                                        const next = { ...prev };
                                        delete next[r.questionId];
                                        return next;
                                      })
                                    }
                                    className="flex items-center gap-1 text-xs font-medium text-gray-500 transition-colors hover:text-gray-700"
                                  >
                                    <RotateCcw size={12} /> Avtomatik baholashga qaytarish
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
