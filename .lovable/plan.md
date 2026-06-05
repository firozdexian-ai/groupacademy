## Finish Learning Domain + Next Pair (UGC + Workforce)

### Part A — Finish Learning Domain (carry-over)

1. **Fix `useProgress.ts`** — swap remaining `supabase.channel` reference to `subscribeToModuleProgress` from `learningRepo`.
2. **Clean `learningRepo.ts`** — remove duplicate exports (`listLearningTrackItems`, `insertLearningTrackItem`).
3. **Migrate remaining learning components/hooks** to repo helpers:
   - `useCourseBriefs`, `useModuleResources`, `useLearningTracks`, `useInstructorWorkspace*`
   - `MyCoursesTab`, `UnifiedDiscovery`, `TracksTab`, `EventsTab`, `CoursesTab`, `BulkResourceUpload`, `LearningB2BEngagementsTab`, `ModulePickerPanel`, `QuizResultsViewer`
4. **Hygiene** — remove stray `console.log/debug` in `useCertificate.ts`; rewrite `src/domains/learning/index.ts` with explicit named exports (no `export *`).
5. **Verify** — `rg "@/integrations/supabase" src/domains/learning` returns only `repo/` + `api/`; no `export *`; no raw palette/`text-white`/`bg-black`; no `console.log`.

### Part B — Re-audit Jobs + Learning

Run the same regex sweep across both:
- Supabase leaks outside `repo/`/`api/`
- `export *` in barrels
- Raw palette colors / `text-white` / `bg-black`
- Stray `console.log`, `TODO`/`FIXME`
Fix anything found before moving on.

### Part C — UGC Domain Refactor

- **Barrel:** rewrite `src/domains/ugc/index.ts` to explicit named exports.
- **Repo:** move all direct `@/integrations/supabase` calls from components/hooks into `ugcRepo.ts` (feed posts, hype reactions, comments/replies, mentions, notifications, realtime subscriptions to `feed_posts` + `post_comments`).
- **Tokens:** semantic-token sweep (primary/success/warning/accent/destructive/muted-foreground; `primary-foreground`/`foreground`).
- **Preserve:** Paid Hype (1cr, 80/20 split), agentic feed notifications (dedup + prefs), AI removal flags, monetization rules.

### Part D — Workforce Domain Refactor

- **Barrel:** rewrite `src/domains/workforce/index.ts` to explicit named exports.
- **Repo:** consolidate direct Supabase calls (commissions ledger, talent assignments, workforce ops queries, realtime) into `workforceRepo.ts`.
- **Tokens:** same semantic-token sweep.
- **Preserve:** workforce commission splits, operating model rules, admin oversight flows.

### Verification (per domain)

- `rg "@/integrations/supabase" src/domains/<d>` → only `repo/` + `api/`
- `rg "export \*" src/domains/<d>/index.ts` → empty
- `rg "text-white|bg-black|(bg|text|border)-(blue|emerald|green|amber|orange|red|rose|indigo|violet|purple|fuchsia|cyan|slate)-[0-9]" src/domains/<d>` → empty
- `rg "console\.(log|debug)|TODO|FIXME|HACK" src/domains/<d>` → empty
- Build clean

### Out of scope

No new tables, RLS, RPCs, edge functions, or features. Bug-fixes only if surfaced incidentally. After this pair, the full domain refactor sweep is complete.
