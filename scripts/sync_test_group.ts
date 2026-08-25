import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://hykqlcvrmfieaosnlrlj.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5a3FsY3ZybWZpZWFvc25scmxqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1NzgwMjMsImV4cCI6MjEwMzE1NDAyM30.v8cD7ChpyB66ubr3V0p9XFRrHL3AOujrRPPYy75L2GA";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function syncGroupAndVerify() {
  // Ensure group FRONTEND-01 exists in exam_groups
  const groupPayload = {
    id: "group_frontend_01",
    group_name: "Frontend Dasturlash (Test)",
    group_code: "FRONTEND-01",
    counts: { HTML: 5, CSS: 5, JavaScript: 5, Python: 5 },
    duration_minutes: 60,
    max_students: 30,
    is_active: true,
  };

  const { data: grpData, error: grpErr } = await supabase
    .from("exam_groups")
    .upsert(groupPayload, { onConflict: "group_code" })
    .select();

  console.log("Group upsert:", { grpData, grpErr });

  // Check results
  const { data: results, error: resErr } = await supabase
    .from("results")
    .select("id, student_name, score, total_points, group_code, submitted_at");

  console.log("Current results in Supabase:", results);
}

syncGroupAndVerify();
