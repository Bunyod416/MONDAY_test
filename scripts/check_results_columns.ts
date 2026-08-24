import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://hykqlcvrmfieaosnlrlj.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5a3FsY3ZybWZpZWFvc25scmxqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1NzgwMjMsImV4cCI6MjEwMzE1NDAyM30.v8cD7ChpyB66ubr3V0p9XFRrHL3AOujrRPPYy75L2GA";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspectResults() {
  const { data, error } = await supabase.from("results").select("*").limit(2);
  if (error) {
    console.error("Error inspecting results:", error);
    return;
  }
  console.log("Results count:", data?.length);
  if (data && data.length > 0) {
    console.log("Results row keys:", Object.keys(data[0]));
    console.log("Sample row:", JSON.stringify(data[0], null, 2));
  }
}

inspectResults();
