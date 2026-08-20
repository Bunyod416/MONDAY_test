import { memo, useEffect, useRef, useState } from "react";
import { Clock, AlertTriangle } from "lucide-react";

interface TimerProps {
  startTime: number;
  onTimeUp: () => void;
}

export default memo(function Timer({ startTime, onTimeUp }: TimerProps) {
  const TOTAL_MS = 90 * 60 * 1000; // 90 minutes

  // Initial remaining hisoblash (sahifa qayta yuklansa ham to'g'ri ko'rsatadi)
  const [remaining, setRemaining] = useState(() =>
    Math.max(0, TOTAL_MS - (Date.now() - startTime))
  );

  const calledRef = useRef(false);
  const onTimeUpRef = useRef(onTimeUp);
  onTimeUpRef.current = onTimeUp;

  useEffect(() => {
    // Agar vaqt allaqachon tugagan bo'lsa
    if (remaining === 0 && !calledRef.current) {
      calledRef.current = true;
      onTimeUpRef.current();
      return;
    }

    const interval = setInterval(() => {
      const remainingMs = Math.max(0, TOTAL_MS - (Date.now() - startTime));
      setRemaining(remainingMs);

      if (remainingMs === 0 && !calledRef.current) {
        calledRef.current = true;
        onTimeUpRef.current();
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startTime]); // faqat startTime o'zgarganda qayta ishga tushsin

  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  const isLowTime = remaining > 0 && remaining < 5 * 60 * 1000; // 5 daqiqadan kam

  const timeString = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  return (
    <div
      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-bold text-sm transition-all ${
        isLowTime
          ? "bg-red-100 text-red-700 animate-pulse"
          : "bg-blue-50 text-blue-700"
      }`}
    >
      {isLowTime && <AlertTriangle size={16} />}
      {!isLowTime && <Clock size={16} />}
      <span>{timeString}</span>
    </div>
  );
});
