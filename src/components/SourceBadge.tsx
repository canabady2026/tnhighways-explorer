"use client";

import { useDataSource, type Mode } from "@/lib/dataSourceContext";

const MODES: { value: Mode; label: string }[] = [
  { value: "auto", label: "Auto" },
  { value: "api", label: "Live API" },
  { value: "sqlite", label: "Offline DB" },
];

export function SourceBadge() {
  const { status, mode, setMode, error, retryApi } = useDataSource();

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
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex items-center gap-2">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${styles[status]}`}
          title={
            status === "api"
              ? "Querying the AWS Lambda API"
              : status === "sqlite"
                ? "Querying a bundled offline copy of the dataset in your browser"
                : error || undefined
          }
        >
          <span className={`h-1.5 w-1.5 rounded-full ${dot[status]}`} />
          {label[status]}
        </span>
        {mode === "auto" && (status === "sqlite" || status === "sqlite-load-error") && (
          <button
            onClick={retryApi}
            className="text-xs text-slate-500 underline decoration-dotted hover:text-slate-700"
          >
            retry API
          </button>
        )}
      </div>

      <div className="inline-flex overflow-hidden rounded-full border border-slate-300 text-xs">
        {MODES.map((m, i) => (
          <button
            key={m.value}
            onClick={() => setMode(m.value)}
            title={
              m.value === "auto"
                ? "Automatically use the API, falling back to the offline dataset"
                : m.value === "api"
                  ? "Always use the live AWS API"
                  : "Always use the offline in-browser dataset"
            }
            className={`px-2.5 py-1 font-medium transition-colors ${i > 0 ? "border-l border-slate-300" : ""} ${
              mode === m.value ? "bg-slate-900 text-white" : "bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>
    </div>
  );
}
