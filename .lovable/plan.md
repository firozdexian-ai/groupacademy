# Phase 4.8 — Study Abroad, AI IELTS Coach & Language Lab (FINAL)

Closes Phase 4. Three pillars, with the **Roadmap Creator absorbed into per-country Destination Agents** (no standalone tool).

---

## How the Roadmap Creator becomes per-country agents

**Today**: `/app/abroad/roadmap` → `RoadmapIntakeForm` → `generate-study-roadmap` edge → `StudyAbroadRoadmapResults`. One generic tool, no country specialization.

**New model**: each destination country has a **Destination Agent** (e.g. UK Agent, Germany Agent, Canada Agent…) that:
1. Lives under `Career Abroad → Destinations` in Admin Group #13 and `/app/abroad` for talents.
2. Knows that country's universities, intake terms, visa rules, IELTS/PTE cutoffs, scholarships, post-study-work norms — grounded in `study_abroad_programs` + a new `country_knowledge_packs` table (curated by admin).
3. Exposes **Roadmap** as a *skill* of the agent (one tool-call), not a separate page. Same form fields, but the agent can also chat — "When's the Russell Group fall deadline?", "What's a budget plan for £25k?", "Will my IELTS 6.5 work for Edinburgh?".
4. Logs roadmap outputs into existing `study_abroad_roadmaps` so admin pipeline keeps working.

### Schema
- `destination_agents` — `country_code` (ISO-2, PK), `display_name`, `flag_emoji`, `tagline`, `system_prompt`, `is_active`, `default_currency`, `intake_terms[]`, `visa_processing_weeks`
- `country_knowledge_packs` — `country_code`, `kind` (visa/scholarship/cost/process/policy), `title`, `body_markdown`, `source_url`, `valid_through`, `is_published`
- Replace standalone `/app/abroad/roadmap` route → redirect to `/app/abroad/destinations/:country?intent=roadmap`.

### Agent runtime
- One edge `ai-destination-agent` (parameterized by `country_code`) replaces both `generate-study-roadmap` (kept as an internal tool-call) and per-country routing.
- Tools the agent can call:
  - `build_roadmap(intake)` — wraps existing `generate-study-roadmap` logic, persists row.
  - `find_programs(filters)` — queries `study_abroad_programs WHERE country = X`.
  - `estimate_costs(profile)` — uses knowledge pack + currency rates.
  - `check_visa_eligibility(profile)` — knowledge-pack lookup.
- Cost: 1 credit per chat response, 3 credits when `build_roadmap` runs (replaces existing per-roadmap charge).

