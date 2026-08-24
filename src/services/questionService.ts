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

    return data.map((row: any): Question => {
      let answerVal = row.answer;
      if (row.type === "truefalse") {
        answerVal = row.answer === "true" || row.answer === true;
      }

      return {
        id: Number(row.id),
        type: row.type,
        category: row.category,
        topic: row.topic,
        question: row.question,
        options: row.options || undefined,
        answer: answerVal,
        hint: row.hint || "",
        points: Number(row.points) || 1,
        placeholder: row.placeholder || undefined,
        accepted: row.accepted || undefined,
        tokens: row.tokens || undefined,
        correctOrder: row.correct_order || row.correctOrder || undefined,
        brokenCode: row.broken_code || row.brokenCode || undefined,
      } as Question;
    });
  } catch (err) {
    console.error("Failed to load questions from Supabase, using local:", err);
    return defaultQuestions;
  }
}
