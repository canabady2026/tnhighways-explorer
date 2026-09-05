"use client";

import type { FeatureGroup, Map as LeafletMap } from "leaflet";
import { useEffect, useRef } from "react";
import useSWR from "swr";
import "leaflet/dist/leaflet.css";
import { withBasePath } from "@/lib/basePath";
import { useDataSource } from "@/lib/dataSourceContext";
import { toFilterClauses, type FiltersState } from "@/lib/filters";
import { fetchOsmWaysForRoads } from "@/lib/osm";
import { classifyRoadNumber } from "@/lib/roadNumberStyle";

// Plotting is one Overpass request per road, so this keeps a "map all
// results" click from firing hundreds of requests at the free public
// Overpass instance at once.
const ROAD_CAP = 30;

const LEGEND = [
  { label: "SH", color: "#047857" },
  { label: "MDR", color: "#1d4ed8" },
  { label: "ODR", color: "#be185d" },
  { label: "NH", color: "#c2410c" },
  { label: "Other", color: "#334155" },
];

export function FullPageResultsMap({ filters }: { filters: FiltersState }) {
  const { source } = useDataSource();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const groupRef = useRef<FeatureGroup | null>(null);

  const roadsKey = source ? (["results-map-roads", source.kind, JSON.stringify(filters)] as const) : null;
  const { data: roadsInfo, isLoading: loadingRoads } = useSWR(roadsKey, async () => {
    const result = await source!.queryRoads({
      filters: toFilterClauses(filters),
      q: filters.q || undefined,
      limit: 500,
      offset: 0,
      fields: ["road_number"],
    });
    return {
      distinct: Array.from(new Set(result.data.map((r) => r.road_number))),
      totalSegments: result.pagination.total,
    };
  });

  const distinctRoads = roadsInfo?.distinct ?? [];
  const cappedRoads = distinctRoads.slice(0, ROAD_CAP);

  const geomKey = cappedRoads.length > 0 ? (["results-map-geom", cappedRoads.join(",")] as const) : null;
  const { data: geometries, isLoading: loadingGeom } = useSWR(geomKey, () => fetchOsmWaysForRoads(cappedRoads));

  useEffect(() => {
    if (!geometries || geometries.size === 0 || !containerRef.current) return;

    let disposed = false;

    (async () => {
      const L = (await import("leaflet")).default;
      if (disposed || !containerRef.current) return;

      const map = L.map(containerRef.current, { scrollWheelZoom: true });
      mapRef.current = map;

      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18,
      }).addTo(map);

      const lines = Array.from(geometries.entries()).map(([roadNumber, ways]) => {
        const { strokeColor } = classifyRoadNumber(roadNumber);
        return L.polyline(
          ways.map((way) => way.map((pt) => [pt.lat, pt.lon] as [number, number])),
          { color: strokeColor, weight: 3 }
        ).bindTooltip(roadNumber);
      });

      const group = L.featureGroup(lines).addTo(map);
      groupRef.current = group;
      map.fitBounds(group.getBounds(), { padding: [24, 24] });
    })();

    return () => {
      disposed = true;
      mapRef.current?.remove();
      mapRef.current = null;
      groupRef.current = null;
    };
  }, [geometries]);

  const backLink = (
    <a href={withBasePath("/")} className="text-sm text-slate-500 underline decoration-dotted hover:text-slate-700">
      ← Back to explorer
    </a>
  );

  return (
    <div className="flex h-screen flex-col bg-slate-100">
      <header className="flex flex-wrap items-center gap-3 border-b border-slate-200 bg-white px-4 py-3">
        {backLink}
        <h1 className="text-sm font-semibold text-slate-900">
          {loadingRoads
            ? "Finding matching roads…"
            : `${distinctRoads.length.toLocaleString()} road${distinctRoads.length === 1 ? "" : "s"} matching current filters`}
        </h1>
        {!loadingRoads && distinctRoads.length > ROAD_CAP && (
          <span className="text-xs text-slate-500">
            (showing the first {ROAD_CAP} on the map — refine filters to narrow this down)
          </span>
        )}
        <div className="ml-auto flex items-center gap-3">
          {LEGEND.map((item) => (
            <span key={item.label} className="flex items-center gap-1 text-xs font-bold text-slate-600">
              <span className="inline-block h-2.5 w-4 rounded-sm" style={{ backgroundColor: item.color }} />
              {item.label}
            </span>
          ))}
        </div>
      </header>

      <div className="relative flex-1 p-3">
        {!loadingRoads && distinctRoads.length === 0 && (
          <p className="p-4 text-sm text-slate-500">No roads match these filters.</p>
        )}

        {!loadingRoads && distinctRoads.length > 0 && loadingGeom && (
          <div className="flex h-full items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-400">
            Loading map for {cappedRoads.length} road{cappedRoads.length === 1 ? "" : "s"}…
          </div>
        )}

        {!loadingGeom && geometries && geometries.size === 0 && cappedRoads.length > 0 && (
          <p className="p-4 text-sm text-slate-500">None of the matching roads are mapped in OpenStreetMap yet.</p>
        )}

        {geometries && geometries.size > 0 && (
          <div ref={containerRef} className="h-full w-full rounded-lg border border-slate-200" />
        )}
      </div>
    </div>
  );
}
