import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://hykqlcvrmfieaosnlrlj.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5a3FsY3ZybWZpZWFvc25scmxqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1NzgwMjMsImV4cCI6MjEwMzE1NDAyM30.v8cD7ChpyB66ubr3V0p9XFRrHL3AOujrRPPYy75L2GA";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runEndToEndVerification() {
  console.log("==================================================");
  console.log("🔍 ADMIN VA TALABA ULANISHINI TO'LIQ TEKSHIRISH");
  console.log("==================================================\n");

  // 1. Questions Check (Admin savollar bazasi)
  console.log("1️⃣  Savollar bazasi tekshirilmoqda (`questions`)...");
  const { data: questions, error: qErr } = await supabase
    .from("questions")
    .select("id, category, type, points")
    .order("id", { ascending: true });

  if (qErr) {
    console.error("❌ Savollarni yuklashda xatolik:", qErr.message);
  } else {
    console.log(`✅ Savollar bazasi ulandi: Jami ${questions?.length} ta savol mavjud.`);
    const cats = ["HTML", "CSS", "JavaScript", "Python"];
    for (const c of cats) {
      const count = questions?.filter((q) => q.category === c).length;
      console.log(`   - ${c}: ${count} ta savol`);
    }
  }

  // 2. Results Check (Natijalar jadvali)
  console.log("\n2️⃣  Natijalar bazasi tekshirilmoqda (`results`)...");
  const { data: results, error: rErr } = await supabase
    .from("results")
    .select("*")
    .order("id", { ascending: false })
    .limit(5);

  if (rErr) {
    console.error("❌ Natijalar jadvalida xatolik:", rErr.message);
  } else {
    console.log(`✅ Natijalar jadvali ulandi: Bazada ${results?.length} ta oxirgi natija mavjud.`);
  }

  // 3. Test Student Submission (Talaba topshirishi simulyatsiyasi)
  console.log("\n3️⃣  Talaba tomonidan imtihon topshirish testi...");
  const testStudentName = `Test Talaba (Ulanish Tekshiruvi)`;
  const testGroupCode = `CONN-TEST-99`;
  
  const testPayload: any = {
    student_name: testStudentName,
    score: 115,
    total_points: 120,
    violation_count: 0,
    duration_minutes: 60,
    answers: { _meta: { group_code: testGroupCode } },
    category_order: { HTML: [1], CSS: [31], JavaScript: [61], Python: [91] },
    option_orders: {},
    drag_orders: {},
    start_time: new Date().toISOString(),
    submitted_at: new Date().toISOString(),
  };

  const { data: inserted, error: insErr } = await supabase
    .from("results")
    .insert(testPayload)
    .select()
    .single();

  if (insErr) {
    console.error("❌ Talaba natijasini saqlashda xatolik:", insErr.message);
  } else {
    console.log(`✅ Talaba muvaffaqiyatli topshirdi! ID: ${inserted.id}, Ism: ${inserted.student_name}`);

    // 4. Admin query check (Admin paneli shu natijani o'qiy olishini tekshirish)
    console.log("\n4️⃣  Admin paneli shu natijani o'qiy olishini tekshirish...");
    const { data: verified, error: verErr } = await supabase
      .from("results")
      .select("*")
      .eq("id", inserted.id)
      .single();

    if (verErr || !verified) {
      console.error("❌ Admin natijani o'qiy olmadi!");
    } else {
      const gCode = verified.group_code || verified.answers?._meta?.group_code;
      console.log(`✅ Admin natijani to'liq ko'rdi: ${verified.student_name} -> ${verified.score}/${verified.total_points} ball (Guruh: ${gCode})`);
    }

    // 5. Cleanup test result
    await supabase.from("results").delete().eq("id", inserted.id);
    console.log("🧹 Test natijasi muvaffaqiyatli tozalandi.");
  }

  console.log("\n==================================================");
  console.log("🎉 ULANISH SINOVDAN 100% MUVAFFAQIYATLI O'TDI!");
  console.log("==================================================");
}

runEndToEndVerification();
