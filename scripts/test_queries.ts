import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://hykqlcvrmfieaosnlrlj.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5a3FsY3ZybWZpZWFvc25scmxqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1NzgwMjMsImV4cCI6MjEwMzE1NDAyM30.v8cD7ChpyB66ubr3V0p9XFRrHL3AOujrRPPYy75L2GA";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testQueries() {
  console.log("--- 1. Testing ilike group_code ---");
  const q1 = await supabase
    .from("results")
    .select("*", { count: "exact", head: true })
    .ilike("group_code", "TEST");
  console.log("q1 ilike('group_code'):", q1.error?.message || `count: ${q1.count}`);

  console.log("--- 2. Testing answers->_meta->>group_code or json filter ---");
  const q2 = await supabase
    .from("results")
    .select("id, answers")
    .limit(10);
  console.log("q2 all results:", q2.data?.length);
  if (q2.data) {
    q2.data.forEach((r: any) => {
      console.log(`id: ${r.id}, meta_group_code:`, r.answers?._meta?.group_code);
    });
  }
}

testQueries();
