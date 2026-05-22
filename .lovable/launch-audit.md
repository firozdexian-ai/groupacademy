# GroUp Academy — Launch Audit
Target launch: **Dec 1, 2026**. Severity: **P0** = blocks launch · **P1** = fix before launch · **P2** = nice-to-have / post-launch.

Test account policy: real admin = `gro10xnow@gmail.com`. All synthetic test accounts use `*@gro10x.com`.

---

## A1 — Auth Surface · 2026-05-22

### Method
Static read of: `src/hooks/useAuth.ts`, `src/hooks/useAccountType.ts`, `src/lib/postAuthRoute.ts`, `src/pages/AuthClassic.tsx`, `src/pages/AuthChat.tsx`, `src/pages/AuthCallback.tsx`, `src/pages/ResetPassword.tsx`, `src/pages/Start.tsx`, `src/components/ProtectedRoute.tsx`, `src/components/auth/GoogleSignInButton.tsx`, `src/layouts/TalentAppShell.tsx`, `src/App.tsx` (routes).
Live: opened `/auth` while logged in as admin → correctly bounced to `/dashboard`. Confirmed session persistence + admin RBAC routing.
Backend: `auth.users` row, `user_roles`, `talents` row for admin.

### Findings

#### P0 — none.

#### P1 (fix before launch)

1. **ProtectedRoute.tsx:128-143** — `requireAnyAdminRole` only accepts `['admin','talent_exec']` but `useAccountType.ts:10` ADMIN_ROLES includes `super_admin`, `staff`, `content_lead`. A `super_admin` / `staff` / `content_lead` user is routed to admin shell by `useAccountType` then **kicked back to `/app/learning`** by ProtectedRoute. → unify the role list in one constant.
2. **ProtectedRoute.tsx:129,138** — User-facing toasts read `"Security Level Error: Administrative clearance verification tokens missing from user account."` Replace with `"You don't have access to this area."`. Same for fault labels `"NEURAL_IDENTITY_FAULT_REJECTED"` / `"CONNECTION_LATENCY_THRESHOLD_EXCEEDED"` shown at line 167-170 → friendly copy.
3. **useAuth.ts:204-208 vs TalentAppShell.tsx:184-187** — Two divergent logout paths: `useAuth.signOut` navigates to `/`, `TalentAppShell.handleSignOut` calls `supabase.auth.signOut()` directly and navigates to `/auth`. Shell logout skips the toast and the `scope:"local"` flag. → call `useAuth().signOut()` from the shell.
4. **ResetPassword.tsx:99** — After password update, hard-redirects to `/app/feed`. If the user is an admin or company, they land in the wrong shell. → use `resolvePostAuthRoute(accountType, ...)`.
5. **AuthChat.tsx (default `/auth`)** — does **not** read the `?tab=signup` query param the way AuthClassic.tsx:43,84 does. Marketing links like `/auth?tab=signup` open in login mode in the chat UI. → either honor `tab` or document that signup is via chat flow.
6. **useAuth.ts:55** — Error mapping for `"email not confirmed"` returns `"Your account is being activated — please try again in a moment."` but signup flow assumes auto-confirm. If auto-confirm is ever toggled off in Cloud, this message gives no actionable guidance. → say `"Please confirm your email — check your inbox for the link."`.
7. **GoogleSignInButton.tsx:24-41** — `focus` listener unconditionally resets `loading` after 1200ms, even mid-redirect. On slow networks the OAuth popup may still be open while the button re-enables, allowing a double-click. → guard with `document.visibilityState !== 'visible'` OR cancel only if no redirect has happened.

#### P2

8. **AuthClassic.tsx:412+ truncated** — verify "Try the chat experience" link target — points back to `/auth?…` which **is** AuthChat (the default). Fine, but confusing because the Classic page is reached via `/auth/classic`.
9. **Start.tsx:42** — `returnTo` is hard-coded to `/app/feed`. Company/admin signups via `/start` always get talent default. Not a real flow today (Start is talent-only) but worth a comment.
10. **talents row for admin (`f182e1…`)** — `country_code = "BD"` not `"+880"`. Inconsistent with new signup writes (`useAuth.ts:159`). Likely legacy migration. Decide on canonical value (`+880`) and backfill.
11. **PWA manifest 401 in preview** — `/manifest.json` returns 401 in the Lovable preview iframe (token-gated). Verify it serves 200 publicly on https://groupacademy.online and https://groupacademy.lovable.app before launch. File exists at `public/manifest.json`.
12. **auth.audit_log_entries empty for last 3d** — confirm Cloud is retaining auth audit logs; we'll need them for post-launch incident response.

#### OK (verified)
- Listener-before-getSession ordering in `useAuth.ts:74-108` ✓
- `SIGNED_OUT` / `TOKEN_REFRESHED` null-session wipe ✓
- `resolvePostAuthRoute` returns `null` while account type is `unknown`, preventing flicker ✓
- AuthCallback OAuth-new-user retry (600 ms) at `AuthCallback.tsx:27-31` ✓
- `/reset-password` checks `PASSWORD_RECOVERY` event AND `type=recovery` hash before allowing update; rejects bare sessions ✓
- `signUp` writes correct `user_metadata` (full_name, phone, country, country_code, account_type, referral_code) ✓
- `talents` row + `user_roles` (admin, super_admin, content_lead) exist for admin ✓
- Live session persisted across navigation to `/auth` → bounced to `/dashboard` correctly ✓
- `signUp` rejects passwords < 8 chars client-side at `AuthClassic.tsx:102-105` ✓
- Duplicate phone check at `AuthClassic.tsx:110-116` switches to login mode ✓

### Totals
0 P0 · 7 P1 · 5 P2 · 10 OK

### Recommended A1-FIX bundle (small, low-risk)
- Centralize `ADMIN_ROLES` constant (fix #1)
- Friendly RBAC + fault copy in ProtectedRoute (#2)
- Shell logout uses `useAuth().signOut()` (#3)
- ResetPassword uses `resolvePostAuthRoute` (#4)
- AuthChat honors `?tab=signup` OR add explicit chat-signup affordance (#5)
- Friendly "email not confirmed" copy (#6)
- GoogleSignInButton focus-reset guard (#7)

Time to fix: ~45 min. No DB migrations. Recommend rolling these into A-FIX after A2 finishes so we batch UI touches.

---

## A1-FIX shipped — 2026-05-22
- ✅ #1 Unified `ADMIN_ROLES` constant in `src/lib/adminRoles.ts`; imported in `useAccountType.ts` and `ProtectedRoute.tsx`
- ✅ #2 Friendly RBAC + fault copy in `ProtectedRoute.tsx`
- ✅ #3 `TalentAppShell` logout now calls `useAuth().signOut()`
- ✅ #4 `ResetPassword` routes via `resolvePostAuthRoute(accountType)`
- ✅ #5 `AuthChat` redirects `?tab=signup|login` to `/auth/classic` (which honors the tab)
- ✅ #6 Friendlier "email not confirmed" copy in `useAuth.ts`
- ✅ #7 `GoogleSignInButton` focus-reset guarded by `visibilityState` + `redirectPendingRef`

Carry-over P2s tracked: country_code backfill, manifest preview 401, auth audit retention.
