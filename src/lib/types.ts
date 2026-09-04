import type { Column, Op } from "./schema";

export interface FilterClause {
  column: Column;
  op: Op;
  // string | string[] (in) | number | [number, number] (between)
  value: string | string[] | number | [number, number];
}

export interface RoadsQuery {
  filters: FilterClause[];
  q?: string;
  sort?: string; // column, or "-column" for descending
  limit: number;
  offset: number;
  fields?: Column[];
}

export interface Road {
  circle: string;
  division: string;
  sub_division: string;
  road_number: string;
  road_name: string;
  start_km: number;
  end_km: number;
  total_km: number;
}

export interface Pagination {
  limit: number;
  offset: number;
  returned: number;
  total: number;
  next_offset: number | null;
}

export interface RoadsResult {
  data: Road[];
  pagination: Pagination;
}

export interface RoadDetail {
  road_number: string;
  segment_count: number;
  total_km: number;
  segments: Road[];
}

export interface Circle {
  id: number;
  name: string;
}

export interface Division {
  id: number;
  name: string;
  circle: string;
}

export interface SubDivision {
  id: number;
  name: string;
  division: string;
  circle: string;
}

export interface StatsRow {
  group_value: string;
  segment_count: number;
  total_km: number;
}

export type TextGroupColumn = "circle" | "division" | "sub_division" | "road_number" | "road_name";

/** Implemented by both the AWS API client and the client-side SQLite fallback. */
export interface DataSource {
  kind: "api" | "sqlite";
  queryRoads(query: RoadsQuery): Promise<RoadsResult>;
  getRoadByNumber(roadNumber: string): Promise<RoadDetail | null>;
  getCircles(): Promise<Circle[]>;
  getDivisions(circle?: string): Promise<Division[]>;
  getSubDivisions(circle?: string, division?: string): Promise<SubDivision[]>;
  getStats(groupBy: TextGroupColumn): Promise<StatsRow[]>;
}
