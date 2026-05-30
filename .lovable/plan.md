
# Next phase: Track D1 — Gro10x marketing + auth + shell chrome

## Why this next
Track C (admin shell) has had three passes (C1–C3) and the remaining hits are deep dialog copy with low blast radius. Gro10x is the **paying-employer surface** — every jargon string here costs conversions. D1 is the smallest, highest-leverage slice: the pages a prospect sees before they even sign in, plus the chrome that wraps every authed page.

## Scope (D1)

Marketing + auth:
- `src/gro10x/pages/Gro10xLanding.tsx`
- `src/gro10x/pages/Gro10xWelcome.tsx`
- `src/gro10x/pages/Gro10xSignIn.tsx`

Shell chrome (visible on every Gro10x page):
- `src/gro10x/components/Gro10xAppShell.tsx`
- `src/gro10x/components/Gro10xTopBar.tsx`
- `src/gro10x/components/Gro10xSideNav.tsx`
- `src/gro10x/components/Gro10xBottomNav.tsx`
- `src/gro10x/components/Gro10xPageGate.tsx`
- `src/gro10x/components/Gro10xInstallButton.tsx`
- `src/gro10x/components/Gro10xLoading.tsx`

## Approach
Same playbook as C1–C3 (pure copy scrub, zero behavior change):
1. Read each file, flag user-visible jargon (Vector / Ingress / Ledger / Phase-Z / HUD / Synchroniz* / Telemetry / Ecosystem / Handshake / Node / Registry / Artifact / Cipher / Yield / Sync / Neural).
2. Replace with plain English in the existing brand voice (Tech Blue / Vibrant Cyan / Success Green).
3. Preserve routes, props, event names, telemetry keys, classNames, behavior.
4. Skip JSDoc/comment-only jargon (deferred to pre-launch sweep).
5. Re-grep each file post-edit; log shipped strings in `.lovable/launch-audit.md` under a new "D1 — shipped" section.

## Out of scope
- Auth flow, routing, gate logic
- Visual redesign / layout changes
- DB, RPC, edge function changes
- D2–D5 batches (Work hub, Gigs, Learn/Billing, Inbox/Agents/Me) — queued after D1 sign-off

## After D1
Pause for a quick visual spot-check at 393×732, then proceed D2 (Work hub: jobs side). Return to Track C deep dialogs only if a pre-launch verification dry-run flags them.
