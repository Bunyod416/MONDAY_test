import { Info } from "lucide-react";
import CodeEditor from "./CodeEditor";
import QuestionHint from "./QuestionHint";
import { langForCategory } from "../utils/answerMatch";
import type { Question } from "../utils/data/questions";
import type { SessionAnswer } from "../utils/session";

type Props = {
    question: Exclude<Question, { type: "mcq" } | { type: "drag" }>;
    questionNumber: number;
    answer: SessionAnswer;
    onAnswer: (answer: SessionAnswer) => void;
};

export default function QuestionResponseCard({ question, questionNumber, answer, onAnswer }: Props) {
    const textValue = answer.type === "code" || answer.type === "fix" ? answer.value : "";
    const selected = answer.type === "truefalse" ? answer.selected : null;

    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
            <div className="mb-5 flex items-start gap-3">
                <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-green-700 text-xs font-semibold text-white">
                    {questionNumber}
                </span>
                <div className="flex-1">
                    <p className="whitespace-pre-wrap font-medium leading-relaxed text-gray-800">
                        {question.question}
                    </p>
                    <span className="mt-2 inline-block rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                        {question.points} ball
                    </span>
                </div>
            </div>

            {question.type === "fix" && (
                <div className="mb-3">
                    <p className="mb-1.5 text-xs font-medium text-gray-500">Xatoli kod:</p>
                    <pre className="overflow-x-auto rounded-lg border border-gray-200 bg-gray-100 p-3 font-mono text-xs leading-5 text-gray-700">
                        {question.brokenCode}
                    </pre>
                </div>
            )}

            {question.type === "truefalse" ? (
                <div className="grid grid-cols-2 gap-3">
                    {[true, false].map((option) => (
                        <button
                            key={String(option)}
                            onClick={() => onAnswer({ type: "truefalse", selected: option })}
                            aria-pressed={selected === option}
                            className={`rounded-lg border p-3 text-sm font-medium transition-colors ${selected === option
                                ? "border-green-600 bg-green-50 text-green-800"
                                : "border-gray-200 text-gray-600 hover:bg-gray-50"
                                }`}
                        >
                            {option ? "To'g'ri" : "Noto'g'ri"}
                        </button>
                    ))}
                </div>
            ) : (
                <>
                    <CodeEditor
                        value={textValue}
                        onChange={(value) => onAnswer({ type: question.type as "code" | "fix", value })}
                        lang={langForCategory(question.category)}
                        placeholder={question.type === "code" ? question.placeholder : "To'g'rilangan kodni shu yerga yozing"}
                        minLines={question.type === "fix" ? 6 : 5}
                        ariaLabel={`${questionNumber}-savol javobi`}
                    />

                    {/* Baholash qoidasini oldindan aytib qo'yamiz — talaba
                        chekinish va qo'shtirnoq ustida bosh qotirmasin. */}
                    <p className="mt-2 flex items-start gap-1.5 text-xs leading-relaxed text-gray-500">
                        <Info size={13} className="mt-0.5 flex-shrink-0" aria-hidden />
                        Bo'shliq, chekinish va qo'shtirnoq turi (<code className="font-mono">'</code> yoki{" "}
                        <code className="font-mono">"</code>) hisobga olinmaydi. Tab — chekinish,
                        Ctrl+Space — takliflar.
                    </p>
                </>
            )}

            <QuestionHint hint={question.hint} />
        </div>
    );
}
