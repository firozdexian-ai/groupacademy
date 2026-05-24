# B5 — Apply ComingSoonGate to "coming-soon" surfaces (Batch 1)

Scope: wrap defer-matrix routes whose action is **coming-soon** with `<ComingSoonGate>`. No new components, no schema, no nav edits (B6 handles hide-nav and admin widget).

To keep blast radius small, B5 ships in **two batches**. This plan covers **Batch 1 only** (8 surfaces). Batch 2 = remaining surfaces + dynamic abroad-country gating.

## Batch 1 — 8 surfaces

Each is a single-line wrapper at the **page component top-level** (not in `App.tsx`). This keeps lazy-loading + route layout untouched, and means dynamic params (e.g. `:country`) are available inside the gate's source-path metadata.

| # | Page file | featureKey | Title / description |
|---|---|---|---|
| 1 | `src/pages/app/ReviewerCockpit.tsx` | `reviewer-program` | "Community Reviewer Program" / "Earn credits by reviewing submissions. Applications open soon." |
| 2 | `src/pages/app/MyProjects.tsx` | `managed-projects` | "Managed Projects" / "Escrow-backed multi-talent projects. Coming soon for talents." |
| 3 | `src/pages/app/TalentDirectory.tsx` | `talent-directory` | "Talent Directory" / "Browse public talent profiles. Opening once enough talents go public." |
| 4 | `src/pages/app/LanguagesHub.tsx` | `languages-hub` | "Languages Hub" / "Practice rooms + verified language instructors. Coming soon." |
| 5 | `src/pages/app/LanguagePracticePage.tsx` | `languages-practice` | "Language Practice" / same theme |
| 6 | `src/pages/app/LanguageInstructorsPage.tsx` | `languages-instructors` | "Language Instructors" / same theme |
| 7 | `src/pages/app/Competitions.tsx` | `competitions` | "Competitions" / "Time-boxed challenges with prizes. Next season opens soon." |
| 8 | `src/pages/app/DestinationAgentPage.tsx` | `abroad-country-${country}` | "Study in {Country}" / "We're onboarding partner agents for {Country}." — uses `useParams().country` for slug + label |

For #8 the `featureKey` must satisfy the RPC regex `^[a-z0-9][a-z0-9-]{0,79}$`. We'll normalize: `country.toLowerCase().replace(/[^a-z0-9-]/g, "-")` and prefix with `abroad-country-`. If empty after normalization → fallback to `abroad-country-unknown`.

## Per-page wrapper pattern

Each page becomes:

```tsx
import { ComingSoonGate } from "@/components/launch/ComingSoonGate";

export default function ReviewerCockpit() {
  return (
    <ComingSoonGate
      featureKey="reviewer-program"
      title="Community Reviewer Program"
      description="Earn credits by reviewing submissions. Applications open soon."
      secondaryCtaLabel="Explore gigs"
      secondaryCtaHref="/app/gigs"
    >
      {/* …existing render… */}
    </ComingSoonGate>
  );
}
```

If a page already does work in its `default export` body (hooks etc.), we'll split into an inner `*Inner` component so hooks don't run behind the gate. Pattern:

```tsx
function ReviewerCockpitInner() { /* original body */ }
export default function ReviewerCockpit() {
  return <ComingSoonGate ...><ReviewerCockpitInner /></ComingSoonGate>;
}
```

This avoids wasted RPC calls / data fetches while gated.

## Verification

- Build passes (auto).
- Manual smoke (1 surface): user navigates to `/app/reviewer` in preview → sees gate → submit email → `supabase--read_query` confirms row in `feature_waitlist`.
- After Batch 1 sign-off, plan Batch 2 (gigs Marketplace sub-tab, leaderboards threshold mode, hide-nav items).

## Out of scope for Batch 1

- Gigs Marketplace **sub-tab** gating (it's a tab inside `/app/gigs`, not its own route) — Batch 2.
- Leaderboards threshold gating (`showWhen` predicate against snapshot count) — Batch 2.
- Hide-nav surfaces (`/app/gigs/appeals`, `/app/gigs/disputes`, `/app/pitches`, `/app/creator/analytics`, `/app/blog`, `/app/abroad/ielts-legacy`) — B6.
- Admin signals widget — B6.
- Nav/sidebar pruning — B6.

## Risks

- Per-page split may break a page that exports named helpers from the same file. Mitigation: only split the default export, leave other exports untouched.
- A page that relies on a specific URL search param for state may not get to read it. Mitigation: gate is at top-level so `useParams`/`useSearchParams` inside `…Inner` still works once gate releases (which is currently always closed in v0.5 launch posture, so this is moot for Batch 1).
- `DestinationAgentPage` country slug — confirm `useParams<{country: string}>()` is the existing convention before edit (will verify in first file read of build phase).

---

Awaiting "go" to switch to build mode and apply 8 file edits.
