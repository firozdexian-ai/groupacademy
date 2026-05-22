
# Phase A1 — Auth Surface Audit (ready to execute)

## Test accounts policy (saving to memory)
- `gro10xnow@gmail.com` — real admin, never modify
- `*@gro10x.com` — test accounts, safe to create/delete (e.g. `a1test1@gro10x.com`)

## A1 sub-checks (8 items, ~25 min)

| # | Check | How |
|---|---|---|
| 1.1 | Session persists on refresh | Reload `/dashboard`, confirm still logged in |
| 1.2 | Logout flow | Click logout → lands on `/`, `/app/*` redirects to `/auth` |
| 1.3 | Email signup (fresh test acct) | Create `a1test1@gro10x.com`, verify flow + DB row |
| 1.4 | Email login | Login as the new test acct, check redirect via `resolvePostAuthRoute` |
| 1.5 | Wrong password | Confirm clear error toast, no silent fail |
| 1.6 | Google OAuth button | Click, verify redirect URL shape (don't complete external flow) |
| 1.7 | Forgot password | Submit reset for test acct, confirm email queued, `/reset-password` page loads |
| 1.8 | AuthCallback OAuth-new-user retry | Read code path, confirm 600ms retry exists for missing talents row |

## Backend checks
- Auth logs for failures during the run
- `talents` row created for new test acct
- `user_roles` empty for test acct (no accidental admin)
- `email_send_log` has recovery email queued

## Output
Append to `.lovable/launch-audit.md`:
```
## A1 Auth — 2026-05-22
- [P0/P1/P2] file:line — issue — fix note
- [OK] passing checks
Totals: X bugs, Y warnings, Z OK
```

## Cleanup
After A1 I'll delete the test account `a1test1@gro10x.com` so the DB stays clean.

Approve → I execute A1 and report back. Then we go A2.
