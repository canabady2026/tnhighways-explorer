import initSqlJs, { type Database, type SqlValue } from "sql.js";
import { withBasePath } from "./basePath";
import { COLUMNS, FREE_TEXT_COLUMNS, isNumericColumn, type Column } from "./schema";
import type {
  Circle,
  DataSource,
  Division,
  FilterClause,
  FilteredSummary,
  RoadDetail,
  RoadsQuery,
  RoadsResult,
  Road,
  StatsRow,
  SubDivision,
  TextGroupColumn,
} from "./types";

const TABLE = "highways";

/**
 * The source .db stores start_km/end_km/total_km with SQLite's TEXT
 * storage class (no column type was declared, and the loader inserted
 * numbers as strings). Comparing/sorting a TEXT value against a numeric
 * bind parameter does NOT coerce in SQLite, so every numeric column
 * reference is explicitly CAST to REAL here -- the same fix applied in
 * tnhighways-api/src/db.py::_col_expr. Skipping this silently produces
 * wrong filter/sort results.
 */
function colExpr(col: Column): string {
  return isNumericColumn(col) ? `CAST(${col} AS REAL)` : col;
}

function clauseFor(filter: FilterClause, params: SqlValue[]): string {
  const expr = colExpr(filter.column);
  const { op, value } = filter;

  switch (op) {
    case "eq":
      params.push(value as string | number);
      return typeof value === "string" ? `LOWER(${expr}) = LOWER(?)` : `${expr} = ?`;
    case "contains":
      params.push(`%${value}%`);
      return `${expr} LIKE ? COLLATE NOCASE`;
    case "in": {
      const values = (value as string[]).map((v) => v.toLowerCase());
      params.push(...values);
      return `LOWER(${expr}) IN (${values.map(() => "?").join(", ")})`;
    }
    case "gt":
    case "gte":
    case "lt":
    case "lte": {
      const sym = { gt: ">", gte: ">=", lt: "<", lte: "<=" }[op];
      params.push(value as number);
      return `${expr} ${sym} ?`;
    }
    case "between": {
      const [lo, hi] = value as [number, number];
      params.push(lo, hi);
      return `${expr} BETWEEN ? AND ?`;
    }
    default:
      throw new Error(`unsupported operator '${op}'`);
  }
}

function buildWhere(filters: FilterClause[], q?: string): { sql: string; params: SqlValue[] } {
  const params: SqlValue[] = [];
  const clauses = filters.map((f) => clauseFor(f, params));

  if (q) {
    const ors = FREE_TEXT_COLUMNS.map((col) => {
      params.push(`%${q}%`);
      return `${col} LIKE ? COLLATE NOCASE`;
    });
    clauses.push(`(${ors.join(" OR ")})`);
  }

  return { sql: clauses.length ? `WHERE ${clauses.join(" AND ")}` : "", params };
}

function selectExpr(col: Column): string {
  return `${colExpr(col)} AS ${col}`;
}

function rowsOf<T>(db: Database, sql: string, params: SqlValue[]): T[] {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const out: T[] = [];
  while (stmt.step()) out.push(stmt.getAsObject() as T);
  stmt.free();
  return out;
}

let dbPromise: Promise<Database> | null = null;

async function loadDb(): Promise<Database> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const SQL = await initSqlJs({ locateFile: () => withBasePath("/sql.js/sql-wasm.wasm") });
      const res = await fetch(withBasePath("/data/tnhighways_2025.db"));
      if (!res.ok) throw new Error(`failed to fetch bundled database: ${res.status}`);
      const buf = await res.arrayBuffer();
      return new SQL.Database(new Uint8Array(buf));
    })();
  }
  return dbPromise;
}

export class SqliteDataSource implements DataSource {
  readonly kind = "sqlite" as const;

