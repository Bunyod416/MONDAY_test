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

let liveChannel: ReturnType<typeof supabase.channel> | null = null;
let lastBroadcastTime = 0;
const BROADCAST_THROTTLE_MS = 800;

export function initLiveMonitoring(studentName: string, groupCode: string) {
  if (liveChannel) {
    supabase.removeChannel(liveChannel);
  }

  const channelId = `live_stream_${groupCode.trim().toUpperCase() || "ALL"}`;
  liveChannel = supabase.channel(channelId, {
    config: {
      presence: { key: `${studentName}_${Date.now()}` },
    },
  });

  liveChannel
    .on("presence", { event: "sync" }, () => {
      // presence synced
    })
    .subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await liveChannel?.track({
          studentName,
          groupCode,
          onlineAt: Date.now(),
        });
      }
    });

  return liveChannel;
}

export function broadcastStudentLiveState(telemetry: LiveStudentTelemetry) {
  const now = Date.now();
  if (now - lastBroadcastTime < BROADCAST_THROTTLE_MS && telemetry.status === "in_exam") {
    return;
  }
  lastBroadcastTime = now;

  try {
    if (!liveChannel) {
      liveChannel = supabase.channel(`live_stream_${telemetry.groupCode || "ALL"}`);
      liveChannel.subscribe();
    }

    liveChannel.send({
      type: "broadcast",
      event: "student_live_telemetry",
      payload: telemetry,
    });
  } catch (err) {
    console.warn("Live telemetry broadcast error:", err);
  }
}

export function closeLiveMonitoring() {
  if (liveChannel) {
    supabase.removeChannel(liveChannel);
    liveChannel = null;
  }
}
