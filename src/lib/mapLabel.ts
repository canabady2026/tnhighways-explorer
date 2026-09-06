/** Leaflet popup/tooltip content is rendered as HTML, not plain text, so
 * any dynamic value has to be escaped -- otherwise a name containing
 * "&"/"<"/">" would break the markup. */
export function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function joinDistinct(values: string[]): string {
  return Array.from(new Set(values)).join(", ");
}

/** Road number large and bold (colored per its SH/MDR/ODR/NH
 * classification), road name below, then sub-division/division/circle --
 * each joined into one line since a single road_number can span more than
 * one of each. Used for both the single-road map's popup and the
 * multi-road results map's per-line tooltips. */
export function buildRoadLabelHtml(opts: {
  roadNumber: string;
  roadName: string;
  subDivisions: string[];
  divisions: string[];
  circles: string[];
  strokeColor: string;
}): string {
  const { roadNumber, roadName, subDivisions, divisions, circles, strokeColor } = opts;
  return `
    <div style="font-size:1.25em;font-weight:700;color:${strokeColor};line-height:1.3;">${escapeHtml(roadNumber)}</div>
    <div style="font-size:0.95em;">${escapeHtml(roadName)}</div>
    <div style="font-size:0.8em;color:#64748b;margin-top:2px;">${escapeHtml(joinDistinct(subDivisions))}</div>
    <div style="font-size:0.8em;color:#64748b;">${escapeHtml(joinDistinct(divisions))}</div>
    <div style="font-size:0.8em;color:#64748b;">${escapeHtml(joinDistinct(circles))}</div>
  `;
}
