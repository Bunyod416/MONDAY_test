import type { Question } from "../utils/data/questions";
import type { SessionAnswer } from "../utils/session";

type Props = {
    question: Exclude<Question, { type: "mcq" } | { type: "drag" }>;
    questionNumber: number;
    answer: SessionAnswer;
    onAnswer: (answer: SessionAnswer) => void;
};

export default function QuestionResponseCard({ question, questionNumber, answer, onAnswer }: Props) {
    const value = answer.type === "truefalse"
        ? answer.selected
        : answer.type === "code" || answer.type === "fix"
            ? answer.value
            : "";

    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-start gap-3 mb-5">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center text-sm font-medium">
                    {questionNumber}
                </span>
                <div className="flex-1">
                    <p className="text-gray-700 font-medium leading-relaxed whitespace-pre-wrap">{question.question}</p>
                    <span className="inline-block mt-2 text-xs text-green-600 font-medium bg-green-50 px-2.5 py-1 rounded-full">
                        {question.points} ball
                    </span>
                </div>
            </div>

            {question.type === "truefalse" ? (
                <div className="grid grid-cols-2 gap-3">
                    {[true, false].map((option) => (
                        <button
                            key={String(option)}
                            onClick={() => onAnswer({ type: "truefalse", selected: option })}
                            className={`p-3 rounded-xl border text-sm font-semibold transition-all ${value === option ? "border-green-300 bg-green-50 text-green-700" : "border-gray-100 hover:bg-gray-50 text-gray-600"}`}
                        >
                            {option ? "To‘g‘ri" : "Noto‘g‘ri"}
                        </button>
                    ))}
                </div>
            ) : (
                <textarea
                    value={typeof value === "string" ? value : ""}
                    onChange={(event) => onAnswer({ type: question.type, value: event.target.value })}
                    placeholder={question.type === "code" ? question.placeholder : "To‘g‘rilangan kodni shu yerga yozing"}
                    rows={question.type === "fix" ? 7 : 5}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 font-mono text-sm text-gray-800 focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-100"
                />
            )}

            {question.type === "fix" && (
                <pre className="mt-3 overflow-x-auto rounded-xl bg-gray-900 p-3 text-xs text-green-200">{question.brokenCode}</pre>
            )}
        </div>
    );
}
