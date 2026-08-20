import { useState, useCallback, memo, useRef, useEffect } from "react";
import ExamPage from "./components/ExamPage";
import AdminPage from "./components/AdminPage";
import NavButton from "./components/NavButton";
import type { ViewType } from "./types";

const Navigation = memo(function Navigation({
  view,
  onViewChange,
  onAdminClick,
}: {
  view: ViewType;
  onViewChange: (view: ViewType) => void;
  onAdminClick: () => void;
}) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex gap-2">
      <NavButton
        label="Imtihon"
        isActive={view === "exam"}
        onClick={() => onViewChange("exam")}
      />
      <NavButton
        label="Admin"
        isActive={view === "admin"}
        onClick={onAdminClick}
      />
    </div>
  );
});

function ViewContent({ view }: { view: ViewType }) {
  return view === "exam" ? <ExamPage /> : <AdminPage />;
}

export default memo(function App() {
  const [view, setView] = useState<ViewType>("exam");
  const clickCountRef = useRef(0);
  const clickTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );

  const handleViewChange = useCallback((newView: ViewType) => {
    setView(newView);
  }, []);

  const handleAdminClick = useCallback(() => {
    clickCountRef.current += 1;

    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
    }

    if (clickCountRef.current >= 3) {
      setView("admin");
      clickCountRef.current = 0;
    } else {
      clickTimeoutRef.current = setTimeout(() => {
        clickCountRef.current = 0;
      }, 2000);
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "u") {
        e.preventDefault();
        setView((v) => (v === "admin" ? "exam" : "admin"));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div>
      <Navigation view={view} onViewChange={handleViewChange} onAdminClick={handleAdminClick} />
      <ViewContent view={view} />
    </div>
  );
});
