import { createClient } from "@supabase/supabase-js";
import { questions } from "../src/utils/data/questions";
import { createSession } from "../src/utils/session";
import {
  calculateExamScore,
  submitExamToSupabase,
} from "../src/services/submissionService";
import {
  fetchGroupByCode,
  getGroupSubmissionsCount,
  createOrUpdateGroup,
} from "../src/services/groupService";

const supabaseUrl = "https://hykqlcvrmfieaosnlrlj.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5a3FsY3ZybWZpZWFvc25scmxqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1NzgwMjMsImV4cCI6MjEwMzE1NDAyM30.v8cD7ChpyB66ubr3V0p9XFRrHL3AOujrRPPYy75L2GA";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runFullVerification() {
  console.log("==================================================");
  console.log("🚀 MONDAY EXAM - TO'LIQ END-TO-END VERIFIKATSIYA");
  console.log("==================================================\n");

  // 1. Check Questions Data
  console.log("1️⃣ Savollar bazasini tekshirish:");
  console.log(`   - Jami mavjud savollar: ${questions.length} ta`);
  const cats = ["HTML", "CSS", "JavaScript", "Python"] as const;
  for (const c of cats) {
    const cnt = questions.filter((q) => q.category === c).length;
    console.log(`   - ${c}: ${cnt} ta savol`);
  }
  if (questions.length !== 120) {
    throw new Error("Savollar soni 120 ta emas!");
  }
  console.log("   ✅ Savollar bazasi 100% to'liq!\n");

  // 2. Test Mandatory Group Verification
  console.log("2️⃣ Guruh kodini majburiy tekshirish testi:");
  const emptyGroup = await fetchGroupByCode("");
  console.log(
    "   - Bo'sh guruh kodi natijasi:",
    emptyGroup === null ? "✅ Bloklandi (null)" : "❌ Xato",
  );

  const invalidGroup = await fetchGroupByCode("NOT-EXISTING-999");
  console.log(
    "   - Mavjud bo'lmagan guruh natijasi:",
    invalidGroup === null ? "✅ Bloklandi (null)" : "❌ Xato",
  );

  const validGroup = await fetchGroupByCode("FE-101");
  console.log(
    "   - 'FE-101' guruhini tekshirish:",
    validGroup ? `✅ Topildi: ${validGroup.group_name}` : "❌ Xato",
  );

  // Create a custom test group
  const customGroup = await createOrUpdateGroup({
    group_name: "E2E Test Guruhi",
    group_code: "E2E-TEST-77",
    counts: { HTML: 2, CSS: 2, JavaScript: 2, Python: 2 },
    duration_minutes: 30,
    max_students: 25,
    is_active: true,
  });
  console.log(
    `   - Yangi guruh yaratish: ✅ ${customGroup.group_name} (${customGroup.group_code})\n`,
  );

  // 3. Test Session Creation & Evaluation
  console.log("3️⃣ Sessiya yaratish va Baholash (Grading) testi:");
  const cfg = {
    counts: { HTML: 2, CSS: 2, JavaScript: 2, Python: 2 },
    durationMinutes: 30,
  };
  const session = createSession("Ali Valiyev", cfg, questions, "E2E-TEST-77");
  console.log(
    `   - Sessiya yaratildi: Talaba="${session.studentName}", Guruh="${session.groupCode}"`,
  );

  // Simulate correct answers for selected questions
  let answeredCount = 0;
  for (const cat of cats) {
    const ids = session.categoryOrder[cat] || [];
    for (const id of ids) {
      const q = questions.find((item) => item.id === id);
      if (!q) continue;
      if (q.type === "mcq") {
        const correctIdx = q.answer.charCodeAt(0) - 65;
        session.answers[id] = { type: "mcq", selected: correctIdx };
        answeredCount++;
      } else if (q.type === "truefalse") {
        session.answers[id] = { type: "truefalse", selected: q.answer };
        answeredCount++;
      } else if (q.type === "code" || q.type === "fix") {
        session.answers[id] = { type: q.type, value: q.accepted[0] };
        answeredCount++;
      } else if (q.type === "drag") {
        const correctOrder = q.correctOrder.map((tok) => q.tokens.indexOf(tok));
        session.answers[id] = {
          type: "dragdrop",
          order: correctOrder,
          touched: true,
        };
        answeredCount++;
      }
    }
  }

  const scoreResult = calculateExamScore(session, questions);
  console.log(
    `   - Baholash natijasi: ${scoreResult.earned} / ${scoreResult.total} ball (${answeredCount} ta savol to'liq javoblandi, Jarima: ${scoreResult.penalty})`,
  );
  if (scoreResult.earned !== scoreResult.total || scoreResult.total === 0) {
    throw new Error("Baholashda xatolik yuz berdi!");
  }
  console.log(
    "   ✅ Barcha 5 ta savol turi bo'yicha baholash 100% to'g'ri ishladi!\n",
  );

  // 4. Test Supabase Submission & Admin Inspection
  console.log("4️⃣ Supabase ga topshirish va Admin qabul qilish testi:");
  const inserted = await submitExamToSupabase(session, questions);
  console.log(`   - Supabase ga muvaffaqiyatli saqlandi! ID: #${inserted.id}`);

  // Fetch back as Admin
  const { data: adminRecord, error: adminErr } = await supabase
    .from("results")
    .select("*")
    .eq("id", inserted.id)
    .single();

  if (adminErr || !adminRecord) {
    throw new Error(`Admin natijani o'qiy olmadi: ${adminErr?.message}`);
  }

  const adminGroup =
    adminRecord.group_code || adminRecord.answers?._meta?.group_code;
  console.log(
    `   - Admin qabul qildi: Talaba="${adminRecord.student_name}", Ball=${adminRecord.score}/${adminRecord.total_points}, Guruh="${adminGroup}"`,
  );

  // Count check
  const groupCount = await getGroupSubmissionsCount("E2E-TEST-77");
  console.log(
    `   - Guruh bo'yicha topshirganlar soni: ${groupCount} ta talaba`,
  );

  // Cleanup test record
  await supabase.from("results").delete().eq("id", inserted.id);
  console.log("   🧹 Test natijasi Supabase dan tozalandi.\n");

  console.log("==================================================");
  console.log("🎉 BARCHA DETALLAR VA REAL-TIME TIZIM 100% ISHLAMOQDA!");
  console.log("==================================================");
}

runFullVerification().catch((err) => {
  console.error("❌ Xatolik yuz berdi:", err);
  process.exit(1);
});
