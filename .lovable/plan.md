
# A1-FIX — Auth surface fixes (independent of later phases)

All 7 P1s from A1 are self-contained UI/routing fixes. No DB migrations, no edge functions, no dependency on A2-A12. Safe to ship now.

## Fixes

| # | File | Change |
|---|---|---|
| 1 | `src/lib/adminRoles.ts` (new) + `useAccountType.ts` + `ProtectedRoute.tsx` | Single `ADMIN_ROLES = ['admin','super_admin','staff','talent_exec','content_lead']` constant. Both files import it. `requireAdmin` keeps strict `'admin'` check; `requireAnyAdminRole` uses the full list. |
| 2 | `ProtectedRoute.tsx:129,138,167-170` | Replace techno-babble copy with plain English: `"You don't have access to this area."`, `"Connection timed out"`, `"Sign-in check failed"`. |
| 3 | `TalentAppShell.tsx:184-187` | Replace inline `supabase.auth.signOut()` with `useAuth().signOut()` so toast + navigation are consistent. |
| 4 | `ResetPassword.tsx:99` | Wait for account type, then `navigate(resolvePostAuthRoute(accountType) ?? '/app/feed')`. |
| 5 | `AuthChat.tsx` | Honor `?tab=signup` by seeding the chat flow into signup intent on initialize. Smallest change: pass `initialIntent` from URL to `useAuthChat.initialize()`. |
| 6 | `useAuth.ts:55` | Friendlier "email not confirmed" copy: `"Please confirm your email — check your inbox for the link."` |
| 7 | `GoogleSignInButton.tsx:24-41` | Only reset `loading` on focus if `document.visibilityState === 'visible'` AND no redirect navigation is pending (track with a ref set true at click). |

## P2 deferred
- talents.country_code "BD" backfill → defer (data, not code)
- manifest 401 in preview → verify after publish, not fixable in code
- auth audit log retention → Cloud config, not code
- AuthClassic "try chat" link wording → cosmetic

## Verify after build
- Build passes
- Open `/auth?tab=signup` → chat starts in signup intent
- Logout from talent shell → toast + home
- Open `/reset-password` with stale link → friendly "Link expired" still shows
- ProtectedRoute renders friendly copy on forced timeout

~30-40 min. After this, proceed to **A2 Onboarding**.
