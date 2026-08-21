import { memo, useEffect, useRef, useState } from "react";
import { Clock, AlertTriangle } from "lucide-react";

interface TimerProps {
  startTime: number;
  /** Imtihon davomiyligi — admin panelda sozlanadi (ilgari 60 daqiqa qattiq yozilgan edi). */
  durationMinutes: number;
  pausedAt: number | null;
  pausedDuration: number;
  onTimeUp: () => void;
}

export default memo(function Timer({
  startTime,
  durationMinutes,
  pausedAt,
  pausedDuration,
  onTimeUp,
}: TimerProps) {
  const totalMs = durationMinutes * 60 * 1000;

  const getRemaining = () => {
    const currentPause = pausedAt === null ? 0 : Date.now() - pausedAt;
    const elapsed = Date.now() - startTime - pausedDuration - currentPause;
    return Math.max(0, totalMs - elapsed);
  };

  // Boshlang'ich qiymat funksiya orqali — sahifa qayta yuklansa ham to'g'ri.
  const [remaining, setRemaining] = useState(getRemaining);

  const calledRef = useRef(false);
  const onTimeUpRef = useRef(onTimeUp);
  onTimeUpRef.current = onTimeUp;

  const getRemainingRef = useRef(getRemaining);
  getRemainingRef.current = getRemaining;

  useEffect(() => {
    // Vaqtni HOZIR qayta hisoblaymiz. Ilgari bu yerda state'dagi eski
    // `remaining` qiymati tekshirilardi — bir render orqada qolgan qiymat.
    const now = getRemainingRef.current();
    setRemaining(now);

    if (pausedAt !== null) return;

    if (now === 0) {
      if (!calledRef.current) {
        calledRef.current = true;
        onTimeUpRef.current();
      }
      return;
    }

    const interval = setInterval(() => {
      const remainingMs = getRemainingRef.current();
      setRemaining(remainingMs);

      if (remainingMs === 0 && !calledRef.current) {
        calledRef.current = true;
        onTimeUpRef.current();
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, pausedAt, pausedDuration, totalMs]);

  const totalSeconds = Math.floor(remaining / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const isLowTime = remaining > 0 && remaining < 5 * 60 * 1000;

  const timeString =
    hours > 0
      ? `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
      : `${minutes}:${seconds.toString().padStart(2, "0")}`;

  return (
    <div
      className={`flex items-center gap-2 rounded-lg px-3 py-1.5 font-mono text-sm font-medium tabular-nums transition-colors ${isLowTime
        ? "bg-red-50 text-red-700 ring-1 ring-red-200"
        : "bg-gray-100 text-gray-700"
        }`}
    >
      {isLowTime ? <AlertTriangle size={16} /> : <Clock size={16} />}
      <span>{timeString}</span>
    </div>
  );
});
