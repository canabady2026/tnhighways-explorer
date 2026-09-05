"use client";

import type { Map as LeafletMap } from "leaflet";
import { useEffect, useRef } from "react";
import useSWR from "swr";
import "leaflet/dist/leaflet.css";
import { fetchOsmWays, OsmUnavailableError, toOsmRef } from "@/lib/osm";
import { classifyRoadNumber } from "@/lib/roadNumberStyle";

export function RoadMap({ roadNumber, fullHeight = false }: { roadNumber: string; fullHeight?: boolean }) {
  const osmRef = toOsmRef(roadNumber);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const heightClass = fullHeight ? "h-full" : "h-56";

  const {
    data: ways,
    isLoading,
    error,
  } = useSWR(osmRef ? (["osm-ways", osmRef] as const) : null, () => fetchOsmWays(osmRef!));

  // Imperative Leaflet lifecycle, kept separate from data fetching (SWR
  // above) so this effect never calls setState -- it only ever creates or
  // tears down the map instance held in mapRef.
  useEffect(() => {
    if (!ways || ways.length === 0 || !containerRef.current) return;

    let disposed = false;

    (async () => {
      const L = (await import("leaflet")).default;
      if (disposed || !containerRef.current) return;

      const map = L.map(containerRef.current, { scrollWheelZoom: fullHeight });
      mapRef.current = map;

      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18,
      }).addTo(map);

      const { strokeColor } = classifyRoadNumber(roadNumber);
      const polyline = L.polyline(
        ways.map((way) => way.map((pt) => [pt.lat, pt.lon] as [number, number])),
        { color: strokeColor, weight: 4 }
      ).addTo(map);

      map.fitBounds(polyline.getBounds(), { padding: [16, 16] });
    })();

    return () => {
      disposed = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [ways, roadNumber, fullHeight]);

  if (!osmRef) {
    return <p className="text-sm text-slate-500">Map not available for this road&apos;s classification.</p>;
  }

  if (isLoading) {
    return (
      <div
        className={`flex ${heightClass} items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-400`}
      >
        Loading map…
      </div>
    );
  }

  if (error) {
    const busy = error instanceof OsmUnavailableError;
    return (
      <p className="text-sm text-slate-500">
        {busy ? "OpenStreetMap's map service is busy right now — try again shortly." : "Could not load the map."}
      </p>
    );
  }

  if (!ways || ways.length === 0) {
    return <p className="text-sm text-slate-500">This road isn&apos;t mapped in OpenStreetMap yet.</p>;
  }

  return <div ref={containerRef} className={`${heightClass} w-full rounded-lg border border-slate-200`} />;
}
