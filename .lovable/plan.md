# Phase 13 Final Sweep — All 27 Remaining Pages

Apply the standard `uiTokens.ts` system (PAGE_SHELL, PAGE_TITLE, SECTION_TITLE, CARD, META_TEXT, PILL_ROW) and `EmptyState` component across every remaining talent-facing page in one pass. Remove all "terminal/sci-fi" jargon and replace with plain English.

## Scope — 27 Pages, Grouped

### Group 1 — High-traffic core (5)
- `src/pages/app/Feed.tsx`
- `src/pages/app/AppJobDetail.tsx`
- `src/pages/app/AppJobApplication.tsx`
- `src/pages/app/AppDashboard.tsx`
- `src/pages/app/AgentChat.tsx`

### Group 2 — Career & Learning (8)
- `src/pages/app/AppCourses.tsx`
- `src/pages/app/CareerTracks.tsx`
- `src/pages/app/CareerTrackDetail.tsx`
- `src/pages/app/MockInterview.tsx`
- `src/pages/app/MockInterviewSession.tsx`
- `src/pages/app/SalaryInsights.tsx`
- `src/pages/app/CVUpload.tsx`
- `src/pages/app/SavedItems.tsx`

### Group 3 — Profile, Wallet, Settings (7)
- `src/pages/app/Profile.tsx`
- `src/pages/app/PublicProfile.tsx`
- `src/pages/app/Wallet.tsx`
- `src/pages/app/Transactions.tsx`
- `src/pages/app/Notifications.tsx`
- `src/pages/app/Settings.tsx`
- `src/pages/app/Referrals.tsx`

### Group 4 — Tools & Misc (7)
- `src/pages/app/tools/CVMaker.tsx` (header sweep only — body already standardized)
- `src/pages/app/tools/CoverLetter.tsx`
- `src/pages/app/tools/LinkedInOptimizer.tsx`
- `src/pages/app/Messages.tsx`
- `src/pages/app/AgentMarketplace.tsx`
- `src/pages/app/AgentProfile.tsx`
- `src/pages/app/Onboarding.tsx`

## Standardization Rules Applied to Every File

1. **Container**: Wrap top-level content in `<div className={PAGE_SHELL}>` (or `PAGE_SHELL_WIDE` for dense dashboards).
2. **Headers**: Replace `text-3xl font-black uppercase tracking-widest italic` → `<h1 className={PAGE_TITLE}>Plain English Title</h1>`.
3. **Cards**: Use `className={CARD}` on all `<Card>` elements; remove neon borders/glows.
4. **Pill rows**: Replace `overflow-x-auto flex gap-2` strips with `<div className={PILL_ROW}>` (flex-wrap, gap-2).
5. **Empty states**: Replace bespoke "Registry Empty / Signal Lost" blocks with `<EmptyState icon={...} title="..." description="..." action={...} />`.
6. **Spacing**: Standardize to `space-y-3` / `space-y-4`; remove excessive `py-12` heroes on sub-pages.
7. **Bottom safe area**: Ensure `pb-28` (already in PAGE_SHELL) for mobile sticky nav clearance.

## Copy — De-terminalization Glossary

| Old (sci-fi) | New (plain) |
|---|---|
| Neural / Protocol / Logic Handshake | (remove) |
| Calibration / Calibrating | Setup / Loading |
| Transmission / Signal / Beacon | Message / Notification |
| Registry / Arena / Terminal | List / Page |
| Execute / Engage / Initiate | Submit / Start / Apply |
| Operator / Node | User / Item |
| Synthesizing intelligence | Generating |
| Anomaly detected | Something went wrong |

A single grep pass per file catches: `Neural`, `Protocol`, `Calibration`, `Terminal`, `Registry`, `Arena`, `Synthesiz`, `Anomaly`, `Handshake`, `Operator Node`.

## Out of Scope (intentionally untouched)
- Admin dashboard pages (`src/pages/admin/*`) — separate design system.
- Auth pages (`SignIn`, `SignUp`, `ResetPassword`) — already standardized in earlier phase.
- Backend logic, edge functions, RLS, hooks — UI-only sweep.
- Landing/marketing pages (`src/pages/Index.tsx` etc.) — separate brand treatment.

## Execution Strategy

- One file at a time, top-down per group.
- Use `code--line_replace` for surgical header/copy swaps; `code--write` only when >60% of file changes.
- Preserve all existing hooks, queries, mutations, and business logic verbatim.
- After each group, do a quick visual smoke check via `read_console_logs` for unrelated breaks.

## Deliverables

- 27 pages fully aligned to `uiTokens.ts`.
- Zero remaining sci-fi terminology in talent-facing routes.
- Consistent mobile-first vertical layout, no horizontal scroll strips.
- All pages render within `max-w-2xl` (or `max-w-3xl` for dense ones) with safe-area bottom padding.

Ready to execute on approval.