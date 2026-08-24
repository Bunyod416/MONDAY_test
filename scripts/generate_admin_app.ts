import fs from "fs";
import path from "path";

const adminRoot = path.resolve(process.cwd(), "../MONDAY_admin");

function ensureDir(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function writeFile(relativePath: string, content: string) {
  const fullPath = path.join(adminRoot, relativePath);
  ensureDir(path.dirname(fullPath));
  fs.writeFileSync(fullPath, content.trim() + "\n", "utf-8");
  console.log(`Created: ${relativePath}`);
}

console.log("Generating MONDAY_admin project base files with Tailwind CSS...");

// 1. postcss.config.js
writeFile(
  "postcss.config.js",
  `
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}
`,
);

// 2. .env
writeFile(
  ".env",
  `
VITE_SUPABASE_URL=https://hykqlcvrmfieaosnlrlj.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5a3FsY3ZybWZpZWFvc25scmxqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1NzgwMjMsImV4cCI6MjEwMzE1NDAyM30.v8cD7ChpyB66ubr3V0p9XFRrHL3AOujrRPPYy75L2GA
`,
);

// 3. src/index.css
writeFile(
  "src/index.css",
  `
@import "tailwindcss";

@layer base {
  body {
    background-color: #020617;
    color: #f8fafc;
    font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
    -webkit-font-smoothing: antialiased;
  }
}

/* Custom Scrollbar */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: rgba(15, 23, 42, 0.6);
}
::-webkit-scrollbar-thumb {
  background: rgba(51, 65, 85, 0.8);
  border-radius: 9999px;
}
::-webkit-scrollbar-thumb:hover {
  background: rgba(71, 85, 105, 1);
}
`,
);

// 4. src/lib/supabase.ts
writeFile(
  "src/lib/supabase.ts",
  `
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://hykqlcvrmfieaosnlrlj.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5a3FsY3ZybWZpZWFvc25scmxqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1NzgwMjMsImV4cCI6MjEwMzE1NDAyM30.v8cD7ChpyB66ubr3V0p9XFRrHL3AOujrRPPYy75L2GA";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
`,
);

console.log("Base configs written successfully!");
