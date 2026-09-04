import type { FilterClause } from "./types";

export interface FiltersState {
  circle: string;
  division: string;
  subDivision: string;
  roadNumber: string;
  q: string;
  totalKmMin: string;
  totalKmMax: string;
  sort: string; // "" | column | "-column"
}

export const EMPTY_FILTERS: FiltersState = {
  circle: "",
  division: "",
  subDivision: "",
  roadNumber: "",
  q: "",
  totalKmMin: "",
  totalKmMax: "",
  sort: "",
};

export function toFilterClauses(f: FiltersState): FilterClause[] {
  const clauses: FilterClause[] = [];

  if (f.circle) clauses.push({ column: "circle", op: "eq", value: f.circle });
  if (f.division) clauses.push({ column: "division", op: "eq", value: f.division });
  if (f.subDivision) clauses.push({ column: "sub_division", op: "eq", value: f.subDivision });
  if (f.roadNumber) clauses.push({ column: "road_number", op: "contains", value: f.roadNumber });

  const min = f.totalKmMin ? Number(f.totalKmMin) : null;
  const max = f.totalKmMax ? Number(f.totalKmMax) : null;
  if (min !== null && !Number.isNaN(min) && max !== null && !Number.isNaN(max)) {
    clauses.push({ column: "total_km", op: "between", value: [min, max] });
  } else if (min !== null && !Number.isNaN(min)) {
    clauses.push({ column: "total_km", op: "gte", value: min });
  } else if (max !== null && !Number.isNaN(max)) {
    clauses.push({ column: "total_km", op: "lte", value: max });
  }

  return clauses;
}

export function hasActiveFilters(f: FiltersState): boolean {
  return Object.entries(f).some(([key, value]) => key !== "sort" && value !== "");
}
