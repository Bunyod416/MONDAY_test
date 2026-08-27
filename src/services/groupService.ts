import { supabase } from "../utils/supabase";
import type { ExamGroup } from "../types";

const GROUPS_STORAGE_KEY = "monday_exam_groups_cache_v2";

export function broadcastRealtimeEvent(event: string, payload: unknown) {
  try {
    const channel = supabase.channel("exam_broadcast_sender");
    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        channel.send({
          type: "broadcast",
          event,
          payload,
        });
      }
    });
  } catch (err) {
    console.warn("Broadcast error:", err);
  }
}

export async function fetchGroupByCode(code: string): Promise<ExamGroup | null> {
  const cleanCode = code.trim().toUpperCase();
  if (!cleanCode) return null;

  // 1. Try fetching from Supabase Postgres table `exam_groups`
  try {
    const { data, error } = await supabase
      .from("exam_groups")
      .select("*")
      .ilike("group_code", cleanCode)
      .maybeSingle();

    if (!error && data) {
      const g: ExamGroup = {
        id: String(data.id),
        group_name: String(data.group_name),
        group_code: String(data.group_code),
        counts: typeof data.counts === "string" ? JSON.parse(data.counts) : data.counts,
        duration_minutes: Number(data.duration_minutes) || 60,
        max_students: Number(data.max_students) || 30,
        is_active: data.is_active !== false,
        created_at: String(data.created_at),
      };
      saveLocalGroup(g);
      return g;
    }
  } catch {
    // Supabase table may not exist yet
  }

  // 2. Check local memory/storage cache
  const local = loadLocalGroups();
  const foundLocal = local.find((g) => g.group_code.toUpperCase() === cleanCode);
  if (foundLocal) {
    return foundLocal;
  }

  return null;
}

export async function getGroupSubmissionsCount(groupCode: string): Promise<number> {
  const cleanCode = groupCode.trim().toUpperCase();
  if (!cleanCode) return 0;

  try {
    const { data, error } = await supabase
      .from("results")
      .select("group_code, answers");

    if (error || !data) return 0;

    return data.filter((r: { group_code?: string; answers?: { _meta?: { group_code?: string } } }) => {
      const code = (r.group_code || r.answers?._meta?.group_code || "").toString().trim().toUpperCase();
      return code === cleanCode;
    }).length;
  } catch {
    return 0;
  }
}

// ─── Real-time Live Group Participant Subscription (Active in exam + Submitted) ───
export interface GroupParticipantsCount {
  activeTaking: number;
  submittedCount: number;
  totalOccupied: number;
}

export function subscribeToGroupParticipants(
  groupCode: string,
  onCountChange: (counts: GroupParticipantsCount) => void
) {
  const cleanCode = groupCode.trim().toUpperCase();
  if (!cleanCode) return () => {};

  let activeTaking = 0;
  let submittedCount = 0;

  const emit = () => {
    onCountChange({
      activeTaking,
      submittedCount,
      totalOccupied: activeTaking + submittedCount,
    });
  };

  getGroupSubmissionsCount(cleanCode).then((cnt) => {
    submittedCount = cnt;
    emit();
  });

  const presenceChannel = supabase.channel(`presence_${cleanCode}`, {
    config: { presence: { key: `watcher_${Date.now()}` } },
  });

  presenceChannel
    .on("presence", { event: "sync" }, () => {
      const state = presenceChannel.presenceState();
      const keys = Object.keys(state).filter((k) => !k.startsWith("watcher_"));
      activeTaking = keys.length;
      emit();
    })
    .subscribe();

  return () => {
    supabase.removeChannel(presenceChannel);
  };
}

// ─── Local Storage Helpers ───
export function loadLocalGroups(): ExamGroup[] {
  try {
    const raw = localStorage.getItem(GROUPS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore
  }
  return [];
}

export function saveLocalGroup(group: ExamGroup) {
  const current = loadLocalGroups();
  const existingIdx = current.findIndex(
    (g) => g.group_code.toUpperCase() === group.group_code.toUpperCase()
  );
  if (existingIdx >= 0) {
    current[existingIdx] = group;
  } else {
    current.unshift(group);
  }
  saveAllLocalGroups(current);
}

export function saveAllLocalGroups(groups: ExamGroup[]) {
  try {
    localStorage.setItem(GROUPS_STORAGE_KEY, JSON.stringify(groups));
  } catch {
    // ignore
  }
}
