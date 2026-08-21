type Props = {
  studentName: string;
  /** Sessiyadagi haqiqiy savollar soni (ilgari "30" deb qattiq yozilgan edi). */
  totalQuestions: number;
  /** Sessiyadagi haqiqiy umumiy ball (ilgari "120" deb qattiq yozilgan edi). */
  totalPoints: number;
};

/**
 * Sarlavha ataylab sokin: bir qator rasmiy nom, bir qator kontekst.
 * Oldingi versiyada talaba ismidan charCode orqali "barcode" SVG chizilardi
 * va burchaklarga o'tkir `border-4` bezaklar qo'yilardi — ular yumaloq
 * kartalar bilan bir ekranda ikki xil dizayn tilini yaratardi.
 */
export default function ExamHeader({ studentName, totalQuestions, totalPoints }: Props) {
  return (
    <header className="bg-green-700 text-white">
      <div className="mx-auto flex max-w-3xl flex-wrap items-baseline gap-x-3 gap-y-1 px-4 py-3 sm:px-6">
        <h1 className="text-sm font-semibold tracking-wide">
          Web Development
        </h1>
        <span aria-hidden className="text-green-300">·</span>
        <p className="text-sm text-green-100">Yakuniy imtihon</p>

        <p className="ml-auto text-xs text-green-100">
          <span className="font-medium text-white">{studentName || "Talaba"}</span>
          <span aria-hidden className="mx-2 text-green-300">·</span>
          {totalQuestions} savol
          <span aria-hidden className="mx-2 text-green-300">·</span>
          {totalPoints} ball
        </p>
      </div>
    </header>
  );
}
