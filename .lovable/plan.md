# Fix: Gro10x sign-in always behaves like new signup

## Problems observed

1. **Riya (the Gro10x auth chat) always runs the signup script.** The hook only has one branch — `collect_email → collect_name → CV → role/company → goals → country → phone → quiz → password`. There is no "is this an existing user?" check, so a returning user typing their email is asked for their name and treated as new.
2. **The "Sign in" link routes to the talent app.** `Gro10xAuth.tsx` line 267 uses `<Link to="/auth">`, which is the talent (Aisha) chat. After login, `useAccountType` resolves and `postAuthRoute` may also send some users to `/app/feed` instead of `/gro10x/inbox` if the metadata fast-path doesn't fire correctly on first session.

## What we will build

### 1. Dedicated Gro10x sign-in page
Create `src/gro10x/pages/Gro10xSignIn.tsx` — same dark Gro10x shell, simple email + password form (with "Forgot password?"). On success it explicitly navigates to `/gro10x/inbox` regardless of `useAccountType` state, so company users never get bounced to the talent feed.

Mount it at `/gro10x/signin` in `Gro10xRoutes.tsx`.

### 2. Stop pointing "Sign in" at the talent app
In `Gro10xAuth.tsx`, change the footer link from `<Link to="/auth">Sign in</Link>` to `<Link to="/gro10x/signin">Sign in</Link>`. Same change on `Gro10xLanding.tsx` — add a secondary "I already have an account" link below the "Get started" CTA.

### 3. Detect existing accounts inside Riya
In `useGro10xAuthChat.ts`, after the email-validation step (`collect_email`), check whether an account with that email already exists. If yes, Riya pivots:

> "Welcome back — looks like you already have a Gro10x account. Want to sign in instead?"

…and renders an inline "Sign in here" button that routes to `/gro10x/signin?email=<prefilled>`. The signup branch only continues if the email is genuinely new.

We can detect existence cheaply by calling a new tiny edge function `check-company-account` that does a server-side lookup against `auth.users` (admin client, returns only a boolean). This avoids exposing user enumeration to the anon key while still letting the UI branch.

### 4. Harden post-auth routing for company users
In `Gro10xSignIn.tsx`, after `signInWithPassword` succeeds, query `company_members` directly for the user's id. If a row exists → `navigate("/gro10x/inbox")`. Otherwise show an inline error: "This email is registered as a talent account — open the talent app instead." with a link to `/auth`. This guarantees the Gro10x sign-in surface never silently dumps a user into the wrong PWA.

## Files

- **Create**: `src/gro10x/pages/Gro10xSignIn.tsx`
- **Create**: `supabase/functions/check-company-account/index.ts` (anon-callable, returns `{ exists: boolean, isCompany: boolean }`)
- **Edit**: `src/gro10x/Gro10xRoutes.tsx` (add `/signin` route)
- **Edit**: `src/gro10x/pages/Gro10xAuth.tsx` (link target + early-exit branch when Riya detects existing user)
- **Edit**: `src/gro10x/pages/Gro10xLanding.tsx` (add "Sign in" secondary link)
- **Edit**: `src/gro10x/hooks/useGro10xAuthChat.ts` (call `check-company-account` after `collect_email`, expose `existingAccount` flag)

## Out of scope

- No changes to the talent `/auth` flow.
- No changes to `useAccountType` — the explicit navigation in `Gro10xSignIn` is sufficient and avoids touching the global routing hook.

Approve to implement.