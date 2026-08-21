import QuestionHint from "./QuestionHint";
import type { MCQQuestion } from "../utils/data/questions";

type Props = {
  question: MCQQuestion;
  questionNumber: number;
  optionOrder: number[];
  selectedOption: number | null;
  onSelect: (optionIndex: number) => void;
};

export default function MCQQuestionCard({
  question,
  questionNumber,
  optionOrder,
  selectedOption,
  onSelect,
}: Props) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6">
      <div className="flex items-start gap-3 mb-5">
        <span className="flex-shrink-0 w-8 h-8 rounded-full bg-green-700 text-white flex items-center justify-center text-sm font-medium">
          {questionNumber}
        </span>

        <div className="flex-1">
          <p className="text-gray-700 font-medium leading-relaxed whitespace-pre-wrap">
            {question.question}
          </p>

          <span className="inline-block mt-2 text-xs text-green-600 font-medium bg-green-50 px-2.5 py-1 rounded-full">
            {question.points} ball
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {optionOrder.map((originalIndex, displayPos) => {
          const label = String.fromCharCode(65 + displayPos);
          const isSelected = selectedOption === originalIndex;

          return (
            <button
              key={originalIndex}
              onClick={() => onSelect(originalIndex)}
              className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-colors ${
                isSelected
                  ? "border-green-200 bg-green-50"
                  : "border-gray-100 bg-white hover:bg-gray-50"
              }`}
            >
              <span
                className={`flex-shrink-0 w-7 h-7 rounded-full border flex items-center justify-center text-xs font-medium transition-colors ${
                  isSelected
                    ? "border-green-700 bg-green-700 text-white"
                    : "border-gray-200 text-gray-400"
                }`}
              >
                {label}
              </span>

              <span
                className={`text-sm leading-snug ${
                  isSelected
                    ? "text-green-700"
                    : "text-gray-600"
                }`}
              >
                {question.options[originalIndex]}
              </span>
            </button>
          );
        })}
      </div>

      <QuestionHint hint={question.hint} />
    </div>
  );
}