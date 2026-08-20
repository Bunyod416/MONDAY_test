export default function ExamHeaderSVG({ studentName }: { studentName: string }) {
  // Generate barcode bars from student name for visual uniqueness
  const bars: number[] = [];
  const seed = studentName + "EXAM2024";
  for (let i = 0; i < 60; i++) {
    const c = seed.charCodeAt(i % seed.length);
    bars.push(((c * (i + 7)) % 4) + 1);
  }

  return (
    <div className="relative bg-[#006400] text-white py-4 px-6 overflow-hidden">
      {/* Pixel corners */}
      <div className="absolute top-0 left-0 w-5 h-5 border-t-4 border-l-4 border-white" />
      <div className="absolute top-0 right-0 w-5 h-5 border-t-4 border-r-4 border-white" />
      <div className="absolute bottom-0 left-0 w-5 h-5 border-b-4 border-l-4 border-white" />
      <div className="absolute bottom-0 right-0 w-5 h-5 border-b-4 border-r-4 border-white" />

      <div className="flex items-center justify-between max-w-5xl mx-auto">
        {/* Left: Title */}
        <div>
          <h1 className="text-2xl font-bold tracking-widest uppercase">
            Web Development
          </h1>
          <p className="text-green-200 text-sm tracking-wider mt-0.5">
            Yakuniy Imtihon / Final Exam
          </p>
        </div>

        {/* Center: barcode SVG */}
        <div className="flex flex-col items-center">
          <svg
            width="140"
            height="40"
            viewBox="0 0 140 40"
            className="bg-white rounded px-1"
          >
            {bars.reduce(
              (acc, width, i) => {
                const x = acc.x;
                const fill = i % 2 === 0 ? "#000" : "#fff";
                acc.elements.push(
                  <rect key={i} x={x} y={2} width={width} height={36} fill={fill} />
                );
                acc.x += width;
                return acc;
              },
              { x: 2, elements: [] as React.ReactElement[] }
            ).elements}
          </svg>
          <span className="text-green-200 text-xs mt-1 font-mono tracking-widest">
            {seed.slice(0, 12).toUpperCase()}
          </span>
        </div>

        {/* Right: exam info */}
        <div className="text-right">
          <p className="text-white font-semibold text-sm">
            {studentName || "Talaba"}
          </p>
          <p className="text-green-200 text-xs mt-0.5">
            {new Date().toLocaleDateString("uz-UZ")}
          </p>
          <p className="text-green-200 text-xs">HTML • CSS • JavaScript | 30 savol • 120 ball</p>
        </div>
      </div>
    </div>
  );
}
