import { createClient } from "@supabase/supabase-js";
import { questions, CATEGORIES } from "../src/utils/data/questions";
import { createSession } from "../src/utils/session";
import { calculateExamScore } from "../src/services/submissionService";

const supabaseUrl = "https://hykqlcvrmfieaosnlrlj.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5a3FsY3ZybWZpZWFvc25scmxqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1NzgwMjMsImV4cCI6MjEwMzE1NDAyM30.v8cD7ChpyB66ubr3V0p9XFRrHL3AOujrRPPYy75L2GA";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  // 1. Check existing groups
  const { data: groups, error: groupErr } = await supabase.from("exam_groups").select("*");
  console.log("Existing groups in Supabase:", groups);

  let targetGroupCode = "FRONTEND-01";
  if (groups && groups.length > 0) {
    targetGroupCode = groups[0].group_code;
  }

  // 2. Prepare test student data
  const testStudentName = "Ali Valiyev (Test O'quvchi)";
  
  // Create realistic session config
  const config = {
    counts: { HTML: 5, CSS: 5, JavaScript: 5, Python: 5 },
    durationMinutes: 60,
    maxViolations: 5,
    penaltyPerViolation: 1,
    enforceFullscreen: true,
    shuffleQuestions: true,
    shuffleOptions: true,
  };

  const session = createSession(testStudentName, config, questions, targetGroupCode);

  // Fill in some correct answers and some incorrect/incomplete answers
  let questionCounter = 0;
  for (const cat of CATEGORIES) {
    for (const qId of session.categoryOrder[cat] || []) {
      const q = questions.find((item) => item.id === qId);
      if (!q) continue;
      questionCounter++;

      // Make 85% of questions answered correctly
      const answerCorrectly = questionCounter % 6 !== 0;

      if (q.type === "mcq") {
        const correctIdx = /^[0-9]+$/.test(String(q.answer))
          ? Number(q.answer)
          : String(q.answer).toUpperCase().charCodeAt(0) - 65;
        session.answers[q.id] = {
          type: "mcq",
          selected: answerCorrectly ? correctIdx : (correctIdx + 1) % (q.options?.length || 4),
        };
      } else if (q.type === "truefalse") {
        session.answers[q.id] = {
          type: "truefalse",
          selected: answerCorrectly ? q.answer : !q.answer,
        };
      } else if (q.type === "code" || q.type === "fix") {
        session.answers[q.id] = {
          type: q.type,
          value: answerCorrectly ? (q.accepted?.[0] || "console.log('test')") : "not_quite_correct()",
        };
      } else if (q.type === "drag") {
        const correctOrder = q.correctOrder.map((tok) => q.tokens.indexOf(tok));
        session.answers[q.id] = {
          type: "dragdrop",
          order: answerCorrectly ? correctOrder : correctOrder.slice().reverse(),
          touched: true,
        };
      }
    }
  }

  session.violationCount = 0;
  const scoreResult = calculateExamScore(session, questions);

  const answersPayload: any = { ...session.answers };
  if (targetGroupCode) {
    answersPayload._meta = { group_code: targetGroupCode };
  }

  const resultPayload = {
    student_name: session.studentName,
    score: scoreResult.earned,
    total_points: scoreResult.total,
    violation_count: session.violationCount,
    duration_minutes: session.durationMinutes,
    answers: answersPayload,
    category_order: session.categoryOrder,
    option_orders: session.optionOrders,
    drag_orders: session.dragOrders,
    group_code: targetGroupCode,
    start_time: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    submitted_at: new Date().toISOString(),
  };

  console.log("Inserting test student result:", {
    student_name: resultPayload.student_name,
    score: `${resultPayload.score} / ${resultPayload.total_points}`,
    group_code: resultPayload.group_code,
  });

  const { data, error } = await supabase.from("results").insert(resultPayload).select().single();

  if (error) {
    console.error("Error inserting student result:", error);
  } else {
    console.log("Successfully inserted student result! ID:", data?.id);
  }
}

main();
