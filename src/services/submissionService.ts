import { supabase } from "../utils/supabase";
import type { ExamSession } from "../utils/session";
import type { Question } from "../utils/data/questions";
import { matchWithNearMiss, langForCategory } from "../utils/answerMatch";

export function calculateExamScore(
  session: ExamSession,
  questionsList: Question[] = []
): { earned: number; total: number; rawEarned: number; penalty: number } {
  let rawEarned = 0;
  let total = 0;

  const categories = Object.keys(session.categoryOrder) as (keyof typeof session.categoryOrder)[];

  for (const cat of categories) {
    const ids = session.categoryOrder[cat] || [];
    for (const id of ids) {
      const q = questionsList.find((item) => item.id === id);
      if (!q) continue;

      total += q.points;
      const ans = session.answers[id];
      if (!ans) continue;

      let isCorrect = false;

      if (q.type === "mcq" && ans.type === "mcq") {
        const correctIdx = /^[0-9]+$/.test(String(q.answer))
          ? Number(q.answer)
          : String(q.answer).toUpperCase().charCodeAt(0) - 65;
        isCorrect = ans.selected !== null && ans.selected === correctIdx;
      } else if (q.type === "truefalse" && ans.type === "truefalse") {
        isCorrect = ans.selected !== null && ans.selected === q.answer;
      } else if ((q.type === "code" || q.type === "fix") && ans.type === q.type) {
        const match = matchWithNearMiss(ans.value, q.accepted, langForCategory(q.category));
        isCorrect = match.status === "correct";
      } else if (q.type === "drag" && ans.type === "dragdrop") {
        if (ans.touched) {
          const correctOrder = q.correctOrder.map((tok) => q.tokens.indexOf(tok));
          isCorrect = JSON.stringify(ans.order) === JSON.stringify(correctOrder);
        }
      }

      if (isCorrect) {
        rawEarned += q.points;
      }
    }
  }

  const penalty = Math.min(session.violationCount ?? 0, rawEarned);
  const earned = Math.max(0, rawEarned - penalty);

  return { earned, total, rawEarned, penalty };
}

export async function submitExamToSupabase(session: ExamSession, questionsList: Question[] = []) {
  const { earned, total } = calculateExamScore(session, questionsList);

  const answersPayload: any = { ...session.answers };
  if (session.groupCode) {
    answersPayload._meta = { group_code: session.groupCode };
  }

  const payload: any = {
    student_name: session.studentName,
    score: earned,
    total_points: total,
    violation_count: session.violationCount,
    duration_minutes: session.durationMinutes,
    answers: answersPayload,
    category_order: session.categoryOrder,
    option_orders: session.optionOrders,
    drag_orders: session.dragOrders,
    start_time: new Date(session.startTime).toISOString(),
    submitted_at: new Date().toISOString(),
  };

  if (session.groupCode) {
    payload.group_code = session.groupCode;
  }

  // 1. Try insert with group_code
  let { data, error } = await supabase
    .from("results")
    .insert(payload)
    .select()
    .single();

  // 2. If group_code column doesn't exist in Supabase schema yet, retry without group_code column
  if (error && (error.message?.includes("group_code") || error.code === "PGRST204" || error.code === "42703")) {
    const fallbackPayload = { ...payload };
    delete fallbackPayload.group_code;

    const retry = await supabase
      .from("results")
      .insert(fallbackPayload)
      .select()
      .single();

    if (!retry.error) {
      return retry.data;
    }
    error = retry.error;
  }

  if (error) {
    console.error("Supabase insert error:", error);
    throw error;
  }

  if (data) {
    try {
      const channel = supabase.channel("exam_sync_realtime");
      channel.send({
        type: "broadcast",
        event: "new_submission",
        payload: data,
      });
    } catch {
      // ignore
    }
  }

  return data;
}
