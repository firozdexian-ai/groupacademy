# v0.5 Defer Matrix — Per-Surface Launch Decisions

**Phase**: P2 / B1 deliverable (doc-only, no code).
**Input**: `inventory.md` Sections C, D, F + P1 Audit Result.
**Output consumed by**: B2 (`ComingSoonGate.tsx`), B5 (apply gate), B6 (hide).

## Action vocabulary

| Action | Meaning | UX |
|---|---|---|
| **keep** | Ship as-is. Surface has enough data/value for v0.5 launch. | Normal route, normal nav. |
| **coming-soon** | Route stays mounted, but wrapped in `<ComingSoonGate featureKey="…">`. Shows a polished "Coming soon" panel + waitlist form. Records interest in `feature_waitlist`. | Route loads → gate intercepts → CTA. |
| **hide-nav** | Route still resolves (deep links work), but removed from sidebars/menus. | Not discoverable through UI. |
| **hide** | Route returns redirect or 404; removed from nav. | Gone for v0.5. |

`featureKey` is a stable slug used in `feature_waitlist.feature_key` so we can read demand signals in the admin widget (B6).

---

## 1. Talent shell `/app/*` — defer decisions

| Route | Action | featureKey | Why | Notes |
|---|---|---|---|---|
| `/app/gigs` (Marketplace tab only) | coming-soon | `gigs-marketplace` | No live client projects on day 1 | For-You tab stays keep; gate the Marketplace sub-tab only |
| `/app/gigs/appeals` | hide-nav | — | Only relevant once disputes exist | Deep link works for active disputants |
| `/app/gigs/disputes` | hide-nav | — | Same as above | |
| `/app/reviewer` (ReviewerCockpit) | coming-soon | `reviewer-program` | Most users not reviewers; show "Apply to join" CTA | Waitlist doubles as application pool |
| `/app/projects` (MyProjects) | coming-soon | `managed-projects` | Empty until first escrow project | |
| `/app/marketplace` | hide | — | Already redirects to `/app/gigs` per A11 | Confirm redirect intact in P3 |
| `/app/pitches` (TalentPitches) | hide-nav | — | Niche surface | Route preserved |
| `/app/talents` (public directory) | coming-soon | `talent-directory` | Empty until ≥50 public profiles | Gate on directory; individual `/t/:handle` stays keep |
| `/app/talents/:id` | keep | — | Public profile pages render fine even sparse | |
| `/app/creator/analytics` | hide-nav | — | Only meaningful for active creators | Surface from creator hub if active |
| `/app/languages` (index) | coming-soon | `languages-hub` | Few instructors | |
| `/app/languages/:code/practice` | coming-soon | `languages-practice` | Same | |
| `/app/languages/:code/instructors` | coming-soon | `languages-instructors` | Same | |
| `/app/abroad/destinations/:country` | coming-soon | `abroad-country-${country}` | Most countries have no agents | Per-country waitlist; signals which countries to staff first |
| `/app/abroad/study` (index) | keep | — | Index page is useful even with few items | |
| `/app/abroad/study/:id` | keep | — | If item exists, it's real | |
| `/app/abroad/ielts-legacy` | hide | — | Superseded by `/app/abroad/ielts` | Remove route or 301 → `/app/abroad/ielts` |
| `/app/learning/competitions` | coming-soon | `competitions` | Few competitions live | |
| `/app/learning/competitions/:slug` | keep | — | If slug exists, render it | |
| `/app/instructor` + sub-routes (×5) | hide-nav | — | Only instructors see it; entry via instructor role flag | No gate needed — RBAC handles |
| `/app/blog` (in-app duplicate) | hide-nav | — | Duplicates `/app/learning/blog` + public `/blog` | Deep links preserved |
| `/app/cohorts/:id`, `/app/sessions/:id/join` | keep | — | Render only when entity exists | |

## 2. Public shell `/*` — defer decisions

