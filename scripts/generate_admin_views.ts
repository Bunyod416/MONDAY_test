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
  console.log(`View Generated: ${relativePath}`);
}

// DashboardView.tsx in Crisp Light Theme
writeFile('src/components/DashboardView.tsx', `
import React from "react";
import {
  Users,
  Award,
  AlertTriangle,
  BookOpenCheck,
  TrendingUp,
  Clock,
  ArrowRight,
} from "lucide-react";
import type { ExamResult, Question, TabType } from "../types";

type DashboardViewProps = {
  results: ExamResult[];
  questions: Question[];
  setActiveTab: (tab: TabType) => void;
  onInspectStudent: (result: ExamResult) => void;
};

export const DashboardView: React.FC<DashboardViewProps> = ({
  results,
  questions,
  setActiveTab,
  onInspectStudent,
}) => {
  const totalSubmissions = results.length;
  const avgScore = totalSubmissions
    ? Math.round(results.reduce((s, r) => s + Number(r.score), 0) / totalSubmissions)
    : 0;
  const highestScore = totalSubmissions
    ? Math.max(...results.map((r) => Number(r.score)))
    : 0;
  const totalViolations = results.reduce((s, r) => s + (r.violation_count || 0), 0);

  const htmlCount = questions.filter((q) => q.category === "HTML").length;
  const cssCount = questions.filter((q) => q.category === "CSS").length;
  const jsCount = questions.filter((q) => q.category === "JavaScript").length;
  const pyCount = questions.filter((q) => q.category === "Python").length;

  const gradeA = results.filter((r) => Number(r.score) >= 86).length;
  const gradeB = results.filter((r) => Number(r.score) >= 71 && Number(r.score) < 86).length;
  const gradeC = results.filter((r) => Number(r.score) >= 56 && Number(r.score) < 71).length;
  const gradeF = results.filter((r) => Number(r.score) < 56).length;

  const recentResults = results.slice(0, 5);

  return (
    <div className="space-y-8">
      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Jami Topshirganlar</span>
            <div className="w-10 h-10 rounded-2xl bg-green-50 text-green-700 flex items-center justify-center border border-green-200">
              <Users size={20} />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-900 mt-4">{totalSubmissions}</p>
          <p className="text-xs text-slate-500 mt-1 font-medium">Bazada saqlangan talabalar</p>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">O'rtacha Natija</span>
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-200">
              <TrendingUp size={20} />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-900 mt-4">{avgScore} <span className="text-base font-medium text-slate-500">ball</span></p>
          <p className="text-xs text-slate-500 mt-1">Guruh bo'yicha o'rtacha ball</p>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Eng Yuqori Ball</span>
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200">
              <Award size={20} />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-900 mt-4">{highestScore} <span className="text-base font-medium text-slate-500">ball</span></p>
          <p className="text-xs text-slate-500 mt-1">Maksimal to'plangan natija</p>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Qoidabuzarliklar</span>
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-700 flex items-center justify-center border border-rose-200">
              <AlertTriangle size={20} />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-900 mt-4">{totalViolations}</p>
          <p className="text-xs text-slate-500 mt-1">Ekrandan chiqish holatlari</p>
        </div>
      </div>

      {/* 2-Row: Question Pool & Grade Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Questions Pool breakdown */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <BookOpenCheck size={20} className="text-green-700" />
              Savollar Banki ({questions.length})
            </h3>
            <button
              onClick={() => setActiveTab("questions")}
              className="text-xs font-semibold text-green-700 hover:text-green-800 flex items-center gap-1 cursor-pointer"
            >
              Boshqarish <ArrowRight size={14} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-4 rounded-2xl bg-orange-50/70 border border-orange-100">
              <p className="text-xs text-orange-800 font-bold">HTML</p>
              <p className="text-2xl font-bold text-orange-950 mt-1">{htmlCount}</p>
            </div>
            <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-100">
              <p className="text-xs text-blue-800 font-bold">CSS</p>
              <p className="text-2xl font-bold text-blue-950 mt-1">{cssCount}</p>
            </div>
            <div className="p-4 rounded-2xl bg-yellow-50/70 border border-yellow-100">
              <p className="text-xs text-yellow-800 font-bold">JavaScript</p>
              <p className="text-2xl font-bold text-yellow-950 mt-1">{jsCount}</p>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100">
              <p className="text-xs text-emerald-800 font-bold">Python</p>
              <p className="text-2xl font-bold text-emerald-950 mt-1">{pyCount}</p>
            </div>
          </div>
        </div>

        {/* Grade distribution */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-base">Natijalar Taqsimoti (Baholar)</h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
              <span className="text-xs font-bold text-emerald-800">A'lo (86 - 100)</span>
              <p className="text-2xl font-extrabold text-emerald-950 mt-2">{gradeA} <span className="text-xs font-normal text-slate-500">talaba</span></p>
            </div>
            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200">
              <span className="text-xs font-bold text-blue-800">Yaxshi (71 - 85)</span>
              <p className="text-2xl font-extrabold text-blue-950 mt-2">{gradeB} <span className="text-xs font-normal text-slate-500">talaba</span></p>
            </div>
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
              <span className="text-xs font-bold text-amber-800">Qoniqarli (56 - 70)</span>
              <p className="text-2xl font-extrabold text-amber-950 mt-2">{gradeC} <span className="text-xs font-normal text-slate-500">talaba</span></p>
            </div>
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200">
              <span className="text-xs font-bold text-rose-800">Qoniqarsiz (&lt;56)</span>
              <p className="text-2xl font-extrabold text-rose-950 mt-2">{gradeF} <span className="text-xs font-normal text-slate-500">talaba</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* 3-Row: Recent submissions */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Oxirgi Topshirgan Talabalar</h3>
            <p className="text-xs text-slate-500">Eng so'nggi natijalar ro'yxati</p>
          </div>
          <button
            onClick={() => setActiveTab("results")}
            className="px-4 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-green-800 flex items-center gap-1.5 transition-colors border border-slate-200 cursor-pointer"
          >
            Barchasini ko'rish <ArrowRight size={14} />
          </button>
        </div>

        {recentResults.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            Hozircha hech qanday natija mavjud emas.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentResults.map((result) => {
              const score = Number(result.score);
              const total = Number(result.total_points) || 120;
              const pct = Math.round((score / total) * 100);
              const isPass = pct >= 60;

              return (
                <div
                  key={result.id}
                  className="py-4 flex items-center justify-between hover:bg-slate-50 px-3 rounded-2xl transition-colors cursor-pointer"
                  onClick={() => onInspectStudent(result)}
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-2xl bg-green-100 text-green-800 flex items-center justify-center font-bold text-sm border border-green-200">
                      {result.student_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 text-sm">{result.student_name}</p>
                      <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                        <Clock size={12} />
                        {new Date(result.submitted_at || result.created_at).toLocaleString("uz-UZ")}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {result.violation_count > 0 && (
                      <span className="px-2.5 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-1">
                        <AlertTriangle size={12} />
                        {result.violation_count} ta qoidabuzarlik
                      </span>
                    )}

                    <div className="text-right">
                      <p className={\`text-base font-extrabold \${isPass ? "text-emerald-600" : "text-rose-600"}\`}>
                        {score} / {total}
                      </p>
                      <p className="text-[11px] text-slate-500 font-medium">{pct}%</p>
                    </div>

                    <button className="px-3.5 py-1.5 rounded-xl bg-green-50 hover:bg-green-100 text-green-800 border border-green-200 text-xs font-semibold transition-colors cursor-pointer">
                      Ko'rish
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
`);

console.log('DashboardView updated for light mode.');
