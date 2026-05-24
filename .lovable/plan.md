
# v0.5 Launch — Status & Next Course of Action

## ✅ Shipped so far

**Track A (talent-side launch sweep) — COMPLETE**
- A1 + A1-FIX + A1/A2 re-audit — Auth surface
- A2 — Onboarding (phone gate, wizard rewrite)
- A3 — Talent Profile (read + edit views)
- A4 + A4 closeout — Talent Landing / Feed / Shell
- A5.1 → A5.5 — Jobs Hub (Browse, Companies, Locations, Tools, Job Detail, /jobs/all, Assessment)
- A6 — Gigs Hub (5 tabs humanized)
- A7 — Profile & Talent Mirror polish
- A8 — Career Abroad (Study Abroad + Roadmap)

**Track B (defer matrix / coming-soon gates) — COMPLETE**
- B1 defer matrix → B2 `<ComingSoonGate>` → B3 `feature_waitlist` DB
- B5 gates applied (Gigs Marketplace tab, Leaderboards threshold, Reviewer, Managed Projects, Talent Directory, Languages hub, Competitions, per-country Abroad)
- B6 nav pruning (Pitches CTA, Creator Analytics menu item) + admin Demand Signals widget at `/dashboard?tab=signals-waitlist`

## 🟡 What's left before Dec 1, 2026

### 1. Admin shell cleanup (biggest remaining block)
The entire `/dashboard/*` surface (~118 tabs across 16 groups) has had **zero humanization pass**. Same jargon ("Phase Z", "Ledger", "Ingress", "HUD LEVEL", "Vector") that we scrubbed talent-side is still throughout. Internal-only, but admins include non-engineering stakeholders.
- Scope: 16 admin groups (Talent, Companies, AI Agents, Investors, Institutions, Workforce, GTM, UGC, Jobs, Learn, Gig Economy, Career Abroad, Marketing, Finance, Platform Config + Overview).
- Approach: group-by-group, copy + comment scrub, no behavior changes.

### 2. Gro10x employer shell (`/gro10x/*`)
Not yet swept. Used by paying employer customers — should match A5/A6 quality bar.
- Landing, Welcome, Sign-in, Work (Jobs/Applicants/Gigs/Projects/Shortlist/Talents), Learn, Inbox, Billing, Me, Agent Marketplace, Chat.

### 3. Public shell residuals
- `PublicProjectsIndex` empty-state CTA copy
- `/blog`, `/blog/:slug` copy verification
- `/c/:slug/projects` and `/c/:slug/learn` branded pages
- `/t/:handle` public talent profile copy
- `/verify/skill/:code`, `/verify/certificate/:code` transactional copy

### 4. Carry-over P1/P2s from earlier audits
- Admin `talents.country_code = "BD"` backfill → `"+880"`
- PWA `/manifest.json` 401 in preview — verify 200 on production domains
- Auth audit log retention check
- AuthClassic "Try the chat experience" CTA label
- JSDoc/comment jargon sweep (zero user impact, low priority)

### 5. P4 punch list (deferred)
- Email notifications when a `feature_waitlist` feature unlocks
- Per-country agent onboarding for `abroad-country-*` waitlists
- Companies 8th-tab investigation (from B1 sign-off checklist)

### 6. Pre-launch verification (week of launch)
- End-to-end smoke: signup → onboarding → feed → apply to job → score → save → tool run → gig bid → roadmap
- Mobile-only walkthrough on 390×672 viewport (matches user's current preview size)
- PWA install + offline test on `groupacademy.online`
- SEO: `sitemap.xml`, `robots.txt`, JSON-LD on job/talent/skill verify pages
- Security: re-run `security--run_security_scan`, verify edge function `auth.getUser(token)` guards

## 🎯 Proposed next track: **Track C — Admin shell cleanup**

Biggest remaining block, internal stakeholders will notice. Suggest tackling in this order (one batch per group, like A1→A8):

```text
C1  Overview group           (Dashboard root + Demand Signals + KPIs)
C2  Talent group             (6 tabs)
C3  Companies group          (8 tabs — resolve missing-tab investigation here)
C4  Jobs group               (admin job moderation, pipelines)
C5  Gigs group               (verification, disputes, reviewer program, projects, escrow)
C6  Learn group              (courses, cohorts, instructor payouts, tracks)
C7  Career Abroad group      (programs, leads, counsellors)
C8  Finance group            (credits, payouts, ledger)
C9  AI Agents group          (13 tabs — biggest)
C10 IR + Institutions + Workforce + Marketing + UGC + GTM + Platform Config
```

Each batch = pure copy + comment scrub, no DB/RPC changes, mirroring the A-track playbook.

**Alternative:** if you'd rather close out customer-facing surfaces first, swap C with **Track D — Gro10x employer shell** (smaller, higher revenue impact).

---

## Sign-off needed
Pick one:
1. **Track C (admin cleanup)** — start with C1 Overview
2. **Track D (Gro10x employer)** — start with Landing + Work pages
3. **Carry-over P1/P2 sweep first** — quick wins, then back to C/D
4. **Pre-launch verification dry-run** — find any P0s before more polish work

I'll plan the chosen batch in detail before executing.
