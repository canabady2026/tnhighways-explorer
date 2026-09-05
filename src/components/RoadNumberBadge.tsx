import { classifyRoadNumber } from "@/lib/roadNumberStyle";

export function RoadNumberBadge({ roadNumber }: { roadNumber: string }) {
  const { className } = classifyRoadNumber(roadNumber);
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-bold whitespace-nowrap ${className}`}
    >
      {roadNumber}
    </span>
  );
}
