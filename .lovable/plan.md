## Sub-phase 3.3 — Talent Mirror → Public Profile

Turn each talent's mastery + credentials into a **shareable, opt-in public profile** that lives outside the auth wall. This is the social/recruiter face of everything Phase 2 + 3.2 produced.

### Goals
- Every talent gets a stable public URL: `/t/:handle` (no auth required).
- Talents control what's visible (mastery, credentials, name, photo) via a single visibility toggle.
- Recruiters and peers can verify skills directly from the profile.
- Pages are SEO-friendly (JSON-LD `Person` + `EducationalOccupationalCredential` list).

---

### 3.3.a — Database

Add to `talents`:
- `public_handle text UNIQUE` — URL-safe slug, generated from `full_name + short id` on first opt-in. Mutable via settings (validated `^[a-z0-9-]{3,40}$`).
- `public_profile_enabled boolean NOT NULL DEFAULT false` — master switch.
- `public_show_mastery boolean NOT NULL DEFAULT true` — show Talent Mirror summary.
- `public_show_credentials boolean NOT NULL DEFAULT true` — show skill credentials.
- `public_bio text` — short tagline (240 chars).

Helper RPC `get_public_talent_profile(_handle text)` SECURITY DEFINER, returns a single JSON payload (talent basics + mastery summary + credentials list) **only if `public_profile_enabled`**, else NULL. Avoids client-side joins and respects flags server-side.

RLS: keep `talents` table as-is. The RPC is the public read path; existing policies stay untouched.

Backfill: leave handles NULL for everyone; generated lazily when a talent toggles public on.

### 3.3.b — Edge function `claim-public-handle`

JWT-required. Body: `{ handle }`. Validates format, checks uniqueness, writes to caller's talent row. Returns `{ handle }` or `{ error }`.

### 3.3.c — Public page `/t/:handle`

New `src/pages/public/PublicTalentProfile.tsx`:
- Header: cover image, avatar, name, profession, country, optional LinkedIn link.
- "Verified Skills" section: chips from `skill_credentials` (level icon, topic, "Verify ↗" → `/verify/skill/:code`).
- "Mastery snapshot" section (if opted-in): top strengths + recent learning, sourced from existing `learner-talent-mirror` aggregation re-fetched server-side via the new RPC.
- CTA: "Connect on Group Academy" → deep-link into `/app/talents/:id` (auth gate handles signup).
- JSON-LD `Person` with `hasCredential` array, OpenGraph + Twitter card meta tags.
- Empty / disabled / not-found states render a neutral "Profile is private" card with a sign-in CTA.

### 3.3.d — Settings UI

Add a **Public Profile** card to the existing profile settings (`src/pages/app/Profile.tsx` or its edit dialog):
- Toggle: Make profile public.
- Handle field with availability check (debounced call to `claim-public-handle`).
- Toggles: show mastery, show credentials.
- Bio textarea (240 chars).
- "Copy public link" + "View public profile" buttons.

### 3.3.e — Surface the link in-app

- `<SkillCredentialsPanel>` and `<TalentMirrorPanel>`: "Share public profile" button shown only when `public_profile_enabled`. Copies `https://groupacademy.online/t/:handle`.
- After credential mint, if profile is private, show one-time prompt: "Make your skills public →".

### 3.3.f — Plan + memory

- Mark 3.3 done in `.lovable/plan.md`, bump Phase 3 progress to ~37%.
- Add `mem://product/public-talent-profile` describing route, RPC, opt-in model, and visibility flags.

---

### Files

**New**
- `supabase/functions/claim-public-handle/index.ts`
- `src/pages/public/PublicTalentProfile.tsx`
- `src/components/profile/PublicProfileSettings.tsx`
- `src/hooks/usePublicProfileSettings.ts`
- `mem://product/public-talent-profile`

**Edited**
- DB migration: `talents` columns + `get_public_talent_profile` RPC.
- `src/App.tsx` — register `/t/:handle` public route (outside `/app` auth gate).
- `src/pages/app/Profile.tsx` — mount `<PublicProfileSettings>`.
- `src/components/learning/SkillCredentialsPanel.tsx` — share button when public.
- `src/pages/app/TalentMirror.tsx` — share button + visibility hint.
- `.lovable/plan.md`, `mem://index.md`

---

### Out of scope (deferred)
- Custom domain mapping (`yourname.groupacademy.online`).
- LinkedIn "Add to Profile" button for credentials (waits on real W3C VC signing, planned post-3.7).
- Profile analytics (views/clicks) — fold into 3.8 mastery snapshots.
- Reserved handle blocklist beyond basic format check (admin tool later).

Reply **continue with 3.3** to ship a–f in one batch, or pick a slice (e.g. **continue with 3.3.a+b+c** for backend + public page first, settings UI in a follow-up).