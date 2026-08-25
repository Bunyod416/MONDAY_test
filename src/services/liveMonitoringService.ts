import { supabase } from "../utils/supabase";
import type { Category } from "../utils/data/questions";

export interface LiveStudentTelemetry {
  studentName: string;
  groupCode: string;
  category: Category;
  questionIndex: number;
  questionId: number;
  categoryTotal: number;
  answeredCount: number;
  totalQuestions: number;
  progressPercent: number;
  remainingSeconds: number;
  elapsedSeconds: number;
  violationCount: number;
  status: "in_exam" | "warning" | "paused" | "blocked" | "submitted";
  lastActiveAt: number;
}

let globalLiveChannel: ReturnType<typeof supabase.channel> | null = null;
let lastBroadcastTime = 0;
const BROADCAST_THROTTLE_MS = 500;

export function initLiveMonitoring(studentName: string, groupCode: string) {
  if (globalLiveChannel) {
    supabase.removeChannel(globalLiveChannel);
  }

  const cleanGroup = groupCode.trim().toUpperCase() || "UMUMIY";
  globalLiveChannel = supabase.channel("exam_live_stream_global", {
    config: {
      presence: { key: `student_${studentName}_${Date.now()}` },
    },
  });

  globalLiveChannel
    .on("presence", { event: "sync" }, () => {
      // presence synced
    })
    .subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await globalLiveChannel?.track({
          studentName,
          groupCode: cleanGroup,
          onlineAt: Date.now(),
        });
      }
    });

  return globalLiveChannel;
}

export function broadcastStudentLiveState(telemetry: LiveStudentTelemetry) {
  const now = Date.now();
  if (now - lastBroadcastTime < BROADCAST_THROTTLE_MS && telemetry.status === "in_exam") {
    return;
  }
  lastBroadcastTime = now;

  try {
    if (!globalLiveChannel) {
      globalLiveChannel = supabase.channel("exam_live_stream_global");
      globalLiveChannel.subscribe((status) => {
        if (status === "SUBSCRIBED") {
          globalLiveChannel?.send({
            type: "broadcast",
            event: "student_live_telemetry",
            payload: telemetry,
          });
        }
      });
      return;
    }

    globalLiveChannel.send({
      type: "broadcast",
      event: "student_live_telemetry",
      payload: telemetry,
    });
  } catch (err) {
    console.warn("Live telemetry broadcast error:", err);
  }
}

export function closeLiveMonitoring() {
  if (globalLiveChannel) {
    supabase.removeChannel(globalLiveChannel);
    globalLiveChannel = null;
  }
}

