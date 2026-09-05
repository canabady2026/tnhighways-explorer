/**
 * Road classification by road_number prefix. In this dataset MDR and ODR
 * are encoded as bare "M" / "O" prefixes (e.g. "M581", "O10161") rather
 * than spelled out -- there is currently no "NH" prefix in the TN PWD
 * roster at all, but it's wired in for when/if national highways appear.
 */
export interface RoadClass {
  category: string;
  className: string;
}

const CLASSES = {
  NH: { category: "NH", className: "bg-orange-50 text-orange-700 border-orange-200" },
  SH: { category: "SH", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  MDR: { category: "MDR", className: "bg-blue-50 text-blue-700 border-blue-200" },
  ODR: { category: "ODR", className: "bg-pink-50 text-pink-700 border-pink-200" },
  OTHER: { category: "Other", className: "bg-slate-50 text-slate-700 border-slate-200" },
} as const;

export function classifyRoadNumber(roadNumber: string): RoadClass {
  const upper = roadNumber.toUpperCase();
  if (upper.startsWith("NH")) return CLASSES.NH;
  if (upper.startsWith("SH")) return CLASSES.SH;
  if (upper.startsWith("MDR")) return CLASSES.MDR;
  if (upper.startsWith("ODR")) return CLASSES.ODR;
  if (upper.startsWith("M")) return CLASSES.MDR;
  if (upper.startsWith("O")) return CLASSES.ODR;
  return CLASSES.OTHER;
}
