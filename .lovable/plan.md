# Phase 1.4 — AI Career Coach (Talent Side)

Goal: now that 1.3 captures **profession_category_id**, **professional_role_id**, **current_status**, and **primary_goal**, turn that data into a working **personal Career Coach** for every talent. Reuse the existing `ai_instructors` table (78 active, one per profession category — `Career Coaching` already exists as a fallback) and the streaming `ai-instructor-chat` edge function. No new model, no new chat surface — just the **routing, persona injection, and entry points**.

## Findings from current code

1. **`ai_instructors`** has 78 active rows, one per `profession_category` (FK `profession_line_id` → `profession_categories.id`). Each row already carries `name`, `persona`, `system_prompt`, `expertise_areas`. Coverage of the 83 categories is near-complete; gaps include `Fresh Graduate` (no instructor) — needs a fallback.
2. **`ai-instructor-chat` edge function** already streams via Lovable AI, hydrates curriculum KB and `get_tutor_mastery_context`. It accepts `professionLineId` and builds a system prompt from instructor + school + curriculum. **No goal/status/role injection today.**
3. **No "Career Coach" entry point** — `AICoachConsoleTab` / `AishaConsoleTab` exist as `AgentRedirectStub`s pointing into the agentic dashboard, but there's no per-talent default coach binding. Aisha (the auth/general agent) is separate from the per-profession coach.
4. **Talent already has** `profession_category_id`, `professional_role_id`, `current_status`, `primary_goal`, `experience/education/skills`. All of this is unused by `ai-instructor-chat`.
5. **Concierge memory** says `ai-general` (agent_key) is the free-forever platform concierge. Career Coach is **different**: it's persona-bound, profession-bound, and lives next to AI General — not a replacement.

## Plan

### 1.4.a — DB: bind a coach to each talent

- Migration:
  - `ALTER TABLE talents ADD COLUMN career_coach_instructor_id uuid REFERENCES ai_instructors(id) ON DELETE SET NULL;`
  - `CREATE INDEX idx_talents_career_coach ON talents(career_coach_instructor_id);`
  - SECURITY DEFINER function `assign_career_coach(_talent_id uuid) RETURNS uuid` that:
    1. Looks up talent's `profession_category_id`.
    2. Picks the `ai_instructors` row for that category (active).
    3. Falls back to the `Career Coaching` instructor (id resolved by name) if none.
    4. Writes `talents.career_coach_instructor_id` and returns the id.
  - Set `search_path = public` (per platform memory).
- Backfill query in the migration: `UPDATE talents SET career_coach_instructor_id = (SELECT id FROM ai_instructors WHERE profession_line_id = talents.profession_category_id AND is_active LIMIT 1) WHERE career_coach_instructor_id IS NULL AND profession_category_id IS NOT NULL;`

### 1.4.b — Auto-assign at end of onboarding

- In `useOnboarding.completeOnboarding`, after the existing welcome-credit gating, call `supabase.rpc("assign_career_coach", { _talent_id })`.
- Also call it in `ProfessionStep`'s save handler so a coach is bound the moment profession is chosen — not only after step 5.
- If `assign_career_coach` returns null (no match + no fallback), surface a soft toast and continue (non-blocking).

### 1.4.c — Inject onboarding context into `ai-instructor-chat`

Edge function `supabase/functions/ai-instructor-chat/index.ts`:

- Already loads instructor + curriculum + mastery. **Add**:
  - Resolve talent row (already does, for `talentId`).
  - Pull `current_status`, `primary_goal`, `professional_roles.name` (via FK from `talents.professional_role_id`), top 5 `skills`, last `experience.title @ company`.
  - Inject a **CAREER PROFILE** block into `systemPrompt` after the institutional block:
    ```
    CAREER PROFILE (use to ground every reply)
    - Goal: {primary_goal}
    - Status: {current_status}
    - Target role: {professional_role.name}
    - Recent role: {experience[0].title @ company}
    - Top skills: {top 5 skills}
    Coach toward {primary_goal}. Be direct, practical, name a next step in every reply.
    ```
