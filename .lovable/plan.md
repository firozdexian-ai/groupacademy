## Phase 4.5a — Make Gro10x Web/Desktop Compatible

### Why it looks broken on desktop today

The Gro10x super-app was designed phone-first and is hard-locked to a mobile width:

- **Every page wraps content in `max-w-md mx-auto`** (~448px). On a 1280px+ screen the user sees a thin column floating in dark space. (34 occurrences across `src/gro10x/pages/*`.)
- **`Gro10xBottomNav` is `fixed bottom-0` with `max-w-md`** — a tiny 5-icon bar pinned center-bottom that looks like a glitch on desktop and wastes the side rails where a real nav belongs.
- **`Gro10xAppShell`** has no breakpoint awareness: same single-column flex on phone and 27" monitor.
- **`Gro10xTopBar`** and chat composer assume the phone column width, so they look stranded.

Net effect: the platform is not "broken" — it's mobile-only by construction. We need a responsive shell, not a rewrite.

### Goal

Make `/gro10x/*` feel native on desktop without regressing the mobile experience. Same routes, same data, same components — just a real shell at `md:` and up.

---

### Plan

1. **New responsive shell** (`Gro10xAppShell.tsx`)
   - Mobile (`<md`): exactly today — top bar + content + fixed bottom nav.
   - Desktop (`md` and up): a 2-column layout — left **sidebar nav** (fixed, ~240px) + main content area (fluid, capped at ~`max-w-5xl` for readability). Bottom nav hidden, top bar collapses to a thin header (search + avatar + notifications).
   - Use Tailwind's `md:` / `lg:` breakpoints; no JS detection.

2. **New `Gro10xSideNav` component** (desktop only)
   - Same items as `Gro10xBottomNav`: Inbox · Activities · Learn · Feed · Company.
   - Add secondary entries that exist on mobile but are buried (Agents Marketplace, CRM, Sourcing, Offerings, Billing, Learning Ops).
   - Active state = Tech Blue accent bar; brand tokens only.

3. **Drop the page-level width cap**
   - Replace `max-w-md mx-auto` in each `src/gro10x/pages/*.tsx` with a responsive utility (e.g. `mx-auto w-full max-w-md md:max-w-3xl lg:max-w-5xl`) **only at the page root**. Inner cards/lists keep their current spacing — they just get more horizontal room on desktop and can flow into multi-column grids where it already makes sense (catalog, sourcing, learning ops tabs).
   - Specific upgrades to multi-column on `md:`:
     - `Gro10xLearn` assignments + catalog → `md:grid-cols-2`.
     - `Gro10xLearnOps` Catalog/Team/Wallet panes → `md:grid-cols-2`.
     - `Gro10xAgentMarketplace` → `md:grid-cols-2 lg:grid-cols-3`.
     - `Gro10xWork`, `Gro10xCRM`, `Gro10xSourcing` lists → `md:grid-cols-2`.
     - `Gro10xInbox` thread list → 2-pane on desktop (list left, current thread right) when a thread is open. Phase 4.5b can deepen this; 4.5a does the responsive split only.

4. **Top bar adjustment** (`Gro10xTopBar.tsx`)
   - On desktop, hide the mobile hamburger / center logo; show a left-aligned brand mark, center search field (where appropriate), right-aligned avatar + notifications.
   - On mobile, unchanged.

5. **Hide bottom nav on `md:`**
   - `Gro10xAppShell` renders `<Gro10xBottomNav className="md:hidden" />` and `<Gro10xSideNav className="hidden md:flex" />`.
   - Remove the bottom-pad reservation (`pb-[64px+safe-area]`) on `md:` so desktop content doesn't have phantom whitespace.

6. **Landing & Auth (`/gro10x`, `/gro10x/auth`)**
   - These are marketing-style pages. Audit `Gro10xLanding`, `Gro10xAuth`, `Gro10xSignIn`, `Gro10xWelcome` for `max-w-md` and replace with marketing-page widths (`max-w-6xl` content, narrower form column).

7. **Smoke test on desktop**
   - Navigate to `/gro10x`, `/gro10x/inbox`, `/gro10x/learn`, `/gro10x/learn/ops`, `/gro10x/work`, `/gro10x/page` at 1280×720; verify side nav, no fixed bottom strip, content uses width.

### Out of scope for 4.5a

- True 3-pane desktop layouts (e.g. inbox list + thread + profile) — handled in 4.5b.
- Keyboard shortcuts, command palette.
- Public marketing site redesign (only width fixes).
- Any business logic / API change.

### Open questions

1. **Sidebar default state** — always expanded on desktop (icon + label), or collapsible to icons only with a toggle? (Recommended: always expanded ≥ `lg`, icons-only at `md`–`lg`.)
2. **Max content width** — `max-w-5xl` (1024px) for readability, or full-bleed (`max-w-7xl`) so dashboards and tables breathe? (Recommended: `max-w-5xl` default, `max-w-7xl` for grid-heavy pages like Learning Ops, Sourcing, Marketplace.)
3. **Top-bar search** — wire it to a global search now (across companies/talents/courses) or leave as a visual placeholder until a search backend is ready? (Recommended: visual placeholder; wire in 4.5b when we add the command palette.)
