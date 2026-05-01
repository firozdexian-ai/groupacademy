## Phase 11A — Auth + Feed + Mobile/Web Parity Polish

Focused pass on the **Talent app authentication surface and the Feed** — fixing real friction, removing dead code, and aligning what the mobile burger menu vs. desktop "Me ▼" menu offers.

### 1. Authentication — chat (`/auth`), classic (`/auth/classic`), reset

**Pain points found**
- `AuthChat` copy is heavily tech-jargon ("Initialize Platform Access", "Authenticating Node", "Entropy Level", "Legacy Authentication Fallback"). Causes user confusion and lowers conversion.
- `AuthClassic` similarly: "Create Identity", "Transmit Link", "Access Recovery", "Initialize Chat Handshake" — same problem.
- `ResetPassword` redirects to `/app/jobs` (legacy). Should land on `/app/feed` like all other auth flows.
- `ResetPassword` only checks `getSession()` — does NOT look for `type=recovery` in URL hash, so a user landing from a stale email could be silently logged in. Plain security gap.
- No "Resend recovery email" affordance on the "Handshake Denied" screen — user has to navigate back.
- `AuthChat` has no `aria-label`s on icon buttons, no `<label>` for inputs (a11y).
- The "Hiring? Apply for Company Access →" CTA exists on classic but NOT on the chat-based `/auth` (the primary entry).

**Changes**
- **AuthChat** (`src/pages/AuthChat.tsx`)
  - Replace jargon: "Authenticating Node" → "Loading…", "Initialize Platform Access" → "Continue to your dashboard", "Legacy Authentication Fallback" → "Use email & password instead", "AES-256 Verified" → "Secure", "Platform Gatekeeper" → tagline like "Your AI guide", "Recovery Request?" → "Forgot password?", "Entropy Level" → "Strength".
  - Add the "For Companies" link beneath the "Use email & password" link.
  - Keep all logic; copy-only swap.
- **AuthClassic** (`src/pages/AuthClassic.tsx`)
  - Replace jargon: "Create Identity" → "Create account", "Transmit Link" → "Send reset link", "Access Recovery" → "Reset password", "Initialize Chat Handshake" → "Try the chat experience", tab labels "ACCESS / REGISTER" → "Sign in / Sign up".
  - Tone-match the existing brand voice (clean, direct).
- **ResetPassword** (`src/pages/ResetPassword.tsx`)
  - Verify recovery token: parse `window.location.hash` for `type=recovery` and require either a recovery hash OR an `onAuthStateChange("PASSWORD_RECOVERY")` event before allowing password update — prevents silent login on stale links.
  - Land on `/app/feed` after success (not `/app/jobs`).
  - Replace jargon: "Reset Logic" → "Reset your password", "Identity Recovery" → "Account recovery", "New Password Node" → "New password", "Verify Password Node" → "Confirm password", "Commit Credentials" → "Update password", "Handshake Denied" → "Link expired", "Verifying Identity Token" → "Verifying link…".
  - Add a "Send a new link" button on the expired-link screen that triggers `resetPasswordForEmail` after collecting email inline (small dialog).

### 2. Feed (`/app/feed`) and feed components

**Pain points found**
- Same tech-jargon problem in copy: "Sync Interrupted", "Registry handshake failed", "Registry Sync Complete", "Discovery Telemetry", "Logic / Path / Stream / Intel", "Secure Neural Feed Logic v2.6.4 Synchronized", "Load Archive", "Retry Sequence". Hostile to first-time users.
- Pull-to-refresh: fixed pixel offsets and an inline `rgba(var(--primary-rgb), 0.3)` shadow that won't resolve (no `--primary-rgb` token defined in `index.css`) → silent visual bug.
- `if (isLoading && !isRefreshing)` skeleton uses `max-w-7xl px-6 py-10` on mobile, breaking the compact mobile design system rule (py-2, no horizontal padding on mobile).
- Empty state and error state both render at huge desktop spacing on mobile (py-16 / py-24).
- 4 dead components: `FeedCard.tsx`, `InsightCard.tsx`, `CareerInsightsCard.tsx`, `CareerInsightsCarousel.tsx` — confirmed unused outside `src/components/feed/` (no external imports). ~588 lines of cruft.
- Sidebar "Discovery Telemetry" stat card has zero user value — duplicates filter counts already shown above.
- "Secure Neural Feed Logic v2.6.4 Synchronized" footer adds noise.
- `FeedHeader` always greets even when `talent.fullName` is missing — shows "Talent Node" placeholder.

