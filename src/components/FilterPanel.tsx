"use client";

import useSWR from "swr";
import { useDataSource } from "@/lib/dataSourceContext";
import { EMPTY_FILTERS, hasActiveFilters, type FiltersState } from "@/lib/filters";

interface Props {
  filters: FiltersState;
  onChange: (next: FiltersState) => void;
}

function Select({
  label,
  value,
  onChange,
  options,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  disabled?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-slate-700">{label}</span>
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-900 disabled:bg-slate-50 disabled:text-slate-400"
      >
        <option value="">All</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </label>
  );
}

export function FilterPanel({ filters, onChange }: Props) {
  const { source } = useDataSource();

  const circlesKey = source ? (["circles", source.kind] as const) : null;
  const { data: circles = [] } = useSWR(circlesKey, () => source!.getCircles());

  const divisionsKey = source ? (["divisions", source.kind, filters.circle] as const) : null;
  const { data: divisions = [] } = useSWR(divisionsKey, () => source!.getDivisions(filters.circle || undefined));

  const subDivisionsKey = source
    ? (["subDivisions", source.kind, filters.circle, filters.division] as const)
    : null;
  const { data: subDivisions = [] } = useSWR(subDivisionsKey, () =>
    source!.getSubDivisions(filters.circle || undefined, filters.division || undefined)
  );

  function set<K extends keyof FiltersState>(key: K, value: FiltersState[K]) {
    const next = { ...filters, [key]: value };
    if (key === "circle") {
      next.division = "";
      next.subDivision = "";
    }
    if (key === "division") {
      next.subDivision = "";
    }
    onChange(next);
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900">Filters</h2>
        {hasActiveFilters(filters) && (
          <button
            onClick={() => onChange({ ...EMPTY_FILTERS, sort: filters.sort })}
            className="text-xs text-slate-500 underline decoration-dotted hover:text-slate-700"
          >
            clear all
          </button>
        )}
      </div>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-slate-700">Search</span>
        <input
          type="text"
          value={filters.q}
          onChange={(e) => set("q", e.target.value)}
          placeholder="Road name, number, circle…"
          className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm text-slate-900 placeholder:text-slate-400"
        />
      </label>

      <Select
        label="Circle"
        value={filters.circle}
        onChange={(v) => set("circle", v)}
        options={circles.map((c) => c.name)}
      />
      <Select
        label="Division"
        value={filters.division}
        onChange={(v) => set("division", v)}
        options={divisions.map((d) => d.name)}
        disabled={divisions.length === 0}
      />
      <Select
        label="Sub-Division"
        value={filters.subDivision}
        onChange={(v) => set("subDivision", v)}
        options={subDivisions.map((s) => s.name)}
        disabled={subDivisions.length === 0}
      />

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-slate-700">Road number contains</span>
        <input
          type="text"
          value={filters.roadNumber}
          onChange={(e) => set("roadNumber", e.target.value)}
          placeholder="e.g. SH49"
          className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm text-slate-900 placeholder:text-slate-400"
        />
      </label>

      <div className="flex gap-2">
        <label className="flex flex-1 flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">Min length (km)</span>
          <input
            type="number"
            min={0}
            step="any"
            value={filters.totalKmMin}
            onChange={(e) => set("totalKmMin", e.target.value)}
            className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm text-slate-900"
          />
        </label>
        <label className="flex flex-1 flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">Max length (km)</span>
          <input
            type="number"
            min={0}
            step="any"
            value={filters.totalKmMax}
            onChange={(e) => set("totalKmMax", e.target.value)}
            className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm text-slate-900"
          />
        </label>
      </div>
    </div>
  );
}
