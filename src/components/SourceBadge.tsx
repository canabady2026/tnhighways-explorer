"use client";

import { useDataSource } from "@/lib/dataSourceContext";

export function SourceBadge() {
  const { status, error, retryApi } = useDataSource();

  const styles: Record<string, string> = {
    checking: "bg-slate-100 text-slate-600 border-slate-200",
    api: "bg-emerald-50 text-emerald-700 border-emerald-200",
    sqlite: "bg-amber-50 text-amber-700 border-amber-200",
    "sqlite-load-error": "bg-red-50 text-red-700 border-red-200",
  };

  const label: Record<string, string> = {
    checking: "Connecting…",
    api: "Live API",
    sqlite: "Offline dataset",
    "sqlite-load-error": "Data unavailable",
  };

  const dot: Record<string, string> = {
    checking: "bg-slate-400 animate-pulse",
    api: "bg-emerald-500",
    sqlite: "bg-amber-500",
    "sqlite-load-error": "bg-red-500",
  };

  return (
    <div className="flex items-center gap-2">
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${styles[status]}`}
        title={
          status === "api"
            ? "Querying the live AWS Lambda API"
            : status === "sqlite"
              ? "API unreachable — querying a bundled offline copy of the dataset in your browser"
              : error || undefined
        }
      >
        <span className={`h-1.5 w-1.5 rounded-full ${dot[status]}`} />
        {label[status]}
      </span>
      {status !== "api" && status !== "checking" && (
        <button
          onClick={retryApi}
          className="text-xs text-slate-500 underline decoration-dotted hover:text-slate-700"
        >
          retry API
        </button>
      )}
    </div>
  );
}
