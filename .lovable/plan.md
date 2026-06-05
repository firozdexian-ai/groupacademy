# Re-audit: institutions + ir (post-cleanup)

Findings from second-pass sweep:

| Check | Result |
|---|---|
| TODO/FIXME/HACK | none |
| Hex / rgb literals | none |
| Supabase leaks outside repo | none |
| Edge function leaks | none |
| Mailto present (B2B rule) | ✅ EmailComposer + InvestorDetailSheet |
| Transactional email misuse | none |
| Mobile safe-area | n/a (admin shell handles it) |
| Console leftovers | **1 stray** `console.log` in `StakeholderRegistry.tsx:156` (Digital Workforce signal) |
| Raw Tailwind palette colors | **significant drift in IR** — pipeline accents + status pills |

## Items to fix (carry-over)

### A. Stray console.log
- `src/domains/institutions/components/admin/StakeholderRegistry.tsx:156` — remove `console.log("[Digital Workforce Agent Signal] …")`.

### B. Raw palette colors (status / brand)
Convert these to semantic tokens (no functional change, just token discipline):

- `InvestorsManager.tsx` — `text-blue-500`, `bg-emerald-500/10 text-emerald-500`, gradients with `via-blue-600 to-indigo-500`, `bg-blue-500` → semantic (`text-primary`, `bg-success/10 text-success`, gradient simplified to `from-primary via-primary to-primary`).
- `InvestorDetailSheet.tsx` — active pill `bg-emerald-500/10 text-emerald-500`, blue badge, emerald borders → `bg-success/10 text-success`, `bg-primary/10 text-primary`.
- `InteractionLogger.tsx` — gradient via `blue-600` → primary-only gradient.
- `pipeline/PipelineCard.tsx` — info pill `bg-blue-500/10 text-blue-600`, warn `amber-500`, purple, emerald arrow → `bg-primary/10 text-primary`, `bg-warning/10 text-warning`, `bg-accent/10 text-accent`, `text-success`.
- `StakeholderRegistry.tsx:283` — `text-blue-500` link → `text-primary`.

### C. Kanban stage accents (decision needed)
`IRPipelineBoard.tsx` defines 8 stage colors (`bg-slate/blue/indigo/violet/amber/emerald/teal/rose-500`) for the pipeline header strip. Project rule says semantic tokens only — but there are no 8 distinct stage tokens.

**Two options:**
1. **Add `--stage-1 … --stage-8` tokens** to `index.css` + `tailwind.config.ts` (proper fix, adds 8 lines to design system).
2. **Document as acceptable drift** — kanban stages are categorical and intentionally distinct; preserve as-is.

I recommend Option 1 (clean) but it's a 5-minute design-system addition. Will confirm before doing it.

---

# Next two domains

Following the same SOP. Remaining domains: `jobs`, `learn`, `marketing`, `messaging`, `profile`, `talent`, `ugc`, `workforce`.

**Proposed pair: `marketing` + `messaging`** — both are smaller, focused surfaces and a good warm-up before the heavyweight `jobs` and `learn` pair.

(If you'd rather tackle the biggest pair first, say so and I'll switch to `jobs` + `learn`.)

## Plan per domain (mirrors the institutions/ir SOP)

### Phase 1 — Structural audit (read-only)
- Confirm no legacy `src/components/marketing/`, `src/components/messaging/` folders remain.
- List `src/domains/marketing/` and `src/domains/messaging/` shape; check for `repo/`, `api/`, `components/`, `index.ts`.
- Verify shell wiring (`src/shells/admin/routes/marketing.ts`, etc.) and talent-facing page importers.

### Phase 2 — Architectural hygiene
- Move any direct `@/integrations/supabase` calls from `components/` into the repo layer.
- Slim domain barrels to named exports of consumed entries (eliminate `export *` where unused), matching gtm/ir pattern.
- Drop dead imports.

### Phase 3 — UI / design-token compliance
- Replace raw `text-white`, `bg-black`, raw palette colors with semantic tokens.
- Spot-check mobile-vertical + safe-area where these surfaces render on talent app.

### Phase 4 — Wiring & monetization preservation
- Confirm hooks/edge functions referenced still resolve and respond.
- **Marketing-specific:** preserve UTM / campaign tracking, no transactional email misuse.
- **Messaging-specific:** preserve 5k-credit inbox gate (`mem://product/creator-economy-hype-and-connections`), realtime channels, dedup logic from agentic feed notifications, no PII leaks (`mem://security/pii-and-storage-hardening`).
- Bug-fix in scope; new features/schema not.

### Phase 5 — Verify
- `rg` checks: zero supabase leaks in components, zero raw palette colors, zero stray console.
- TypeScript build clean.

## Out of scope
- New tables / columns / RLS / RPCs / edge functions.
- New features or UX rewrites.
- Other 6 domains.

Ready to execute the institutions/ir carry-over fixes + start `marketing` + `messaging` on approval.