import { useState, useRef } from "react";
import { Upload, CheckCircle, XCircle, Lock, FileText } from "lucide-react";
import { decodeResult } from "../utils/encoding";
import { questions, CATEGORIES, type Category } from "../utils/data/questions";
import type { SessionAnswer } from "../utils/session";

type DecodedPayload = {
  studentName: string;
  startTime: number;
  submitTime: number;
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
};

const ADMIN_PASSWORD = "JAMSHID";

const CATEGORY_COLORS: Record<Category, string> = {
  HTML: "bg-orange-50 text-orange-700 border-orange-200",
  CSS: "bg-blue-50 text-blue-700 border-blue-200",
  JavaScript: "bg-yellow-50 text-yellow-700 border-yellow-200",
};

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState(false);
  const [fileContent, setFileContent] = useState("");
  const [decoded, setDecoded] = useState<DecodedPayload | null>(null);
  const [graded, setGraded] = useState<GradedResult[]>([]);
  const [totals, setTotals] = useState<{ earned: number; total: number } | null>(null);
  const [catTotals, setCatTotals] = useState<Record<Category, { earned: number; total: number }> | null>(null);
  const [decodeError, setDecodeError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setAuthenticated(true);
      setPasswordError(false);
    } else {
      setPasswordError(true);
    }
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
    } catch {
      setDecodeError("Fayl o'qib bo'lmadi. Fayl buzilgan yoki noto'g'ri.");
    }
  }

  function gradePayload(payload: DecodedPayload) {
    const results: GradedResult[] = [];
    let totalEarned = 0;
    let totalPts = 0;
    const ct: Record<string, { earned: number; total: number }> = {};
    for (const cat of CATEGORIES) ct[cat] = { earned: 0, total: 0 };

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
          correct = q.accepted.some((expected) => expected.trim() === answer.value.trim());
          studentAnswer = answer.value || "Javob berilmadi";
          correctAnswer = q.accepted[0];
        } else if (q.type === "drag" && answer?.type === "dragdrop") {
          const correctOrder = q.correctOrder.map((token) => q.tokens.indexOf(token));
          correct = JSON.stringify(answer.order) === JSON.stringify(correctOrder);
          studentAnswer = answer.order.map((i) => q.tokens[i]).join(" → ");
          correctAnswer = q.correctOrder.join(" → ");
        }

        const earned = correct ? q.points : 0;
        totalEarned += earned;
        totalPts += q.points;
        ct[cat].earned += earned;
        ct[cat].total += q.points;

        results.push({
          questionId: id,
          category: cat,
          displayOrder: displayIdx + 1,
          correct,
          points: q.points,
          earned,
          studentAnswer,
          correctAnswer,
        });
      });
    }

    setGraded(results);
    setTotals({ earned: totalEarned, total: totalPts });
    setCatTotals(ct as Record<Category, { earned: number; total: number }>);
  }

  function formatDuration(start: number, end: number) {
    const ms = end - start;
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    return `${mins} daqiqa ${secs} soniya`;
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[#006400] flex flex-col items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-full bg-green-50 border-2 border-[#006400] flex items-center justify-center mx-auto mb-4 text-[#006400]">
              <Lock size={28} />
            </div>
            <h2 className="text-xl font-bold text-gray-800">Admin Panel</h2>
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
                className={`w-full border-2 rounded-lg px-4 py-3 text-gray-800 focus:outline-none transition-colors ${
                  passwordError ? "border-red-400 bg-red-50" : "border-gray-200 focus:border-[#006400]"
                }`}
              />
              {passwordError && (
                <p className="text-red-600 text-xs mt-1">Noto'g'ri parol</p>
              )}
            </div>
            <button
              type="submit"
              className="w-full bg-[#006400] hover:bg-green-800 text-white font-bold py-3 rounded-xl transition-colors text-sm"
            >
              Kirish
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-[#006400] text-white py-4 px-6 relative">
        <div className="absolute top-0 left-0 w-5 h-5 border-t-4 border-l-4 border-white" />
        <div className="absolute top-0 right-0 w-5 h-5 border-t-4 border-r-4 border-white" />
        <div className="absolute bottom-0 left-0 w-5 h-5 border-b-4 border-l-4 border-white" />
        <div className="absolute bottom-0 right-0 w-5 h-5 border-b-4 border-r-4 border-white" />
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-wide">Admin Panel</h1>
            <p className="text-green-200 text-xs mt-0.5">Imtihon natijalarini dekodlash</p>
          </div>
          <button
            onClick={() => setAuthenticated(false)}
            className="text-green-200 hover:text-white text-sm border border-green-500 hover:border-white px-3 py-1.5 rounded-lg transition-colors"
          >
            Chiqish
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Upload */}
        <div className="bg-white rounded-xl border border-green-100 shadow-sm p-6">
          <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
            <FileText size={18} className="text-[#006400]" /> Natija Faylini Yuklash
          </h2>

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-green-200 rounded-xl p-8 text-center cursor-pointer hover:border-[#006400] hover:bg-green-50/40 transition-colors"
          >
            <Upload size={32} className="text-green-400 mx-auto mb-3" />
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
              className="w-full border-2 border-gray-200 rounded-lg px-3 py-2.5 text-xs font-mono text-gray-700 focus:outline-none focus:border-[#006400] resize-none"
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
            className="mt-4 w-full bg-[#006400] hover:bg-green-800 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors text-sm"
          >
            Dekodlash va Baholash
          </button>
        </div>

        {/* Results */}
        {decoded && totals && catTotals && (
          <div className="space-y-4">
            {/* Summary */}
            <div className="bg-[#006400] text-white rounded-xl p-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-green-200 text-xs font-semibold uppercase tracking-wider">Talaba</p>
                  <p className="text-white font-bold text-lg mt-0.5">{decoded.studentName}</p>
                </div>
                <div>
                  <p className="text-green-200 text-xs font-semibold uppercase tracking-wider">Natija</p>
                  <p className="text-white font-bold text-lg mt-0.5">{totals.earned} / {totals.total}</p>
                </div>
                <div>
                  <p className="text-green-200 text-xs font-semibold uppercase tracking-wider">Foiz</p>
                  <p className="text-white font-bold text-lg mt-0.5">
                    {Math.round((totals.earned / totals.total) * 100)}%
                  </p>
                </div>
                <div>
                  <p className="text-green-200 text-xs font-semibold uppercase tracking-wider">Vaqt</p>
                  <p className="text-white font-bold text-sm mt-0.5">
                    {decoded.submitTime ? formatDuration(decoded.startTime, decoded.submitTime) : "—"}
                  </p>
                </div>
              </div>
              <div className="h-3 bg-green-900/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all"
                  style={{ width: `${(totals.earned / totals.total) * 100}%` }}
                />
              </div>

              {/* Per-category mini scores */}
              <div className="grid grid-cols-3 gap-3 mt-4">
                {CATEGORIES.map((cat) => (
                  <div key={cat} className="bg-green-900/30 rounded-lg p-3 text-center">
                    <p className="text-green-200 text-xs font-semibold">{cat}</p>
                    <p className="text-white font-bold mt-0.5">
                      {catTotals[cat].earned}/{catTotals[cat].total}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Per-category detailed results */}
            {CATEGORIES.map((cat) => {
              const catResults = graded.filter((r) => r.category === cat);
              return (
                <div key={cat} className="bg-white rounded-xl border border-green-100 shadow-sm overflow-hidden">
                  <div className={`px-6 py-3 border-b flex items-center gap-2 ${CATEGORY_COLORS[cat]}`}>
                    <h3 className="font-bold text-sm">{cat} Bo'limi</h3>
                    <span className="ml-auto text-xs font-bold">
                      {catTotals[cat].earned}/{catTotals[cat].total} ball
                    </span>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {catResults.map((r) => {
                      const q = questions.find((qq) => qq.id === r.questionId)!;
                      return (
                        <div key={r.questionId} className="px-6 py-4">
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 mt-0.5">
                              {r.correct ? (
                                <CheckCircle size={18} className="text-[#006400]" />
                              ) : (
                                <XCircle size={18} className="text-red-500" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1.5">
                                <span className="text-xs font-bold text-gray-500">#{r.displayOrder}</span>
                                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${CATEGORY_COLORS[cat]}`}>
                                  {q.type === "drag" ? "Drag & Drop" : q.type.toUpperCase()}
                                </span>
                                <span className={`ml-auto text-sm font-bold ${r.correct ? "text-[#006400]" : "text-red-500"}`}>
                                  {r.earned}/{r.points}
                                </span>
                              </div>
                              <p className="text-sm text-gray-800 font-medium mb-2 whitespace-pre-wrap">{q.question}</p>
                              <div className="grid sm:grid-cols-2 gap-2 text-xs">
                                <div className={`rounded-lg p-2.5 ${r.correct ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
                                  <p className="font-semibold text-gray-600 mb-0.5">Talaba javobi:</p>
                                  <p className={`${r.correct ? "text-[#006400]" : "text-red-700"} font-medium break-words`}>
                                    {r.studentAnswer}
                                  </p>
                                </div>
                                {!r.correct && (
                                  <div className="rounded-lg p-2.5 bg-green-50 border border-green-200">
                                    <p className="font-semibold text-gray-600 mb-0.5">To'g'ri javob:</p>
                                    <p className="text-[#006400] font-medium break-words">{r.correctAnswer}</p>
                                  </div>
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
