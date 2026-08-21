import { useState, memo, useEffect } from "react";
import ExamPage from "./components/ExamPage";
import AdminPage from "./components/AdminPage";
import { isExamActive } from "./utils/examLock";
import type { ViewType } from "./types";

function ViewContent({ view }: { view: ViewType }) {
  return view === "exam" ? <ExamPage /> : <AdminPage />;
}

export default memo(function App() {
  const [view, setView] = useState<ViewType>("exam");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "u") {
        // Imtihon davom etayotganda yorliq ishlamaydi — aks holda talaba
        // ExamPage'ni unmount qilib, imtihondan "chiqib" ketardi.
        if (isExamActive()) return;
        e.preventDefault();
        setView((v) => (v === "admin" ? "exam" : "admin"));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div>
      <ViewContent view={view} />
    </div>
  );
});
