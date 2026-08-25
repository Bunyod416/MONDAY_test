import { useState, useRef } from "react";
import { GripVertical, ChevronUp, ChevronDown } from "lucide-react";
import QuestionHint from "./QuestionHint";
import type { DragQuestion } from "../utils/data/questions";

type Props = {
  question: DragQuestion;
  questionNumber: number;
  currentOrder: number[];
  onReorder: (newOrder: number[]) => void;
};

export default function DragDropCard({
  question,
  questionNumber,
  currentOrder,
  onReorder,
}: Props) {
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);
  const dragItem = useRef<number | null>(null);

  function moveItem(fromPos: number, toPos: number) {
    if (toPos < 0 || toPos >= currentOrder.length) return;
    const newOrder = [...currentOrder];
    const [moved] = newOrder.splice(fromPos, 1);
    newOrder.splice(toPos, 0, moved);
    onReorder(newOrder);
  }

  function handleDragStart(pos: number) {
    dragItem.current = pos;
    setDraggingIdx(pos);
  }

  function handleDragOver(e: React.DragEvent, pos: number) {
    e.preventDefault();
    setOverIdx(pos);
  }

  function handleDrop(pos: number) {
    if (dragItem.current === null || dragItem.current === pos) {
      setDraggingIdx(null);
      setOverIdx(null);
      return;
    }
    moveItem(dragItem.current, pos);
    setDraggingIdx(null);
    setOverIdx(null);
    dragItem.current = null;
  }

  function handleDragEnd() {
    setDraggingIdx(null);
    setOverIdx(null);
    dragItem.current = null;
  }

  // Touch support
  const touchStart = useRef<number | null>(null);
  const touchTarget = useRef<number | null>(null);

  function handleTouchStart(pos: number) {
    touchStart.current = pos;
  }

  function handleTouchEnd(pos: number) {
    if (touchStart.current !== null && touchStart.current !== pos) {
      const newOrder = [...currentOrder];
      const [moved] = newOrder.splice(touchStart.current, 1);
      newOrder.splice(pos, 0, moved);
      onReorder(newOrder);
    }
    touchStart.current = null;
    touchTarget.current = null;
  }

  return (
    <div className="bg-white rounded-xl border border-green-100 shadow-sm p-6">
      <div className="flex items-start gap-3 mb-5">
        <span className="flex-shrink-0 w-8 h-8 rounded-full bg-green-700 text-white flex items-center justify-center text-sm font-semibold">
          {questionNumber}
        </span>
        <div className="flex-1">
          <p className="text-gray-800 font-medium leading-relaxed">
            {question.question}
          </p>
          <span className="inline-block mt-1 text-xs text-green-700 font-semibold bg-green-50 px-2 py-0.5 rounded-full">
            {question.points} ball • Tartiblang
          </span>
        </div>
      </div>

      <div className="space-y-2 font-mono text-sm">
        {currentOrder.map((lineIdx, pos) => (
          <div
            key={lineIdx}
            draggable
            onDragStart={() => handleDragStart(pos)}
            onDragOver={(e) => handleDragOver(e, pos)}
            onDrop={() => handleDrop(pos)}
            onDragEnd={handleDragEnd}
            onTouchStart={() => handleTouchStart(pos)}
            onTouchEnd={() => handleTouchEnd(pos)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 cursor-grab active:cursor-grabbing transition-colors select-none ${draggingIdx === pos
                ? "opacity-40 border-green-700 bg-green-50"
                : overIdx === pos
                  ? "border-green-700 bg-green-50 shadow-md"
                  : "border-gray-200 bg-gray-50 hover:border-green-300"
              }`}
          >
            <GripVertical size={16} className="text-gray-400 flex-shrink-0" />
            <span className="text-gray-500 w-5 text-xs font-sans font-bold">{pos + 1}.</span>
            <span className="text-gray-800 flex-1 text-xs sm:text-sm">{question.tokens[lineIdx]}</span>
            <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                disabled={pos === 0}
                onClick={() => moveItem(pos, pos - 1)}
                className="p-1 rounded-md text-gray-400 hover:text-green-800 hover:bg-green-100/70 disabled:opacity-20 disabled:hover:bg-transparent transition-colors cursor-pointer"
                title="Yuqoriga surish"
              >
                <ChevronUp size={14} />
              </button>
              <button
                type="button"
                disabled={pos === currentOrder.length - 1}
                onClick={() => moveItem(pos, pos + 1)}
                className="p-1 rounded-md text-gray-400 hover:text-green-800 hover:bg-green-100/70 disabled:opacity-20 disabled:hover:bg-transparent transition-colors cursor-pointer"
                title="Pastga surish"
              >
                <ChevronDown size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <QuestionHint hint={question.hint} />
    </div>
  );
}
