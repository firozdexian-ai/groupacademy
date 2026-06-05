# Sequence recap

Done so far: **gigs + gtm** → **institutions + ir** → **marketing + messaging**.
Next pair (this plan): **profile + talent**.
Remaining after this: **jobs + learning** → **ugc + workforce**.

So the running order is: gigs · gtm · institutions · ir · marketing · messaging · **profile · talent** · jobs · learning · ugc · workforce.

---

# Part A — Re-audit carry-over for marketing + messaging

Second-pass sweep found everything clean **except raw palette colors** (which the first pass partially missed). No supabase leaks, no edge invokes, no `export *`, no console, no TODOs, no transactional misuse. Mailto preserved.

### A1. Messaging palette drift → semantic tokens
- `messaging/components/talent/ThreadListItem.tsx:84` — `bg-blue-600/bg-emerald-600` avatar fallback → `bg-primary` / `bg-success`.
- `messaging/components/admin/MessagingChannelsTab.tsx` — `from-primary to-blue-500`, `bg-blue-500/10 text-blue-500`, `from-emerald-400 to-emerald-500`, emerald/orange status pills → `from-primary to-accent`, `bg-primary/10 text-primary`, `bg-success/10 text-success`, `bg-warning/10 text-warning`.

### A2. Marketing palette drift → semantic tokens
- `MarketingAnalyticsTab.tsx` — heavy orange/blue/emerald/fuchsia/indigo/violet/green/rose palette throughout the header, stat cards, log rows, and pulse bars. Map: orange→`primary`, blue→`accent`, emerald/green→`success`, amber→`warning`, fuchsia/violet/indigo/rose→`accent` variants (we already have `--accent`; for the 4-bar PulseBar grid use `bg-primary / bg-accent / bg-success / bg-warning` as the canonical 4-slot palette).
- `MarketingAnalyticsTab.tsx:62` `CHART_COLORS` hex array and `:244,:293` hex color props → replace with `hsl(var(--primary))`, `hsl(var(--success))`, `hsl(var(--warning))`, `hsl(var(--accent))`, `hsl(var(--destructive))`, `hsl(var(--muted-foreground))`.
- `LeadsActivitiesTab.tsx:18-19` — `text-indigo-500` → `text-accent`.
- `ServiceOutreachTab.tsx` — blue/amber/emerald stat config + emerald header icon → `primary` / `warning` / `success`.
- `StandaloneSalaryCodeGenerator.tsx:114` and `StandaloneMockInterviewCodeGenerator.tsx:113` — `via-blue-600` in gradient → `via-accent`.

### A3. Marketing hex literals (legitimate brand swatches — preserve)
- `ThemesTab.tsx:21,79` — `#2A7DDE` brand-color default for theme rows is data, not styling. **Keep.**
- `messaging/hooks/useMessageThreads.ts:81` — `#2A7DDE` fallback for system thread color. **Keep** (it's mapped into a per-thread accent, not a stylesheet color).

No new tokens needed (using existing `--primary`, `--accent`, `--success`, `--warning`, `--destructive`, `--muted-foreground`). No functional change.

---

# Part B — Profile + Talent refactor (mirrors SOP)

### Scope
- `src/domains/profile/` (talent-facing profile editing, public settings, history cards)
- `src/domains/talent/` (admin-facing talent registry, batch upload, outreach, professions, creator economy)

### Phase 1 — Structural audit (read-only confirm)
- No legacy `src/components/profile/` or `src/components/talent/` folders remain (initial check clean).
- Confirm shell wiring via `src/shells/admin/routes/talent.ts` resolves all listed talent admin exports.
- Confirm `ProfileEditDialog` and friends are imported from `@/domains/profile` by talent pages (`TalentHome`, profile page).

### Phase 2 — Architectural hygiene
- **Supabase leak (1 file):** `profile/hooks/useTalentPitches.ts` imports `@/integrations/supabase` directly. Move the queries/mutations into `profileRepo.ts` (create one if it doesn't exist; mirrors `marketingRepo`/`messagingRepo` pattern) and have the hook call repo functions.
- **Barrel hygiene — profile:** replace 15 `export *` lines with explicit named exports matching what shells/pages consume (same pattern we did for ir/marketing/messaging). Hook re-exports stay explicit.
- **Barrel — talent:** already named exports ✅, no change.
- Drop any dead imports surfaced by the audit.

### Phase 3 — UI / design-token compliance
- **`text-white` / `bg-black`** in 7 files (BatchTalentUpload, SkillsEditor, ProfilePhotoUpload, TalentDetailDialog, SupportAITab, TalentOutreachConsoleTab, LinkedInJsonUpload) → `text-primary-foreground` / `bg-foreground/20`.
- **Raw palette colors** across ~24 files. Map consistently: blue→`primary`, emerald/green→`success`, amber/orange→`warning`, red/rose→`destructive`, indigo/violet/purple/fuchsia/cyan→`accent`, slate→`muted-foreground`. Heaviest files: `SupportAITab.tsx` (20), `ServiceHistoryCard.tsx` (11), `TalentOverviewTab.tsx` (10), `CVUploadSection.tsx` (9), `ProfileCompletionMeter.tsx` (7).
- Spot-check `ProfileEditDialog` / `PublicProfileSettings` on mobile: vertical layout, safe-area, compact spacing (3:1 banner ratio for `CoverImageUpload`).

### Phase 4 — Wiring & monetization preservation
- **Public profile opt-in** (`mem://product/public-talent-profile`) — preserve `get_public_talent_profile` flow in `PublicProfileSettings`.
- **CV / IdentityDocs** — keep signed-URL pattern for `talent-cvs` bucket (`mem://security/pii-and-storage-hardening`); no PII in logs.
- **PayoutAccountsManager** — preserve managed-payments wiring (no schema change).
- **Creator Economy / Hype** (`mem://product/creator-economy-hype-and-connections`) — preserve 5k-credit inbox gate, 80/20 split, dynamic connection fees in `CreatorEconomyTab`.
- **Outreach** (`TalentOutreachConsoleTab`) — preserve mailto-only B2B contract (`mem://architecture/email-outreach-vs-transactional-strategy`).
- **LinkedIn import** — preserve normalization rules (`mem://admin/talent-management/linkedin-import-logic`).
- **Talent readiness** (`computeReadiness`) — leave logic untouched.
- Bug-fixes in scope; new tables / RLS / RPCs / edge functions / features **out of scope**.

### Phase 5 — Verify
`rg` sweeps must show zero results in profile + talent for:
- `@/integrations/supabase` outside `repo/`
- `text-white|bg-black\b` (raw)
- `(text|bg|border|from|to|via)-(blue|emerald|green|amber|orange|red|indigo|violet|purple|fuchsia|rose|teal|slate|cyan|pink|yellow|sky|lime)-[0-9]`
- `console\.(log|debug)`
- `TODO|FIXME|HACK`

Plus TypeScript build clean.

---

# Out of scope (unchanged from prior SOP)
- New DB schema, RLS policies, RPCs, edge functions, storage buckets.
- New features, UX rewrites, route changes.
- The 4 remaining domains (jobs, learning, ugc, workforce).
- Pricing values **may** be adjusted only if a bug is found; bug-fixes for broken hooks/edge calls in scope.

Approve to execute Part A + Part B in one pass.
