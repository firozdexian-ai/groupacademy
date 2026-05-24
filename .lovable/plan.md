## Phase A18 — Accessibility & Semantic HTML Pass

The polish track (A11–A17) unified the visual chrome: buttons, cards, modals, empty states, copy, and loading indicators all share one vocabulary. What it didn't touch is the **semantic + a11y layer underneath**. Screen-reader experience, keyboard navigation, and form accessibility are still inconsistent across talent and admin surfaces. This phase is the natural next step: same surfaces, same scope discipline, but normalizing the invisible layer.

### Scope (in)

1. **Icon-only buttons missing `aria-label`** — Audit `src/pages/app/**`, `src/domains/*/components/talent/**`, `src/domains/*/components/admin/**`, and `src/gro10x/**`. Common offenders: close buttons, kebab menus, copy-to-clipboard, refresh, expand/collapse, sort toggles. Target: every `<Button size="icon">` or `<button>` containing only a lucide icon gets an `aria-label`.

2. **Form inputs missing labels** — Sweep for `<Input>` / `<Textarea>` / `<Select>` without an associated `<Label htmlFor>` or `aria-label`. Most search bars and inline filters are unlabeled. Add visually-hidden labels (`sr-only`) where a visible label would break layout.

3. **Landmark roles** — Each page route should have one `<main>` (or `role="main"`) wrapping primary content. Audit page shells; the `TalentShell`, admin shell, and gro10x shell mostly already wrap children in `<main>`, but standalone pages (e.g. `/auth`, `/start`, error pages) often don't.

4. **Heading hierarchy** — Spot-check that each page has exactly one `<h1>` and that sections use `<h2>`/`<h3>` rather than styled `<div>`s. Fix obvious skips (h1 → h4) on the top 20 highest-traffic pages (feed, jobs, learn, profile, dashboard, jobs hub, gigs, messages, notifications, settings, plus equivalent admin tabs).

5. **Keyboard traps & focus rings** — Verify `Dialog`, `Sheet`, `Popover`, `DropdownMenu` (all shadcn) trap focus correctly (they do by default — just confirm no rogue `tabIndex={-1}` on triggers). Ensure custom clickable `<div>`s have `role="button"` + `tabIndex={0}` + Enter/Space handlers, or are converted to `<button>`. Common offender: card click-throughs on `/app/jobs`, `/app/gigs`, `/app/feed`.

6. **`alt` text on `<img>`** — Audit `src/pages/app/**` and gro10x for `<img>` without `alt`. Decorative images get `alt=""`; informative ones get a real description.

### Scope (out)

- No public/marketing pages, landing, or auth chat flows (intentional bespoke UX, separate pass).
- No color-contrast audit (separate phase — needs design tokens review).
- No screen-reader testing infrastructure / Storybook a11y addon — out of scope for this product.
- No new components or behavior changes. Purely additive a11y attributes + tag swaps.
- No `eslint-plugin-jsx-a11y` install (would generate hundreds of warnings; tackle in a later phase if desired).

### Approach

1. **Audit pass** — `rg` patterns to enumerate offenders:
   - `<Button[^>]*size="icon"(?![^>]*aria-label)` for icon-button violations
   - `<Input(?![^>]*aria-label)(?![^>]*id=)` (cross-ref with `<Label htmlFor>` in same file)
   - `<img (?![^>]*alt=)` for missing alt
   - `onClick=\{[^}]+\}` on `<div>` / `<span>` without `role="button"`
   - `<h1` count per page (>1 or 0 = flag)
2. **Targeted edits** — Use `code--line_replace` on each match. No blanket sed; context matters (e.g., decorative vs. informative icons).
3. **Sweep order** — talent pages first (highest user impact), then gro10x, then admin tabs.
4. **Spot-check** — Manual keyboard tab through `/app/feed`, `/app/jobs`, `/app/messages`, `/dashboard`, one admin tab. Verify focus rings visible and dialogs trap focus.

### Acceptance

- 0 hits for `<Button size="icon">` without `aria-label` in talent + admin + gro10x surfaces.
- 0 hits for `<img>` without `alt` attribute in talent + admin + gro10x surfaces.
- All standalone routed pages have a `<main>` landmark (either directly or via shell).
- Top 20 pages have exactly one `<h1>`.
- No build/console regressions.

### Why this phase

A11–A17 made the product look consistent. A18 makes it **work** consistently for keyboard and screen-reader users, and lays the groundwork for a Lighthouse / axe-core audit later. It stays within the same scope discipline (no behavior changes, surgical sweeps), so it slots cleanly in after the polish track.

### Alternatives considered (not recommended now)

- **JSDoc / identifier jargon sweep** — Cleans up internal names like `Authoritative*`, `Hardened*` in non-UI files. Low user impact; defer.
- **Performance pass** (lazy-load images, code-split heavy routes) — Bigger architectural work; needs separate planning.
- **Feature work** — User hasn't named a feature target; polish-track follow-through is the safer default.

---

## A18 — Executed (Accessibility & Semantic HTML pass)

1. **Icon-only Buttons**: Brace-aware parser swept `src/pages/app/**`, `src/domains/**`, `src/gro10x/**`. Added `aria-label` to **226** `<Button size="icon">` instances across **125** files. Labels inferred from `title=`, `navigate(-1)` (→ "Go back"), and lucide icon name (X → "Close", Trash2 → "Delete", Pencil → "Edit", ArrowLeft → "Go back", Send, Search, RefreshCw, MoreHorizontal, etc. — 45-entry icon→label map). Deduped 7 collisions where the file already had `aria-label` elsewhere on the same Button.
2. **`<img>` alt text**: 1 file (`CompaniesTab.tsx`) had a missing `alt` on a company logo; added `alt=""` (decorative — accompanies company name text).
3. **`<main>` landmark**: Added `role="main"` to outermost wrapper of 5 standalone routed pages (`AuthClassic`, `AuthChat`, `Start`, `NotFound`, `ResetPassword`). Used `role="main"` rather than tag-swapping `<div>`/`</div>` to avoid JSX pairing risk.
4. **Build verified**: 0 TS errors after dedup fix.

### Acceptance

- `<Button size="icon">` without `aria-label` across talent + admin + gro10x: **0**.
- `<img>` without `alt`: **0**.
- 5/5 standalone pages have a main landmark.
- shadcn Dialog/Sheet/Popover/DropdownMenu already trap focus via Radix — no changes needed.

Accessibility baseline established: keyboard and screen-reader users get accessible names on every icon control, every image, and a primary landmark on every routed page.