  async queryRoads(query: RoadsQuery): Promise<RoadsResult> {
    const db = await loadDb();
    const { sql: whereSql, params } = buildWhere(query.filters, query.q);

    const [{ values }] = db.exec(`SELECT COUNT(*) FROM ${TABLE} ${whereSql}`, params);
    const total = Number(values[0][0]);

    const fields = query.fields?.length ? query.fields : (Object.keys(COLUMNS) as Column[]);
    const selectCols = fields.map(selectExpr).join(", ");
    const orderSql = sortExpr(query.sort);

    const data = rowsOf<Road>(
      db,
      `SELECT ${selectCols} FROM ${TABLE} ${whereSql} ORDER BY ${orderSql} LIMIT ? OFFSET ?`,
      [...params, query.limit, query.offset]
    );

    return {
      data,
      pagination: {
        limit: query.limit,
        offset: query.offset,
        returned: data.length,
        total,
        next_offset: query.offset + query.limit < total ? query.offset + query.limit : null,
      },
    };
  }

  async getRoadByNumber(roadNumber: string): Promise<RoadDetail | null> {
    const db = await loadDb();
    const selectCols = (Object.keys(COLUMNS) as Column[]).map(selectExpr).join(", ");
    const segments = rowsOf<Road>(
      db,
      `SELECT ${selectCols} FROM ${TABLE} WHERE LOWER(road_number) = LOWER(?) ORDER BY ${colExpr("start_km")}`,
      [roadNumber]
    );
    if (segments.length === 0) return null;
    const total_km = Math.round(segments.reduce((sum, s) => sum + s.total_km, 0) * 1000) / 1000;
    return { road_number: roadNumber, segment_count: segments.length, total_km, segments };
  }

  async getCircles(): Promise<Circle[]> {
    const db = await loadDb();
    return rowsOf<Circle>(db, "SELECT id, name FROM circle ORDER BY name", []);
  }

  async getDivisions(circle?: string): Promise<Division[]> {
    const db = await loadDb();
    const where = circle ? "WHERE c.name = ? COLLATE NOCASE" : "";
    return rowsOf<Division>(
      db,
      `SELECT d.id, d.name, c.name AS circle FROM division d
       JOIN circle c ON c.id = d.circle_id ${where}
       ORDER BY c.name, d.name`,
      circle ? [circle] : []
    );
  }

  async getSubDivisions(circle?: string, division?: string): Promise<SubDivision[]> {
    const db = await loadDb();
    const clauses: string[] = [];
    const params: SqlValue[] = [];
    if (circle) {
      clauses.push("c.name = ? COLLATE NOCASE");
      params.push(circle);
    }
    if (division) {
      clauses.push("d.name = ? COLLATE NOCASE");
      params.push(division);
    }
    const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
    return rowsOf<SubDivision>(
      db,
      `SELECT sd.id, sd.name, d.name AS division, c.name AS circle FROM sub_division sd
       JOIN division d ON d.id = sd.division_id
       JOIN circle c ON c.id = sd.circle_id
       ${where} ORDER BY c.name, d.name, sd.name`,
      params
    );
  }

  async getStats(groupBy: TextGroupColumn): Promise<StatsRow[]> {
    const db = await loadDb();
    return rowsOf<StatsRow>(
      db,
      `SELECT ${groupBy} AS group_value, COUNT(*) AS segment_count,
              ROUND(SUM(${colExpr("total_km")}), 3) AS total_km
       FROM ${TABLE} GROUP BY ${groupBy} ORDER BY total_km DESC`,
      []
    );
  }

  async getFilteredSummary(filters: FilterClause[], q?: string): Promise<FilteredSummary> {
    const db = await loadDb();
    const { sql: whereSql, params } = buildWhere(filters, q);
    const [row] = rowsOf<{ segment_count: number; total_km: number | null; distinct_road_count: number }>(
      db,
      `SELECT COUNT(*) AS segment_count,
              ROUND(SUM(${colExpr("total_km")}), 3) AS total_km,
              COUNT(DISTINCT road_number) AS distinct_road_count
       FROM ${TABLE} ${whereSql}`,
      params
    );
    return {
      segmentCount: row.segment_count,
      totalKm: row.total_km ?? 0,
      distinctRoadCount: row.distinct_road_count,
    };
  }
}

function sortExpr(sort?: string): string {
  if (!sort) return "ROWID";
  const desc = sort.startsWith("-");
  const col = (desc ? sort.slice(1) : sort) as Column;
  if (!(col in COLUMNS)) return "ROWID";
  return `${colExpr(col)} ${desc ? "DESC" : "ASC"}`;
}
