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

// 1. CreateGroupModal.tsx
writeFile('src/components/CreateGroupModal.tsx', `
import React, { useState } from "react";
import { X, Save, Sparkles, Clock, Users } from "lucide-react";
import type { Category, ExamGroup } from "../types";

type CreateGroupModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (group: ExamGroup) => Promise<void>;
};

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  if (!isOpen) return null;

  const [groupName, setGroupName] = useState("");
  const [groupCode, setGroupCode] = useState(() => "GRP-" + Math.floor(1000 + Math.random() * 9000));
  const [maxStudents, setMaxStudents] = useState<number>(30);
  const [durationMinutes, setDurationMinutes] = useState<number>(60);
  const [counts, setCounts] = useState<Record<Category, number>>({
    HTML: 30,
    CSS: 30,
    JavaScript: 30,
    Python: 30,
  });
  const [isSaving, setIsSaving] = useState(false);

  const categories: Category[] = ["HTML", "CSS", "JavaScript", "Python"];
  const totalQuestions = categories.reduce((sum, cat) => sum + (counts[cat] || 0), 0);

  function generateRandomCode() {
    const prefixes = ["FE", "JS", "WEB", "GRP", "IT"];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const num = Math.floor(100 + Math.random() * 900);
    setGroupCode(\`\${prefix}-\${num}\`);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!groupName.trim() || !groupCode.trim()) return;

    setIsSaving(true);
    try {
      const newGroup: ExamGroup = {
        group_name: groupName.trim(),
        group_code: groupCode.trim().toUpperCase(),
        max_students: Math.max(1, Math.min(30, Number(maxStudents) || 30)),
        duration_minutes: Math.max(5, Math.min(300, Number(durationMinutes) || 60)),
        counts,
        is_active: true,
      };

      await onSave(newGroup);
      onClose();
    } catch (err) {
      console.error(err);
      alert("Guruhni saqlashda xatolik yuz berdi");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-slide-up">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Yangi Guruh Yaratish</h2>
            <p className="text-xs text-slate-500 mt-0.5">Imtihon sessiyasi va talabalar limiti sozlamalari</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-900 border border-slate-200 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1 text-sm text-slate-700">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Guruh Nomi</label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Masalan: Frontend 101, Kechki guruh..."
              required
              className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-green-600 rounded-xl px-3.5 py-2.5 text-slate-900 outline-none transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                <span>Guruh Kodi</span>
                <button
                  type="button"
                  onClick={generateRandomCode}
                  className="text-[11px] text-green-700 hover:text-green-800 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles size={12} /> Yangi kod
                </button>
              </label>
              <input
                type="text"
                value={groupCode}
                onChange={(e) => setGroupCode(e.target.value.toUpperCase())}
                placeholder="FE-101"
                required
                className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-green-600 rounded-xl px-3.5 py-2.5 text-slate-900 font-mono font-bold uppercase outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Users size={14} className="text-green-700" />
                <span>Talabalar Soni Limiti (1 - 30)</span>
              </label>
              <input
                type="number"
                min={1}
                max={30}
                value={maxStudents}
                onChange={(e) => setMaxStudents(Math.max(1, Math.min(30, Number(e.target.value))))}
                required
                className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-green-600 rounded-xl px-3.5 py-2.5 text-slate-900 font-bold text-center outline-none transition-colors"
              />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Clock size={15} className="text-green-700" />
                Imtihon Davomiyligi (daqiqa)
              </label>
              <input
                type="number"
                min={5}
                max={300}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-24 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-center text-sm font-bold text-slate-900 outline-none focus:border-green-600"
              />
            </div>
          </div>

          {/* Category Counts Breakdown */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
              Savollar Soni (Har bir bo'limdan)
            </label>
            <div className="grid grid-cols-2 gap-3">
              {categories.map((cat) => (
                <div key={cat} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700">{cat}</span>
                  <input
                    type="number"
                    min={0}
                    max={50}
                    value={counts[cat] || 0}
                    onChange={(e) => setCounts({ ...counts, [cat]: Number(e.target.value) })}
                    className="w-16 bg-white border border-slate-200 rounded-lg px-2 py-1 text-center text-sm font-bold text-slate-900 outline-none focus:border-green-600"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-green-50 border border-green-200 flex items-center justify-between text-xs">
            <span className="text-green-800 font-semibold">Jami savollar:</span>
            <span className="text-green-900 font-extrabold text-sm">{totalQuestions} ta savol ({totalQuestions} ball)</span>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
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
              <span>{isSaving ? "Yaratilmoqda..." : "Guruhni Yaratish"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
`);

