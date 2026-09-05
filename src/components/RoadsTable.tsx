"use client";

import { RoadNumberBadge } from "@/components/RoadNumberBadge";
import type { Road } from "@/lib/types";

interface Column {
  key: keyof Road;
  label: string;
  numeric?: boolean;
}

const COLUMNS: Column[] = [
  { key: "circle", label: "Circle" },
  { key: "division", label: "Division" },
  { key: "sub_division", label: "Sub-Division" },
  { key: "road_number", label: "Road No." },
  { key: "road_name", label: "Road Name" },
  { key: "start_km", label: "Start", numeric: true },
  { key: "end_km", label: "End", numeric: true },
  { key: "total_km", label: "Length (km)", numeric: true },
];

interface Props {
  rows: Road[];
  loading: boolean;
  sort: string;
  onSortChange: (sort: string) => void;
  onRowClick: (roadNumber: string) => void;
}

export function RoadsTable({ rows, loading, sort, onSortChange, onRowClick }: Props) {
  function toggleSort(col: keyof Road) {
    if (sort === col) onSortChange(`-${col}`);
    else if (sort === `-${col}`) onSortChange("");
    else onSortChange(col);
  }

  function sortIndicator(col: keyof Road) {
    if (sort === col) return "↑";
    if (sort === `-${col}`) return "↓";
    return "";
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50">
          <tr>
            {COLUMNS.map((col) => (
              <th
                key={col.key}
                onClick={() => toggleSort(col.key)}
                className={`cursor-pointer select-none whitespace-nowrap px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 hover:text-slate-900 ${col.numeric ? "text-right" : ""}`}
              >
                {col.label} <span className="text-slate-400">{sortIndicator(col.key)}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {loading &&
            Array.from({ length: 8 }).map((_, i) => (
              <tr key={i}>
                {COLUMNS.map((col) => (
                  <td key={col.key} className="px-3 py-2">
                    <span className="inline-block h-4 w-full max-w-24 animate-pulse rounded bg-slate-100" />
                  </td>
                ))}
              </tr>
            ))}
          {!loading && rows.length === 0 && (
            <tr>
              <td colSpan={COLUMNS.length} className="px-3 py-8 text-center text-slate-500">
                No road segments match these filters.
              </td>
            </tr>
          )}
          {!loading &&
            rows.map((row, i) => (
              <tr
                key={`${row.road_number}-${row.start_km}-${i}`}
                onClick={() => onRowClick(row.road_number)}
                className="cursor-pointer hover:bg-slate-50"
              >
                <td className="whitespace-nowrap px-3 py-2 text-slate-700">{row.circle}</td>
                <td className="whitespace-nowrap px-3 py-2 text-slate-700">{row.division}</td>
                <td className="whitespace-nowrap px-3 py-2 text-slate-700">{row.sub_division}</td>
                <td className="whitespace-nowrap px-3 py-2">
                  <RoadNumberBadge roadNumber={row.road_number} />
                </td>
                <td className="px-3 py-2 text-slate-700">{row.road_name}</td>
                <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums text-slate-700">
                  {row.start_km}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums text-slate-700">
                  {row.end_km}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums font-medium text-slate-900">
                  {row.total_km}
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}