- Keep injection ≤ 1.5 KB.
- New optional payload field `mode: "career_coach" | "tutor"` so the existing tutor flows on `/app/courses/...` are unchanged. When `mode === "career_coach"`, skip the curriculum KB block (it's noise for career chat).

### 1.4.d — Career Coach surface

Two minimal entry points, no new chat UI from scratch — reuse existing chat panel infra.

1. **Dashboard tile** on the talent dashboard quick actions grid:
   - "Talk to your Coach" → routes to `/app/career-coach`.
   - Subtitle shows the bound coach's `name` (fallback "Career Coach").
2. **New page** `src/pages/app/CareerCoach.tsx`:
   - Reads `talents.career_coach_instructor_id`. If null, calls `assign_career_coach` on mount.
   - Renders `AIChatPanel` (existing) wired to `ai-instructor-chat` with `professionLineId` (from instructor row) and `mode: "career_coach"`.
   - **Seed first message** when there are no prior messages: a server-side starter built from goal+role: e.g. `"Hi {first_name}, I'm {coach.name}. You said your goal is to {goal label}. Want to start with a 30-day plan or fix your CV first?"` — render as the first assistant bubble (not user-sent).
   - Persists thread via existing `agent_chat_sessions` (use `agent_key = 'career-coach'`; insert a row in `ai_agents` for `career-coach` if not present, mirroring the `ai-general` pattern).
3. Update `AICoachConsoleTab` (currently a redirect stub) to point at `/app/career-coach` instead of the generic agent route.

### 1.4.e — Concierge ↔ Coach handoff

- In `useAIGeneralChat`'s system prompt (server side, already markdown-link-aware), append: "When the user asks for career planning, CV feedback, interview prep, or skill gaps — recommend they open their Career Coach: `[Open your Career Coach](/app/career-coach)`."
- No code changes on the client; just a system-prompt append in whatever edge function `ai-general` uses (verify location during implementation).

### 1.4.f — Telemetry (light, same pattern as 1.3)

- Reuse `src/lib/onboarding/telemetry.ts` shape; add `trackCoachEvent("opened" | "first_message" | "session_resume")` writing to `console.debug`. Real table comes in 1.5.

## Files changed (planned)

- `supabase/migrations/<ts>_career_coach.sql` — new column, index, `assign_career_coach` RPC, backfill
- `supabase/functions/ai-instructor-chat/index.ts` — career-profile context block, `mode` switch
- `src/hooks/useOnboarding.ts` — call `assign_career_coach` on completion
- `src/components/onboarding/ProfessionStep.tsx` — call `assign_career_coach` after save
- `src/pages/app/CareerCoach.tsx` — new page, reuses `AIChatPanel`
- `src/components/ai-instructor/AIChatPanel.tsx` — accept optional `seedAssistantMessage` + `mode` props (small additive change)
- `src/components/dashboard/talent/AICoachConsoleTab.tsx` (or equivalent quick-action card) — link to `/app/career-coach`
- `src/App.tsx` — route `/app/career-coach`
- `src/lib/onboarding/telemetry.ts` — `trackCoachEvent`

## Out of scope (deferred)

- Profile groomer / CV-rewrite tools inside the coach chat → 1.5
- Voice mode, mock interview launcher inside coach → later
- Per-goal sub-personas (one coach per `primary_goal`) — current plan binds **per profession**; goal lives in the system prompt only
- Admin UI to edit per-talent coach assignment → trivial later add
- Migration of legacy `Aisha` chat threads into the coach surface
- WhatsApp / phone verification → Profile Verification phase

## Open questions

1. **Coach naming** — show the instructor's real persona name (e.g. *"Rafiq, your Project Management Coach"*) or always brand it as **"GroUp Career Coach"** with the persona only inside replies? My recommendation: show real persona name — feels more human and matches the existing instructor identity.
2. **First-message seeding** — auto-send the seed as the assistant's first bubble (recommended) or show a **starter chips** strip ("Plan my next 30 days", "Review my CV", "Find me jobs", "What skill should I learn?") and let the user pick? Could do both.
3. **Coverage gap** — for the few categories without an `ai_instructors` row (e.g. `Fresh Graduate`), should I (a) fall back to the `Career Coaching` instructor only, or (b) auto-create missing instructor rows from a template at migration time so every talent always has a same-category coach?