| Route | Action | featureKey | Why | Notes |
|---|---|---|---|---|
| `/projects` (PublicProjectsIndex) | keep | — | OK empty; SEO value; auto-fills from `toggle_project_public` | Add empty-state with "Be the first" CTA |
| `/projects/:slug` | keep | — | Renders only if slug exists | |
| `/leaderboards/:kind` | coming-soon | `leaderboards-${kind}` | Empty until ≥10 entries; threshold logic in `cron-leaderboard-rebuild` | Gate when snapshot row count < 10 (B2 logic) |
| `/c/:slug/projects` | keep | — | Brand pages; OK sparse | |
| `/c/:slug/learn` | keep | — | Same | |
| `/t/:handle` | keep | — | Public talent profile; opt-in only | |
| `/verify/skill/:code` | keep | — | Verification page; transactional | |
| `/blog`, `/blog/:slug` | keep | — | Standalone content | |
| `/agents/:agentKey` | **deferred to Track E** | — | Not built yet | Track E creates this; not a B1/B5 concern |

## 3. Admin shell `/dashboard?tab=…` — defer decisions

Admin is internal-only. Default = **keep** unless noted.

| Tab | Action | Why |
|---|---|---|
| `crm-wa-channel` | keep | Confirm WhatsApp connector live in P3; if not, swap content to setup CTA in-place (no gate) |
| `companies-wa-channel` | keep | Same |
| Companies 8th tab (per memory) | **investigate** | P1 audit open item. Resolve before B5: either restore the missing tab or update `mem://admin/companies-stakeholder-structure`. **Owner: B5 prep.** |
| Legacy admin pages (`/students`, `/instructors`, `/sessions`, `/content/*`, `/org`) | keep | Deep-link tools for admins; no orphan nav |
| `/app/services/*` aliases | hide-nav | All redirect to `/app/jobs`; no nav entry |

---

## 4. featureKey registry (input to B3 migration)

Stable slugs to seed into `feature_waitlist.feature_key`. Used by B6 admin widget to rank demand.

```
gigs-marketplace
reviewer-program
managed-projects
talent-directory
languages-hub
languages-practice
languages-instructors
competitions
leaderboards-talent
leaderboards-employer
leaderboards-instructor
abroad-country-*       (wildcard; one row per country slug, created on demand)
```

Total static keys: **10** + dynamic `abroad-country-*`.

---

## 5. ComingSoonGate behavioral contract (input to B2)

The gate component (B2) must:

1. **Render a polished panel** using existing design tokens (no custom colors). Layout: badge "Coming soon" → headline → 1-line value prop → waitlist form (email if logged-out, one-click if logged-in) → optional secondary CTA ("Explore Jobs instead", linking back to `/app/jobs` or `/`).
2. **Read** `featureKey` prop and an optional `title`, `description`, `secondaryCtaHref`, `secondaryCtaLabel`.
3. **Submit** to `feature_waitlist` via RPC `join_feature_waitlist(_feature_key text, _email text default null)`. RPC handles dedup per (user_id, feature_key) or (email, feature_key) for anon.
4. **Show toast** on success ("You're on the list — we'll email you when it opens.") and persist a local hint so the user isn't asked twice on the same surface.
5. **Logged-out path**: collect email + show "Sign up to get full updates" secondary CTA → `/auth?redirect=…`.
6. **Threshold mode** (optional, used by `leaderboards-*`): accept `showWhen` prop — a function or count-based predicate. If predicate true, render children instead of gate. Used so leaderboards auto-unlock once snapshot rows ≥ 10.
7. **Accessibility**: focus first input on mount, ESC closes if mounted as overlay (default is full-page block).
8. **Mobile-first**: vertical stack, py-2 spacing per mobile design system.

---

## 6. Out of scope for B-track

- Building per-feature waitlist landing pages outside `/app/*` shell
- Email notifications to waitlist subscribers (handled by P4 punch list if needed)
- Admin moderation of waitlist entries beyond the read-only signals widget (B6)
- Migrating existing demand signals into `feature_waitlist`

---

## Sign-off needed

Before B2 starts, confirm:

- [ ] Action column above (keep / coming-soon / hide-nav / hide) per route
- [ ] featureKey registry (10 static slugs)
- [ ] ComingSoonGate behavioral contract (Section 5)
- [ ] Companies 8th-tab investigation owner (default: B5 prep)

Once approved → B2 builds `<ComingSoonGate>` shell (visual only, no DB yet).
