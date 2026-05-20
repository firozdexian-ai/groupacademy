## Phase 5.13a — Admin shell residuals (chat / messaging / gtm / overview / performance)

11 dashboard folders remain. Splitting into sub-phases to stay safe. **5.13a** covers the 5 smallest, lowest-coupling admin shells (22 files, 1 `functions.invoke` site).

### Inventory & target domains

| Source | Files | Invokes | Target domain |
|---|---|---|---|
| `dashboard/chat/` | 4 (`AgentRail`, `AgentRedirectStub`, `ChatThread`, hooks `useAdminAgents`, `useAgentRuntimeThread`) | 0 | `domains/agents/components/admin/chat/` |
| `dashboard/messaging/MessagingChannelsTab.tsx` | 1 | 0 | `domains/messaging/components/admin/` |
| `dashboard/gtm/` | 4 (`ConfirmPurge`, `GtmKnowledgeTab`, `GtmOverviewTab`, `GtmTabs`, hook `useGtmGraph`) | 0 | **new** `domains/gtm/components/admin/` |
| `dashboard/overview/` | 6 (`AgentAnomalyFeed`, `AnalystChatTab`, `LifetimeOverviewTab`, `OverviewSkeleton`, `PeriodOverviewTab`, `ReportsBuilderTab`, util `period.ts`) | 0 | **new** `domains/analytics/components/admin/overview/` |
| `dashboard/performance/` | 5 (`EnrollmentFunnel`, `KPIStrip`, `ModuleDropoffTable`, `PoolHealthCard`, `RecentActivityList`) | 0 | `domains/analytics/components/admin/performance/` |

### Scope

**Move + barrel pattern** (same as 5.10–5.12):
- Copy each file to its new domain path; replace the original with a barrel `export { default, NamedExport } from "@/domains/.../..."`.
- Hooks become `export * from "@/domains/.../hooks/..."`.

**New domain skeletons** (`gtm`, `analytics`):
- `src/domains/{gtm,analytics}/index.ts` — barrel re-exports.
- `src/domains/{gtm,analytics}/api/manifest.ts` — `{} as const` stub.
- `src/edge/contracts/{gtm,analytics}.ts` — `Record<string, never>` reserved.

**Import rewrites** (relative `../` → `@/`):
- Audit each file with `rg "from ['\"]\\.\\." src/domains/{gtm,analytics,agents,messaging}/components/admin/` after the copy and rewrite each hit to its `@/components/...` or `@/domains/...` equivalent. From the survey, the only known hits are inside `dashboard/chat` and `dashboard/overview` siblings; will resolve once copied.
- `gtm/ConfirmPurge.tsx` looks like a domain-local copy — keep it inside the gtm domain rather than pointing it at the shared `dashboard/common/ConfirmPurge`.

**Cross-domain consumer kept stable**:
- `src/domains/learning/components/admin/content-widgets/CoursePerformanceDashboard.tsx` keeps its current `@/components/dashboard/performance/*` imports — they resolve through the new barrel files.

**`DashboardChat.tsx`**:
- Continues importing `@/components/dashboard/chat/*` unchanged (barrel re-exports).

### F3 sweep
- **Zero** `functions.invoke` calls across the five folders — no edge contract enrichment needed in 5.13a.

### Verification
- `tsc` clean.
- `/dashboard` Overview / Period / Reports / Analyst Chat tabs mount.
- `/dashboard/chat` thread + AgentRail render.
- GTM Knowledge / Overview tabs mount.
- Performance widgets (incl. embedded `CoursePerformanceDashboard`) render.
- `rg "functions.invoke" src/domains/{gtm,analytics,agents/components/admin/chat,messaging/components/admin}` → 0.

### Out of scope (deferred to 5.13b/c/d)
- `dashboard/abroad/` (9 files) → `domains/abroad` — 5.13b
- `dashboard/agents/` (15 files) → `domains/agents` — 5.13b
- `dashboard/gigs/` (12) + `dashboard/learning/` (21) → 5.13c
- `dashboard/jobs/` (14, **7 invokes**) + `dashboard/marketing/` (15) → 5.13d (heavier, contract enrichment needed)
- Phases 6–9 (platform extraction, route shells + lazy, barrel retirement, full edge contracts).

### Risk
- Low. No edge calls, single primary consumer (`pages/Dashboard.tsx` + `pages/DashboardChat.tsx`), barrels preserve every existing import path.

### Progress after 5.13a
~75%. Remaining residuals: ~86 files across 5 folders (abroad, agents, gigs, learning, jobs, marketing).
