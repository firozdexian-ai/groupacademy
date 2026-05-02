# Admin Overview — Polish, Pickers, and Bug Fixes

Three real problems to close before we move on:

1. **Edge functions return 403** — `admin-analyst` and `admin-report-builder` both gate on `super_admin`, but no user in `user_roles` actually has that role. The operator (you) is currently just `admin`, so every call is rejected.
2. **Month / Quarter tabs have no picker** — they only ever show the *current* period vs. the previous one. You can't pick June 2026 or Q1 2026.
3. **UI drift** — the new tabs (Period, Analyst, Reports) don't match the brand language used in `LifetimeOverviewTab` (rounded‑[40px] cards, italic black uppercase headers, accent gradient strip, StatsCard usage).

There is also one piece of dead UI: `DashboardOverview.tsx` still renders an internal horizontal `<Tabs>`, but the sidebar now routes directly to each sub‑view via `?tab=overview-*`. That inner tab strip is no longer reachable and should be removed.

---

## 1. Fix the 403 errors (root cause: missing role)

Migration:
- Insert `super_admin` rows into `user_roles` for the two existing admin user_ids (`a424…` and `a840…`). Idempotent `ON CONFLICT DO NOTHING`.
- Keep the edge functions' `super_admin` gate as‑is (matches your stated intent: "the platform / super admin panel … that is for me").

After the migration, both functions resolve normally:
- `admin-analyst` → tool‑calls `analyst_metric` / `analyst_top_n` / `analyst_series`
- `admin-report-builder` → plans a spec, resolves each section

Small hardening while we're in there:
- Surface the upstream gateway error message in the toast (currently "Edge function returned 403" is opaque). The functions already return `{error, detail}`; the client will display `detail` if present.

## 2. Month / Quarter pickers

Refactor `PeriodOverviewTab` to accept an explicit period instead of always computing "now":

- Add a header row with **◄ / ►** chevrons and a `Select` dropdown.
  - Month mode: dropdown of last 24 months (e.g. "May 2026", "April 2026", …).
  - Quarter mode: dropdown of last 12 quarters (e.g. "Q2 2026", "Q1 2026", …).
- The picked period drives `cur`; `prev` is auto‑computed (one period back) for delta.
- Default selection = current period, so behaviour is unchanged on first load.
- URL sync: `?tab=overview-month&p=2026-05` so a chosen period is shareable.

## 3. Brand‑consistent UI pass

Match the `LifetimeOverviewTab` system across the three new tabs:

- **Header block**: replace the small h2 with the `bg-muted/20 p-8 rounded-[40px] border-2 border-border/40 backdrop-blur-md` header used in Lifetime, with the icon chip + italic black uppercase title + 0.3em tracking eyebrow.
- **Period KPI cards**: swap raw `Card` for `StatsCard` (already used in Lifetime) so deltas render in the same visual language. Remove the smaller "rounded‑3xl" cards.
- **Analyst tab**: use the same big header; wrap the chat in a rounded‑[40px] card with a 1.5px gradient strip on top; add a left‑rail thread list placeholder (wired to `admin_analyst_threads` in a follow‑up — for now show "New chat" + recent local thread).
- **Reports tab**: same header treatment; canvas card uses rounded‑[40px], gradient strip, and section titles in italic black uppercase. Chart palette already uses brand colors (`#2A7DDE`, `#33E1E4`, `#10D576`) — keep it.

## 4. Cleanup

- `DashboardOverview.tsx`: remove the inner `<Tabs>` strip and just render `<LifetimeOverviewTab />`. The sidebar already handles sub‑routing, and the legacy `?tab=overview` key in `Dashboard.tsx` already points here, so behaviour is preserved.
- Move `period` math out of `PeriodOverviewTab` into a tiny pure helper (`src/components/dashboard/overview/period.ts`) so it's unit‑testable and reusable by the picker.

## Technical notes

- Files touched:
  - `supabase/migrations/<new>.sql` — grant `super_admin` to the two existing admin user_ids
  - `src/components/dashboard/overview/PeriodOverviewTab.tsx` — picker + StatsCard + branded header
  - `src/components/dashboard/overview/period.ts` (new) — period math + label formatting
  - `src/components/dashboard/overview/AnalystChatTab.tsx` — branded header + canvas; better error toast
  - `src/components/dashboard/overview/ReportsBuilderTab.tsx` — branded header + canvas; better error toast
  - `src/components/dashboard/DashboardOverview.tsx` — drop dead inner tabs
- No changes to RPCs, schema, or routing keys.
- Out of scope (separate follow‑up): persisting analyst threads and saved reports to `admin_analyst_threads` / `admin_reports` with a real left‑rail history. Tables already exist; we'll wire them in the next pass once you've validated the visuals.

Approve and I'll implement.