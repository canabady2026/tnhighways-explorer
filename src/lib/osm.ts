/**
 * Maps a road to its OpenStreetMap route relation, per the tagging schemes
 * documented at:
 *   https://wiki.openstreetmap.org/wiki/Tamil_Nadu-SH   (network=IN:SH:TN,  ref=SH#)
 *   https://wiki.openstreetmap.org/wiki/Tamil_Nadu-MDR  (network=IN:MDR:TN, ref=MDR#)
 *   https://wiki.openstreetmap.org/wiki/Tamil_Nadu-ODR  (network=IN:ODR:TN, ref=O#)
 *   https://wiki.openstreetmap.org/wiki/Tamil_Nadu-NH   (ref=NH#)
 *
 * Our dataset's road_number uses a bare "M"/"O" prefix (e.g. "M581",
 * "O10161") rather than OSM's spelled-out "MDR581" -- SH and (as it
 * happens) O already match OSM's ref format directly, but M needs
 * rewriting to MDR before it'll match anything in OSM.
 */
export function toOsmRef(roadNumber: string): string | null {
  const upper = roadNumber.toUpperCase().trim();
  if (upper.startsWith("NH")) return upper;
  if (upper.startsWith("SH")) return upper;
  if (upper.startsWith("MDR")) return upper;
  if (upper.startsWith("ODR")) return upper;
  if (upper.startsWith("M")) return `MDR${upper.slice(1)}`;
  if (upper.startsWith("O")) return upper;
  return null; // e.g. the "C" prefix bucket -- no known OSM tagging scheme
}

export interface LatLon {
  lat: number;
  lon: number;
}

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";

// Tamil Nadu's bounding box. A plain bbox filter is dramatically faster on
// the shared public Overpass instance than resolving an admin-boundary
// `area` for the whole state, and comfortably avoids false matches from
// other states since these ref codes aren't reused nationally.
const TN_BBOX = "8.0,76.0,13.6,80.5";

export class OsmUnavailableError extends Error {}

/** Returns one array of {lat,lon} points per OSM way in the road's route relation. */
export async function fetchOsmWays(ref: string): Promise<LatLon[][]> {
  const safeRef = ref.replace(/["\\]/g, "");
  const query = `[out:json][timeout:25];
rel(${TN_BBOX})["type"="route"]["route"="road"]["ref"="${safeRef}"]->.r;
way(r.r);
out geom;`;

  let res: Response;
  try {
    res = await fetch(OVERPASS_URL, {
      method: "POST",
      body: `data=${encodeURIComponent(query)}`,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
  } catch {
    throw new OsmUnavailableError("network error reaching Overpass API");
  }

  if (res.status === 429 || res.status === 504) {
    throw new OsmUnavailableError(`Overpass API is busy (${res.status})`);
  }
  if (!res.ok) {
    throw new OsmUnavailableError(`Overpass API request failed: ${res.status}`);
  }

  const json = await res.json();
  const elements = (json.elements ?? []) as Array<{
    type: string;
    geometry?: Array<{ lat: number; lon: number }>;
  }>;

  return elements
    .filter((el) => el.type === "way" && Array.isArray(el.geometry) && el.geometry.length > 1)
    .map((el) => el.geometry!.map((pt) => ({ lat: pt.lat, lon: pt.lon })));
}
