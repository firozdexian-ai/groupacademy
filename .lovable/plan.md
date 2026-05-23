
# v0.5 Jargon Sweep — Plan

**Goal:** Find and fix every embarrassing, user-visible "tech-jargon" string across the talent app before Nov 28, without spending 6 days on it.

**Scope of v0.5 sweep:** Talent surfaces only — `src/pages/app/**`, `src/domains/**/components/talent/**`, `src/components/**` (shared UI). **Admin + Gro10x are out of scope** for v0.5 (staff-operated; defer to v1.0.1).

**Initial sweep (read-only, just ran):** 448 files match the broad regex. ~60–70% of those are false positives (code identifiers, comments, hook names, admin-side). True user-visible jargon estimate: **~120–160 files, ~250–400 string instances.**

---

## 3-pass methodology

### Pass 1 — Tier the hits (Day 1, ~2 hrs)

Tighten the regex to **user-visible strings only**: match inside JSX text, `toast(...)`, `title=`, `placeholder=`, `aria-label=`, `<h1-h6>`, `<p>`, `<span>`, plus `description:` / `label:` in config objects.

Write `scripts/jargon-sweep.ts` that:
1. Walks talent-scope files
2. Parses with a lightweight JSX-aware regex (or `@babel/parser` if needed)
3. Bucketizes hits into:
   - **T1 — User-blocking** (loading screens, error states, headers, CTAs, toasts)
   - **T2 — User-visible decoration** (subtitles, footer tags, secondary copy)
   - **T3 — Code-only** (variable names, comments, telemetry event strings) — defer to v1.0.1
4. Outputs `.lovable/v0.5-jargon-hits.md` grouped by file + tier + line

**Expected output:** ~50–80 T1 strings, ~150–250 T2 strings, ~rest T3.

### Pass 2 — Batch-fix T1 (Days 1–2, ~4 hrs)

T1 = anything blocking comprehension. Examples already confirmed live:
- `"Verifying Core Clearance Tokens…"` → `"Signing you in…"`
- `"Logic Node Fault"` → `"Something went wrong"`
- `"Telemetry sync error. Admin agents notified."` → `"We hit a snag. Our team has been notified."`
- `"Protocol: Verified Mastery Sync v2.6.4"` → **delete** (footer noise)
- `"Initialize Synthesis Pipeline"` → `"Start"`

Process: read the file, fix all T1 strings in one edit per file, move on. No design changes, no restructuring, no telemetry renames. **15–30 files/hour at this bar.**

### Pass 3 — Batch-fix T2 by surface area (Days 2–3, ~6 hrs)

Group T2 hits by talent surface so we touch each route once:
- Profile / Onboarding / Auth
- Learning Hub + Course pages + Player
- Gigs Hub + Marketplace
- Career Abroad + IELTS
- AI Agents + Chat
- Wallet + Transactions + Settings
- Misc (Blog, Competitions, Connections, Saved)

For each surface: open every flagged file, fix every T2 string, no scope creep.

---

## What stays out of v0.5 (explicit)

- **Admin panel jargon** — staff-operated, our team can read it
- **Gro10x panel jargon** — pilot employers only, hand-walked by staff
- **Code comments** with `[cite: 6]` and similar — invisible to users
- **Telemetry event names** (`boot_gate_warmup_skipped_session_active`, etc.) — internal logs only
- **Variable names** (`useTelemetry`, `cognitiveCore`, etc.) — code-level
- **Footer "version" badges** that are just slightly weird but not jargon

All of the above → v1.0.1 backlog.

---

## Technical section

### Banned-phrase regex (T1 + T2 detector)

```
\b(Clearance|Telemetry|Anomaly|Sentinel|Synthesis|Synthetic|Cognitive|
   Executive Logic|Logic Node|Node Failure|Reasoning Pipeline|
   Verified \w+ Sync|Core (Boot|Clearance|Sync)|Initialize \w+|
   Protocol:|HUD|Phase [A-Z]\d|cite:\s*\d)\b
```

Plus heuristic: any JSX text-node string with ≥3 Capitalized Tech-Words in a row (e.g. "Adaptive Synthesis Engine").

### User-visible string detector

Match strings inside:
- `>...</tag>` text nodes for `h1-h6`, `p`, `span`, `div`, `label`, `button`
- `toast.error(...)`, `toast.success(...)`, `toast(...)`
- `title=`, `placeholder=`, `aria-label=`, `alt=`
- Object literal values for keys: `label`, `title`, `description`, `headline`, `subtitle`, `cta`, `message`, `error`

### Files produced

- `scripts/jargon-sweep.ts` — runnable sweep
- `.lovable/v0.5-jargon-hits.md` — tiered hit list with file:line
- `.lovable/v0.5-jargon-glossary.md` — replacement glossary (so fixes stay consistent: e.g. "Clearance" always → "sign-in", "Telemetry" always → "diagnostics")

### Time budget (fits inside the v0.5 6-day window)

| Pass | Effort | Day |
|---|---|---|
| Build sweep script + run + tier | 2 hrs | Day 1 |
| Fix all T1 | 4 hrs | Day 1–2 (overlaps B2) |
| Fix T2 by surface | 6 hrs | Day 2–3 (overlaps B2/B3) |
| **Total** | **~12 hrs** | **Within Days 1–3** |

No timeline impact on Nov 28 launch.

### Risk

- **R1:** Sweep script produces 400+ T1 hits → re-tier: only fix the obvious user-blocking ones; remainder → v1.0.1
- **R2:** Some "jargon" is actually intentional brand voice (e.g. "Mastery", "Credentials") — glossary file prevents over-correction
- **R3:** AST parsing slow on 600+ files → regex-only mode is fine; false positives go to a "review" bucket

---

## Approval needed

1. Approve this sweep methodology + scope (talent-only, T1+T2 only)?
2. Should I include the **PWA boot screen / loading screens / auth flow** in T1 with extra priority? (They're the first thing every user sees — `"Verifying Core Clearance Tokens"` is on the auth path).
3. Approve building the sweep script as part of Day 1 work?

Once approved I switch to build mode and start with the sweep script + Pass 1 output.
