const fs = require("fs");
const path = require("path");

const adminRoot = path.resolve(__dirname, "../../MONDAY_admin");

// 1. Upgrade ResultsView.tsx with Beautiful Animated Delete Modal
const resultsViewPath = path.join(adminRoot, "src", "components", "ResultsView.tsx");
if (fs.existsSync(resultsViewPath)) {
  const newResultsView = `import React, { useState } from "react";
import {
  Search,
  Download,
  AlertTriangle,
  Clock,
  Eye,
  Trash2,
  CheckCircle,
  X,
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

  // State for animated delete confirmation modal
  const [itemToDelete, setItemToDelete] = useState<ExamResult | null>(null);

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
        const rGroup = (r.group_code || r.answers?._meta?.group_code || "").toString().toUpperCase();
        groupMatches = rGroup === filterGroup.toUpperCase();
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
    const rows = filtered.map((r) => {
      const score = Number(r.score);
      const total = Number(r.total_points) || 120;
      const pct = Math.round((score / total) * 100);
      const grp = r.group_code || r.answers?._meta?.group_code || "Umumiy";
      const time = new Date(r.submitted_at || r.created_at).toLocaleString("uz-UZ");
      return [r.id, \`"\${r.student_name}"\`, \`"\${grp}"\`, score, total, \`"\${pct}%"\`, r.violation_count || 0, \`"\${time}"\`].join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows].join("\\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", \`imtihon_natijalari_\${new Date().toISOString().slice(0, 10)}.csv\`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function handleConfirmDelete() {
    if (itemToDelete) {
      onDeleteResult(itemToDelete.id);
      setItemToDelete(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Filters and Search Bar */}
      <div className="p-4 rounded-3xl bg-white border border-slate-200 flex flex-col lg:flex-row gap-4 items-center justify-between shadow-sm">
        <div className="relative w-full lg:w-96">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Talaba ismi bo'yicha qidirish..."
            className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-green-600 rounded-2xl pl-11 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-end">
          {/* Group Filter */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-3 py-1.5 text-xs text-slate-700">
            <span>Guruh:</span>
            <select
              value={filterGroup}
              onChange={(e) => setFilterGroup(e.target.value)}
              className="bg-transparent text-slate-800 outline-none cursor-pointer font-bold"
            >
              <option value="all">Barcha guruhlar</option>
              {groups.map((g) => (
                <option key={g.group_code} value={g.group_code}>
                  {g.group_name} ({g.group_code})
                </option>
              ))}
            </select>
          </div>

          {/* Grade Filter */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-3 py-1.5 text-xs text-slate-700">
            <span>Baho:</span>
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

          {/* Sorting */}
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
                  const grp = r.group_code || r.answers?._meta?.group_code;

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
                        {grp ? (
                          <span className="px-2.5 py-0.5 rounded-md bg-purple-50 text-purple-800 font-mono font-bold text-xs border border-purple-200">
                            {grp}
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
                            onClick={() => setItemToDelete(r)}
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

      {/* ────────────────────────────────────────────────────────
          BEAUTIFUL ANIMATED DELETE CONFIRMATION MODAL
      ──────────────────────────────────────────────────────── */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 transform transition-all animate-scale-up space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200">
                <Trash2 size={24} />
              </div>
              <button
                onClick={() => setItemToDelete(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X size={18} />
              </button>
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Natijani o'chirishni xohlaysizmi?
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Ushbu amalni ortga qaytarib bo'lmaydi. Talabaning to'plagan bali va barcha javoblari bazadan butunlay o'chiriladi.
              </p>
            </div>

            {/* Student Preview Box */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 text-sm">{itemToDelete.student_name}</span>
                <span className="font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                  {itemToDelete.score} / {itemToDelete.total_points} ball
                </span>
              </div>
              <div className="text-slate-500 flex items-center gap-2">
                <span>Guruh: {itemToDelete.group_code || itemToDelete.answers?._meta?.group_code || "Umumiy"}</span>
                <span>•</span>
                <span>{new Date(itemToDelete.submitted_at || itemToDelete.created_at).toLocaleString("uz-UZ")}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="flex-1 py-3 rounded-2xl border border-slate-200 font-bold text-xs text-slate-700 hover:bg-slate-50 transition"
              >
                Bekor Qilish
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md hover:shadow-lg transition flex items-center justify-center gap-1.5"
              >
                <Trash2 size={15} />
                <span>Ha, O'chirilsin</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
`;

  fs.writeFileSync(resultsViewPath, newResultsView, "utf8");
  console.log("✅ Beautiful Delete Modal installed in MONDAY_admin/src/components/ResultsView.tsx");
}

// 2. Upgrade GroupsView.tsx with Beautiful Animated Delete Modal
const groupsViewPath = path.join(adminRoot, "src", "components", "GroupsView.tsx");
if (fs.existsSync(groupsViewPath)) {
  let gvContent = fs.readFileSync(groupsViewPath, "utf8");
  // Replace window.confirm in GroupsView with custom modal
  gvContent = gvContent.replace(
    'const [copiedCode, setCopiedCode] = useState<string | null>(null);',
    'const [copiedCode, setCopiedCode] = useState<string | null>(null);\n  const [groupToDelete, setGroupToDelete] = useState<ExamGroup | null>(null);'
  );
  gvContent = gvContent.replace(
    /onClick=\{\(\) => \{\s*if \(confirm\(`"\$\{g\.group_name\}" guruhini o'chirishni xohlaysizmi\?`\)\) \{\s*onDeleteGroup\(g\.group_code\);\s*\}\s*\}\}/g,
    'onClick={() => setGroupToDelete(g)}'
  );

  // Add the modal JSX right before the last closing </div>
  const modalJsx = `
      {/* ────────────────────────────────────────────────────────
          BEAUTIFUL ANIMATED DELETE CONFIRMATION MODAL FOR GROUPS
      ──────────────────────────────────────────────────────── */}
      {groupToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 transform transition-all animate-scale-up space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200">
                <Trash2 size={24} />
              </div>
              <button
                onClick={() => setGroupToDelete(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X size={18} />
              </button>
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Guruhni o'chirishni xohlaysizmi?
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Ushbu guruh bazadan butunlay o'chiriladi. Talabalar ushbu guruh kodi orqali imtihonga kira olmaydilar.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 text-sm">{groupToDelete.group_name}</span>
                <span className="font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                  {groupToDelete.group_code}
                </span>
              </div>
              <p className="text-slate-500">{groupToDelete.duration_minutes} daqiqa • {groupToDelete.max_students} talaba sig'imi</p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setGroupToDelete(null)}
                className="flex-1 py-3 rounded-2xl border border-slate-200 font-bold text-xs text-slate-700 hover:bg-slate-50 transition"
              >
                Bekor Qilish
              </button>
              <button
                type="button"
                onClick={() => {
                  if (groupToDelete) {
                    onDeleteGroup(groupToDelete.group_code);
                    setGroupToDelete(null);
                  }
                }}
                className="flex-1 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md hover:shadow-lg transition flex items-center justify-center gap-1.5"
              >
                <Trash2 size={15} />
                <span>Ha, O'chirilsin</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
`;

  gvContent = gvContent.replace(/<\/div>\s*\);\s*};\s*$/, modalJsx);
  fs.writeFileSync(groupsViewPath, gvContent, "utf8");
  console.log("✅ Beautiful Delete Modal installed in MONDAY_admin/src/components/GroupsView.tsx");
}
