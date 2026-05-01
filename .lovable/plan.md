# Phase 13 — Platform-Wide UI Standardization

The Feed, Learning Hub and Jobs Hub are now compact and modern. But ~25 other pages still use the old "neural / arena / calibration terminal" sci-fi styling: oversized italic uppercase headings, decorative gradients, "Registry Sync Failure" empty states, and inconsistent container widths. This phase brings every talent-facing page onto a single, calm, mobile-first design system.

---

## 1. Define the standard (shared tokens)

Codify what we already use in Feed/Learning/Jobs into one place so future pages can't drift.

`src/lib/uiTokens.ts` (new) — exports a few reusable className constants:

```text
PAGE_SHELL     max-w-2xl mx-auto px-3 py-3 pb-28 space-y-4
PAGE_TITLE     text-xl font-bold
PAGE_SUBTITLE  text-xs text-muted-foreground
SECTION_TITLE  text-sm font-semibold
META_TEXT      text-[11px] text-muted-foreground
CARD           rounded-2xl border border-border/40
CARD_PAD       p-3
PILL_ROW       flex flex-wrap gap-2   (never horizontal-scroll)
```

Plus a small `<EmptyState icon title description action />` component in `src/components/common/EmptyState.tsx` — replaces every bespoke "Registry Mismatch / Arena Empty / Sync Error" block.

## 2. Pages to de-terminalize (high priority)

These still use `text-3xl/4xl/5xl font-black uppercase tracking-tighter italic` headers, "Neural / Calibration / Registry / Arena / Telemetry / Protocol" copy, and oversized hero blocks. Convert each to standard tokens above.

| Page | Current hero | Target |
|---|---|---|
| `JobAssessment.tsx` | "Neural Interface" 3xl black | "Job Assessment" `PAGE_TITLE` |
| `StudyAbroad.tsx` | "Academic Discovery" 4xl italic + 3xl balance pill | Compact header + standard balance badge |
| `StudyAbroadDetail.tsx` | 4xl–6xl italic university name, rotated 28px emoji tile | `text-2xl font-bold`, plain logo tile `h-12 w-12 rounded-xl` |
| `IELTSPrep.tsx` | "Expansion Protocols Active" 3xl black | "IELTS Prep" + standard `EmptyState` |
| `Competitions.tsx` | "The Arena" 5xl italic | "Competitions" `PAGE_TITLE` |
| `CompetitionDetail.tsx` | "Registry Node Missing" 5xl–6xl | Compact title + `EmptyState` for missing |
| `Blog.tsx` / `BlogPost.tsx` | 4xl–6xl italic uppercase article titles | `text-2xl font-bold` article title, `text-xl` list cards |
| `AppCourseDetail.tsx` | 5xl–6xl italic course name | `text-2xl font-bold` |
| `AppMockInterviewSetup.tsx` | "Job Telemetry / Calibration / Neural Synthesis" 3xl | Plain "Setup", "Job details", "Generating…" inline |
| `AppJobs.tsx` | "Registry Mismatch" 4xl | `EmptyState` |
| `Gigs.tsx` | "Gig Hub" 2xl→4xl + 3xl dialog titles | `PAGE_TITLE` + standard `DialogTitle text-lg` |
| `ProfileEdit.tsx` | "Calibration Terminal" 3xl | "Edit profile" `PAGE_TITLE` |

For each: also remove decorative gradients, rotated tiles, drop-shadow halos, and `font-mono tracking-tighter` on numbers — use plain semibold.

## 3. Container width consistency

