"use client";

import useSWR from "swr";
import { RoadMap } from "@/components/RoadMap";
import { RoadNumberBadge } from "@/components/RoadNumberBadge";
import { withBasePath } from "@/lib/basePath";
import { useDataSource } from "@/lib/dataSourceContext";

export function FullPageRoadMap({ roadNumber }: { roadNumber: string }) {
  const { source } = useDataSource();
  const key = source ? (["road", source.kind, roadNumber] as const) : null;
  const { data: detail } = useSWR(key, () => source!.getRoadByNumber(roadNumber));

  return (
    <div className="flex h-screen flex-col bg-slate-100">
      <header className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3">
        <a
          href={withBasePath("/")}
          className="text-sm text-slate-500 underline decoration-dotted hover:text-slate-700"
        >
          ← Back to explorer
        </a>
        <RoadNumberBadge roadNumber={roadNumber} />
      </header>
      <div className="flex-1 p-3">
        <RoadMap roadNumber={roadNumber} segments={detail?.segments} fullHeight />
      </div>
    </div>
  );
}
