"use client";

import useSWR from "swr";
import { useDataSource } from "@/lib/dataSourceContext";
import { toFilterClauses, type FiltersState } from "@/lib/filters";

function SummaryTile({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="text-lg font-semibold text-slate-900 tabular-nums">
        {value ?? <span className="inline-block h-6 w-16 animate-pulse rounded bg-slate-200" />}
      </div>
    </div>
  );
}

/** Aggregate totals for whatever's currently filtered -- distinct from the
 * header KPI cards, which always show whole-dataset totals. */
export function FilterSummary({ filters }: { filters: FiltersState }) {
  const { source } = useDataSource();

  const key = source ? (["filtered-summary", source.kind, JSON.stringify(filters)] as const) : null;
  const { data, isLoading } = useSWR(key, () =>
    source!.getFilteredSummary(toFilterClauses(filters), filters.q || undefined)
  );

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-sm font-semibold text-slate-900">Network summary for this filter</h2>
      <div className="grid grid-cols-3 gap-4">
        <SummaryTile label="Segments" value={isLoading || !data ? undefined : data.segmentCount.toLocaleString()} />
        <SummaryTile
          label="Distinct roads"
          value={isLoading || !data ? undefined : data.distinctRoadCount.toLocaleString()}
        />
        <SummaryTile
          label="Total length"
          value={isLoading || !data ? undefined : `${Math.round(data.totalKm).toLocaleString()} km`}
        />
      </div>
    </div>
  );
}
