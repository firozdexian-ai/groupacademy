# Phase A4 — Re-audit & completion plan

Verified what shipped vs what remains. Below is a piece-by-piece status with gaps surfaced.

## Completion summary — what shipped ✅

| Slice | Status | Evidence |
|---|---|---|
| A4-FIX-1 `TalentHome` cleanup | ✅ Done | `adminSupportAssistant` removed, replaced with `trackError`; copy humanized ("messages from employers", "skills verified", "You're live on Gro10x", "Couldn't boost your profile…") |
| A4-FIX-2 Feed user-visible copy | ✅ Partial — toasts/aria done | Fixed: `HypeBoostSheet`, `FloatingWhatsAppButton` toast, `PostCard` (saved-items, report, aria), `PersonalizedPromptCard` (3 toasts), `ComposePost` (telemetry + aria), `CommentList` (tip strings) |
| A4-FIX-3 Shell scrub | ✅ Done | `TalentAppShell.tsx`: jargon comments + `fetchInstitutionalAlerts` → `fetchNotificationCount` |
| A4-FIX-4 Landing decision | ✅ Recorded | Kept `/app` → `/app/feed`; documented in audit log |
| A4-AUDIT-BACKFILL | ✅ Done | A2 + A4 sections added to `.lovable/launch-audit.md` |

## Gaps found in re-audit ⚠️

### G1 — `TalentHome` (`/app/me`) is orphaned (P0)
- No bottom-nav slot, no header link, no profile-dropdown entry points to `/app/me`.
- The profile dropdown goes to `/app/profile` (read view) and `/app/profile/edit` only.
- `TalentHome` (readiness card, pitches, verified skills) is the actual talent dashboard yet is unreachable from the shell. We humanized it but no user will ever see it.
- **Fix:** add a "Dashboard" or "My Hub" entry in the profile dropdown, OR swap the avatar tap to land on `/app/me` (with a "View public profile" item in the menu).

### G2 — `QuickActionsGrid` is dead code (P1)
- `src/domains/feed/components/talent/QuickActionsGrid.tsx` exists, references the Quick Actions Grid memory, but `rg` shows zero imports anywhere.
- Same for `QuickActionsSheet.tsx`.
- **Fix:** either mount on Feed/TalentHome per the memory, or delete (and clear the memory if intentionally dropped).

### G3 — One residual user-visible jargon string (P1)
- `FloatingWhatsAppButton.tsx:73` throws `"Credit wallet ledger mutation failed to settle cleanly."` — surfaces in console + crash boundary.
- **Fix:** plain message.

### G4 — Internal jargon comments remain across 30 feed files (P2, deferred earlier — recommend keeping deferred)
- `Phase Z0`, `Digital Workforce`, `Automated Efficiency`, `Neural Match`, `Institutional` in code comments and console.error strings.
- Not user-visible. Pre-launch comment-only pass.
- **Decision needed:** scrub now (1 batch sed) or hold until pre-launch sweep?

### G5 — Functional checks never run live (P1)
The original plan called for live walkthroughs that we didn't execute:
- Hype + comment realtime subscription cleanup on remount
- Pagination/refresh on `useFeedRecommendations`
- Notification bell badge counter
- Fresh `*@gro10x.com` sign-up → onboarding → feed → post → hype → comment flow

## Proposed sub-phases to close A4

### A4-CLOSE-1 — Wire `/app/me` into the shell (P0, ~10 min)
Add a "My dashboard" item to the profile dropdown above "View profile", linking to `/app/me`. Keeps current nav, makes TalentHome reachable in 2 taps.

### A4-CLOSE-2 — `QuickActionsGrid` decision (P1, ~5–20 min)
Quick check on the memory and decide: mount on TalentHome below the readiness card, OR delete both files. Recommend **mount on TalentHome** since that's the canonical "dashboard" surface and matches the memory's intent.

### A4-CLOSE-3 — Fix `FloatingWhatsAppButton` Error string (P1, ~2 min)
Replace `"Credit wallet ledger mutation failed to settle cleanly."` with `"Couldn't apply the credit bonus."`.

### A4-CLOSE-4 — Live verification (P1, ~10 min)
- Open preview as admin, navigate `/app/feed` and `/app/me`, confirm no console errors.
- Tap profile avatar → confirm new "My dashboard" link.
- Refresh feed, scroll, check infinite-scroll sentinel fires.
- Skim console for any `adminSupportAssistant` / `Digital Workforce` log noise.

### A4-CLOSE-5 — Comment scrub decision (deferred or now)
Ask: do you want the 30-file comment scrub done as part of A4 close, or rolled into a single pre-launch sweep? My recommendation: **defer to pre-launch** — comment-only changes carry merge-conflict risk against ongoing feature work and have zero user impact.

## Order

A4-CLOSE-1 → A4-CLOSE-2 → A4-CLOSE-3 → A4-CLOSE-4 → log final A4 closeout entry in `.lovable/launch-audit.md` → ready for A5 (Jobs Hub).

Estimated total: ~30 min to fully close A4.
