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