### Surfaces
- `/app/abroad` — country grid (flags + agent cards). Tap → `/app/abroad/destinations/:code` (chat + Roadmap CTA + programs panel).
- Old `RoadmapIntakeForm` becomes a sheet inside the destination page (still callable as the agent's first action via "Build my roadmap" chip).
- Admin: `Career Abroad → Destinations` tab — manage agents, knowledge packs, agent test console (reuses Agentic Dashboard pattern).

### Launch destinations (8)
UK, USA, Canada, Australia, Germany, Ireland, Netherlands, Singapore. (Add more via admin without code.)

---

## Pillar 1 — Counsellor Workflow (unchanged from previous plan, summary)

- New tables: `abroad_counsellors`, `abroad_applications` (8-stage pipeline), `abroad_application_docs` (private bucket `abroad-docs`), `abroad_application_events`.
- RPCs: `assign_abroad_counsellor`, `advance_abroad_stage`, `request_abroad_doc_review`.
- Edges: `ai-abroad-sop-coach`, `notify-abroad-event`.
- Counsellor earnings reuse Phase 4.7 `instructor_earnings_ledger` with `source_kind = 'abroad_application'` (60% counsellor / 40% platform).
- Surfaces: `/app/abroad/applications`, `/app/abroad/applications/:id`, `/app/counsellor` cockpit, admin tabs `Applications | Counsellors | Doc Reviews | Payouts`.
- Destination Agent automatically offers "Start application with a counsellor" once roadmap exists.

---

## Pillar 2 — AI IELTS Coach (gamified + AI mocks)

- New tables: `ielts_prompts` (curated), `ielts_mock_attempts` (AI-graded bands per criterion), `ielts_streaks`, `ielts_daily_challenges`.
- Edges:
  - `ai-ielts-evaluate` — grades writing (text), speaking (audio upload to private `ielts-audio` bucket → Gemini multimodal), reading/listening (auto + AI explanation). Returns 0–9 bands per criterion + actionable feedback.
  - `ai-ielts-coach-chat` — conversational tutor grounded in last 5 attempts.
  - `cron-ielts-daily-challenge`, `cron-ielts-streak-decay`.
- Pricing: **1 free attempt/day** (drives engagement) → 1 credit/section, 4 credits/full mock.
- Surfaces:
  - `/app/ielts` redesigned as Coach Home (streak ring, daily challenge, weakest-band chip, "Take a mock" CTA).
  - `/app/ielts/mock/:section` runner (timer + MediaRecorder for speaking).
  - `/app/ielts/results/:attemptId` with per-criterion AI feedback and inline coach chat.
  - Public `/ielts` SEO landing with rate-limited (1/day per IP) free band predictor demo.
- Gamification: XP per attempt, badges at 7/30/100-day streaks, country leaderboard (display name only).
- Admin: `IELTSPromptsTab` + `IELTSAttemptsTab` for curation and quality monitoring.
- Destination Agents reference talent's latest IELTS band when answering eligibility questions.

---

## Pillar 3 — Language Lab (new vertical for Language Experts)

- New tables: `languages` (ISO 639-1), `language_levels` (CEFR A1–C2), `language_instructors` (extends talent profile), `language_bookings` (1:1 sessions), `language_practice_sessions` (AI partner logs).
- Extend existing `courses` with `subject_kind`, `language_code`, `cefr_level` (additive columns — no fork).
- Edges:
  - `ai-language-partner` — multilingual conversation partner at chosen CEFR; inline corrections via tool-call.
  - `ai-language-evaluate` — placement test → CEFR estimate per skill, recommends instructors + courses.
  - `book-language-session` — credits deduction + booking + meet room + notification.
- Surfaces:
  - `/app/languages` — language grid; per-language landing with AI partner CTA, top instructors, courses by CEFR, placement test.
  - `/app/languages/:code/practice` — chat with AI partner + corrections pane.
  - `/app/languages/:code/instructors` — browse + book.
  - `/app/languages/me` — verified CEFR levels, history, streak.
  - Instructor side: `/app/instructor` gains "Languages" tab (calendar + earnings reusing 4.7 ledger with `source_kind = 'language_session'`).
  - Public `/learn/languages` SEO landing.
  - Admin: `Language Lab` group with `Languages | Instructors | Bookings | Practice Insights`.
- Launch with 6 languages: English, Spanish, French, German, Japanese, Bangla (extend via admin).
- Verified CEFR levels feed into `talent_skill_profile` → surfaced in `get_talent_outcome_signal`, displayed on `/t/:handle`, and boost `score-job-match` when jobs require languages.

---

## Cross-cutting

- **Credits**: fractional `numeric(12,1)` deductions per existing model.
- **Storage** (private buckets, signed URLs): `abroad-docs`, `ielts-audio`, `language-audio`.
- **RLS**: talents see own rows; counsellors see assigned applications; instructors see own bookings; admins see all via `has_role`.
- **Notifications**: native email queue (`notify.groupacademy.online`) for stage changes, booking confirmations, daily IELTS challenge.
- **Memory updates**: 4 new entries — Destination Agents architecture, Counsellor Workflow, AI IELTS Coach, Language Lab.
- **Retire**: standalone Roadmap Creator route + admin lead manager card; data preserved (`study_abroad_roadmaps` lives on as agent output store).

---

## Out of scope (explicit defer)

- Real-time full-duplex voice for IELTS speaking / language partner (audio upload only this phase).
- Visa appointment booking integrations.
- Stripe Connect international payouts (credits → existing payout flow only).
- Instructor-led IELTS classes (AI coach first; cohorts can layer later).

---

## Open questions

1. **Counsellor sourcing** — sub-role of `instructor` (reuse onboarding) or fully separate role with its own application flow?
2. **Document retention** — keep abroad docs how long after `enrolled` / `declined`? Default proposal: 24 months then archive.
3. **Destination Agent voice** — single shared brand voice, or per-country localized tone (e.g. UK Agent more formal)?
4. **Language Lab launch** — confirm 6 languages above, or different mix for MVP?
