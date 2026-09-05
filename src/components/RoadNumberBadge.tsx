import { classifyRoadNumber } from "@/lib/roadNumberStyle";

const SIZE_CLASSES = {
  sm: "px-2 py-0.5 text-xs",
  lg: "px-3 py-1 text-base",
} as const;

interface Props {
  roadNumber: string;
  size?: keyof typeof SIZE_CLASSES;
}

export function RoadNumberBadge({ roadNumber, size = "sm" }: Props) {
  const { className } = classifyRoadNumber(roadNumber);
  return (
    <span
      className={`inline-flex items-center rounded-full border font-bold whitespace-nowrap ${SIZE_CLASSES[size]} ${className}`}
    >
      {roadNumber}
    </span>
  );
}
