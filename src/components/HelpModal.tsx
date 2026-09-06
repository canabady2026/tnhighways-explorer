"use client";

import { useState } from "react";
import { RoadNumberBadge } from "@/components/RoadNumberBadge";

const LEGEND: { label: string; road: string }[] = [
  { label: "State Highway", road: "SH49" },
  { label: "Major District Road", road: "MDR12" },
  { label: "Other District Road", road: "ODR3" },
  { label: "National Highway", road: "NH38" },
  { label: "Other/unclassified", road: "L107" },
];

/** Self-contained walkthrough: owns its own open/close state, like
 * FontControls/SourceBadge own their own preference state -- just drop
 * <HelpModal /> in the header, no props needed. */
export function HelpModal() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="How to use this app"
        title="How to use this app"
        className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-50"
      >
        ?
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={() => setOpen(false)}>
          <div
            className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-y-auto rounded-xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between">
              <h2 className="text-lg font-bold text-slate-900">Walkthrough</h2>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-5 text-sm text-slate-700">
              <section>
                <p>
                  This app browses <strong>15,568 Tamil Nadu PWD road segments</strong>, organized into circles,
                  divisions, and sub-divisions. It can query a live AWS Lambda API or a bundled offline copy of the
                  same dataset entirely in your browser.
                </p>
              </section>

              <section>
                <h3 className="mb-1.5 font-semibold text-slate-900">Data source</h3>
                <p>
                  The badge in the top-right shows which backend is answering your queries: <strong>Live API</strong>{" "}
                  (the AWS Lambda backend) or <strong>Offline dataset</strong> (a SQLite database queried in-browser via
                  WebAssembly, no network required). The three buttons below it — <strong>Auto</strong>,{" "}
                  <strong>Live API</strong>, <strong>Offline DB</strong> — pick how it decides: Auto tries the API
                  first and falls back automatically if it&apos;s unreachable; the other two force one or the other.
                  If it fell back to offline, a &quot;retry API&quot; link lets you re-check.
                </p>
              </section>

              <section>
                <h3 className="mb-1.5 font-semibold text-slate-900">Filtering</h3>
                <p>
                  The left panel filters the road list: free-text search (matches road name, number, or circle),
                  a Circle → Division → Sub-Division cascade (each narrows the next), a road number substring
                  filter, and a min/max total length in km. &quot;clear all&quot; resets everything at once.
                </p>
              </section>

              <section>
                <h3 className="mb-1.5 font-semibold text-slate-900">Road number colors</h3>
                <p className="mb-2">Each road number badge is colored by classification:</p>
                <div className="flex flex-wrap gap-2">
                  {LEGEND.map((l) => (
                    <div key={l.label} className="flex items-center gap-1.5">
                      <RoadNumberBadge roadNumber={l.road} />
                      <span className="text-xs text-slate-500">{l.label}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="mb-1.5 font-semibold text-slate-900">Road details &amp; maps</h3>
                <p>
                  Click any row to open a detail panel: total segment count and length, a map of that road drawn
                  from real OpenStreetMap geometry (click &quot;Open in full window&quot; for a bigger view), and
                  the list of individual segments with clickable Circle/Division/Sub-Division badges that jump the
                  main filters to that location.
                </p>
              </section>

              <section>
                <h3 className="mb-1.5 font-semibold text-slate-900">Results map</h3>
                <p>
                  &quot;View matching roads on map&quot; opens a full-page map of every road matching your current
                  filters (up to 30 at once), each labeled with its road number, name, sub-division, division, and
                  circle.
                </p>
              </section>

              <section>
                <h3 className="mb-1.5 font-semibold text-slate-900">Font controls</h3>
                <p>
                  The A-/A/A+ buttons and font-style dropdown next to this help button adjust text size and typeface
                  for the whole app -- your choice is remembered on this device.
                </p>
              </section>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
