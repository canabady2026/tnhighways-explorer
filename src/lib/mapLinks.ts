import { withBasePath } from "./basePath";
import { EMPTY_FILTERS, type FiltersState } from "./filters";

/**
 * Full-page/full-window map views are opened as plain URLs (new tab), not
 * client-side navigation -- a fresh tab has no app state, so everything
 * the view needs is round-tripped through the query string instead.
 */

const FILTER_KEYS: (keyof FiltersState)[] = [
  "circle",
  "division",
  "subDivision",
  "roadNumber",
  "q",
  "totalKmMin",
  "totalKmMax",
  "sort",
];

export function buildSingleRoadMapUrl(roadNumber: string): string {
  const params = new URLSearchParams({ map: roadNumber });
  return `${withBasePath("/")}?${params.toString()}`;
}

export function buildResultsMapUrl(filters: FiltersState): string {
  const params = new URLSearchParams({ mapResults: "1" });
  for (const key of FILTER_KEYS) {
    if (filters[key]) params.set(key, filters[key]);
  }
  return `${withBasePath("/")}?${params.toString()}`;
}

/**
 * The most specific selected geography, or null if none of circle,
 * division, sub-division is set. Used to scope an Overpass Turbo
 * {{geocodeArea:...}}, which needs one place name, not our full filter set.
 *
 * Appending "District" measurably improves Nominatim's resolution for
 * *division*-level names to the actual admin boundary relation rather than
 * an arbitrary town/POI of the same name (verified: Chengalpattu,
 * Kanchipuram, Coimbatore all resolve correctly with it) -- PWD divisions
 * are usually coterminous with revenue districts. Circle and sub-division
 * names aren't districts, so it's skipped there. This still isn't
 * foolproof: our data's spelling doesn't always match OSM's canonical name
 * (e.g. our "Villupuram" vs. OSM's "Viluppuram"), and Nominatim can pick
 * an unrelated result either way -- since this opens the fully-editable
 * overpass-turbo.eu page, a wrong geocodeArea is easy to fix there by hand.
 */
export function overpassAreaName(filters: FiltersState): string | null {
  if (filters.subDivision) return `${filters.subDivision}, Tamil Nadu, India`;
  if (filters.division) return `${filters.division} District, Tamil Nadu, India`;
  if (filters.circle) return `${filters.circle}, Tamil Nadu, India`;
  return null;
}

/**
 * All state/major-district/other-district/national highway route ways
 * within the named area, colored by OSM highway= classification -- opens
 * directly in overpass-turbo.eu (editable there), rather than our own
 * capped/rate-limited in-app map, since Overpass Turbo handles a whole
 * area's roads far better than fetching each road individually.
 */
export function buildOverpassTurboUrl(areaName: string): string {
  const query = `[out:json][timeout:25];

{{geocodeArea:${areaName}}}->.searchArea;

way(area.searchArea)["ref"~"^(NH|SH|MDR|O)"];
(._;>;);
out geom;




{{style:

node,relation {

}

way[highway=trunk]
{ color:orange; fill-color:orange; width:8;}

way[highway=primary]
{ color:#0B5345; fill-color:#0B5345; width:6;}

way[highway=secondary]
{
  text: eval("any(tag('ref'),tag('name'))");
  color:#0000ff ; fill-color:#2874A6 ; width:4;
}

way[highway=tertiary]
{
  text: eval("any(tag('ref'),tag('name'))");
  color:brown; fill-color:brown; width:2;
}
}}`;

  return `https://overpass-turbo.eu/?Q=${encodeURIComponent(query)}&R`;
}

export type Route =
  | { mode: "single"; roadNumber: string }
  | { mode: "results"; filters: FiltersState }
  | { mode: "dashboard" };

export function parseRoute(search: string): Route {
  const params = new URLSearchParams(search);

  const mapRoad = params.get("map");
  if (mapRoad) return { mode: "single", roadNumber: mapRoad };

  if (params.get("mapResults")) {
    const filters: FiltersState = { ...EMPTY_FILTERS };
    for (const key of FILTER_KEYS) {
      const value = params.get(key);
      if (value) filters[key] = value;
    }
    return { mode: "results", filters };
  }

  return { mode: "dashboard" };
}
