import fs from 'fs';
import path from 'path';

const adminRoot = path.resolve(process.cwd(), '../MONDAY_admin');

function ensureDir(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function writeFile(relativePath: string, content: string) {
  const fullPath = path.join(adminRoot, relativePath);
  ensureDir(path.dirname(fullPath));
  fs.writeFileSync(fullPath, content.trim() + '\n', 'utf-8');
  console.log(`Generated: ${relativePath}`);
}

// 1. QuestionModal.tsx (Light Mode)
writeFile('src/components/QuestionModal.tsx', `
import React, { useState } from "react";
import { X, Save } from "lucide-react";
import type { Question, Category, QuestionType } from "../types";

type QuestionModalProps = {
  isOpen: boolean;
  question: Question | null;
  onClose: () => void;
  onSave: (question: Question) => Promise<void>;
};

export const QuestionModal: React.FC<QuestionModalProps> = ({
  isOpen,
  question,
  onClose,
  onSave,
}) => {
  if (!isOpen) return null;

  const id = question ? question.id : Date.now() % 100000;
  const [category, setCategory] = useState<Category>(question ? question.category : "HTML");
  const [type, setType] = useState<QuestionType>(question ? question.type : "mcq");
  const [topic, setTopic] = useState<string>(question ? question.topic : "");
  const [questionText, setQuestionText] = useState<string>(question ? question.question : "");
  const [hint, setHint] = useState<string>(question ? question.hint : "");
  const [points, setPoints] = useState<number>(question ? question.points : 1);

  const [mcqOptions, setMcqOptions] = useState<string[]>(
    question?.type === "mcq" ? question.options : ["", "", "", ""]
  );
  const [mcqAnswer, setMcqAnswer] = useState<string>(
    question?.type === "mcq" ? question.answer : "A"
  );

  const [tfAnswer, setTfAnswer] = useState<boolean>(
    question?.type === "truefalse" ? question.answer : true
  );

  const [codePlaceholder, setCodePlaceholder] = useState<string>(
    question?.type === "code" ? question.placeholder || "" : ""
  );
  const [codeAccepted, setCodeAccepted] = useState<string>(
    question?.type === "code" ? question.accepted.join("\\n---YOKI---\\n") : ""
  );

  const [dragTokens, setDragTokens] = useState<string>(
    question?.type === "drag" ? question.tokens.join(", ") : ""
  );
  const [dragCorrectOrder, setDragCorrectOrder] = useState<string>(
    question?.type === "drag" ? question.correctOrder.join(", ") : ""
  );

  const [fixBrokenCode, setFixBrokenCode] = useState<string>(
    question?.type === "fix" ? question.brokenCode : ""
  );
  const [fixAccepted, setFixAccepted] = useState<string>(
    question?.type === "fix" ? question.accepted.join("\\n---YOKI---\\n") : ""
  );

  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    try {
      let constructed: Question;

      if (type === "mcq") {
        constructed = {
          id,
          type: "mcq",
          category,
          topic: topic.trim() || "Umumiy",
          question: questionText.trim(),
          options: mcqOptions.map((o) => o.trim()),
          answer: mcqAnswer,
          hint: hint.trim(),
          points: Number(points) || 1,
        };
      } else if (type === "truefalse") {
        constructed = {
          id,
          type: "truefalse",
          category,
          topic: topic.trim() || "Umumiy",
          question: questionText.trim(),
          answer: tfAnswer,
          hint: hint.trim(),
          points: Number(points) || 1,
        };
      } else if (type === "code") {
        constructed = {
          id,
          type: "code",
          category,
          topic: topic.trim() || "Umumiy",
          question: questionText.trim(),
          placeholder: codePlaceholder.trim(),
          accepted: codeAccepted.split("\\n---YOKI---\\n").map((s) => s.trim()).filter(Boolean),
          hint: hint.trim(),
          points: Number(points) || 1,
        };
      } else if (type === "drag") {
        constructed = {
          id,
          type: "drag",
          category,
          topic: topic.trim() || "Umumiy",
          question: questionText.trim(),
          tokens: dragTokens.split(",").map((s) => s.trim()).filter(Boolean),
          correctOrder: dragCorrectOrder.split(",").map((s) => s.trim()).filter(Boolean),
          hint: hint.trim(),
          points: Number(points) || 1,
        };
      } else {
        constructed = {
          id,
          type: "fix",
          category,
          topic: topic.trim() || "Umumiy",
          question: questionText.trim(),
          brokenCode: fixBrokenCode,
          accepted: fixAccepted.split("\\n---YOKI---\\n").map((s) => s.trim()).filter(Boolean),
          hint: hint.trim(),
          points: Number(points) || 1,
        };
      }

      await onSave(constructed);
      onClose();
    } catch (err) {
      console.error(err);
      alert("Savolni saqlashda xatolik yuz berdi");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-slide-up">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {question ? "Savolni Tahrirlash" : "Yangi Savol Qo'shish"}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Supabase bazasiga avtomatik yoziladi</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-900 border border-slate-200 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1 text-sm text-slate-700">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Bo'lim (Kategoriya)</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 font-semibold outline-none focus:bg-white focus:border-green-600"
              >
                <option value="HTML">HTML</option>
                <option value="CSS">CSS</option>
                <option value="JavaScript">JavaScript</option>
                <option value="Python">Python</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Savol Turi</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as QuestionType)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 font-semibold outline-none focus:bg-white focus:border-green-600"
              >
                <option value="mcq">MCQ (4 ta variant)</option>
                <option value="truefalse">True/False (To'g'ri/Noto'g'ri)</option>
                <option value="code">Kod Yozish</option>
                <option value="drag">Drag & Drop (Tokenlar)</option>
                <option value="fix">Kod Xatosini Tuzatish</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Ball</label>
              <input
                type="number"
                min={1}
                max={20}
                value={points}
                onChange={(e) => setPoints(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 font-semibold outline-none focus:bg-white focus:border-green-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Mavzu (Topic)</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Masalan: Flexbox, DOM, Sikllar..."
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 outline-none focus:bg-white focus:border-green-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Savol Matni</label>
            <textarea
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="Savol matnini yozing..."
              rows={3}
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-slate-900 outline-none focus:bg-white focus:border-green-600 font-medium"
            />
          </div>

          {type === "mcq" && (
            <div className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-xs font-bold text-green-800 uppercase tracking-wider block mb-2">Variantlar</span>
              {["A", "B", "C", "D"].map((letter, idx) => (
                <div key={letter} className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-lg bg-white text-slate-700 font-bold text-xs flex items-center justify-center border border-slate-200 shadow-sm">
                    {letter}
                  </span>
                  <input
                    type="text"
                    value={mcqOptions[idx] || ""}
                    onChange={(e) => {
                      const copy = [...mcqOptions];
                      copy[idx] = e.target.value;
                      setMcqOptions(copy);
                    }}
                    placeholder={\`\${letter} varianti matni...\`}
                    required
                    className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 text-xs outline-none focus:border-green-600"
                  />
                  <input
                    type="radio"
                    name="mcqCorrect"
                    checked={mcqAnswer === letter}
                    onChange={() => setMcqAnswer(letter)}
                    className="w-4 h-4 accent-green-700 cursor-pointer"
                    title="To'g'ri javob sifatida belgilash"
                  />
                </div>
              ))}
            </div>
          )}

          {type === "truefalse" && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="text-xs font-bold text-green-800 uppercase tracking-wider block mb-2">To'g'ri Javob</span>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="tfCorrect"
                    checked={tfAnswer === true}
                    onChange={() => setTfAnswer(true)}
                    className="w-4 h-4 accent-green-700"
                  />
                  <span className="font-semibold text-emerald-800">To'g'ri (True)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="tfCorrect"
                    checked={tfAnswer === false}
                    onChange={() => setTfAnswer(false)}
                    className="w-4 h-4 accent-green-700"
                  />
                  <span className="font-semibold text-rose-800">Noto'g'ri (False)</span>
                </label>
              </div>
            </div>
          )}

          {type === "code" && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Boshlang'ich kod (Placeholder)</label>
                <input
                  type="text"
                  value={codePlaceholder}
                  onChange={(e) => setCodePlaceholder(e.target.value)}
                  placeholder="<!-- Kodingizni yozing -->"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Qabul qilinadigan to'g'ri kodlar (Bir nechtasi bo'lsa ---YOKI--- bilan ajrating):
                </label>
                <textarea
                  value={codeAccepted}
                  onChange={(e) => setCodeAccepted(e.target.value)}
                  rows={4}
                  required
                  className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-emerald-800 font-mono outline-none focus:border-green-600"
                />
              </div>
            </div>
          )}

          {type === "drag" && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Tokenlar ro'yxati (vergul bilan ajrating):</label>
                <input
                  type="text"
                  value={dragTokens}
                  onChange={(e) => setDragTokens(e.target.value)}
                  placeholder="<a>, href='...', >, Matn, </a>"
                  required
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">To'g'ri tartibdagi tokenlar (vergul bilan ajrating):</label>
                <input
                  type="text"
                  value={dragCorrectOrder}
                  onChange={(e) => setDragCorrectOrder(e.target.value)}
                  placeholder="<a>, href='...', >, Matn, </a>"
                  required
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-emerald-800 font-mono"
                />
              </div>
            </div>
          )}

          {type === "fix" && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Xatosi bor dastlabki kod:</label>
                <textarea
                  value={fixBrokenCode}
                  onChange={(e) => setFixBrokenCode(e.target.value)}
                  rows={3}
                  required
                  className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-amber-900 font-mono outline-none focus:border-green-600"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Tuzatilgan to'g'ri kodlar (---YOKI--- bilan ajrating):</label>
                <textarea
                  value={fixAccepted}
                  onChange={(e) => setFixAccepted(e.target.value)}
                  rows={3}
                  required
                  className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-emerald-800 font-mono outline-none focus:border-green-600"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Maslahat (Hint)</label>
            <input
              type="text"
              value={hint}
              onChange={(e) => setHint(e.target.value)}
              placeholder="Yordamchi eslatma matni..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 outline-none focus:bg-white focus:border-green-600"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-900 font-semibold transition-colors cursor-pointer"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-green-700 hover:bg-green-800 text-white font-bold transition-all shadow-sm disabled:opacity-50 cursor-pointer"
            >
              <Save size={16} />
              <span>{isSaving ? "Saqlanmoqda..." : "Saqlash"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
`);

// 2. QuestionsView.tsx (Light Mode)
writeFile('src/components/QuestionsView.tsx', `
import React, { useState } from "react";
import { Plus, Search, Edit3, Trash2 } from "lucide-react";
import type { Question, Category, QuestionType } from "../types";

type QuestionsViewProps = {
  questions: Question[];
  onAddQuestion: () => void;
  onEditQuestion: (q: Question) => void;
  onDeleteQuestion: (id: number) => void;
};

export const QuestionsView: React.FC<QuestionsViewProps> = ({
  questions,
  onAddQuestion,
  onEditQuestion,
  onDeleteQuestion,
}) => {
  const [selectedCat, setSelectedCat] = useState<Category | "ALL">("ALL");
  const [selectedType, setSelectedType] = useState<QuestionType | "ALL">("ALL");
  const [search, setSearch] = useState("");

  const categories: Category[] = ["HTML", "CSS", "JavaScript", "Python"];

  const filtered = questions.filter((q) => {
    const catMatches = selectedCat === "ALL" || q.category === selectedCat;
    const typeMatches = selectedType === "ALL" || q.type === selectedType;
    const searchMatches =
      q.question.toLowerCase().includes(search.toLowerCase()) ||
      q.topic.toLowerCase().includes(search.toLowerCase());
    return catMatches && typeMatches && searchMatches;
  });

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="p-4 rounded-3xl bg-white border border-slate-200 flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
        <div className="relative w-full md:w-80">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Savol yoki mavzuni qidirish..."
            className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-green-600 rounded-2xl pl-11 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-colors"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as any)}
            className="bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2 text-xs text-slate-700 outline-none font-medium cursor-pointer"
          >
            <option value="ALL">Barcha Turlar</option>
            <option value="mcq">MCQ (Variantli)</option>
            <option value="truefalse">True / False</option>
            <option value="code">Kod Yozish</option>
            <option value="drag">Drag & Drop</option>
            <option value="fix">Kod Tuzatish</option>
          </select>

          <button
            onClick={onAddQuestion}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-green-700 hover:bg-green-800 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
          >
            <Plus size={16} />
            <span>Yangi Savol Qo'shish</span>
          </button>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedCat("ALL")}
          className={\`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer \${
            selectedCat === "ALL"
              ? "bg-green-700 text-white shadow-sm"
              : "bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }\`}
        >
          Barcha Fanlar ({questions.length})
        </button>
        {categories.map((cat) => {
          const count = questions.filter((q) => q.category === cat).length;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCat(cat)}
              className={\`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer \${
                selectedCat === cat
                  ? "bg-green-700 text-white shadow-sm"
                  : "bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }\`}
            >
              {cat} ({count})
            </button>
          );
        })}
      </div>

      {/* Questions List */}
      <div className="grid grid-cols-1 gap-4">
        {filtered.length === 0 ? (
          <div className="p-16 rounded-3xl bg-white border border-slate-200 text-center text-slate-400">
            Mos keluvchi savollar topilmadi.
          </div>
        ) : (
          filtered.map((q) => (
            <div
              key={q.id}
              className="p-5 rounded-3xl bg-white border border-slate-200 hover:border-slate-300 transition-all shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group"
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 font-bold text-xs text-slate-600 border border-slate-200">
                    ID: {q.id}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 font-bold text-xs border border-emerald-200">
                    {q.category}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-800 font-bold text-xs border border-blue-200 uppercase">
                    {q.type}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">• {q.topic}</span>
                </div>
                <p className="font-semibold text-slate-900 text-sm">{q.question}</p>
                {q.hint && <p className="text-xs text-slate-500 italic">💡 Maslahat: {q.hint}</p>}
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                <button
                  onClick={() => onEditQuestion(q)}
                  className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200 transition-colors cursor-pointer"
                  title="Tahrirlash"
                >
                  <Edit3 size={15} />
                </button>
                <button
                  onClick={() => {
                    if (confirm(\`ID \${q.id} savolini o'chirishni xohlaysizmi?\`)) {
                      onDeleteQuestion(q.id);
                    }
                  }}
                  className="p-2.5 rounded-xl bg-slate-50 hover:bg-rose-50 text-slate-700 hover:text-rose-600 border border-slate-200 transition-colors cursor-pointer"
                  title="O'chirish"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
`);

// 3. ExamConfigView.tsx (Comprehensive Light Mode Settings)
writeFile('src/components/ExamConfigView.tsx', `
import React, { useState } from "react";
import {
  Settings,
  Clock,
  Save,
  ShieldAlert,
  Shuffle,
  Maximize,
  CheckCircle2,
} from "lucide-react";
import type { Category, ExamSettings, Question } from "../types";

type ExamConfigViewProps = {
  settings: ExamSettings;
  questions?: Question[];
  onSaveSettings: (settings: ExamSettings) => Promise<void> | void;
};

export const ExamConfigView: React.FC<ExamConfigViewProps> = ({
  settings,
  questions = [],
  onSaveSettings,
}) => {
  const [counts, setCounts] = useState<Record<Category, number>>(settings.counts);
  const [duration, setDuration] = useState<number>(settings.durationMinutes || 60);
  const [maxViolations, setMaxViolations] = useState<number>(settings.maxViolations ?? 3);
  const [penalty, setPenalty] = useState<number>(settings.penaltyPerViolation ?? 1);
  const [enforceFullscreen, setEnforceFullscreen] = useState<boolean>(settings.enforceFullscreen ?? true);
  const [shuffleQuestions, setShuffleQuestions] = useState<boolean>(settings.shuffleQuestions ?? true);
  const [shuffleOptions, setShuffleOptions] = useState<boolean>(settings.shuffleOptions ?? true);

  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const categories: Category[] = ["HTML", "CSS", "JavaScript", "Python"];

  function getPoolCount(cat: Category): number {
    return questions.filter((q) => q.category === cat).length;
  }

  const totalQuestions = categories.reduce((sum, cat) => sum + (counts[cat] || 0), 0);

  function applyPreset(perCategory: number | "max") {
    const newCounts = {} as Record<Category, number>;
    for (const cat of categories) {
      const pool = getPoolCount(cat);
      if (perCategory === "max") {
        newCounts[cat] = pool > 0 ? pool : 30;
      } else {
        newCounts[cat] = pool > 0 ? Math.min(pool, perCategory) : perCategory;
      }
    }
    setCounts(newCounts);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSaveSettings({
        counts,
        durationMinutes: Math.max(5, Math.min(300, Number(duration))),
        maxViolations: Math.max(1, Math.min(10, Number(maxViolations))),
        penaltyPerViolation: Math.max(0, Math.min(10, Number(penalty))),
        enforceFullscreen,
        shuffleQuestions,
        shuffleOptions,
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3500);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-12">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-green-50 text-green-700 flex items-center justify-center border border-green-200 shrink-0">
            <Settings size={26} />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-lg">Umumiy Imtihon Sozlamalari</h3>
            <p className="text-xs text-slate-500">
              Guruhsiz to'g'ridan-to'g'ri topshiruvchi talabalar uchun asosiy imtihon parametrlari
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Bazada jami {questions.length} ta savol</span>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* 1. Savollar soni va taqsimoti */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Savollar Taqsimoti (Har bir bo'limdan)</h4>
              <p className="text-xs text-slate-500">Talabaga beriladigan savollar miqdori</p>
            </div>

            {/* Quick Presets */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Tezkor:</span>
              <button
                type="button"
                onClick={() => applyPreset("max")}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-green-50 hover:text-green-800 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors cursor-pointer"
              >
                Maksimal
              </button>
              <button
                type="button"
                onClick={() => applyPreset(30)}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-green-50 hover:text-green-800 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors cursor-pointer"
              >
                30 tadan (120 ta)
              </button>
              <button
                type="button"
                onClick={() => applyPreset(20)}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-green-50 hover:text-green-800 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors cursor-pointer"
              >
                20 tadan (80 ta)
              </button>
              <button
                type="button"
                onClick={() => applyPreset(15)}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-green-50 hover:text-green-800 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors cursor-pointer"
              >
                15 tadan (60 ta)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {categories.map((cat) => {
              const pool = getPoolCount(cat);
              const val = counts[cat] || 0;
              return (
                <div key={cat} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-800">{cat}</span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      Bazada: {pool > 0 ? \`\${pool} ta\` : "30 ta"}
                    </span>
                  </div>
                  <input
                    type="number"
                    min={0}
                    max={pool > 0 ? pool : 100}
                    value={val}
                    onChange={(e) => setCounts({ ...counts, [cat]: Number(e.target.value) })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-center text-xl font-bold text-slate-900 outline-none focus:border-green-600 shadow-sm"
                  />
                </div>
              );
            })}
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
            <span className="text-emerald-900 font-bold">Jami beriladigan savollar va umumiy ball:</span>
            <span className="text-emerald-900 font-black text-base">{totalQuestions} ta savol ({totalQuestions} ball)</span>
          </div>
        </div>

        {/* 2. Vaqt va Davomiylik */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Clock size={16} className="text-green-700" />
                Imtihon Davomiyligi
              </h4>
              <p className="text-xs text-slate-500">Talaba testni yechishi uchun beriladigan vaqt</p>
            </div>
            <div className="flex items-center gap-2">
              {[30, 45, 60, 90, 120].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setDuration(mins)}
                  className={\`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors cursor-pointer \${
                    duration === mins
                      ? "bg-green-700 text-white border-green-700"
                      : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                  }\`}
                >
                  {mins} daqiqa
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4 pt-2">
            <input
              type="range"
              min={10}
              max={180}
              step={5}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="flex-1 accent-green-700 cursor-pointer"
            />
            <div className="w-28 p-2 rounded-xl bg-slate-50 border border-slate-200 text-center font-bold text-sm text-slate-900">
              {duration} daqiqa
            </div>
          </div>
        </div>

        {/* 3. Xavfsizlik va Qoidabuzarlik Sozlamalari */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <ShieldAlert size={16} className="text-rose-600" />
              Imtihon Xavfsizligi va Nazorat Qoidalari
            </h4>
            <p className="text-xs text-slate-500">Anticheat va qoidabuzarlik cheklovlari</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <label className="block text-xs font-bold text-slate-800">
                Qoidabuzarliklar Limiti (Bloklash chegarasi)
              </label>
              <p className="text-[11px] text-slate-500">
                Nechta ogohlantirishdan keyin talaba butunlay bloklanadi
              </p>
              <input
                type="number"
                min={1}
                max={10}
                value={maxViolations}
                onChange={(e) => setMaxViolations(Number(e.target.value))}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-center text-base font-bold text-slate-900 outline-none focus:border-green-600"
              />
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <label className="block text-xs font-bold text-slate-800">
                Har bir qoidabuzarlik uchun jarima (ball)
              </label>
              <p className="text-[11px] text-slate-500">
                Ekrandan chiqqan har bir holat uchun natijadan ayiriladigan ball
              </p>
              <input
                type="number"
                min={0}
                max={5}
                value={penalty}
                onChange={(e) => setPenalty(Number(e.target.value))}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-center text-base font-bold text-slate-900 outline-none focus:border-green-600"
              />
            </div>
          </div>

          {/* Toggle Switches */}
          <div className="space-y-3 pt-2">
            <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer">
              <div className="flex items-center gap-3">
                <Maximize size={18} className="text-green-700" />
                <div>
                  <p className="text-xs font-bold text-slate-800">To'liq ekran rejimini majburlash</p>
                  <p className="text-[11px] text-slate-500">Talaba imtihon davomida faqat to'liq ekranda ishlashi shart</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={enforceFullscreen}
                onChange={(e) => setEnforceFullscreen(e.target.checked)}
                className="w-5 h-5 accent-green-700 rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer">
              <div className="flex items-center gap-3">
                <Shuffle size={18} className="text-purple-700" />
                <div>
                  <p className="text-xs font-bold text-slate-800">Savollar tartibini aralashtirish (Shuffle Questions)</p>
                  <p className="text-[11px] text-slate-500">Har bir talabaga savollar tasodifiy tartibda chiqadi</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={shuffleQuestions}
                onChange={(e) => setShuffleQuestions(e.target.checked)}
                className="w-5 h-5 accent-green-700 rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer">
              <div className="flex items-center gap-3">
                <Shuffle size={18} className="text-blue-700" />
                <div>
                  <p className="text-xs font-bold text-slate-800">Variantlar tartibini aralashtirish (Shuffle Options)</p>
                  <p className="text-[11px] text-slate-500">Test variantlari (A, B, C, D) har bir talabada turlicha joylashadi</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={shuffleOptions}
                onChange={(e) => setShuffleOptions(e.target.checked)}
                className="w-5 h-5 accent-green-700 rounded cursor-pointer"
              />
            </label>
          </div>
        </div>

        {/* Success Alert */}
        {savedSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-center gap-2 animate-fade-in shadow-sm">
            <CheckCircle2 size={18} className="text-emerald-700" />
            <span>Imtihon sozlamalari muvaffaqiyatli saqlandi va faollashtirildi!</span>
          </div>
        )}

        {/* Save Button */}
        <button
          type="submit"
          disabled={isSaving}
          className="w-full py-4 rounded-2xl bg-green-700 hover:bg-green-800 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <Save size={18} />
          <span>{isSaving ? "Saqlanmoqda..." : "Sozlamalarni Saqlash va Qo'llash"}</span>
        </button>
      </form>
    </div>
  );
};

`);

console.log('Light mode Question views generated.');
