/**
 * Road classification by road_number prefix. In this dataset MDR and ODR
 * are encoded as bare "M" / "O" prefixes (e.g. "M581", "O10161") rather
 * than spelled out -- there is currently no "NH" prefix in the TN PWD
 * roster at all, but it's wired in for when/if national highways appear.
 */
export interface RoadClass {
  category: string;
  className: string;
  /** Matches the badge's text color (Tailwind "-700" shade), for the Leaflet map line. */
  strokeColor: string;
}

const CLASSES = {
  NH: { category: "NH", className: "bg-orange-50 text-orange-700 border-orange-200", strokeColor: "#c2410c" },
  SH: { category: "SH", className: "bg-emerald-50 text-emerald-700 border-emerald-200", strokeColor: "#047857" },
  MDR: { category: "MDR", className: "bg-blue-50 text-blue-700 border-blue-200", strokeColor: "#1d4ed8" },
  ODR: { category: "ODR", className: "bg-pink-50 text-pink-700 border-pink-200", strokeColor: "#be185d" },
  OTHER: { category: "Other", className: "bg-slate-50 text-slate-700 border-slate-200", strokeColor: "#334155" },
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
