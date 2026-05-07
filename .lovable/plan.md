# Phase 5.6 — Public Discovery for Projects & Leaderboards

## Goal
Phases 5.1–5.5 made the gig + projects engine work end-to-end **inside the logged-in app**. But everything happens behind auth — Google can't index a single project, no company can show off a completed engagement publicly, and there's no SEO surface that pulls new talent + new posters into the funnel. Phase 5.6 closes that gap: a public, SEO-friendly discovery layer for **gigs, projects, and the talents/companies who win them**, plus opt-in leaderboards that turn the marketplace into a magnet.

This is the layer that converts Gro10x from "private tool we use" into "platform people search for."

---

## Part A — 5.5 cleanup carried over

Three small follow-ups from 5.5 that ride on the 5.6 migration:

1. **Project status digest delivery** — `ai-project-status-summary` runs but isn't wired to a weekly cron + email send. Add `cron-project-weekly-digest`.
2. **Escrow receipts download** — `gig_escrow_ledger` is queryable but no PDF/CSV export from project cockpit. Wire a CSV export RPC + button.
3. **Project room realtime** — `gig_project_messages` insert event isn't subscribed in `ProjectRoom.tsx` yet (still polls). Add Supabase realtime channel.

---

## Part B — Phase 5.6 — Public Discovery

### Core surfaces

| Route | Purpose | Auth |
|---|---|---|
| `/gigs` | Public marketplace index (open gigs + recently completed) | public |
| `/gigs/:slug` | Public gig detail (single-deliverable, 5.1) | public |
| `/projects` | Public project showcase (completed + open-public) | public |
| `/projects/:slug` | Public project case-study page | public |
| `/leaderboards/talents` | Top talents (overall + per category) | public |
| `/leaderboards/companies` | Top hiring companies (volume + reputation) | public |
| `/leaderboards/reviewers` | Top community reviewers (5.4 program) | public |
| `/c/:slug/projects` | Branded company project portfolio | public |
| `/t/:handle/projects` | Talent's public project portfolio (extends 5.5 `/t/:handle`) | public |

All pages are server-friendly: meta tags, JSON-LD, OG image, canonical, sitemap entry.

### Schema

| Object | Purpose |
|---|---|
| `gig_public_settings` | `gig_id`, `is_public bool`, `slug`, `og_image_url`, `published_at`, `seo_title`, `seo_description` |
| `project_public_settings` | `project_id`, `is_public`, `slug`, `og_image_url`, `published_at`, `case_study_md`, `featured_deliverables jsonb` |
| `leaderboard_snapshots` | `kind` (`talent` / `company` / `reviewer`), `period` (`weekly` / `monthly` / `alltime`), `category` nullable, `payload jsonb`, `computed_at` — pre-computed rankings; cron writes |
| `discovery_signals` | append-only event stream: `entity_kind`, `entity_id`, `signal` (`view` / `share` / `apply` / `hire` / `complete` / `dispute_lost`), `weight`, `created_at` — feeds ranking + trending |

RLS:
- `gig_public_settings` / `project_public_settings`: select by anyone when `is_public=true`; write only by owner (poster) or admin.
- `leaderboard_snapshots`: select by anyone, write only by service role.
- `discovery_signals`: insert by edge functions only, select by admin.

### Triggers
- On `gig_projects.status → 'completed'`: auto-create `project_public_settings` row with `is_public=false` and seed `case_study_md` from `ai-project-case-study` (off by default; poster opts in).
- On `talent_trust_events` insert: append `discovery_signals` view-equivalent for ranking inputs.

### RPCs
- `get_public_gigs(_filters jsonb, _page int, _page_size int)` — paginated, filtered (category, budget range, currency, recency).
- `get_public_gig_detail(_slug text)` — returns gig + poster company snippet (anonymized if private) + similar gigs.
- `get_public_projects(_filters jsonb, _page int, _page_size int)` — same shape.
- `get_public_project_detail(_slug text)` — project + milestones (titles only, no internal chat) + awarded talents (handles only) + case study + featured deliverables.
- `get_leaderboard(_kind text, _period text, _category text)` — reads latest `leaderboard_snapshots`.
- `get_company_public_projects(_slug text)` — branded portfolio.
- `get_talent_public_projects(_handle text)` — extends `get_public_talent_profile` with completed projects.
- `toggle_gig_public(_gig_id uuid, _public bool)` / `toggle_project_public(_project_id uuid, _public bool)` — owner-only; auto-generates slug + OG image job.
- `record_discovery_signal(_kind text, _id uuid, _signal text)` — service-role only; called by edge functions.

### Edge functions
- `ai-project-case-study` — Gemini 2.5-pro: from project + milestones + verdicts, draft a 4-section markdown case study (Brief / Approach / Outcome / Team). Owner can edit before publishing.
- `ai-gig-public-summary` — short 2-paragraph poster-friendly summary used as `seo_description`.
- `og-image-render` — generates 1200×630 OG image per public entity (gig, project, leaderboard rank); cached in storage bucket `discovery-og`.
- `cron-leaderboard-rebuild` (hourly weekly + nightly monthly) — recomputes `leaderboard_snapshots` from `talent_trust_score`, `talent_trust_events`, `gig_escrow_ledger`, `gig_review_assignments`, `discovery_signals`.
- `cron-sitemap-rebuild` (every 30 min) — writes `public/sitemap.xml` slice for `/gigs`, `/projects`, `/leaderboards`, `/t`, `/c` from public-settings tables. Uses incremental rewrite, not full scan.
- `cron-discovery-signal-decay` (daily) — applies time-decay to `discovery_signals.weight` for trending recency.
- `discovery-share-redirect` — `/s/:short` short-link redirector that records `share` signals and forwards to canonical URL.
- `notify-public-listing` — pings poster when their listing gets X views/applies/saves (digest, not per-event).