// 2. GroupsView.tsx
writeFile('src/components/GroupsView.tsx', `
import React, { useState } from "react";
import {
  Plus,
  Search,
  Copy,
  Check,
  Power,
  Trash2,
  Users,
  Clock,
  ExternalLink,
  BookOpen,
} from "lucide-react";
import type { ExamGroup, ExamResult } from "../types";

type GroupsViewProps = {
  groups: ExamGroup[];
  results: ExamResult[];
  onAddGroup: () => void;
  onToggleGroupStatus: (groupCode: string, currentStatus: boolean) => Promise<void>;
  onDeleteGroup: (groupCode: string) => Promise<void>;
  onViewResultsForGroup: (groupCode: string) => void;
};

export const GroupsView: React.FC<GroupsViewProps> = ({
  groups,
  results,
  onAddGroup,
  onToggleGroupStatus,
  onDeleteGroup,
  onViewResultsForGroup,
}) => {
  const [search, setSearch] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const filtered = groups.filter((g) => {
    return (
      g.group_name.toLowerCase().includes(search.toLowerCase()) ||
      g.group_code.toLowerCase().includes(search.toLowerCase())
    );
  });

  function getStudentCount(groupCode: string): number {
    return results.filter((r) => (r.group_code || "").toUpperCase() === groupCode.toUpperCase()).length;
  }

  function copyGroupLink(code: string) {
    const studentUrl = \`http://localhost:5173/?group=\${code}\`;
    navigator.clipboard.writeText(studentUrl);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Stat Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Jami Guruhlar</span>
          <p className="text-3xl font-extrabold text-slate-900 mt-2">{groups.length}</p>
        </div>
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Faol Imtihonlar</span>
          <p className="text-3xl font-extrabold text-emerald-700 mt-2">
            {groups.filter((g) => g.is_active).length}
          </p>
        </div>
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Guruhlarda Topshirganlar</span>
          <p className="text-3xl font-extrabold text-blue-700 mt-2">
            {results.filter((r) => !!r.group_code).length} <span className="text-sm font-normal text-slate-400">talaba</span>
          </p>
        </div>
      </div>

      {/* Action Bar */}
      <div className="p-4 rounded-3xl bg-white border border-slate-200 flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
        <div className="relative w-full md:w-80">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Guruh nomi yoki kodini qidirish..."
            className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-green-600 rounded-2xl pl-11 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-colors"
          />
        </div>

        <button
          onClick={onAddGroup}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-green-700 hover:bg-green-800 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
        >
          <Plus size={16} />
          <span>Yangi Guruh Yaratish</span>
        </button>
      </div>

      {/* Groups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.length === 0 ? (
          <div className="col-span-full p-16 rounded-3xl bg-white border border-slate-200 text-center text-slate-400">
            Hozircha hech qanday guruh mavjud emas. Yangi guruh yarating!
          </div>
        ) : (
          filtered.map((g) => {
            const count = getStudentCount(g.group_code);
            const max = g.max_students || 30;
            const pct = Math.min(100, Math.round((count / max) * 100));
            const isCopied = copiedCode === g.group_code;
            const totalQ = Object.values(g.counts || {}).reduce((s, n) => s + (n || 0), 0);

            return (
              <div
                key={g.group_code}
                className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-5"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">{g.group_name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="px-2.5 py-0.5 rounded-md bg-purple-50 text-purple-800 font-mono font-extrabold text-xs border border-purple-200">
                          {g.group_code}
                        </span>
                        <span className={\`text-xs px-2 py-0.5 rounded-full font-bold border \${
                          g.is_active
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : "bg-slate-100 text-slate-600 border-slate-200"
                        }\`}>
                          {g.is_active ? "● Faol" : "○ Yopilgan"}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => onToggleGroupStatus(g.group_code, g.is_active)}
                      className={\`p-2 rounded-xl border transition-colors cursor-pointer \${
                        g.is_active
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200"
                          : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200"
                      }\`}
                      title={g.is_active ? "Imtihonni yopish (talaba kira olmaydi)" : "Imtihonni ochish (faollashtirish)"}
                    >
                      <Power size={15} />
                    </button>
                  </div>

                  {/* Student Capacity Progress Bar */}
                  <div className="mt-4 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium flex items-center gap-1">
                        <Users size={13} className="text-green-700" /> Talabalar sig'imi:
                      </span>
                      <span className="font-bold text-slate-900">
                        {count} / {max} talaba
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={\`h-full rounded-full transition-all \${
                          pct >= 100 ? "bg-rose-500" : pct >= 70 ? "bg-amber-500" : "bg-green-600"
                        }\`}
                        style={{ width: \`\${pct}%\` }}
                      />
                    </div>
                  </div>

                  {/* Specs Info */}
                  <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <Clock size={13} className="text-slate-400" />
                      <span>{g.duration_minutes} daqiqa</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <BookOpen size={13} className="text-slate-400" />
                      <span>{totalQ} ta savol</span>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="space-y-2 pt-2">
                  <button
                    onClick={() => copyGroupLink(g.group_code)}
                    className={\`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border transition-all cursor-pointer \${
                      isCopied
                        ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                        : "bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200"
                    }\`}
                  >
                    {isCopied ? <Check size={14} className="text-emerald-700" /> : <Copy size={14} />}
                    <span>{isCopied ? "Havola Nusxalandi! ✅" : "Talabalar Havolasini Nusxalash"}</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onViewResultsForGroup(g.group_code)}
                      className="flex-1 py-2 rounded-xl bg-green-50 hover:bg-green-100 text-green-800 border border-green-200 text-xs font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <ExternalLink size={13} />
                      <span>Natijalar ({count})</span>
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(\`"\${g.group_name}" guruhini o'chirishni xohlaysizmi?\`)) {
                          onDeleteGroup(g.group_code);
                        }
                      }}
                      className="p-2 rounded-xl bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 transition-colors cursor-pointer"
                      title="O'chirish"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
`);

console.log('Groups management views generated successfully.');
