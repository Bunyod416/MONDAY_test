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

import './generate_admin_app';
import './generate_all_admin_code';
import './generate_admin_components';
import './generate_admin_groups';
import './generate_admin_inspect_crud';
import './generate_admin_modals_crud';
import './generate_admin_views';
import './generate_admin_questions_app';

// Write App.tsx in Light Mode with Full Supabase Realtime Subscriptions
writeFile('src/App.tsx', `
import { useState, useEffect } from "react";
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import { DashboardView } from "./components/DashboardView";
import { GroupsView } from "./components/GroupsView";
import { CreateGroupModal } from "./components/CreateGroupModal";
import { ResultsView } from "./components/ResultsView";
import { StudentDetailModal } from "./components/StudentDetailModal";
import { QuestionsView } from "./components/QuestionsView";
import { QuestionModal } from "./components/QuestionModal";
import { ExamConfigView } from "./components/ExamConfigView";
import { supabase } from "./lib/supabase";
import type { ExamResult, Question, TabType, ExamSettings, ExamGroup } from "./types";
import { Bell } from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [results, setResults] = useState<ExamResult[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [groups, setGroups] = useState<ExamGroup[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);

  // Realtime Live Toast Notification
  const [realtimeNotification, setRealtimeNotification] = useState<string | null>(null);

  // Group Filter for Results
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>("all");

  // Inspector Modal
  const [inspectingResult, setInspectingResult] = useState<ExamResult | null>(null);

  // Question CRUD Modal
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  // Group Create Modal
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);

  // Settings
  const [settings, setSettings] = useState<ExamSettings>(() => {
    const saved = localStorage.getItem("monday_exam_settings");
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return {
      counts: { HTML: 30, CSS: 30, JavaScript: 30, Python: 30 },
      durationMinutes: 60,
      maxViolations: 3,
      penaltyPerViolation: 1,
      enforceFullscreen: true,
      shuffleQuestions: true,
      shuffleOptions: true,
    };
  });

  function showNotification(msg: string) {
    setRealtimeNotification(msg);
    setTimeout(() => setRealtimeNotification(null), 4000);
  }

  async function loadData() {
    setIsRefreshing(true);
    try {
      // 1. Fetch results
      const { data: resultsData, error: resultsError } = await supabase
        .from("results")
        .select("*")
        .order("id", { ascending: false });

      if (!resultsError && resultsData) {
        const parsedResults = resultsData.map((r: any): ExamResult => ({
          ...r,
          group_code: r.group_code || (r.answers as any)?._meta?.group_code || undefined,
        }));
        setResults(parsedResults);
      }

      // 2. Fetch questions
      const { data: questionsData, error: questionsError } = await supabase
        .from("questions")
        .select("*")
        .order("id", { ascending: true });

      if (!questionsError && questionsData) {
        setQuestions(
          questionsData.map((row: any): Question => {
            let answerVal = row.answer;
            if (row.type === "truefalse") {
              answerVal = row.answer === "true" || row.answer === true;
            }
            return {
              id: Number(row.id),
              type: row.type,
              category: row.category,
              topic: row.topic,
              question: row.question,
              options: row.options || undefined,
              answer: answerVal,
              hint: row.hint || "",
              points: Number(row.points) || 1,
              placeholder: row.placeholder || undefined,
              accepted: row.accepted || undefined,
              tokens: row.tokens || undefined,
              correctOrder: row.correct_order || row.correctOrder || undefined,
              brokenCode: row.broken_code || row.brokenCode || undefined,
            } as Question;
          })
        );
      }

      // 3. Fetch groups
      const { data: groupsData, error: groupsError } = await supabase
        .from("exam_groups")
        .select("*")
        .order("created_at", { ascending: false });

      if (!groupsError && groupsData) {
        const parsed = groupsData.map((g: any) => ({
          id: g.id,
          group_name: g.group_name,
          group_code: g.group_code,
          counts: typeof g.counts === "string" ? JSON.parse(g.counts) : g.counts,
          duration_minutes: Number(g.duration_minutes) || 60,
          max_students: Number(g.max_students) || 30,
          is_active: g.is_active !== false,
          created_at: g.created_at,
        }));
        setGroups(parsed);
        localStorage.setItem("monday_exam_groups_cache", JSON.stringify(parsed));
      } else {
        const cached = localStorage.getItem("monday_exam_groups_cache");
        if (cached) setGroups(JSON.parse(cached));
      }

      // 4. Fetch settings
      const { data: settingsData } = await supabase
        .from("exam_settings")
        .select("*")
        .eq("id", 1)
        .maybeSingle();

      if (settingsData) {
        const loadedSettings: ExamSettings = {
          counts: typeof settingsData.counts === "string" ? JSON.parse(settingsData.counts) : settingsData.counts,
          durationMinutes: Number(settingsData.duration_minutes) || 60,
          maxViolations: Number(settingsData.max_violations) || 3,
          penaltyPerViolation: Number(settingsData.penalty_per_violation) || 1,
          enforceFullscreen: settingsData.enforce_fullscreen !== false,
          shuffleQuestions: settingsData.shuffle_questions !== false,
          shuffleOptions: settingsData.shuffle_options !== false,
        };
        setSettings(loadedSettings);
        localStorage.setItem("monday_exam_settings", JSON.stringify(loadedSettings));
      }
    } catch (err) {
      console.error("Data load failed:", err);
    } finally {
      setIsRefreshing(false);
    }
  }

  // Initial Load and Supabase Realtime Channels
  useEffect(() => {
    loadData();

    // ⚡ 1. Realtime channel for RESULTS
    const resultsChannel = supabase
      .channel("admin_realtime_results")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "results" },
        (payload) => {
          const raw = payload.new as any;
          const newResult: ExamResult = {
            ...raw,
            group_code: raw.group_code || (raw.answers as any)?._meta?.group_code || undefined,
          };
          setResults((prev) => {
            if (prev.some((r) => r.id === newResult.id)) return prev;
            return [newResult, ...prev];
          });
          showNotification(\`🎉 Yangi natija: \${newResult.student_name} (\${newResult.score} ball)\`);
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "results" },
        (payload) => {
          const deletedId = (payload.old as any)?.id;
          if (deletedId) {
            setResults((prev) => prev.filter((r) => r.id !== deletedId));
          }
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setIsRealtimeConnected(true);
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          setIsRealtimeConnected(false);
        }
      });

    // ⚡ 2. Realtime channel for EXAM_GROUPS
    const groupsChannel = supabase
      .channel("admin_realtime_groups")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "exam_groups" },
        async () => {
          const { data } = await supabase.from("exam_groups").select("*").order("created_at", { ascending: false });
          if (data) {
            const parsed = data.map((g: any) => ({
              id: g.id,
              group_name: g.group_name,
              group_code: g.group_code,
              counts: typeof g.counts === "string" ? JSON.parse(g.counts) : g.counts,
              duration_minutes: Number(g.duration_minutes) || 60,
              max_students: Number(g.max_students) || 30,
              is_active: g.is_active !== false,
              created_at: g.created_at,
            }));
            setGroups(parsed);
          }
        }
      )
      .subscribe();

    // ⚡ 3. Realtime channel for QUESTIONS
    const questionsChannel = supabase
      .channel("admin_realtime_questions")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "questions" },
        () => {
          loadData();
        }
      )
      .subscribe();

    // Cleanup channels on unmount
    return () => {
      supabase.removeChannel(resultsChannel);
      supabase.removeChannel(groupsChannel);
      supabase.removeChannel(questionsChannel);
    };
  }, []);

  async function handleCreateGroup(group: ExamGroup) {
    const { data, error } = await supabase.from("exam_groups").insert({
      group_name: group.group_name,
      group_code: group.group_code,
      counts: group.counts,
      duration_minutes: group.duration_minutes,
      max_students: group.max_students,
      is_active: group.is_active,
    }).select().single();

    const createdGroup = (data && !error) ? {
      id: data.id,
      group_name: data.group_name,
      group_code: data.group_code,
      counts: typeof data.counts === "string" ? JSON.parse(data.counts) : data.counts,
      duration_minutes: Number(data.duration_minutes) || 60,
      max_students: Number(data.max_students) || 30,
      is_active: data.is_active !== false,
    } : group;

    setGroups((prev) => {
      const updated = [createdGroup, ...prev.filter((g) => g.group_code !== createdGroup.group_code)];
      localStorage.setItem("monday_exam_groups_cache", JSON.stringify(updated));
      return updated;
    });
  }

  async function handleToggleGroupStatus(groupCode: string, currentStatus: boolean) {
    const newStatus = !currentStatus;
    await supabase.from("exam_groups").update({ is_active: newStatus }).eq("group_code", groupCode);
    setGroups((prev) => {
      const updated = prev.map((g) => g.group_code === groupCode ? { ...g, is_active: newStatus } : g);
      localStorage.setItem("monday_exam_groups_cache", JSON.stringify(updated));
      return updated;
    });
  }

  async function handleDeleteGroup(groupCode: string) {
    await supabase.from("exam_groups").delete().eq("group_code", groupCode);
    setGroups((prev) => {
      const updated = prev.filter((g) => g.group_code !== groupCode);
      localStorage.setItem("monday_exam_groups_cache", JSON.stringify(updated));
      return updated;
    });
  }

  function handleViewResultsForGroup(groupCode: string) {
    setSelectedGroupFilter(groupCode);
    setActiveTab("results");
  }

  async function handleSaveQuestion(q: Question) {
    const record = {
      id: q.id,
      type: q.type,
      category: q.category,
      topic: q.topic,
      question: q.question,
      options: (q as any).options || null,
      answer: (q as any).answer !== undefined ? String((q as any).answer) : null,
      hint: q.hint || null,
      points: q.points || 1,
      placeholder: (q as any).placeholder || null,
      accepted: (q as any).accepted || null,
      tokens: (q as any).tokens || null,
      correct_order: (q as any).correctOrder || null,
      broken_code: (q as any).brokenCode || null,
    };

    const { error } = await supabase.from("questions").upsert(record, { onConflict: "id" });
    if (error) throw error;
    await loadData();
  }

  async function handleDeleteQuestion(id: number) {
    const { error } = await supabase.from("questions").delete().eq("id", id);
    if (error) {
      alert("Savolni o'chirishda xatolik yuz berdi");
    } else {
      setQuestions((prev) => prev.filter((q) => q.id !== id));
    }
  }

  async function handleDeleteResult(id: number) {
    const { error } = await supabase.from("results").delete().eq("id", id);
    if (error) {
      alert("Natijani o'chirishda xatolik yuz berdi");
    } else {
      setResults((prev) => prev.filter((r) => r.id !== id));
    }
  }

  async function handleSaveSettings(newSettings: ExamSettings) {
    setSettings(newSettings);
    localStorage.setItem("monday_exam_settings", JSON.stringify(newSettings));

    try {
      await supabase.from("exam_settings").upsert({
        id: 1,
        counts: newSettings.counts,
        duration_minutes: newSettings.durationMinutes,
        max_violations: newSettings.maxViolations ?? 3,
        penalty_per_violation: newSettings.penaltyPerViolation ?? 1,
        enforce_fullscreen: newSettings.enforceFullscreen !== false,
        shuffle_questions: newSettings.shuffleQuestions !== false,
        shuffle_options: newSettings.shuffleOptions !== false,
        updated_at: new Date().toISOString(),
      });
    } catch (err) {
      console.warn("Could not save to remote exam_settings:", err);
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans antialiased relative">
      {/* Realtime Toast Notification */}
      {realtimeNotification && (
        <div className="fixed top-5 right-5 z-50 animate-slide-down bg-emerald-900 text-white px-5 py-3.5 rounded-2xl shadow-xl border border-emerald-700 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-700 flex items-center justify-center">
            <Bell size={18} className="text-emerald-200" />
          </div>
          <span className="text-sm font-semibold">{realtimeNotification}</span>
        </div>
      )}

      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        resultCount={results.length}
        questionCount={questions.length}
        groupCount={groups.length}
        isRealtimeConnected={isRealtimeConnected}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
        <Header
          activeTab={activeTab}
          onRefresh={loadData}
          isRefreshing={isRefreshing}
          isRealtimeConnected={isRealtimeConnected}
        />

        <main className="p-8 max-w-7xl w-full mx-auto flex-1">
          {activeTab === "dashboard" && (
            <DashboardView
              results={results}
              questions={questions}
              setActiveTab={setActiveTab}
              onInspectStudent={setInspectingResult}
            />
          )}

          {activeTab === "groups" && (
            <GroupsView
              groups={groups}
              results={results}
              onAddGroup={() => setIsGroupModalOpen(true)}
              onToggleGroupStatus={handleToggleGroupStatus}
              onDeleteGroup={handleDeleteGroup}
              onViewResultsForGroup={handleViewResultsForGroup}
            />
          )}

          {activeTab === "results" && (
            <ResultsView
              results={results}
              groups={groups}
              selectedGroupFilter={selectedGroupFilter}
              onInspectStudent={setInspectingResult}
              onDeleteResult={handleDeleteResult}
            />
          )}

          {activeTab === "questions" && (
            <QuestionsView
              questions={questions}
              onAddQuestion={() => {
                setEditingQuestion(null);
                setIsQuestionModalOpen(true);
              }}
              onEditQuestion={(q) => {
                setEditingQuestion(q);
                setIsQuestionModalOpen(true);
              }}
              onDeleteQuestion={handleDeleteQuestion}
            />
          )}

          {activeTab === "settings" && (
            <ExamConfigView
              settings={settings}
              questions={questions}
              onSaveSettings={handleSaveSettings}
            />
          )}
        </main>
      </div>

      {/* Student Deep Inspection Modal */}
      <StudentDetailModal
        result={inspectingResult}
        questions={questions}
        onClose={() => setInspectingResult(null)}
      />

      {/* Add / Edit Question Modal */}
      <QuestionModal
        isOpen={isQuestionModalOpen}
        question={editingQuestion}
        onClose={() => {
          setIsQuestionModalOpen(false);
          setEditingQuestion(null);
        }}
        onSave={handleSaveQuestion}
      />

      {/* Create Group Modal */}
      <CreateGroupModal
        isOpen={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
        onSave={handleCreateGroup}
      />
    </div>
  );
}
`);

console.log('🎉 Full build_admin updated with Full Realtime sync!');
