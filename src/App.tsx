import { memo, useState, useEffect } from "react";
import ExamPage from "./components/ExamPage";
import AdminPage from "./components/AdminPage";
import { isExamActive } from "./utils/examLock";
import type { ViewType } from "./types";

export default memo(function App() {
  const [view, setView] = useState<ViewType>(() => {
    const params = new URLSearchParams(window.location.search);
    if (
      params.get("admin") === "1" ||
      params.get("admin") === "true" ||
      params.get("view") === "admin" ||
      window.location.hash === "#admin"
    ) {
      return "admin";
    }
    return "exam";
  });

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (
        (e.ctrlKey || e.metaKey) &&
        e.shiftKey &&
        (e.key === "U" || e.key === "u" || e.key === "A" || e.key === "a")
      ) {
        if (isExamActive()) {
          // Imtihon jarayonida admin paneliga o'tish bloklanadi
          return;
        }
        e.preventDefault();
        setView((prev) => (prev === "exam" ? "admin" : "exam"));
      }
    }

    function handleHashChange() {
      if (window.location.hash === "#admin") {
        setView("admin");
      } else if (window.location.hash === "#exam" || window.location.hash === "") {
        setView("exam");
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("hashchange", handleHashChange);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, []);

  if (view === "admin") {
    return <AdminPage onBack={() => setView("exam")} />;
  }

  return <ExamPage />;
});
