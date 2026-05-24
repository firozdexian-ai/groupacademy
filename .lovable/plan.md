
# Next: Track D — Gro10x employer shell

## Why this next (not C or verification)
- **Customer-facing & revenue-bearing.** Gro10x is the paying-employer surface. Bad copy here directly hurts conversions and paid retention. Admin shell (Track C) is internal — same defects but lower blast radius.
- **Smaller scope than C.** ~12 pages vs ~118 admin tabs. We can finish Track D in 4–5 batches and then hit C with a clean run.
- **Verification dry-run (option 4) is more useful *after* Gro10x is humanized** — otherwise we'd find the same copy issues twice.

## Track D batch plan

```text
D1  Marketing + Auth surface
    - Gro10xLanding, Gro10xWelcome, Gro10xSignIn
    - PageGate, InstallButton, TopBar, SideNav, BottomNav (shell chrome)

D2  Work hub (jobs side)
    - Gro10xWork (root), Gro10xJobsList, Gro10xJobApplicants,
      Gro10xApplications, Gro10xShortlist, Gro10xOfferComposer

D3  Work hub (gigs + sourcing)
    - Gro10xGigBids, Gro10xProjects, Gro10xTalents,
      Gro10xSourcingLists, TalentPipelinePanel, OpenGigs, JobPostWizard

D4  Learn + commerce
    - Gro10xLearn, OpsTracksTab, Gro10xBilling, TelegramTopUpModal

D5  Messaging + agents + me
    - Gro10xInbox, Gro10xChat, Gro10xAgentMarketplace, Gro10xMe
```

Each batch = same A-track playbook: pure copy + comment scrub, no DB / RPC / behavior changes. Verify with TS clean + visual spot-check.

## Starting now: **D1 — Marketing + Auth surface**

Scope:
- `src/gro10x/pages/Gro10xLanding.tsx` — public landing page (first impression for paying employers)
- `src/gro10x/pages/Gro10xWelcome.tsx` — first-run welcome
- `src/gro10x/pages/Gro10xSignIn.tsx` — sign-in
- `src/gro10x/components/Gro10xTopBar.tsx`
- `src/gro10x/components/Gro10xSideNav.tsx`
- `src/gro10x/components/Gro10xBottomNav.tsx`
- `src/gro10x/components/Gro10xPageGate.tsx`
- `src/gro10x/components/Gro10xInstallButton.tsx`
- `src/gro10x/components/Gro10xAppShell.tsx`

Approach:
1. Read each file, identify user-visible jargon strings (Vector/Ingress/Ledger/Phase-Z/HUD/Synchroniz/Telemetry/Ecosystem/Handshake).
2. Replace with plain English while preserving brand voice (Tech Blue, Vibrant Cyan, Success Green per memory).
3. Preserve all behavior, routes, props, telemetry event names where they're used downstream.
4. Log changes in `.lovable/launch-audit.md` under a new "D1 — Gro10x Auth/Shell — shipped" section.
5. Mobile-first verification at the current 390×672 viewport.

Out of scope for D1:
- Functional changes (auth flow, routing, gates)
- DB / RPC / edge function changes
- Visual redesign (handled separately if requested)
- JSDoc/comment jargon (deferred to pre-launch sweep)

## After D1
Pause for a quick sign-off, then proceed D2 → D5. After Track D, return to Track C (admin) or jump to pre-launch verification depending on time-to-launch.
