## Phase A16 — Public & gro10x Chrome Sweep

A11–A14 normalized admin. A15 normalized the talent app (`/app/*`). Two surfaces still carry the old heavy chrome and jargon: **public/marketing pages** and the **gro10x employer shell**. This phase ports the proven A11–A14 regex rules to both, finishing the chrome unification across the product.

### Scope (in)

**Public/marketing pages** (anything user-facing without `/app/` or admin):
- `src/pages/public/**` — `PublicTalentProfile`, `WebinarLanding`, `PublicProjectsIndex`, `PublicProjectDetail`, `PublicLeaderboard`, `PublicCompanyPage`, `CompanyBrandedCatalog`, `CompanyPublicProjects`
- `src/pages/Public*.tsx` — `PublicBlog`, `PublicBlogPost`, `PublicCourses`, `PublicJobDetail`, `PublicServices`, `PublicServiceLanding`
- `src/pages/Auth*.tsx`, `src/pages/Index.tsx`, `src/pages/NotFound.tsx`, `src/pages/ResetPassword.tsx`
- Legacy standalone pages still rendered to users: `Dashboard`, `CourseDetail`, `Instructors*`, `Sessions*`, `Enrollments`, `MockInterview*`, `CareerAssessment`, `AssessmentResults`, `Quiz*`, `Portfolio*`, `Organization`, `ReportCard`, `SalaryAnalysisResults`, `ImmersiveCoursePlayer`, `Content*`, `Module*`
- `src/components/landing/**` (marketing components)

**gro10x employer shell:**
- `src/shells/gro10x/**`, `src/pages/gro10x/**`, `src/domains/*/components/gro10x/**`

### Scope (out)

- `src/components/ui/**` shadcn primitives — untouched.
- Brand colors, layouts, routes, mobile constraints (`py-2`, 3:1 banner, safe-bottom) — untouched.
- Public marketing **hero sections, landing-page art direction, and the marketing site's intentional oversized type** — left alone unless they hit jargon copy. The audit applies to forms, cards, modals, tables, and empty states, not editorial hero composition.
- No feature, data, routing, or behavior changes.

### Rules applied (same as A11–A15)

- **Buttons**: `h-14 px-{8,10,12} rounded-2xl` → `h-10 px-4 rounded-xl`; `shadow-2xl shadow-*/{10,20,30}` → `shadow-sm`; `text-[10px] font-bold uppercase` / `text-[11px] font-black` → `text-sm font-medium`
- **Cards/tables**: `rounded-[40px|32px|28px]` → `rounded-2xl`, `rounded-[24px]` → `rounded-xl`; `border-2 border-border/*` → `border border-border/60`; `bg-card/{30,50}` → `bg-card`; `tracking-[0.2em]` → `tracking-tight`; `backdrop-blur-{xl,md}` on cards → drop
- **Modals**: `rounded-3xl` → `rounded-2xl`; `backdrop-blur-{2xl,xl}` on panels → removed; header micro-caption → `text-sm text-muted-foreground`
- **Empty-state copy**: "Zero X detected/found/deployed" → "No X yet"; "Inbox Zero Achieved" → "All caught up"; visible "Registry/Telemetry/Artifact/Ingest" nouns in user-facing strings → plain English. Variable-name identifiers left alone.

### Approach

1. Baseline `rg` count per rule family across each sub-scope (public, gro10x).
2. One `sed` sweep per rule family, scope-bounded.
3. **Hero-section guard**: before sweeping `src/pages/Index.tsx` and `src/components/landing/**`, list the file's intentional oversized elements and exclude them from the button/card rules — landing pages are allowed `h-14` CTAs and `rounded-[40px]` hero cards by design.
4. Spot-check: `/` (landing), `/auth`, `/jobs/:id` (public), `/c/:slug`, `/projects`, `/t/:handle`, and a gro10x route.
5. Verify build + console clean.

### Acceptance

- 0 hits across non-landing public + gro10x scope for the same regex set zeroed in A11–A15.
- Landing/hero composition visually unchanged.
- Chrome on auth, public profile, public job/project/company pages, and gro10x employer shell matches admin + talent.

### Why this phase

A15 finished talent. A16 finishes the last two surfaces (public + gro10x) so the entire product — admin, talent, public, employer — shares one chrome vocabulary. After A16, the polish track is structurally complete and the next track (loading skeleton unification, JSDoc/identifier sweep, or accessibility pass) can begin cleanly.
---

## A16 — Executed

Swept 54 files across `src/pages/public/**`, `src/pages/Public*.tsx`, `src/pages/Auth*.tsx`, legacy standalone pages (Dashboard, CourseDetail, Instructor*, Session*, Enrollments, MockInterview*, CareerAssessment, AssessmentResults, Quiz*, Portfolio*, Organization, ReportCard, SalaryAnalysisResults, ImmersiveCoursePlayer, Content*, Module*, LearningReview, AdminLive/MessagingInbox), and `src/shells/gro10x` + `src/domains/*/components/gro10x/*`.

- **Before**: buttons 30 hits, cards 40 hits, modals 30 hits, jargon 1 hit.
- **After**: 0 across every regex family.
- Visible jargon strings fixed: "Academic Artifact" → "Report card", "JD Ingestion" → "Job description", "Synchronizing Catalog Matrix..." → "Loading catalog...", "Registry Identity Missing" → "Company not found", "Registry Empty" → "Nothing here yet", "Syncing Portfolio Registry..." → "Loading projects...", "Registry Fault" → "Error", "Artifact Missing" → "Post not found", "Synchronizing Session" → "Loading session".
- Landing (`src/pages/Index.tsx`, `src/components/landing/**`) intentionally excluded; hero composition untouched.

Admin (A11–A14), talent (A15), and public/gro10x (A16) now share one chrome vocabulary across the entire product.
