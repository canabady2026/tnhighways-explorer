"use client";

import useSWR from "swr";
import { LocationBadge } from "@/components/LocationBadge";
import { RoadMap } from "@/components/RoadMap";
import { RoadNumberBadge } from "@/components/RoadNumberBadge";
import { useDataSource } from "@/lib/dataSourceContext";
import type { LocationSelection } from "@/lib/filters";
import { buildSingleRoadMapUrl } from "@/lib/mapLinks";

interface Props {
  roadNumber: string | null;
  onClose: () => void;
  onNavigateToLocation: (location: LocationSelection) => void;
}

export function RoadDetailDrawer({ roadNumber, onClose, onNavigateToLocation }: Props) {
  const { source } = useDataSource();

  const key = roadNumber && source ? (["road", source.kind, roadNumber] as const) : null;
  const { data: detail, isLoading: loading } = useSWR(key, () => source!.getRoadByNumber(roadNumber!));

  if (!roadNumber) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={onClose}>
      <div
        className="flex h-full w-full max-w-lg flex-col overflow-y-auto bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              <RoadNumberBadge roadNumber={roadNumber} size="lg" />
            </h2>
            {detail && <p className="mt-1 text-sm font-bold text-slate-700">{detail.segments[0]?.road_name}</p>}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            ✕
          </button>
        </div>

        {loading && <p className="text-sm text-slate-500">Loading…</p>}

        {!loading && !detail && <p className="text-sm text-slate-500">No data found for this road.</p>}

        {!loading && detail && (
          <>
            <div className="mb-5 grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-slate-50 p-3">
                <div className="text-xs uppercase tracking-wide text-slate-500">Segments</div>
                <div className="text-xl font-semibold text-slate-900">{detail.segment_count}</div>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <div className="text-xs uppercase tracking-wide text-slate-500">Total length</div>
                <div className="text-xl font-semibold text-slate-900">{detail.total_km} km</div>
              </div>
            </div>

            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">Map</h3>
              <a
                href={buildSingleRoadMapUrl(roadNumber)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 underline decoration-dotted hover:text-blue-800"
              >
                Open in full window ↗
              </a>
            </div>
            <div className="mb-5">
              <RoadMap roadNumber={roadNumber} segments={detail.segments} />
            </div>

            <h3 className="mb-2 text-sm font-semibold text-slate-900">Segments</h3>
            <ul className="flex flex-col gap-2">
              {detail.segments.map((seg, i) => {
                const navigate = (location: LocationSelection) => {
                  onNavigateToLocation(location);
                  onClose();
                };
                return (
                  <li key={i} className="rounded-lg border border-slate-200 p-3 text-sm">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <LocationBadge
                        category="circle"
                        value={seg.circle}
                        onClick={() => navigate({ circle: seg.circle })}
                      />
                      <span className="text-slate-300">·</span>
                      <LocationBadge
                        category="division"
                        value={seg.division}
                        onClick={() => navigate({ circle: seg.circle, division: seg.division })}
                      />
                      <span className="text-slate-300">·</span>
                      <LocationBadge
                        category="sub_division"
                        value={seg.sub_division}
                        onClick={() =>
                          navigate({ circle: seg.circle, division: seg.division, subDivision: seg.sub_division })
                        }
                      />
                    </div>
                    <div className="mt-1.5 text-slate-600 tabular-nums">
                      km {seg.start_km} – {seg.end_km} ({seg.total_km} km)
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
