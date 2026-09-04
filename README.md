# TN Highways Explorer

A static, self-contained Next.js app for browsing the Tamil Nadu PWD
highway roster (15,568 road segments across 9 circles), designed to be
hosted for free on GitHub Pages. Interface inspired by
[Open Data Kerala's LSG2025 dashboard](https://opendatakerala.org/LSG2025/#/data)
(KPI stat cards, filterable/searchable data table, detail view).

## Two data backends, one interface

The app queries [`tnhighways-api`](../tnhighways-api) (the AWS Lambda + API
Gateway backend built alongside this project) by default. If that API is
unreachable — rate-limited, torn down, or you're just offline — it falls
back automatically to a **client-side SQLite database** running entirely
in the browser via [sql.js](https://sql.js.org) (SQLite compiled to
WebAssembly), querying a ~1.5MB copy of the same dataset bundled into the
site itself (`public/data/tnhighways_2025.db`, `public/sql.js/`). No
backend is required for the app to work — that's what makes it safe to
host as static files on GitHub Pages with no server of its own.

Both backends implement the same `DataSource` interface
(`src/lib/types.ts`) with matching query semantics — including the same
`CAST(col AS REAL)` fix applied on the numeric columns (`start_km`,
`end_km`, `total_km`), which are stored as SQLite's TEXT storage class in
the source `.db` (see `src/lib/sqlite.ts` and `tnhighways-api/src/db.py`
for the matching backend-side fix). A badge in the header shows which
backend is currently active, with a manual "retry API" link.

## Project layout

```
src/
├── app/
│   ├── layout.tsx           Root layout + metadata
│   └── page.tsx              The whole app: filters, table, KPIs, wiring
├── components/
│   ├── FilterPanel.tsx        Circle/division/sub-division cascading selects, search, range filters
│   ├── RoadsTable.tsx          Sortable results table
│   ├── Pagination.tsx          Page size + prev/next
│   ├── RoadDetailDrawer.tsx    Per-road-number detail panel (all segments + total length)
│   ├── KpiCards.tsx             Header stat tiles
│   └── SourceBadge.tsx          Live API / offline dataset indicator
└── lib/
    ├── schema.ts               Filterable columns + operators (mirrors tnhighways-api/src/schema.py)
    ├── types.ts                 Shared DataSource interface + row types
    ├── api.ts                   DataSource impl: talks to the AWS API
    ├── sqlite.ts                 DataSource impl: sql.js against the bundled .db
    ├── dataSourceContext.tsx     Picks a backend (health-checks the API, falls back to SQLite) via SWR
    ├── filters.ts                UI filter state <-> query filter clauses
    └── basePath.ts                GitHub Pages subpath-aware asset URLs
```

Client-side data fetching uses [SWR](https://swr.vercel.app) throughout
(`useSWR`), per this Next.js version's own guidance for client-only
fetching with inline loading states — it also sidesteps manual
`useEffect`-driven `setState` entirely, satisfying the stricter
`react-hooks/set-state-in-effect` lint rule this Next.js version ships
with.

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). By default it talks
to the already-deployed API at
`https://au80g7fdk7.execute-api.ap-south-1.amazonaws.com`; override with
`NEXT_PUBLIC_API_BASE_URL` in `.env.local` if you deploy your own copy of
`tnhighways-api`. To exercise the SQLite fallback path locally, block or
misconfigure that URL, or just watch the badge switch over automatically
if the API is ever down.

## Building the static export

```bash
npm run build       # writes ./out
```

`next.config.ts` sets `output: "export"`, so `npm run build` alone
produces a fully static site — no `next start` / Node server needed at
runtime. Serve `out/` with any static file server, or open it directly:

```bash
npx serve out
```

### Deploying to GitHub Pages

`.github/workflows/deploy.yml` builds and publishes `out/` to GitHub Pages
on every push to `main` (or via manual dispatch). It sets
`NEXT_BASE_PATH=/<repo-name>` automatically from the repository name,
since a GitHub Pages *project* site is served from
`https://<user>.github.io/<repo>/`, not the domain root — asset URLs need
that prefix baked in at build time (see `next.config.ts`).

One-time setup after pushing this repo to GitHub:

1. Repo **Settings → Pages → Source: GitHub Actions**.
2. Push to `main` (or run the workflow manually from the Actions tab).
3. The deployed URL appears in the workflow run summary and in
   **Settings → Pages**.

To build locally exactly as CI does:

```bash
NEXT_BASE_PATH=/tnhighways-explorer npm run build
```

## Keeping the two backends in sync

`src/lib/schema.ts` and `src/lib/sqlite.ts` are hand-kept in sync with
`tnhighways-api/src/schema.py` and `db.py` — there's no shared build
between the two projects. If you add a filterable column or operator to
the API, mirror it here too.

To refresh the bundled offline dataset after the source database changes:

```bash
cp ../tnhighways_2025.db /tmp/tnhighways_web.db
sqlite3 /tmp/tnhighways_web.db "DROP TABLE roads; VACUUM;"   # drop the unused duplicate table to halve the file size
cp /tmp/tnhighways_web.db public/data/tnhighways_2025.db
```
