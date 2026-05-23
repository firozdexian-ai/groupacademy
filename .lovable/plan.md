# Next Phase — A7: Profile & Talent Mirror Polish

A6 (Gigs Hub) is closed. The remaining P1 talent-facing surface in the launch audit is the **Profile / Talent Mirror / Public Profile** stack. Brings `/app/profile`, `/app/talent-mirror`, and `/t/:handle` to the same launch-ready quality as Jobs (A5) and Gigs (A6).

## Goal
Humanize copy, fix empty/loading states, and ensure the profile narrative (verified skills, mastery, credentials, completed tracks, public toggle) reads cleanly to a non-technical talent — without touching schema, RPCs, or scoring logic.

## Scope (talent-facing only)

### A7.1 — Profile shell (`/app/profile`)
- Audit `src/domains/profile/components/talent/*` + profile page(s): tighten section headers, CTAs, and toasts. Replace residual jargon (e.g. "Vector", "Ledger", "Synchroniz", "Pipeline") with plain English.
- Confirm sections render in a sensible order: Header → Verified Skills → Mastery → Credentials → Completed Tracks → Experience/Education → Public toggle.
- Empty states for each section ("No verified skills yet — finish a course to earn one.").

### A7.2 — Talent Mirror (`/app/talent-mirror`)
- `TalentMirrorPanel` + page: clarify "Topics tracked" / "Average mastery" labels, weak/strong topic chips, and the Next-Best-Action list copy. Wire friendly empty state for new users with no learning history.

### A7.3 — Public profile (`/t/:handle`)
- Spot-check the public renderer: humanize section labels, ensure JSON-LD still emits, verify `ProjectPublicToggle` copy and the "Verified Skills" / "Completed Tracks" sections read cleanly to a recruiter.
- Confirm `VerifiedMatchBadge` and skill credential links resolve to `/verify/skill/:code`.

### A7.4 — Output Hub (`/app/my-gigs` → `MyGigs.tsx`)
- This page still carries heavy jargon ("Output Hub", "Professional pipeline management & deliverable handshakes", "Launch Candidate · Phase Z1 Production Contract Locked"). Rename to "My Gigs", rewrite subtitle, drop the version banner, humanize tab labels.

### A7.5 — Closeout
- Update `.lovable/launch-audit.md` with A7 findings + shipped items.
- Mark A7 done in `.lovable/plan.md`; flag A8 (Career Abroad) as the remaining P1.

## Out of scope
- Schema, RPCs, edge functions, RLS, scoring.
- Admin profile surfaces, Gro10x talent views, Career Abroad (A8).
- Visual redesign beyond copy + empty/loading states.

## Process
1. Read profile + talent-mirror + public profile + MyGigs files in parallel to baseline.
2. Implement copy/empty-state edits in parallel batches by surface.
3. Verify via preview: `/app/profile`, `/app/talent-mirror`, `/app/my-gigs`, and a sample `/t/:handle`.
4. Update audit + plan docs.

## Deliverable estimate
~12–18 files, no migrations, ~60 min. Targets a P1 closeout matching A5/A6.

If you'd rather jump to **A8 (Career Abroad)** or sweep **admin shells** next, say the word and I'll re-plan.
