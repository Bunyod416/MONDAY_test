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

// StudentDetailModal.tsx in Crisp Light Theme
writeFile('src/components/StudentDetailModal.tsx', `
import React, { useState } from "react";
import {
  X,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import type { ExamResult, Question, Category } from "../types";
import { matchWithNearMiss, langForCategory } from "../utils/answerMatch";

type StudentDetailModalProps = {
  result: ExamResult | null;
  questions: Question[];
  onClose: () => void;
};

export const StudentDetailModal: React.FC<StudentDetailModalProps> = ({
  result,
  questions,
  onClose,
}) => {
  if (!result) return null;

  const [selectedCat, setSelectedCat] = useState<Category | "ALL">("ALL");

  const categories: Category[] = ["HTML", "CSS", "JavaScript", "Python"];
  const score = Number(result.score);
  const total = Number(result.total_points) || 120;
  const pct = Math.round((score / total) * 100);

  const allQuestionIds = Object.values(result.category_order || {}).flat();

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-slide-up">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-green-700 text-white flex items-center justify-center font-black text-xl shadow-md">
              {result.student_name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                {result.student_name}
                <span className={\`text-xs px-2.5 py-0.5 rounded-full font-bold border \${
                  pct >= 86
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : pct >= 71
                    ? "bg-blue-50 text-blue-800 border-blue-200"
                    : pct >= 56
                    ? "bg-amber-50 text-amber-800 border-amber-200"
                    : "bg-rose-50 text-rose-800 border-rose-200"
                }\`}>
                  {pct}% natija
                </span>
              </h2>
              <p className="text-xs text-slate-500 flex items-center gap-3 mt-1">
                <span className="flex items-center gap-1"><Clock size={12} /> {new Date(result.submitted_at || result.created_at).toLocaleString("uz-UZ")}</span>
                <span>•</span>
                <span>Vaqt: {result.duration_minutes || 60} daqiqa</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-900 border border-slate-200 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Stats Row */}
        <div className="p-6 bg-slate-50 border-b border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-slate-500">To'plangan Ball</span>
            <p className="text-2xl font-black text-emerald-700 mt-1">{score} <span className="text-sm font-normal text-slate-400">/ {total}</span></p>
          </div>
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-slate-500">Ko'rsatkich (Foiz)</span>
            <p className="text-2xl font-black text-slate-900 mt-1">{pct}%</p>
          </div>
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-slate-500">Qoidabuzarliklar</span>
            <p className={\`text-2xl font-black mt-1 \${result.violation_count > 0 ? "text-rose-600" : "text-slate-600"}\`}>
              {result.violation_count || 0} ta
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-slate-500">Jarima Bali</span>
            <p className="text-2xl font-black text-amber-700 mt-1">-{result.violation_count || 0}</p>
          </div>
        </div>

        {/* Category Tabs Filter */}
        <div className="px-6 py-3 border-b border-slate-200 flex gap-2 overflow-x-auto bg-white">
          <button
            onClick={() => setSelectedCat("ALL")}
            className={\`px-4 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer \${
              selectedCat === "ALL"
                ? "bg-green-700 text-white"
                : "bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200"
            }\`}
          >
            Barcha Savollar ({allQuestionIds.length || questions.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCat(cat)}
              className={\`px-4 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer \${
                selectedCat === cat
                  ? "bg-green-700 text-white"
                  : "bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200"
              }\`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Detailed Questions Breakdown List */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 bg-slate-50">
          {questions
            .filter((q) => selectedCat === "ALL" || q.category === selectedCat)
            .map((q, idx) => {
              const ans = result.answers?.[q.id] || result.answers?.[String(q.id)];
              let isCorrect = false;
              let studentAnswerText = "Javob berilmagan";
              let correctAnswerText = "—";

              if (q.type === "mcq") {
                const correctIdx = q.answer.charCodeAt(0) - 65;
                isCorrect = ans?.type === "mcq" && ans.selected === correctIdx;
                studentAnswerText =
                  ans?.type === "mcq" && ans.selected !== null && ans.selected !== undefined
                    ? \`\${String.fromCharCode(65 + ans.selected)}) \${q.options[ans.selected]}\`
                    : "Javob berilmadi";
                correctAnswerText = \`\${q.answer}) \${q.options[correctIdx]}\`;
              } else if (q.type === "truefalse") {
                isCorrect = ans?.type === "truefalse" && ans.selected === q.answer;
                studentAnswerText =
                  ans?.type === "truefalse" && ans.selected !== null
                    ? ans.selected ? "To'g'ri (True)" : "Noto'g'ri (False)"
                    : "Javob berilmadi";
                correctAnswerText = q.answer ? "To'g'ri (True)" : "Noto'g'ri (False)";
              } else if (q.type === "code" || q.type === "fix") {
                const val = ans?.type === q.type ? ans.value : "";
                const match = matchWithNearMiss(val, q.accepted, langForCategory(q.category));
                isCorrect = match.status === "correct";
                studentAnswerText = val || "Javob berilmadi";
                correctAnswerText = q.accepted.join("  YOKI  ");
              } else if (q.type === "drag") {
                const correctOrder = q.correctOrder.map((t) => q.tokens.indexOf(t));
                isCorrect = ans?.type === "dragdrop" && JSON.stringify(ans.order) === JSON.stringify(correctOrder);
                studentAnswerText = ans?.type === "dragdrop" ? ans.order.map((i) => q.tokens[i]).join(" → ") : "Javob berilmadi";
                correctAnswerText = q.correctOrder.join(" → ");
              }

              return (
                <div
                  key={q.id}
                  className={\`p-5 rounded-2xl border transition-all bg-white shadow-sm \${
                    isCorrect
                      ? "border-emerald-200"
                      : "border-rose-200"
                  }\`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-2.5">
                      <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center border border-slate-200">
                        {idx + 1}
                      </span>
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        {q.category} • {q.type.toUpperCase()}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={\`px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 \${
                        isCorrect ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-rose-50 text-rose-800 border border-rose-200"
                      }\`}>
                        {isCorrect ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                        {isCorrect ? \`+\${q.points} ball\` : "0 ball"}
                      </span>
                    </div>
                  </div>

                  <p className="font-semibold text-slate-900 text-sm mt-3">{q.question}</p>

                  {/* Code / Fix Broken Code Preview */}
                  {q.type === "fix" && (
                    <div className="mt-3 p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-xs font-mono text-amber-900">
                      <span className="text-amber-700 block mb-1 text-[11px] font-sans font-semibold">Berilgan xato kod:</span>
                      <pre className="whitespace-pre-wrap">{q.brokenCode}</pre>
                    </div>
                  )}

                  {/* Student Answer vs Correct Answer Box */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 pt-3 border-t border-slate-100 text-xs">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-slate-500 font-semibold block mb-1">Talabaning Javobi:</span>
                      <pre className={\`font-mono whitespace-pre-wrap font-semibold \${isCorrect ? "text-emerald-700" : "text-rose-600"}\`}>
                        {studentAnswerText}
                      </pre>
                    </div>

                    <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200">
                      <span className="text-emerald-800 font-semibold block mb-1">To'g'ri Javob:</span>
                      <pre className="font-mono whitespace-pre-wrap text-emerald-900 font-semibold">
                        {correctAnswerText}
                      </pre>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};
`);

console.log('StudentDetailModal updated for light mode.');
