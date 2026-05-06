# Phase 1.3 — Onboarding Restructure (Talent Side)

Goal: turn the current 3-step "robotic" wizard into a tight, human, mobile-first flow that captures the **infrastructural pillars** (profession category → professional role → current status → goal) and uses the freshly-added `cv_fingerprint` to block obvious duplicate-account abuse. No Career Coach yet (that's 1.4).

## Findings from current code

1. **Wizard** (`OnboardingWizard.tsx`) has 3 nodes: `welcome` → `profile` (CV upload) → `explore` (services tour). The `profile` step is **only** CV upload; profession/role/goal capture is missing entirely. `ProfileQuickSetup.tsx` exists but is **orphan code** — never rendered.
2. **CV step** (`CVUploadStep.tsx`) still carries leftover sci-fi terms (`REGISTRY_SYNC`, `DROPSHIP_ZONE`, `ARTIFACT_AUDIT`, `handleExecutiveUpload`) and uppercase headings like "PROFILE UPDATED". Cleanup left over from 1.1.
3. **CV parse** writes only `full_name` back to `talents`; `experience`, `education`, `skills` are extracted but **discarded**. They live in `talents.experience/education/skills` JSONB columns — there's no merge.
4. **No fingerprint computation** during parse, so the 1.2 `cv_fingerprint` column stays empty. We need to compute and persist it, then check duplicates before awarding the 250-credit welcome bonus.
5. **Welcome credits** are awarded inside `useOnboarding.completeOnboarding` purely on row-presence in `talent_credits`. That makes credit farming trivial right now (delete account, sign up again with a different email + same CV).
6. **Profession infrastructure ready**: `profession_categories` (83 active), `professional_roles` (829 rows, FK to category). `talents.profession_category_id` and `talents.professional_role_id` columns already exist.
7. **No goal capture** anywhere. Downstream features (jobs match, AI concierge, agents hub) all want it.
8. **Mobile**: current wizard pages render fine but with desktop-tier headings (`text-4xl md:text-5xl font-black`). Per memory rules they need compact spacing and notched safe-bottom.

## Plan

### 1.3.a — Restructure wizard to 5 steps

```text
1. Welcome           → keep; tighten copy; reuse WelcomeBonus
2. CV (optional)     → CVUploadStep, refactored
3. Profession + Role → NEW: ProfessionStep
4. Status + Goal     → NEW: GoalStep
5. Quick tour        → keep; ServicesTour (slim)
```

- `ONBOARDING_NODES` updated; `useOnboarding.updateStep` already persists step index.
- CV step gets a clear **Skip for now** (already exists; relabel to "I'll add it later"). If CV is uploaded successfully, **prefill** profession step from extracted titles via a tiny RPC.
- Mobile: replace `text-4xl md:text-5xl font-black` with `text-2xl md:text-3xl font-bold`, drop wide paddings, add `pb-[env(safe-area-inset-bottom)]` on action bars.

### 1.3.b — ProfessionStep (NEW)

- Two cascaded selects:
  - **Profession Category** (search-as-you-type combobox over the 83 active categories)
  - **Professional Role** (combobox over `professional_roles WHERE profession_category_id = $cat`, 829 rows)
- Both are required to advance; "Other / not listed" option writes to existing `talents.custom_profession` (no schema change).
- Saves `profession_category_id`, `professional_role_id`, optional `custom_profession`.
- Powers the Career Coach selection in 1.4.

### 1.3.c — GoalStep (NEW)

- **Current status** (radio): student / fresh graduate / actively looking / employed / freelancer / career changer. Maps to existing `talents.current_status` (text — no schema change).
- **Primary goal** (single-select chips): land first job / switch role / get promoted / freelance & earn / learn a new skill / study abroad / build my own thing.
- Goal needs a column. **Migration**: add `talents.primary_goal TEXT` + check on a fixed enum-like list enforced by a validation **trigger** (per platform memory — never CHECK constraints with mutable logic; here the list is static, but we use a trigger to remain consistent with existing convention).
- Both are persisted; goal becomes the seed for AI concierge dynamic chips and for the Career Coach intro in 1.4.

### 1.3.d — CV parse → write everything back, compute fingerprint

- In `CVUploadStep.handleExecutiveUpload` (renamed `handleCVUpload`) merge parsed fields into `talents`:
  - `experience`, `education`, `skills` JSONB → only when current value is empty / null (don't overwrite user-edited data).
  - `linkedin_url`, `portfolio_url` if extracted.
- Compute `cv_fingerprint` client-side from `parseResult.parsed`:
  - Normalised string of `[skills sorted | experience.company+title sorted | education.institution+degree sorted]`
  - SHA-256 (Web Crypto), hex string.
- Persist on `talents.cv_fingerprint`.
- **Duplicate check**: edge function `check-cv-duplicate` (server-side, security definer RPC) returns `{ duplicate: boolean, otherTalentCount: number }`. If `duplicate && otherTalentCount > 0`, set a flag on the talent (`is_suspected_duplicate boolean`, new column) and **suppress the welcome credit award** in `completeOnboarding`. User can still finish onboarding and use the platform; admins see the flag in Talent admin (already a known surface in admin memory).
- This is the **anti-abuse mechanism** the user asked for. No blocking, no friction for legit users — just no free credits for repeats.

### 1.3.e — Welcome credits gating

- Update `useOnboarding.completeOnboarding`:
  - Read `talent.is_suspected_duplicate` (and existing `talent_credits` row).
  - Only call `addCredits(250, "welcome_bonus", …)` if neither is true.
  - Otherwise show a softer success toast: "You're all set — explore the platform!" (no credit mention).

### 1.3.f — Copy & UX polish (carries on 1.1)

- Remove residual `REGISTRY_SYNC`, `DROPSHIP_ZONE`, `ARTIFACT_AUDIT`, `VISUAL_ID_HANGER`, `handle*Ingress` names.
- Replace ALL-CAPS micro-labels (`PROFILE UPDATED`, `SKILLS FOUND`, etc.) with sentence case.
- Header in `OnboardingWizard.tsx` already simplified; ensure `Skip for now` is a low-emphasis text button (per UX rules — it's currently fine, just verify mobile spacing).

### 1.3.g — Telemetry hook (light)

- Add a thin `trackOnboardingStep(step, action)` helper writing to `console.debug` for now (proper `talent_funnel_events` table comes in 1.5). Wire it on each step's `next` and on `skipOnboarding`. **No DB writes in 1.3.**

## Files changed (planned)

- `src/components/onboarding/OnboardingWizard.tsx` — 5-step `ONBOARDING_NODES`, mobile spacing
- `src/components/onboarding/CVUploadStep.tsx` — merge parsed fields, compute & persist fingerprint, copy cleanup
- `src/components/onboarding/ProfileQuickSetup.tsx` — **delete** (orphan; replaced by ProfessionStep + GoalStep)
- `src/components/onboarding/ProfessionStep.tsx` — **new** (cascaded comboboxes)
- `src/components/onboarding/GoalStep.tsx` — **new** (status + goal chips)
- `src/components/onboarding/WelcomeBonus.tsx` — copy tighten only
- `src/components/onboarding/ServicesTour.tsx` — copy tighten + mobile spacing
- `src/hooks/useOnboarding.ts` — gate welcome credits on `is_suspected_duplicate`
- `src/lib/onboarding/cvFingerprint.ts` — **new** SHA-256 helper
- `src/lib/onboarding/telemetry.ts` — **new** thin tracker stub
- `supabase/functions/check-cv-duplicate/` — **new** edge function
- DB migration:
  - `ALTER TABLE talents ADD COLUMN primary_goal TEXT`
  - `ALTER TABLE talents ADD COLUMN is_suspected_duplicate BOOLEAN DEFAULT false`
  - `CREATE INDEX idx_talents_is_suspected_duplicate WHERE is_suspected_duplicate = true`
  - Validation trigger for `primary_goal` (allowed list)
  - Server-side RPC `check_cv_duplicate(_fingerprint TEXT, _self_user_id UUID) RETURNS TABLE(duplicate boolean, other_count int)` (SECURITY DEFINER, `search_path = public`)

## Out of scope (deferred)

- Career Coach persona / `ai-career-coach` edge function → 1.4
- Profile groomer chat / per-profession agent → 1.4
- `talent_funnel_events` analytics table → 1.5
- WhatsApp connect, email verification, phone verification → "Profile Verification" phase
- Admin UI surface for `is_suspected_duplicate` flag (the column ships now; admin filter chip is a tiny later add — not blocking)

## Open questions

1. **Goal options** — happy with the seven I listed (first job / switch / promoted / freelance / learn / study abroad / own thing), or do you want a different set / wording?
2. **Duplicate handling stance** — soft (current proposal: no welcome credits, flag the row, full access) or harder (also block welcome credits + put account in `verification_status='pending_review'` until admin clears)?
3. **CV is currently optional and skippable** — keep it optional, or make it required-but-skippable-with-friction (e.g., a confirmation modal "Skipping means you'll fill these in manually later")?