### Public UI

- **`/gigs` index** — search bar, category chips, sort (Newest / Trending / Highest budget), 12-card grid, infinite scroll. Sidebar: top categories, top posters this week.
- **`/gigs/:slug`** — hero (title, budget chip in poster currency + USD, deadline, category), brief, similar gigs, "Bid on this gig" CTA → `/auth?returnTo=…`.
- **`/projects` index** — same layout, two tabs: Live (open public projects) + Showcase (completed case studies).
- **`/projects/:slug`** — case-study page: hero with company brand, brief, team (talent chips → `/t/:handle`), milestone timeline, featured deliverables (images/PDFs), outcome metrics, "Hire this team" CTA.
- **`/leaderboards/*`** — ranked table, per-category filter, period toggle (Week / Month / All-time), badge chips (verified, trust tier, reviewer tier), profile links. Each row links to public profile.
- **`/c/:slug/projects`** — extends `CompanyBrandedCatalog.tsx` shell: branded header + projects grid.
- **`/t/:handle/projects`** — extends `PublicTalentProfile.tsx`: new "Projects" section above existing skill credentials.

All pages: SSR-friendly head tags via `setHead` pattern already used in `CompanyBrandedCatalog.tsx`, JSON-LD (`Course` → `JobPosting` for gigs, `CreativeWork` for projects, `ItemList` for leaderboards), canonical URL, OG image from `discovery-og` bucket, sitemap entry.

### App-side surfaces

- **Poster cockpit (Gro10x)** — new "Make public" toggle on each gig + project with preview, slug editor, OG image preview, view/share counters.
- **Talent cockpit** — same toggle on completed gigs + projects ("Add to portfolio").
- **Admin → Gig Ops → Discovery** (new subtab):
  - Public listings table (filter by entity, status, owner)
  - Force-unpublish / takedown with reason
  - Leaderboard rebuild trigger + last-run status
  - Sitemap last-rebuild status
  - Discovery signals analytics (top viewed, top shared, conversion funnel)

### Ranking inputs (talent leaderboard, illustrative)
```text
score = 0.35 * trust_score
      + 0.20 * normalized(gigs_completed_30d)
      + 0.15 * normalized(escrow_released_30d)
      + 0.10 * verified_skill_count
      + 0.10 * reviewer_tier_weight
      + 0.10 * recency_boost(last_completed_at)
```
Weights live in `verification_rules`-style `discovery_rules` row so admin can tune without redeploy.

---

## Out of scope (deferred)

- **5.7** — Cash payouts for talents via managed payments rails.
- **5.8** — Cross-project portfolio auto-generator + per-talent case-study export (PDF).
- Indexable internal search results pages (low ROI vs sitemap).
- Paid promotion / featured listings (separate monetization phase).

---

## Technical sequencing (Phase 4 SOP)

```text
Step 1 → Cleanup migration: weekly project digest cron, escrow CSV export RPC,
         project room realtime subscription.

Step 2 → Phase 5.6 schema: gig_public_settings, project_public_settings,
         leaderboard_snapshots, discovery_signals + RLS + triggers + slug uniqueness.

Step 3 → RPCs: get_public_gigs/projects (+ details), get_leaderboard,
         get_company/talent_public_projects, toggle_*_public,
         record_discovery_signal.

Step 4 → Edge functions: ai-project-case-study, ai-gig-public-summary,
         og-image-render (writes discovery-og bucket),
         cron-leaderboard-rebuild, cron-sitemap-rebuild,
         cron-discovery-signal-decay, discovery-share-redirect,
         notify-public-listing.

Step 5 → Public UI: /gigs, /gigs/:slug, /projects, /projects/:slug,
         /leaderboards/{talents,companies,reviewers}, extend
         /c/:slug/projects + /t/:handle/projects. Wire setHead + JSON-LD + OG.

Step 6 → App UI: "Make public" toggle on gig + project cockpits with preview,
         view/share counters.

Step 7 → Admin UI: Gig Ops → Discovery subtab (listings, takedowns,
         leaderboard rebuild, sitemap status, signal analytics).

Step 8 → Memory entry + plan.md update + smoke test:
         publish project → verify slug + OG + sitemap entry → record share signal
         → leaderboard rebuild includes new data.
```

---

## Open questions

1. **Default visibility on completion** — auto-public completed projects (with anonymized client name unless opted in) or strict opt-in only? Proposal: strict opt-in; auto-create draft case study so owner just clicks Publish.
2. **Leaderboard categories** — use the existing `gig_categories` taxonomy as-is, or introduce a tighter "discovery category" mapping (10–12 buckets) for cleaner browsing? Proposal: derived bucketing on top of existing categories.
3. **OG image style** — branded card with company logo + budget + category, or photographic generation per project? Proposal: branded card (cheap, on-platform consistency); photographic only for showcase hero on `/projects/:slug`.
4. **Leaderboard refresh cadence** — hourly weekly + nightly monthly + weekly all-time, or all hourly? Proposal: tiered (above) to keep cron cost bounded.