**Changes**
- **Feed.tsx**
  - Re-copy all strings to plain English: "Couldn't load your feed", "Try again", "You're all caught up", "Load more", "For you" (sidebar header).
  - Mobile-first padding: outer container uses `px-3 py-2 md:px-6 md:py-10`; spacing `space-y-3 md:space-y-8`; empty/error states `py-10 md:py-16`.
  - Remove the "Discovery Telemetry" stat block and the "Secure Neural Feed Logic" footer chip.
  - Fix pull-refresh badge: replace `rgba(var(--primary-rgb)…)` shadow with a defined Tailwind shadow utility (`shadow-lg`) and theme-token color.
- **Delete dead files**: `FeedCard.tsx`, `InsightCard.tsx`, `CareerInsightsCard.tsx`, `CareerInsightsCarousel.tsx`.
- **FeedHeader.tsx**: graceful greeting when name missing ("Welcome back" instead of "Talent Node"). Plain copy.
- **FeedFilters / PostCard / FeedCardRedesigned / ComposePost**: copy-only de-jargoning sweep on visible labels; no logic change.

### 3. Mobile vs. Web menu parity

**Gaps found** (comparing mobile burger sheet vs. desktop "Me ▼" dropdown)

| Item | Mobile burger | Desktop "Me ▼" |
|---|---|---|
| Buy Credits | ✅ | ✅ |
| Transactions | ✅ | ✅ |
| Disbursement Account | ✅ | ❌ |
| Saved Jobs | ✅ | ❌ |
| My Learning | ✅ | ❌ |
| Career Abroad | ✅ | ❌ |
| Applications | ✅ | ❌ |
| Download CV | ✅ | ❌ |
| Profile Verification | ✅ | ❌ |
| Refer App | ✅ | ❌ |
| Language | ✅ | ❌ |
| View Profile | ❌ (only edit pencil) | ✅ |
| Settings & Privacy | ❌ | ✅ |
| Help Center | only via Customer Service | ✅ |
| Company Portal | ✅ | ✅ |
| Sign Out | ✅ | ✅ |

**Changes** (`src/layouts/TalentAppShell.tsx`)
- Restructure the desktop "Me ▼" dropdown into grouped sections so it has parity with mobile:
  - **Account**: View Profile, Settings & Privacy, Profile Verification
  - **Activity**: Saved Jobs, Applications, My Learning, Transactions, Disbursement Account
  - **Quick actions**: Buy Credits, Download CV, Career Abroad, Refer App
  - **Switch**: Company Portal (when applicable)
  - **Support**: Help Center, Toggle Theme, Language (read-only "English")
  - **Sign Out**
- Mobile burger: rename items to plain English ("Disbursement Account" → "Withdraw earnings", "Profile Verification" → "Verify your profile", "Customer Service" → "Help Center", "Learn About Academy" → "About"). Keep order; just clarify.
- Both menus: mark items that require auth/role gating consistently.

### 4. Out of scope for this phase

- No DB migrations.
- No edge function changes.
- No new features — purely copy, layout, parity, dead-code removal, and one real security fix (recovery token check).

### Files

**Edit:**
- `src/pages/AuthChat.tsx`
- `src/pages/AuthClassic.tsx`
- `src/pages/ResetPassword.tsx`
- `src/pages/app/Feed.tsx`
- `src/components/feed/FeedHeader.tsx`
- `src/components/feed/FeedFilters.tsx`
- `src/components/feed/PostCard.tsx` (copy only)
- `src/components/feed/FeedCardRedesigned.tsx` (copy only)
- `src/components/feed/ComposePost.tsx` (copy only)
- `src/layouts/TalentAppShell.tsx`

**Delete:**
- `src/components/feed/FeedCard.tsx`
- `src/components/feed/InsightCard.tsx`
- `src/components/feed/CareerInsightsCard.tsx`
- `src/components/feed/CareerInsightsCarousel.tsx`

Approve to implement?