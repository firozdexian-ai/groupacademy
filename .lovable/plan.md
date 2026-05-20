## Phase 5.8 — `ir` domain vertical slice

Admin-only domain (Investor Relations). No edge functions, no talent-facing UI, single external consumer (`src/pages/Dashboard.tsx`). 23 files in four buckets.

### Scope

**Admin UI → `src/domains/ir/components/admin/` (+ barrels at `src/components/dashboard/ir/*`)** — 9 top-level files
- `IRDashboard`, `IRPipelineBoard`
- `InvestorsManager`, `InvestorDetailSheet`, `InteractionLogger`
- `EmailComposer`
- `KeyInfluencersTab`
- `MRRTargetManager`, `VCFirmsManager`

**Dataroom → `src/domains/ir/components/admin/dataroom/` (+ barrels at `src/components/dashboard/ir/dataroom/*`)** — 4 files
- `DataRoomManager`, `DocumentTelemetryDrawer`, `ShareLinkDialog`, `UploadDocumentDialog`

**Economics → `src/domains/ir/components/admin/economics/` (+ barrels at `src/components/dashboard/ir/economics/*`)** — 6 files
- `UnitEconomics`, `CohortRetentionCard`, `RetentionCard`, `RevPerEmployeeCard`, `HitLCogsCard`, `MetricEntrySheet`

**Pipeline → `src/domains/ir/components/admin/pipeline/` (+ barrels at `src/components/dashboard/ir/pipeline/*`)** — 2 files
- `PipelineCard`, `PipelineColumn`

**Hooks → `src/domains/ir/components/admin/hooks/` (+ barrels at `src/components/dashboard/ir/hooks/*`)** — 2 files
- `useDataRoom`, `useIRPipeline`

**Edge contract → `src/edge/contracts/ir.ts`**
- Reserved namespace, no invokes today. All persistence is direct table writes / RPCs.

**API manifest → `src/domains/ir/api/manifest.ts`**
- Empty `irApi = {}` stub.

**Domain index → `src/domains/ir/index.ts`**
- Re-export all components, hooks, `irApi`.

**F3 sweep**
- No edge invokes. Only mechanical rewrites of relative imports (`../DashboardSkeleton`, `./hooks/...`, intra-folder siblings) to absolute `@/...` paths where needed after copy.

### Importers that keep working via barrels
- `src/pages/Dashboard.tsx` (sole external consumer).

### Verification
- Type-check passes.
- `/dashboard` Investors group tabs (Pipeline / Investors / VC Firms / Key Influencers / Dataroom / Unit Economics / MRR Targets) all mount.
- Dataroom upload + share-link flows still open.
- `rg "functions.invoke" src/domains/ir/` returns 0.

### Out of scope
- IR-side chat agents (`FP&A`, `Relationship Exec`) — already part of `agents` domain.
- Public investor landing pages — not present.
- Phases 6–9.

### Risk
- Low. 23 files, 0 edge fns, 1 external importer.

### Progress after 5.8
~57%. Next: 5.9 finance.

### Roadmap remainder
```text
5.9  finance
5.10 institutions
5.11 workforce
5.12 ugc
5.13 dashboard residuals (jobs admin, agents admin, etc.)
Phase 6  platform/ extraction (notifications, credits, payments)
Phase 7  shells/*/routes.tsx + React.lazy
Phase 8  retire barrel re-exports
Phase 9  edge/contracts/ for every domain
```

---

## Phase 5.8 — completed

- 9 admin tabs + 4 dataroom + 6 economics + 2 pipeline + 2 hooks moved to `src/domains/ir/components/admin[/sub]/`.
- Barrels at `src/components/dashboard/ir/*` for all 23 files.
- Cross-domain `../talent/LinkedInJsonUpload` rewritten to `@/components/dashboard/talent/LinkedInJsonUpload`.
- Sibling relative imports (`./InvestorDetailSheet`, `./InteractionLogger`, `./PipelineCard`, `./CohortRetentionCard`, `../hooks/useDataRoom`, `../hooks/useIRPipeline`, etc.) preserved as-is (paths still resolve in new layout).
- `src/edge/contracts/ir.ts` reserved (no edge fns today) + `src/domains/ir/api/manifest.ts` stub.
- `src/domains/ir/index.ts` re-exports everything.
- Verified zero `functions.invoke` in domain.
