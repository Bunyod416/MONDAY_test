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

// ResultsView.tsx in Crisp Light Theme with Group filtering
writeFile('src/components/ResultsView.tsx', `
import React, { useState } from "react";
import {
  Search,
  Filter,
  Download,
  AlertTriangle,
  Clock,
  Eye,
  Trash2,
  CheckCircle,
  FolderKanban,
} from "lucide-react";
import type { ExamResult, ExamGroup } from "../types";

type ResultsViewProps = {
  results: ExamResult[];
  groups?: ExamGroup[];
  selectedGroupFilter?: string;
  onInspectStudent: (result: ExamResult) => void;
  onDeleteResult: (id: number) => void;
};

export const ResultsView: React.FC<ResultsViewProps> = ({
  results,
  groups = [],
  selectedGroupFilter = "all",
  onInspectStudent,
  onDeleteResult,
}) => {
  const [search, setSearch] = useState("");
  const [filterScore, setFilterScore] = useState<string>("all");
  const [filterGroup, setFilterGroup] = useState<string>(selectedGroupFilter);
  const [sortBy, setSortBy] = useState<"time" | "score" | "violations">("time");

  const filtered = results
    .filter((r) => {
      const nameMatches = r.student_name.toLowerCase().includes(search.toLowerCase());
      const score = Number(r.score);
      let scoreMatches = true;

      if (filterScore === "a") scoreMatches = score >= 86;
      else if (filterScore === "b") scoreMatches = score >= 71 && score < 86;
      else if (filterScore === "c") scoreMatches = score >= 56 && score < 71;
      else if (filterScore === "f") scoreMatches = score < 56;
      else if (filterScore === "violations") scoreMatches = (r.violation_count || 0) > 0;

      let groupMatches = true;
      if (filterGroup !== "all") {
        groupMatches = (r.group_code || "").toUpperCase() === filterGroup.toUpperCase();
      }

      return nameMatches && scoreMatches && groupMatches;
    })
    .sort((a, b) => {
      if (sortBy === "score") return Number(b.score) - Number(a.score);
      if (sortBy === "violations") return (b.violation_count || 0) - (a.violation_count || 0);
      return new Date(b.submitted_at || b.created_at).getTime() - new Date(a.submitted_at || a.created_at).getTime();
    });

  function exportCSV() {
    if (results.length === 0) return;
    const headers = ["ID", "Talaba Ismi", "Guruh Kodi", "Ball", "Jami Ball", "Foiz", "Qoidabuzarlik", "Topshirilgan Vaqt"];
    const rows = filtered.map((r) => [
      r.id,
      \`"\${r.student_name.replace(/"/g, '""')}"\`,
      \`"\${r.group_code || 'Umumiy'}"\`,
      r.score,
      r.total_points || 120,
      \`\${Math.round((Number(r.score) / (Number(r.total_points) || 120)) * 100)}%\`,
      r.violation_count || 0,
      \`"\${new Date(r.submitted_at || r.created_at).toLocaleString("uz-UZ")}"\`,
    ]);

    const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join("\\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = \`imtihon_natijalari_\${filterGroup !== 'all' ? filterGroup + '_' : ''}\${new Date().toISOString().slice(0, 10)}.csv\`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters Bar */}
      <div className="p-4 rounded-3xl bg-white border border-slate-200 flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
        <div className="relative w-full md:w-80">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Talaba ismini qidirish..."
            className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-green-600 rounded-2xl pl-11 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-colors"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
          {/* Group Filter Dropdown */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-3 py-1.5 text-xs text-slate-700">
            <FolderKanban size={14} className="text-purple-700" />
            <select
              value={filterGroup}
              onChange={(e) => setFilterGroup(e.target.value)}
              className="bg-transparent text-slate-800 outline-none cursor-pointer font-semibold"
            >
              <option value="all">Barcha Guruhlar</option>
              {groups.map((g) => (
                <option key={g.group_code} value={g.group_code}>
                  {g.group_name} ({g.group_code})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-3 py-1.5 text-xs text-slate-700">
            <Filter size={14} className="text-slate-400" />
            <select
              value={filterScore}
              onChange={(e) => setFilterScore(e.target.value)}
              className="bg-transparent text-slate-800 outline-none cursor-pointer font-medium"
            >
              <option value="all">Barcha baholar</option>
              <option value="a">A'lo (86 - 100)</option>
              <option value="b">Yaxshi (71 - 85)</option>
              <option value="c">Qoniqarli (56 - 70)</option>
              <option value="f">Qoniqarsiz (&lt;56)</option>
              <option value="violations">Qoidabuzarlar</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-3 py-1.5 text-xs text-slate-700">
            <span>Saralash:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-slate-900 outline-none cursor-pointer font-semibold"
            >
              <option value="time">Vaqt (Eng yangilar)</option>
              <option value="score">Ball (Yuqoridan)</option>
              <option value="violations">Qoidabuzarliklar</option>
            </select>
          </div>

          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-green-700 hover:bg-green-800 text-white text-xs font-bold transition-colors shadow-sm cursor-pointer"
          >
            <Download size={14} />
            <span>Excel / CSV</span>
          </button>
        </div>
      </div>

      {/* Results Table */}
      <div className="rounded-3xl bg-white border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-bold border-b border-slate-200 tracking-wider">
              <tr>
                <th className="px-6 py-4">#</th>
                <th className="px-6 py-4">Talaba Ismi</th>
                <th className="px-6 py-4">Guruh</th>
                <th className="px-6 py-4">To'plagan Ball</th>
                <th className="px-6 py-4">Foiz</th>
                <th className="px-6 py-4">Qoidabuzarlik</th>
                <th className="px-6 py-4">Topshirilgan Vaqt</th>
                <th className="px-6 py-4 text-right">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400 text-sm">
                    Qidiruvga mos natijalar topilmadi.
                  </td>
                </tr>
              ) : (
                filtered.map((r, idx) => {
                  const score = Number(r.score);
                  const total = Number(r.total_points) || 120;
                  const pct = Math.round((score / total) * 100);
                  const isPass = pct >= 60;

                  return (
                    <tr
                      key={r.id}
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                      onClick={() => onInspectStudent(r)}
                    >
                      <td className="px-6 py-4 text-xs font-bold text-slate-400">{idx + 1}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-green-50 text-green-800 flex items-center justify-center font-bold text-sm border border-green-200">
                            {r.student_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 group-hover:text-green-700 transition-colors">{r.student_name}</p>
                            <p className="text-xs text-slate-400">ID: {r.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {r.group_code ? (
                          <span className="px-2.5 py-0.5 rounded-md bg-purple-50 text-purple-800 font-mono font-bold text-xs border border-purple-200">
                            {r.group_code}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Umumiy</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={\`text-base font-extrabold \${isPass ? "text-emerald-700" : "text-rose-600"}\`}>
                          {score}
                        </span>
                        <span className="text-xs text-slate-400"> / {total}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={\`px-2.5 py-1 rounded-full text-xs font-bold border \${
                          pct >= 86
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : pct >= 71
                            ? "bg-blue-50 text-blue-800 border-blue-200"
                            : pct >= 56
                            ? "bg-amber-50 text-amber-800 border-amber-200"
                            : "bg-rose-50 text-rose-800 border-rose-200"
                        }\`}>
                          {pct}%
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {r.violation_count > 0 ? (
                          <span className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold flex items-center gap-1.5 w-fit">
                            <AlertTriangle size={13} />
                            {r.violation_count} ta
                          </span>
                        ) : (
                          <span className="text-xs text-emerald-700 font-medium flex items-center gap-1">
                            <CheckCircle size={13} /> 0 ta
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <Clock size={13} />
                          {new Date(r.submitted_at || r.created_at).toLocaleString("uz-UZ")}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => onInspectStudent(r)}
                            className="p-2 rounded-xl bg-slate-100 hover:bg-green-50 text-slate-600 hover:text-green-700 border border-slate-200 transition-colors cursor-pointer"
                            title="Batafsil ko'rish"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(\`"\${r.student_name}" natijasini o'chirishni xohlaysizmi?\`)) {
                                onDeleteResult(r.id);
                              }
                            }}
                            className="p-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 transition-colors cursor-pointer"
                            title="O'chirish"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
`);

console.log('ResultsView updated with Group column and filter.');
