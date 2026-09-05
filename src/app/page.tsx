"use client";

import { useState } from "react";
import useSWR from "swr";
import { FilterPanel } from "@/components/FilterPanel";
import { FullPageResultsMap } from "@/components/FullPageResultsMap";
import { FullPageRoadMap } from "@/components/FullPageRoadMap";
import { KpiCards } from "@/components/KpiCards";
import { Pagination } from "@/components/Pagination";
import { RoadDetailDrawer } from "@/components/RoadDetailDrawer";
import { RoadsTable } from "@/components/RoadsTable";
import { SourceBadge } from "@/components/SourceBadge";
import { DataSourceProvider, useDataSource } from "@/lib/dataSourceContext";
import { EMPTY_FILTERS, toFilterClauses, type FiltersState } from "@/lib/filters";
import { buildOverpassTurboUrl, buildResultsMapUrl, overpassAreaName, parseRoute } from "@/lib/mapLinks";
import { DEFAULT_LIMIT } from "@/lib/schema";
import { useDebounced } from "@/lib/useDebounced";

function Dashboard() {
  const { source, status } = useDataSource();

  const [filters, setFilters] = useState<FiltersState>(EMPTY_FILTERS);
  const debouncedFilters = useDebounced(filters, 350);

  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [offset, setOffset] = useState(0);

  // Reset to page 1 whenever the effective filter set (or page size)
  // changes, adjusted during render rather than in an effect -- see
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  const pageResetKey = `${JSON.stringify(debouncedFilters)}|${limit}`;
  const [prevPageResetKey, setPrevPageResetKey] = useState(pageResetKey);
  if (pageResetKey !== prevPageResetKey) {
    setPrevPageResetKey(pageResetKey);
    if (offset !== 0) setOffset(0);
  }

  const [selectedRoad, setSelectedRoad] = useState<string | null>(null);

  const roadsKey = source ? (["roads", source.kind, pageResetKey, offset] as const) : null;
  const { data: roadsResult, isLoading: loading } = useSWR(roadsKey, () =>
    source!.queryRoads({
      filters: toFilterClauses(debouncedFilters),
      q: debouncedFilters.q || undefined,
      sort: debouncedFilters.sort || undefined,
      limit,
      offset,
    })
  );
  const rows = roadsResult?.data ?? [];
  const pagination = roadsResult?.pagination ?? null;

  const kpiKey = source ? (["kpis", source.kind] as const) : null;
  const { data: kpis, isLoading: kpisLoading } = useSWR(kpiKey, async () => {
    const [circleStats, divisions, subDivisions] = await Promise.all([
      source!.getStats("circle"),
      source!.getDivisions(),
      source!.getSubDivisions(),
    ]);
    const totalSegments = circleStats.reduce((sum, s) => sum + s.segment_count, 0);
    const totalKm = circleStats.reduce((sum, s) => sum + s.total_km, 0);
    return [
      { label: "Road Segments", value: totalSegments.toLocaleString() },
      { label: "Network Length", value: `${Math.round(totalKm).toLocaleString()} km` },
      { label: "Circles", value: circleStats.length.toLocaleString() },
      { label: "Divisions / Sub-Divisions", value: `${divisions.length} / ${subDivisions.length}` },
    ];
  });

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-6 sm:px-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Tamil Nadu Highways Explorer</h1>
          <p className="text-sm text-slate-500">
            Browse the TN PWD highway roster — {status === "sqlite" ? "offline" : "live"} dataset of 15,568 road
            segments.
          </p>
        </div>
        <SourceBadge />
      </header>

      <KpiCards kpis={kpis ?? []} loading={kpisLoading} />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[260px_1fr]">
        <FilterPanel filters={filters} onChange={setFilters} />

        <div className="flex flex-col gap-3">
          <div className="flex justify-end">
            {(() => {
              const area = overpassAreaName(filters);
              const href = area ? buildOverpassTurboUrl(area) : buildResultsMapUrl(filters);
              return (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 underline decoration-dotted hover:text-blue-800"
                  title={area ? `Opens all SH/MDR/O/NH roads in ${area} on overpass-turbo.eu` : undefined}
                >
                  View matching roads on map ↗
                </a>
              );
            })()}
          </div>
          <RoadsTable
            rows={rows}
            loading={loading}
            sort={filters.sort}
            onSortChange={(sort) => setFilters((f) => ({ ...f, sort }))}
            onRowClick={setSelectedRoad}
          />
          <Pagination pagination={pagination} limit={limit} onLimitChange={setLimit} onOffsetChange={setOffset} />
        </div>
      </div>

      <footer className="mt-4 border-t border-slate-200 pt-4 text-xs text-slate-400">
        Source: TN Highways 2025. Interface inspired by{" "}
        <a
          href="https://opendatakerala.org/LSG2025/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline decoration-dotted hover:text-slate-600"
        >
          Open Data Kerala&apos;s LSG2025
        </a>
        .
      </footer>

      <RoadDetailDrawer roadNumber={selectedRoad} onClose={() => setSelectedRoad(null)} />
    </div>
  );
}

function Router() {
  // Full-page/full-window map views are opened as plain URLs (new tab),
  // so the route is whatever's in the query string on first load -- read
  // via SWR (client-only, never during the static prerender pass) rather
  // than an effect that would call setState directly.
  const { data: route } = useSWR("route", () => parseRoute(window.location.search));

  if (!route) return null;
  if (route.mode === "single") return <FullPageRoadMap roadNumber={route.roadNumber} />;
  if (route.mode === "results") return <FullPageResultsMap filters={route.filters} />;
  return <Dashboard />;
}

export default function Home() {
  return (
    <DataSourceProvider>
      <Router />
    </DataSourceProvider>
  );
}
