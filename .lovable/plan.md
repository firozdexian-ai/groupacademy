## Sub-phase 3.2 — Verifiable Skill Credentials

Build on top of the existing course-completion `certificates` table by issuing **per-skill credentials** derived from `talent_skill_profile` mastery data. Each credential proves a learner has demonstrated competence on a topic across multiple attempts, is publicly verifiable, and feeds Phase 3.3 (public profile) and 3.4 (job match).

### Goals
- Auto-mint a credential when a learner reaches mastery thresholds on a topic.
- Surface earned credentials on My Hub and Talent Mirror.
- Make every credential verifiable via a public link, no auth required.

---

### 3.2.a — Database

New table `skill_credentials` (separate from course `certificates`):

```text
skill_credentials
  id              uuid pk
  talent_id       uuid → talents
  topic_tag       text
  content_id      uuid → content (course where earned, nullable for cross-course)
  module_id       uuid → course_modules (nullable)
  level           text  -- 'foundational' | 'proficient' | 'expert'
  mastery_at_issue numeric(3,2)
  attempts_at_issue int
  evidence        jsonb  -- {sources:['quiz','scenario'], items:[...], rubric_avg:...}
  verify_code     text unique  -- short URL-safe code
  issued_at       timestamptz default now()
  revoked_at      timestamptz
  created_at      timestamptz default now()
  unique(talent_id, topic_tag, level)
```

RLS:
- `SELECT` public (anyone can verify by code/look up).
- `INSERT` restricted to service role (issued only by edge fn).
- `UPDATE` admin-only (for revocation).

Trigger / RPC `issue_skill_credential(talent_id, module_id, topic_tag)` — idempotent; checks mastery + attempts thresholds and inserts the appropriate level row (or upgrades).

Thresholds:
- `foundational`: mastery ≥ 0.70 AND attempts ≥ 4
- `proficient`:   mastery ≥ 0.82 AND attempts ≥ 8
- `expert`:       mastery ≥ 0.92 AND attempts ≥ 12 AND ≥1 scenario signal

### 3.2.b — Edge function `issue-skill-credentials`

JWT-required. Walks the caller's `talent_skill_profile` rows, calls `issue_skill_credential` per qualifying row. Idempotent — safe to call after every quiz or scenario evaluate.

Hook it into the existing `learner-quiz-pool` submission path and `learner-scenario-evaluate` so credentials mint automatically. Returns `{ newly_issued: [...] }`.

### 3.2.c — Public verify route

Add `/verify/skill/:code` page (and `verify-skill-credential` edge fn or direct read via public RLS).
Renders: holder name, topic, level badge, issue date, course context, evidence summary. No auth.
Add JSON-LD `EducationalOccupationalCredential` for SEO.

### 3.2.d — Learner UI

- New `useSkillCredentials` hook.
- New `<SkillCredentialsPanel>` mounted on **Talent Mirror** (`/app/talent-mirror`) and condensed on **My Hub** above `<NextActionsCard>`.
- Credential chip: level icon (Lucide `BadgeCheck`/`Award`/`Trophy`), topic, course, "Verify ↗" link copying public URL.

### 3.2.e — Plan + memory updates
- Mark 3.2 done in `.lovable/plan.md`, bump Phase 3 progress.
- Add `mem://product/verifiable-skill-credentials` describing thresholds, table, and verify route.

---

### Files

**New**
- `supabase/functions/issue-skill-credentials/index.ts`
- `src/hooks/useSkillCredentials.ts`
- `src/components/learning/SkillCredentialsPanel.tsx`
- `src/pages/VerifySkillCredential.tsx`
- `mem://product/verifiable-skill-credentials`

**Edited**
- DB migration: `skill_credentials` table + `issue_skill_credential` function + RLS.
- `src/App.tsx` — register `/verify/skill/:code` route.
- `src/components/learning/MyCoursesTab.tsx` — mount condensed panel.
- `src/pages/app/TalentMirror.tsx` — mount full panel.
- `supabase/functions/learner-scenario-evaluate/index.ts` — invoke issuer post-eval.
- `supabase/functions/learner-quiz-pool/index.ts` (or quiz submit fn) — invoke issuer post-submit.
- `.lovable/plan.md`, `mem://index.md`

---

### Out of scope (deferred)
- W3C Verifiable Credentials JSON / cryptographic signing (3.2 ships verifiable-by-link; cryptographic VC is a future hardening pass).
- Sharing to LinkedIn (folded into 3.3 Public Profile).
- Admin revoke UI (DB supports it; admin screen deferred).

Reply **continue with 3.2** to ship a–e in one batch, or pick a smaller starting slice (e.g. **continue with 3.2.a** for migration only).