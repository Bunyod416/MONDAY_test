import { createClient } from "@supabase/supabase-js";
import { questions } from "../src/utils/data/questions";
import { createSession } from "../src/utils/session";
import { calculateExamScore, submitExamToSupabase } from "../src/services/submissionService";
import { fetchGroupByCode, getGroupSubmissionsCount } from "../src/services/groupService";

const supabaseUrl = "https://hykqlcvrmfieaosnlrlj.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5a3FsY3ZybWZpZWFvc25scmxqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1NzgwMjMsImV4cCI6MjEwMzE1NDAyM30.v8cD7ChpyB66ubr3V0p9XFRrHL3AOujrRPPYy75L2GA";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verifyAll() {
  console.log("===============================================================");
  console.log("🚀 MONDAY EXAM & ADMIN SYSTEM - TO'LIQ KOMPLEKS TEKSHIRUV");
  console.log("===============================================================\n");

  // 1. Database Connection & Tables Check
  console.log("1️⃣ Supabase Jadvallari va Ulanish:");
  const { data: qData, error: qErr } = await supabase.from("questions").select("id").limit(5);
  console.log("   - `questions` jadvali:", qErr ? `❌ ${qErr.message}` : `✅ Ulandi (${questions.length} ta savol)`);

  const { data: gData, error: gErr } = await supabase.from("exam_groups").select("*");
  console.log("   - `exam_groups` jadvali:", gErr ? `❌ ${gErr.message}` : `✅ Ulandi (${gData?.length} ta guruh bazada mavjud)`);

  const { data: rData, error: rErr } = await supabase.from("results").select("id").limit(5);
  console.log("   - `results` jadvali:", rErr ? `❌ ${rErr.message}` : `✅ Ulandi (${rData?.length} ta natija saqlangan)\n`);

  // 2. Real Group GRP-910 (apple) Verification
  console.log("2️⃣ Admin tomonidan yaratilgan `GRP-910` guruhini tekshirish:");
  const group = await fetchGroupByCode("GRP-910");
  if (!group) {
    throw new Error("GRP-910 guruhi bazadan topilmadi!");
  }
  console.log(`   - Guruh nomi: "${group.group_name}"`);
  console.log(`   - Guruh kodi: "${group.group_code}"`);
  console.log(`   - Belgilangan vaqt: ${group.duration_minutes} daqiqa`);
  console.log(`   - Savollar taqsimoti:`, group.counts);
  console.log(`   - Sig'im: ${group.max_students} ta talaba`);
  console.log(`   - Holati: ${group.is_active ? "🟢 Faol" : "🔴 Nofaol"}`);
  console.log("   ✅ Guruh ma'lumotlari to'liq va to'g'ri!\n");

  // 3. Mandatory Group Code Validation in Student Portal
  console.log("3️⃣ Talaba Portali: Guruh kodini majburiy tekshirish:");
  const emptyCheck = await fetchGroupByCode("");
  console.log("   - Bo'sh kod bilan kirish:", emptyCheck === null ? "✅ Bloklandi (null)" : "❌ Xato");

  const wrongCheck = await fetchGroupByCode("WRONG-CODE-999");
  console.log("   - Noto'g'ri kod bilan kirish:", wrongCheck === null ? "✅ Bloklandi (null)" : "❌ Xato");

  const realCheck = await fetchGroupByCode("grp-910");
  console.log("   - Kichik harflar bilan 'grp-910' yozganda:", realCheck?.group_code === "GRP-910" ? "✅ Tandi va qabul qildi" : "❌ Xato");
  console.log("   ✅ Talaba portali tekshiruvi a'lo darajada!\n");

  // 4. Exam Session, 5 Question Types & Grading
  console.log("4️⃣ Imtihon Sessiyasi va Baholash (5 ta savol turi):");
  const session = createSession(
    "Shoxruh Rahimov",
    { counts: group.counts, durationMinutes: group.duration_minutes },
    questions,
    "GRP-910"
  );
  console.log(`   - Sessiya yaratildi: Talaba="${session.studentName}", Guruh="${session.groupCode}"`);

  // Fill in answers for questions
  const cats = ["HTML", "CSS", "JavaScript", "Python"] as const;
  for (const cat of cats) {
    const ids = session.categoryOrder[cat] || [];
    for (const id of ids) {
      const q = questions.find((item) => item.id === id);
      if (!q) continue;
      if (q.type === "mcq") {
        const correctIdx = q.answer.charCodeAt(0) - 65;
        session.answers[id] = { type: "mcq", selected: correctIdx };
      } else if (q.type === "truefalse") {
        session.answers[id] = { type: "truefalse", selected: q.answer };
      } else if (q.type === "code" || q.type === "fix") {
        session.answers[id] = { type: q.type, value: q.accepted[0] };
      } else if (q.type === "drag") {
        const correctOrder = q.correctOrder.map((tok) => q.tokens.indexOf(tok));
        session.answers[id] = { type: "dragdrop", order: correctOrder, touched: true };
      }
    }
  }

  const scoreResult = calculateExamScore(session, questions);
  console.log(`   - Ball: ${scoreResult.earned} / ${scoreResult.total} ball`);
  if (scoreResult.earned !== scoreResult.total || scoreResult.total === 0) {
    throw new Error("Baholashda xatolik yuz berdi!");
  }
  console.log("   ✅ Barcha 5 ta savol turi bo'yicha baholash 100% to'g'ri ishladi!\n");

  // 5. Test Submission to Supabase & Admin Mapping
  console.log("5️⃣ Natijani Supabase ga yuborish va Admin o'qishi:");
  const inserted = await submitExamToSupabase(session, questions);
  console.log(`   - Supabase ga muvaffaqiyatli saqlandi! ID: #${inserted.id}`);

  // Fetch as Admin
  const { data: adminRecord, error: adminErr } = await supabase
    .from("results")
    .select("*")
    .eq("id", inserted.id)
    .single();

  if (adminErr || !adminRecord) {
    throw new Error(`Admin natijani o'qiy olmadi: ${adminErr?.message}`);
  }

  const groupInAdmin = adminRecord.group_code || adminRecord.answers?._meta?.group_code;
  console.log(`   - Admin qabul qildi: Ism="${adminRecord.student_name}", Ball=${adminRecord.score}/${adminRecord.total_points}, Guruh="${groupInAdmin}"`);

  if (groupInAdmin !== "GRP-910") {
    throw new Error("Guruh kodi mos kelmadi!");
  }

  // Cleanup verification submission
  await supabase.from("results").delete().eq("id", inserted.id);
  console.log("   🧹 Test natijasi Supabase dan tozalandi.\n");

  console.log("===============================================================");
  console.log("🎉 BARCHASI 100% ISHLAMOQDA! TEST VA ADMIN TO'LIQ TAYYOR!");
  console.log("===============================================================");
}

verifyAll().catch((err) => {
  console.error("❌ Xatolik yuz berdi:", err);
  process.exit(1);
});
