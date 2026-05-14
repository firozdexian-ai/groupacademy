## Investors & IR — Re-audit (Phase IR-Z1)

10 tabs · 23 files · ~4,780 LOC. Since last audit, **4 of 6 fixes landed**; **B1 is still broken**, **2 polish items pending**, and **3 features look ripped/orphaned**.

---

### ✅ Already fixed since IR-Z0

| ID | Fix | Verified |
|---|---|---|
| B2 | `IRDashboard` now pulls live counts (`ir_vc_firms`, `ir_investors`, `talents`, 30d `ir_outreach_log`) via single `useQuery(["ir-unified-telemetry"])` | IRDashboard.tsx:48-94 |
| B3 | `InvestorsManager` search input is wired (`searchQuery` + `filteredInvestors` memo over name/email/title/firm) | InvestorsManager.tsx:114-127, 261 |
| P1 | `EmailComposer` logs to `ir_outreach_log` **and** opens `mailto:` per email memory | EmailComposer.tsx:64-69 |
| P2 | `KeyInfluencersTab` now has edit + delete (file grew 246 → 327 LOC) | KeyInfluencersTab.tsx:103-121 |

---

### 🔴 Still broken (regression risk)

**B1 — `IROverviewTab` still queries non-existent tables.** Renders zeros silently behind a swallowed catch.
```ts
sb.from("vc_firms")        // ❌  → ir_vc_firms
sb.from("investors")       // ❌  → ir_investors
sb.from("ir_mrr_targets")  // ❌  → ir_monthly_targets  (col target_mrr_usd→mrr_target_usd, target_date→month)
```
This tab is mounted as `ir-overview` ("IR Overview") and is visible in the sidebar — every visit shows 0/0/0 unless the user happens to have an `ir_influencers` row.

---

### 🟠 Removed / orphaned features (DB tables w/o code paths)

Database tables exist but no client or edge function reads/writes them — strong candidates for previously-ripped features:

| Table | Status | Likely original purpose |
|---|---|---|
| `ir_email_communications` | Zero refs outside `types.ts` | A richer outbound email log (separate from `ir_outreach_log`) — possibly intended for the "Executive Updates" tab's send history. Probably superseded by `ir_outreach_log`. |
| `ir_pipeline_events` | Zero refs outside `types.ts` | Stage-transition audit log. The `useIRPipeline.moveCard` mutation updates `pipeline_stage` directly with **no event log written** — losing IR history that this table was designed to capture. |
| `ir_retention_cohorts` | Zero refs outside `types.ts` | Cohort-level NRR/GRR for the Unit Economics tab. `useUnitEconomics` currently only reads `ir_metrics_snapshots` — the cohort grid is gone. |

These three should be either **wired back** or **dropped via migration with a memory note**. Recommend wiring `ir_pipeline_events` (cheap insert in `moveCard`) and re-evaluating the other two.

---

### 🟡 Polish still pending from IR-Z0

**P3 — Folder fragmentation.** `IROverviewTab.tsx` + `KeyInfluencersTab.tsx` still live in `components/dashboard/investors/`; everything else in `components/dashboard/ir/`. Same issue we cleaned up for Companies. Move into `ir/` and update Dashboard imports.

**P4 — Two overview screens.** `ir-overview` (KPI HUD) and `ir-dashboard` (Intelligence Hub) both summarize IR. Now that `IRDashboard` has a full 4-card KPI ribbon plus live counts, `ir-overview` is redundant. Recommend **delete `ir-overview`** from the sidebar and drop the file (after fixing B1 is moot if we're deleting it).

**P5 — `supabase as any` casts.** `IROverviewTab` and `KeyInfluencersTab` still cast through any. If we delete `IROverviewTab` and consolidate Influencers into `ir/`, regenerate types and drop the casts.

---

### 🟢 Structural / deferred

- **S1** — `InvestorsManager` (650 LOC) and `VCFirmsManager` (585 LOC) are still oversized. Split dialog + delete confirm into siblings. Defer.
- **S2** — `ir_outreach_log` has no FK to `ir_investors` (composer admits it). Adds clean per-investor outreach history. Defer.
- **S3** — Memory drift: `mem://admin/investors-stakeholder-structure` lists 9 tabs missing `ir-pipeline`, `ir-dataroom`, `ir-economics`. Update memory to match the 10-tab reality once we resolve P4.

---

### Proposed IR-Z1 execution plan

**Decisions needed:** the lettered options below.

1. **Fix B1** — one of:
   - **(a)** Delete `IROverviewTab.tsx` + remove `ir-overview` entry from `Dashboard.tsx` (resolves P4 too). ← recommended
   - **(b)** Rewrite queries to use real tables; keep tab.
2. **Restore `ir_pipeline_events`** — in `useIRPipeline.moveCard`, after the update insert `{ investor_id, from_stage, to_stage, changed_by, changed_at }`. Adds audit trail that downstream IR FP&A agent can read.
3. **Decide on `ir_email_communications` and `ir_retention_cohorts`:**
   - **(c)** Wire them back (more work, more product surface).
   - **(d)** Drop tables via migration and document in memory as deliberately removed.
4. **P3** — move `IROverviewTab` (or just `KeyInfluencersTab` if we delete the overview) into `ir/`; update Dashboard imports; drop `as any` casts.
5. **Memory** — update `mem://admin/investors-stakeholder-structure` to reflect the final tab set + Phase IR-Z1 lock note.

**My recommendation:** 1a + 2 + 4 + 5; defer (c/d) until you tell me whether to revive Email Communications and Retention Cohorts. That's the minimum to lock the area cleanly without losing features that are actually orphaned.

Tell me which letters you want (1a vs 1b, c vs d) and I'll execute.