Standardize three widths only:
- **Reading / forms** (`max-w-2xl`) — Profile, ProfileEdit, ProfileVerify, all `tools/*`, BlogPost, Withdrawals, Transactions, SavedItems, MessageThread, AppJobApplication, AppPortfolioRequest, AppSalaryAnalysisSetup, AppCareerAssessment, AppMockInterviewSetup, JobAssessment, StudyAbroadRoadmap, StudyAbroadDetail, CompetitionDetail, AppCourseDetail, AppJobDetail, AppProfessionDetail.
- **Lists / hubs** (`max-w-3xl`) — Feed, LearningHub, JobsHub, Gigs, Marketplace, Competitions, AppJobs, AppCourses, AppEvents, MyApplications, MyAgents, MyGigs, MyResults, AgentMarketplace, StudyAbroad, IELTSPrep, Notifications, Blog, Messages, ServicesHub.
- **Full-bleed only when justified** (`max-w-none`) — AgentChat, MessageThread chat surface.

Audit pass to fix anything wider (`max-w-4xl/5xl/6xl/7xl`).

## 4. Kill remaining horizontal scroll

`overflow-x-auto`/`min-w-max`/`whitespace-nowrap` strips remaining in:
- `src/pages/app/AIAgents.tsx`, `Messages.tsx`, `Gigs.tsx`, `Blog.tsx`, `Marketplace.tsx`
- `src/components/profile/ApplicationHistoryCard.tsx`
- `src/components/feed/PostAuthor.tsx`
- `src/components/learning/LearningStreak.tsx`, `ActiveCourseHero.tsx`
- `src/components/ai-agents/RecentConversations.tsx`
- `src/components/gigs/JobSharingGigForm.tsx`

Replace with `flex-wrap` + a "More" sheet where >6 items, mirroring `AgentFilters.tsx` / `FeedFilters.tsx`.

## 5. Empty states

Replace every bespoke empty/error block (≈18 occurrences across pages) with `<EmptyState>`. Examples:
- "Registry Sync Failure" → "Couldn't load this university."
- "Arena Empty" → "No competitions yet."
- "Sync Error" → "We couldn't load this. Try again."
- "Calibration Terminal" → not an empty state; just remove.

Plain English, `text-sm`, single primary action button (`size="sm"`).

## 6. Cards & badges audit

Across `src/components/{jobs,gigs,learning,feed,marketplace}/*Card.tsx`:
- Force `rounded-2xl border border-border/40 p-3` baseline.
- Title `text-sm font-semibold`, meta `text-[11px] text-muted-foreground`.
- Replace any `font-mono uppercase tracking-tighter` badges with standard `Badge variant="outline" className="text-[10px]"`.
- Remove gradient borders, glow rings, rotation transforms.

## 7. Page-level header pattern

Every page gets the same header block (replace ad-hoc heroes):

```text
<header className="space-y-1">
  <div className="flex items-center gap-2">
    <Icon className="h-5 w-5 text-primary" />
    <h1 className={PAGE_TITLE}>Title</h1>
  </div>
  <p className={PAGE_SUBTITLE}>Short subtitle.</p>
</header>
```

Back button: `Button variant="ghost" size="sm"` with `ArrowLeft` — already used in `tools/CVMaker.tsx`. Apply to detail pages that use a custom back.

## 8. Out of scope (this phase)

- Admin dashboard pages (`src/components/dashboard/**`) — admin keeps its denser styling.
- Public marketing pages (`src/pages/*.tsx` outside `app/`) — separate brand pass.
- Color tokens, dark mode, fonts — already standardized.
- Functionality changes — pure visual/copy refactor.

---

## Execution order

1. Create `src/lib/uiTokens.ts` and `src/components/common/EmptyState.tsx`.
2. Sweep the 12 high-priority "terminal" pages in section 2 (largest visual debt).
3. Container-width audit (section 3) — mostly one-line className changes.
4. Horizontal-scroll sweep (section 4).
5. Replace empty/error blocks with `EmptyState` (section 5).
6. Card consistency audit (section 6).
7. Header pattern audit (section 7).

No DB migrations, no edge functions, no dependency changes. ~25 files modified, 2 created.

---

**Approve to proceed with Phase 13 standardization?**
