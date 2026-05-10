# Phase 3 — Data Room & AI-Era Unit Economics

Schema is already migrated (Phase 1). This phase ships the edge function, hooks, and UI for both features and wires them into the IR sidebar.

## Feature B — Data Room Telemetry

### Edge function (public, CORS-enabled)
`supabase/functions/dataroom-track/index.ts` — single function, multi-action via `?action=`:
- `GET ?action=resolve&token=...` → validates `ir_data_room_share_links` (active + not expired), returns document metadata + signed URL from `ir-data-room` bucket (5 min TTL).
- `POST ?action=view` → inserts `ir_document_views` row (token, viewer_email if gated, ip hash, user agent), returns `view_id`.
- `POST ?action=slide` → inserts `ir_document_slide_events` (view_id, slide_index, dwell_ms).
- Robust CORS preflight + headers on every response (incl. errors).
- Uses `SUPABASE_SERVICE_ROLE_KEY`. No JWT required (public viewer). Add `verify_jwt = false` to `supabase/config.toml`.

### Hook
`src/hooks/useDataRoom.ts` — list documents, upload (Storage `ir-data-room`), create/revoke share links, fetch per-document views + slide heatmap (via `ir_document_hot_slides` view).

### Components (in `src/components/dashboard/ir/dataroom/`)
- `DataRoomManager.tsx` — top-level: upload button + `DocumentList`.
- `DocumentList.tsx` — table: name, version, total views, unique viewers, hot-slide count, actions.
- `UploadDocumentDialog.tsx` — file picker, title, slide count input.
- `ShareLinkDialog.tsx` — generate token, expiry picker, viewer email gate toggle, copy `https://<host>/ir/view/:token` URL.
- `DocumentTelemetryDrawer.tsx` — recent views table + `SlideHeatmap`.
- `SlideHeatmap.tsx` — recharts bar chart of dwell_ms per slide, ≥300s highlighted.

### Public viewer route
`src/pages/ir/IRDocumentViewer.tsx` mounted at `/ir/view/:token` in `App.tsx`:
- Calls `dataroom-track?action=resolve` → renders signed PDF in `<iframe>` or `<embed>`.
- Tracks page/slide changes via PDF.js `pageChange` event → posts `action=slide` with dwell_ms.
- Posts `action=view` on mount.

## Feature C — AI-Era Unit Economics

### Hook
`src/hooks/useUnitEconomics.ts` — fetches last 12 `ir_metrics_snapshots`, computes deltas (NRR/GRR/Usage retention, AI COGS %, HitL labor %, Rev/FTE), exposes `upsertSnapshot` mutation.

### Components (in `src/components/dashboard/ir/economics/`)
- `UnitEconomics.tsx` — header + KPI grid + 3 cards + "Log monthly snapshot" button.
- `RetentionCard.tsx` — sparkline of GRR/NRR/Usage retention with delta chips.
- `HitLCogsCard.tsx` — stacked area: AI inference COGS vs HitL labor COGS, % of revenue.
- `RevPerEmployeeCard.tsx` — Rev/FTE line + "3-person unicorn" benchmark line at $1M/FTE.
- `MetricEntrySheet.tsx` — Sheet form to upsert a snapshot (period_month picker + all new fields).

## Wiring
- `Dashboard.tsx`: register `ir-dataroom` and `ir-economics` tabs.
- `AdminSidebar.tsx`: under Investors group add "Data Room" + "Unit Economics".
- `supabase/config.toml`: append `[functions.dataroom-track]\nverify_jwt = false`.

## Build order
1. Edge function `dataroom-track` + config.toml entry → deploy.
2. `useDataRoom` + Data Room components + public viewer route.
3. `useUnitEconomics` + Unit Economics components.
4. Sidebar + Dashboard tab registration.
5. Smoke-test: upload a PDF, generate share link, open in incognito, verify telemetry rows; log a snapshot, verify charts render.

Stop and confirm before any further IR work.
