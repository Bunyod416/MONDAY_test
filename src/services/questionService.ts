import { supabase } from "../utils/supabase";
import { questions as defaultQuestions, type Question } from "../utils/data/questions";

export async function fetchQuestions(): Promise<Question[]> {
  try {
    const { data, error } = await supabase
      .from("questions")
      .select("*")
      .order("id", { ascending: true });

    if (error || !data || data.length === 0) {
      console.warn("Supabase questions fetch fallback to local:", error);
      return defaultQuestions;
    }

    return data.map((row: Record<string, unknown>): Question => {
      let answerVal = row.answer;
      if (row.type === "truefalse") {
        answerVal = row.answer === "true" || row.answer === true;
      }

      return {
        id: Number(row.id),
        type: row.type as Question["type"],
        category: row.category as Question["category"],
        topic: String(row.topic || ""),
        question: String(row.question || ""),
        options: (row.options as string[] | undefined) || undefined,
        answer: answerVal,
        hint: String(row.hint || ""),
        points: Number(row.points) || 1,
        placeholder: (row.placeholder as string | undefined) || undefined,
        accepted: (row.accepted as string[] | undefined) || undefined,
        tokens: (row.tokens as string[] | undefined) || undefined,
        correctOrder: (row.correct_order || row.correctOrder) as string[] | undefined,
        brokenCode: (row.broken_code || row.brokenCode) as string | undefined,
      } as unknown as Question;
    });
  } catch (err) {
    console.error("Failed to load questions from Supabase, using local:", err);
    return defaultQuestions;
  }
}
