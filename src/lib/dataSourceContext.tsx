"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import useSWR from "swr";
import { ApiDataSource, isApiHealthy } from "./api";
import { SqliteDataSource } from "./sqlite";
import type { DataSource } from "./types";

export const DEFAULT_API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://au80g7fdk7.execute-api.ap-south-1.amazonaws.com";

/** "auto" health-checks the API and falls back to SQLite; "api"/"sqlite" force a backend. */
export type Mode = "auto" | "api" | "sqlite";
export type Status = "checking" | "api" | "sqlite" | "sqlite-load-error";

function envDefaultMode(): Mode {
  const configured = process.env.NEXT_PUBLIC_DATA_SOURCE_MODE;
  return configured === "api" || configured === "auto" ? configured : "sqlite";
}

interface Ctx {
  source: DataSource | null;
  status: Status;
  mode: Mode;
  setMode: (mode: Mode) => void;
  error: string | null;
  retryApi: () => void;
}

const DataSourceCtx = createContext<Ctx | null>(null);

const sqliteSource = new SqliteDataSource();
const apiSource = new ApiDataSource(DEFAULT_API_BASE_URL);

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
  const [mode, setMode] = useState<Mode>(envDefaultMode);

  // Only probed in "auto" mode -- a forced mode skips the health check
  // entirely and commits to that backend.
  const { data, isLoading, mutate } = useSWR(mode === "auto" ? "data-source-detect" : null, detectDataSource);

  const status: Status =
    mode === "api" ? "api" : mode === "sqlite" ? "sqlite" : isLoading || !data ? "checking" : data.status;
  const error = mode === "auto" ? (data?.error ?? null) : null;

  const source = useMemo<DataSource | null>(() => {
    if (status === "api") return apiSource;
    if (status === "sqlite") return sqliteSource;
    return null;
  }, [status]);

  const value = useMemo<Ctx>(
    () => ({ source, status, mode, setMode, error, retryApi: () => mutate() }),
    [source, status, mode, error, mutate]
  );

  return <DataSourceCtx.Provider value={value}>{children}</DataSourceCtx.Provider>;
}

export function useDataSource() {
  const ctx = useContext(DataSourceCtx);
  if (!ctx) throw new Error("useDataSource must be used within a DataSourceProvider");
  return ctx;
}
