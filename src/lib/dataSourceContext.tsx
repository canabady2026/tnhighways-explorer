"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import useSWR from "swr";
import { ApiDataSource, isApiHealthy } from "./api";
import { SqliteDataSource } from "./sqlite";
import type { DataSource } from "./types";

export const DEFAULT_API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://au80g7fdk7.execute-api.ap-south-1.amazonaws.com";

type Status = "checking" | "api" | "sqlite" | "sqlite-load-error";

interface Ctx {
  source: DataSource | null;
  status: Status;
  error: string | null;
  retryApi: () => void;
}

const DataSourceCtx = createContext<Ctx | null>(null);

const sqliteSource = new SqliteDataSource();

interface Detection {
  status: Extract<Status, "api" | "sqlite" | "sqlite-load-error">;
  error: string | null;
}

async function detectDataSource(): Promise<Detection> {
  if (await isApiHealthy(DEFAULT_API_BASE_URL)) {
    return { status: "api", error: null };
  }
  // API unreachable -- fall back to the bundled SQLite database. Just
  // probing readiness here; queryRoads() etc. lazily (re-)load it for real.
  try {
    await sqliteSource.getCircles();
    return { status: "sqlite", error: null };
  } catch (err) {
    return { status: "sqlite-load-error", error: err instanceof Error ? err.message : String(err) };
  }
}

export function DataSourceProvider({ children }: { children: ReactNode }) {
  const { data, isLoading, mutate } = useSWR("data-source-detect", detectDataSource);

  const status: Status = isLoading || !data ? "checking" : data.status;
  const error = data?.error ?? null;

  const source = useMemo<DataSource | null>(() => {
    if (status === "api") return new ApiDataSource(DEFAULT_API_BASE_URL);
    if (status === "sqlite") return sqliteSource;
    return null;
  }, [status]);

  const value = useMemo<Ctx>(
    () => ({ source, status, error, retryApi: () => mutate() }),
    [source, status, error, mutate]
  );

  return <DataSourceCtx.Provider value={value}>{children}</DataSourceCtx.Provider>;
}

export function useDataSource() {
  const ctx = useContext(DataSourceCtx);
  if (!ctx) throw new Error("useDataSource must be used within a DataSourceProvider");
  return ctx;
}
