import type {
  Circle,
  DataSource,
  Division,
  RoadDetail,
  RoadsQuery,
  RoadsResult,
  StatsRow,
  SubDivision,
  TextGroupColumn,
} from "./types";

/** Translates a RoadsQuery into the API's `col__op=value` filter DSL (see tnhighways-api/src/db.py). */
function buildParams(query: RoadsQuery): URLSearchParams {
  const params = new URLSearchParams();

  for (const { column, op, value } of query.filters) {
    const key = op === "eq" ? column : `${column}__${op}`;
    if (Array.isArray(value)) {
      params.set(key, value.join(","));
    } else {
      params.set(key, String(value));
    }
  }

  if (query.q) params.set("q", query.q);
  if (query.sort) params.set("sort", query.sort);
  if (query.fields?.length) params.set("fields", query.fields.join(","));
  params.set("limit", String(query.limit));
  params.set("offset", String(query.offset));

  return params;
}

export class ApiDataSource implements DataSource {
  readonly kind = "api" as const;

  constructor(private readonly baseUrl: string) {}

  private async getJson<T>(path: string): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message || `API request failed: ${res.status}`);
    }
    return res.json();
  }

  async queryRoads(query: RoadsQuery): Promise<RoadsResult> {
    return this.getJson(`/roads?${buildParams(query)}`);
  }

  async getRoadByNumber(roadNumber: string): Promise<RoadDetail | null> {
    try {
      return await this.getJson(`/roads/${encodeURIComponent(roadNumber)}`);
    } catch {
      return null;
    }
  }

  async getCircles(): Promise<Circle[]> {
    const { data } = await this.getJson<{ data: Circle[] }>("/circles");
    return data;
  }

  async getDivisions(circle?: string): Promise<Division[]> {
    const params = circle ? `?circle=${encodeURIComponent(circle)}` : "";
    const { data } = await this.getJson<{ data: Division[] }>(`/divisions${params}`);
    return data;
  }

  async getSubDivisions(circle?: string, division?: string): Promise<SubDivision[]> {
    const params = new URLSearchParams();
    if (circle) params.set("circle", circle);
    if (division) params.set("division", division);
    const qs = params.toString();
    const { data } = await this.getJson<{ data: SubDivision[] }>(`/sub-divisions${qs ? `?${qs}` : ""}`);
    return data;
  }

  async getStats(groupBy: TextGroupColumn): Promise<StatsRow[]> {
    const { data } = await this.getJson<{ data: StatsRow[] }>(`/stats?group_by=${groupBy}`);
    return data;
  }
}

export async function isApiHealthy(baseUrl: string, timeoutMs = 4000): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${baseUrl}/health`, { signal: controller.signal });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}
