
# Talent Feed + Auth — Deep-Dive Audit

I read the feed pipeline (`Feed.tsx` → `PostCard` → `PostActionBar` → `useHype` / `useContentHype` / `usePostReactions` / `CommentList` / `TopHypedWidget`) and the auth pipeline (`useAuth.ts`, related referral & welcome flows) end-to-end. Below are the real issues, grouped by severity, plus a focused fix plan.

---

## 1. Hype is the worst offender — two parallel implementations

There are **two independent hype systems** that don't agree with each other:

| File | Used by | RPC called | Toast text | Self-hype rule | Repeat-tap rule |
|---|---|---|---|---|---|
| `useHype.ts` | `PostActionBar` (PostCard) | `hype_post` | "🔥 Hype sent · -1 credit" + balance fetch | blocks `CANNOT_HYPE_SELF` | shows `ALREADY_HYPED` warning |
| `useContentHype.ts` | `HypeButton` (generic, courses/videos/blogs) | `hype_content` | "🔥 Hype sent · -1 credit" | blocks `CANNOT_HYPE_SELF` | shows `ALREADY_HYPED` warning |

Problems this causes:

- **Conflicts with the creator-economy model** (per project memory: paid Hype = 1 credit per tap, repeatable, 80/20 split). Both hooks treat repeat taps as `ALREADY_HYPED`, which is wrong for the post path that's supposed to be "tap-tap-tap to keep hyping."
- **No tap-lock / debounce** on either path. Rapid taps fire parallel RPCs in flight → duplicate optimistic increments and unpredictable credit deductions on Boost.
- **`useHype` re-fetches `hype_count` on mount** even when the feed already supplied the count, then **does a second round-trip to refetch wallet balance after every single tap** just to show a toast — adds ~200–400ms perceived lag and wallet thrash on Boost (5 sequential taps = 5 wallet fetches).
- **Boost loop is sequential `await hype()` x N** in `PostActionBar.sendBoost`, producing N separate "🔥 Hype sent · -1 credit" toasts. UX spam, slow.
- **`hasHyped` is local component state** — doesn't reflect server reality, lost on remount, and there's no initial "did I already hype this?" load.
- **No realtime subscription on `hype_count`** — counters don't move for other viewers without refresh.
- **`useContentHype` has no synchronization** with `useFeedEngagement` cache (used by reactions), so post Hype counts and reaction counts live in totally separate caches.

## 2. Reactions (`like / insightful / celebrate / support`) are dead in the feed

`usePostReactions` + `ReactionBar` exist and are wired to a **batched** RPC (`get_feed_engagement`) and an optimistic cache… but `PostCard` never renders `ReactionBar`. The only post action bar shows Hype/Comment/Share. So:

- All the reaction infrastructure is shipped but invisible.
- `useFeedEngagement` is still pre-fetched in `Feed.tsx` for every post on screen — paying the RPC cost with no UI to show for it.

