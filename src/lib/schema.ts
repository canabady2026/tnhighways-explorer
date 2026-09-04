/**
 * Mirrors tnhighways-api/src/schema.py — the single source of truth for
 * which columns are filterable and what operators they support. Kept in
 * sync by hand since the two projects don't share a build; if the API's
 * schema changes, update this file to match.
 */

export type Column =
  | "circle"
  | "division"
  | "sub_division"
  | "road_number"
  | "road_name"
  | "start_km"
  | "end_km"
  | "total_km";

export type TextOp = "eq" | "contains" | "in";
export type NumericOp = "eq" | "gt" | "gte" | "lt" | "lte" | "between";
export type Op = TextOp | NumericOp;

export interface ColumnInfo {
  type: "TEXT" | "REAL";
  ops: readonly Op[];
  label: string;
}

const TEXT_OPS: readonly TextOp[] = ["eq", "contains", "in"];
const NUMERIC_OPS: readonly NumericOp[] = ["eq", "gt", "gte", "lt", "lte", "between"];

export const COLUMNS: Record<Column, ColumnInfo> = {
  circle: { type: "TEXT", ops: TEXT_OPS, label: "Circle" },
  division: { type: "TEXT", ops: TEXT_OPS, label: "Division" },
  sub_division: { type: "TEXT", ops: TEXT_OPS, label: "Sub-Division" },
  road_number: { type: "TEXT", ops: TEXT_OPS, label: "Road Number" },
  road_name: { type: "TEXT", ops: TEXT_OPS, label: "Road Name" },
  start_km: { type: "REAL", ops: NUMERIC_OPS, label: "Start KM" },
  end_km: { type: "REAL", ops: NUMERIC_OPS, label: "End KM" },
  total_km: { type: "REAL", ops: NUMERIC_OPS, label: "Length (KM)" },
};

export const NUMERIC_COLUMNS: readonly Column[] = ["start_km", "end_km", "total_km"];

export const FREE_TEXT_COLUMNS: readonly Column[] = [
  "road_name",
  "road_number",
  "circle",
  "division",
  "sub_division",
];

export const DEFAULT_LIMIT = 25;
export const MAX_LIMIT = 500;

export function isNumericColumn(col: Column): boolean {
  return COLUMNS[col].type === "REAL";
}
