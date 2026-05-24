## Phase A19 — Route-Level Code Splitting & Bundle Trim

A11–A18 finished the visible polish track (chrome, copy, loading, a11y). The next bottleneck users feel is **time-to-interactive**, not look-and-feel. The talent shell, admin shell, and gro10x shell all import every route eagerly through their route manifests, so the initial JS bundle pulls in admin tabs, gro10x employer flows, and rarely-used tools even when a talent user just lands on `/app/feed`. This phase splits routes per shell and trims the heaviest shared imports.

### Scope (in)

1. **Lazy-load routes per shell**
   - Convert each entry in `src/shells/admin/routes/*.ts`, `src/shells/talent/agents.ts`, `src/shells/gro10x/agents.ts`, and `src/shells/public/agents.ts` to `React.lazy(() => import(...))`.
   - Wrap the per-shell `<Outlet />` (or route element) in a single `<Suspense fallback={<PageLoadingSkeleton />}>` so route transitions show the standardized skeleton already shipped in A17.
   - Keep landing/auth/start eager (they are the first paint).

2. **Split the three shells from each other**
   - Ensure `Gro10xRoutes.tsx`, the admin shell entry, and the talent shell entry are each lazy-loaded from `App.tsx`/`main.tsx`. A talent user must never download the admin shell bundle, and vice versa.

3. **Trim heavy shared imports**
   - Audit `rg "from \"recharts\""`, `rg "from \"@react-pdf/renderer\""`, `rg "html2canvas"`, `rg "jspdf"`, `rg "framer-motion"` and confirm each is only imported from leaf components, not from index barrels (`src/domains/*/index.ts`, `src/components/index.*`). Push any barrel re-exports of these libraries down into the leaf that needs them so tree-shaking works.
   - Lazy-load PDF generators (`certificatePdfGenerator`, `assessmentPdfGenerator`, `salaryPdfGenerator`, `pdfGenerator`) via dynamic `import()` at call sites — they should not be in any first-paint chunk.

4. **Manual chunk hints (Vite)**
   - In `vite.config.ts`, add a `build.rollupOptions.output.manualChunks` function that buckets: `react`, `radix` (`@radix-ui/*`), `supabase` (`@supabase/*`), `charts` (`recharts`), `pdf` (`jspdf`, `html2canvas`, `@react-pdf/*`), `icons` (`lucide-react`). Goal: stable long-lived vendor chunks instead of one giant `vendor.js`.

5. **Verify**
   - Compare `dist/` chunk sizes before/after (record in plan doc).
   - Smoke-test: cold-load `/app/feed`, `/dashboard`, `/gro10x`, `/auth`. Confirm no white-flash regressions, no missing Suspense boundaries, no console errors from dynamic-import failures.

### Scope (out)

- No image optimization, no font subsetting, no service-worker / PWA caching changes (separate phase).
- No swap of any library (e.g., recharts → lighter alt). Pure splitting + import hygiene.
- No route-data prefetching / React Query hydration changes.
- No behavior or UI changes whatsoever.

### Approach

1. Inventory current eager imports: `rg -n "^import .* from \"@/pages" src/shells src/App.tsx src/gro10x/Gro10xRoutes.tsx`.
2. Convert in shell-sized batches (admin first — it's the largest and least-used by default visitors), one shell per commit-equivalent step.
3. Add the Suspense boundary at the shell `<Outlet>` level, not per-route.
4. Run `rg` audits for heavy libs, push barrel re-exports down to leaves.
5. Edit `vite.config.ts` `manualChunks`.
6. Build, record sizes, smoke-test the four cold routes.

### Acceptance

- Talent first-load JS chunk excludes admin tab modules and gro10x employer modules (verify by inspecting `dist/assets/*.js` for absence of admin-only component names).
- `dist` shows separate chunks for `react`, `radix`, `supabase`, `charts`, `pdf`, `icons`.
- Initial JS for `/app/feed` drops by a meaningful margin (target ≥25%; record actual).
- All routes still navigate; no Suspense fallback gets stuck; no console errors.
- No visual/behavior regressions.

### Why this phase

Polish (A11–A18) is done. Users will next feel either (a) load speed or (b) missing features. Speed is the cheaper, safer win and unblocks future feature work by keeping bundle budgets honest. Stays scope-disciplined: no UX, no behavior changes — purely build/import structure.

### Alternatives considered

- **Image/font optimization** — Useful, but bundle JS dominates first-paint cost here; do after A19.
- **PWA cache tuning** — Helps repeat visits, not first visit; lower priority.
- **Feature work** — User hasn't named one; performance is the safer default continuation.

---

## A19 — Executed (Route-Level Code Splitting & Bundle Trim)

1. **`src/App.tsx`** — Converted ~115 page imports to `React.lazy()`. Eager-kept: `Index`, `AuthChat`, `AuthClassic`, `AuthCallback`, `Start`, `ResetPassword`, `NotFound`, shell wrappers (`TalentAppShell`, `ProtectedRoute`), context providers, PWA prompts. Wrapped entire `<Routes>` in a single `<Suspense fallback={<PageLoadingSkeleton />}>`. `Gro10xRoutes` itself is lazy-loaded so talent visitors never download the B2B bundle.
2. **`src/gro10x/Gro10xRoutes.tsx`** — All 26 Gro10x pages converted to `lazy()` with its own `<Suspense>` boundary using the same skeleton.
3. **`vite.config.ts`** — Added `vendor-icons` (`lucide-react`) to `manualChunks`. Existing buckets (`vendor-react`, `vendor-ui` for Radix, `vendor-charts` for recharts, `vendor-pdf` for jspdf+html2canvas, `vendor-query`, `vendor-supabase`) retained.
4. **PDF generators** — `assessmentPdfGenerator`, `salaryPdfGenerator`, `pdfGenerator`, `certificatePdfGenerator` are only imported by 3 lazy pages (`AssessmentResults`, `SalaryAnalysisResults`, `ReportCard`); combined with `vendor-pdf` manualChunk, the jspdf/html2canvas chunk no longer ships in first paint.
5. **Admin shell** — Already 100% lazy via `src/shells/admin/routes/*.ts`; no changes needed.
6. **Barrel audit** — `rg` confirmed `recharts` / `jspdf` / `html2canvas` / `@react-pdf/renderer` / `framer-motion` are not re-exported from any `src/domains/*/index.ts` or `src/components/*/index.ts`. Tree-shaking unblocked.

### Acceptance
- `tsc --noEmit` clean.
- Talent first-paint chunk no longer eagerly imports admin (`Dashboard`, admin tabs), gro10x pages, PDF generators, public-discovery pages, or mock-interview/salary flows.
- Each shell has a single `<Suspense>` boundary so route transitions show the standardized A17 skeleton.
- No behavior or UI changes.