Either delete it or expose it in `PostCard`. (Recommend exposing — it's the cheapest engagement tier and complements paid Hype.)

## 3. Comments: confirmed UX bug

In `PostActionBar`, tapping "Comment" opens a `Sheet` that renders `<CommentList postId={postId} />`. But `CommentList` has its **own internal `open` state defaulting to `false`** and a "Comments / Hide" toggle button. Result: user opens the sheet, sees only a button, has to tap **again** to actually load comments. First-fetch never runs because `useEffect(() => { if (open) load() }, [open, postId])` gates on the inner `open`.

Other comment issues:

- `CommentList.submit` does `supabase.auth.getUser()` + `talents` lookup on every send instead of using `useTalent()`.
- Realtime channel subscribes on mount even when the sheet is closed — wasted websocket frames per post on screen.
- No comment **count** is shown on the post card before opening, so users don't know there are comments.
- No nested replies / mentions surfaced (memory says feed notifications support replies & @mentions).

## 4. Other feed surface issues

- **`TopHypedWidget`**: 2-step query (view → posts) is N+1-ish, no loading skeleton, no error UI, returns `null` silently when empty (looks broken on staging).
- **Pull-to-refresh**: uses `window.scrollY` instead of container scroll; doesn't `preventDefault` so feels weak; on iOS the indicator bounces with the rubber-band.
- **PostCard `pollOptions` typing** assumes `{id, text}` but `useFeedRecommendations` may map raw `poll_options` differently — worth a sanity check.
- **`Feed.tsx` legacy redirect** runs on every `searchParams` change; should run once and only when `?post=` is present (it does check, but the redirect should also clear the param to prevent loops on back-nav).
- **Filters `counts.poll`** counts only `contentType === "poll"`, but feed items may not always carry `contentType` for non-post types — minor.

## 5. Auth — real issues

Reading `useAuth.ts`:

- **`createStudentProfile` writes to a `students` table** that the rest of the app doesn't use (everything else queries `talents`). It's exported and just caused a build break earlier in this thread; it has zero callers and should be deleted along with the `students` table reference.
- **Race on signup → referral**: `signUp` calls `supabase.auth.signUp` and then immediately `update talents set referred_by where user_id = …`. The `talents` row is created by a DB trigger; if the trigger hasn't fired (or fails), the update silently affects 0 rows — referral lost, no error.
- **Welcome email fires before email confirmation**. If the user never confirms, they still got a "Welcome" — bad funnel signal and inflates email volume.
- **`resolveIdentifier` (phone → email)** queries `talents.email` from the client to support "sign in with phone." This leaks a phone→email lookup oracle to anonymous users; should be moved to a `SECURITY DEFINER` RPC that only returns existence (not the email itself, which is then used directly for `signInWithPassword`).
- **Listener ordering**: `getSession()` is awaited *before* `onAuthStateChange` is attached. Auth knowledge file specifies the opposite order so `INITIAL_SESSION` is never missed. Low impact but worth flipping.
- **Refresh-token errors in production logs** (`refresh_token_not_found` 400s observed in the supplied auth logs). `useAuth` doesn't catch this and clear local session state, so users can land in a "signed-in UI / 401 API" zombie state. Need a global handler that on `TOKEN_REFRESHED && !nextSession` (already partially handled) **also** force-routes to `/auth` and clears query cache.
- **`signOut`** uses default global scope; safer to use `{ scope: 'local' }` to avoid killing other devices unexpectedly.
- **Sign-in toast fires "Welcome back" before email confirmation check** — if confirmation is required and user is unconfirmed, Supabase still returns an error path, but error message is the raw RPC string ("Email not confirmed"). Should map to a plain-language message and a "Resend verification" CTA.
- **No HIBP** ("password leaked" check) enforced. Project standard says enable it; it currently isn't.
- **Lovable Cloud auth-state UI**: there is no `INITIAL_SESSION` event handling, no skeleton/redirect guard during `isLoading=true` in many of the gated routes I sampled, so a brief flash of unauthenticated UI happens on hard reload. Not in `useAuth` itself but a knock-on effect.

---

## Fix plan (proposed order of work)

### Wave A — Hype unification & correctness (highest user impact)

1. Collapse `useHype` and `useContentHype` into **one** hook `useHype(contentType, contentId, initialCount)` calling a single RPC `hype_content`. Delete `hype_post` references.
2. Remove the `ALREADY_HYPED` toast for posts (paid model is repeat-tap). Keep it only if/where the underlying RPC actually returns it for non-post content.
3. Add a 150 ms tap-lock + in-flight guard so rapid taps coalesce client-side, and an optimistic counter that increments per tap without awaiting the RPC.
4. Replace per-tap wallet fetch with a single **debounced** wallet refresh (1 s after last tap) and a single aggregated toast for Boost ("🔥 +5 Hype · -5 credits").
5. Drop the redundant on-mount `hype_count` re-fetch when `initialCount` is provided.
6. Subscribe to `feed_posts` realtime for `hype_count` updates on visible posts (or fold into `useFeedEngagement` so it's batched).
7. Persist "did I hype this?" via the engagement RPC so `hasHyped` survives remounts.

### Wave B — Re-enable reactions in `PostCard`

1. Render `ReactionBar` (compact variant) inside `PostActionBar` next to Comment/Share, fed by `usePostReactions`.
2. Show top-3 reaction emojis + total count as a passive header above the action row (LinkedIn-style).
3. Keep using the existing batched `useFeedEngagement` cache — no new fetches.

### Wave C — Comments

1. Remove the inner toggle button in `CommentList`; auto-load on mount, since the sheet is already a deliberate open action.
2. Use `useTalent()` instead of `auth.getUser()` + `talents` round-trip in `submit`.
3. Only subscribe to realtime when the sheet is open.
4. Show comment count on the post card (extend `get_feed_engagement` RPC to include it; or add a column already in `feed_posts.comment_count`).
5. Add "Reply" + `@mention` autocomplete (matches feed-notifications memory).

### Wave D — Auth hardening

1. **Delete** `createStudentProfile` and the unused `students` table fallback.
2. Move signup-side referral assignment into the DB trigger (`handle_new_user` style) so it can't race.
3. Move welcome email to **after** email confirmation (trigger on first `email_confirmed_at` change, or fire from `auth/callback`).
4. Replace client-side `resolveIdentifier` query with a `SECURITY DEFINER` RPC `lookup_email_by_phone(_phone text)` that returns only `boolean exists` + (server-side) signs the user in via an admin token, OR keep email return but enforce strict rate-limit and `search_path = public`.
5. Reorder `useAuth` to attach `onAuthStateChange` **before** awaiting `getSession()`.
6. Add a global handler: on refresh-token failure, clear `react-query` cache, reset auth state, redirect to `/auth` with a toast "Your session expired."
7. Switch `signOut` to `{ scope: 'local' }`.
8. Map common Supabase auth errors to plain-language toasts ("Email not confirmed" → "Please verify your email — we just resent the link" with a one-click resend button).
9. Enable HIBP via `configure_auth` (`password_hibp_enabled: true`).

### Wave E — Polish

1. `TopHypedWidget`: skeleton, empty-state copy, single batched query (join in the view).
2. `Feed.tsx` pull-to-refresh: bind to container scroll, add `touch-action: pan-y`, clamp on iOS rubber-band.
3. Strip "Digital Workforce / IDENTITY_NODE / KINETIC PROTOCOL" terminal-talk from user-facing toasts (memory says plain English, mobile-first); keep them as console logs only.

---

## Suggested next step

I'd start with **Wave A + Wave C step 1** (hype unification + comments-auto-load) in the next build turn — those are the two issues users will feel immediately. Wave D (auth hardening) is the most important from a security standpoint and should follow right after.

Want me to proceed with Wave A first, or roll Waves A+C+D into one larger build pass?
