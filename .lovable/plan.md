## Sub-phase 3.5 — AI Tutor with Mastery Context

Make the existing AI instructor chat (`ai-instructor-chat` + `<AIChatPanel>`) aware of the learner's verified mastery, so it teaches to gaps and references credentials/scenarios instead of giving generic explanations.

### Goal
When a talent opens the chat (general, course, module, or scenario context), the tutor:
- Knows their **weakest topics** in the active module/course (from `talent_skill_profile`).
- Knows their **strong topics + earned credentials** (from `skill_credentials`).
- Suggests a concrete next action: review weak topic → quiz/scenario.
- References their last scenario evaluation when relevant.

### Scope

a. **Mastery context RPC**
   - New `get_tutor_mastery_context(_talent_id, _module_id, _content_id)` RPC returning JSON:
     - `weak_topics` (mastery < 0.7, top 5 by lowest mastery)
     - `strong_topics` (mastery >= 0.8, top 5)
     - `due_for_review_count`
     - `credentials` (topic_tag, level)
     - `last_scenario` (topic_tag + score + when, optional)
   - Scoped: if `_module_id` provided → only that module; else course; else cross-course.

b. **Edge function upgrade — `ai-instructor-chat`**
   - Accept new optional `talentId`, `moduleId`, `contentId` in body (resolve `talentId` server-side from auth as fallback).
   - Call the new RPC with service-role client and inject a "LEARNER MASTERY SNAPSHOT" block into `systemPrompt` after the curriculum KB:
     ```
     LEARNER MASTERY SNAPSHOT
     - Weak topics: [...]
     - Strong topics: [...]
     - Earned credentials: [...]
     - Items due for spaced review: N
     - Last scenario: <topic> scored <x>/100
     Coach the learner toward their weak topics first; reference their wins; if they ask "what should I study", recommend the weakest topic and link to /app/talent-mirror.
     ```
   - Cap snapshot to ~1.5KB; gracefully no-op if no profile exists.

c. **AIChatPanel wiring**
   - Pass `moduleId`/`contentId` through `<AIChatPanel>` props (already supports `contextId` — formalize naming) and forward to edge function.
   - Update `DiscussStage` and any course-context usage to pass the right IDs.
   - Add a small "Tutor knows your progress" hint chip on first open of the chat (one-time per session, dismissible).

d. **Smart starter prompts**
   - When mastery context is available, render 2 dynamic suggestion chips above the input:
     - "Help me with: <weakest topic>"
     - "Quick review: <due count> items"
   - Tap = pre-fills the message and sends.

e. **Telemetry hook (lightweight)**
   - Log `tutor_opened` and `tutor_starter_used` with module/content into existing analytics table (re-use the pattern from 3.4) for 3.8 trend lines.

---

### Data flow

```text
AIChatPanel ──(talentId, moduleId, contentId, messages)──► ai-instructor-chat
                                                             │
                                            get_tutor_mastery_context (RPC)
                                                             │
                                System prompt = instructor + KB + MASTERY SNAPSHOT
                                                             │
                                                         streamed AI reply
```

---

### Out of scope (deferred)
- Persisting tutor chat history (still ephemeral per session — a separate phase).
- Tool-calling (e.g. tutor enrolling user in next module) — Phase 4.
- Multilingual coaching tone — Phase 3.8 ties into trend lines.

---

### Files to create / edit

**New**
- `supabase/migrations/...` — `get_tutor_mastery_context` RPC.
- `src/hooks/useTutorMasteryContext.ts` — fetches snapshot for chip rendering.
- `mem://product/ai-tutor-mastery-context`

**Edit**
- `supabase/functions/ai-instructor-chat/index.ts` — RPC call + snapshot injection, accept new IDs.
- `src/components/ai-instructor/AIChatPanel.tsx` — forward IDs, render starter chips + hint.
- `src/components/player/stages/DiscussStage.tsx` — pass moduleId/contentId.
- `src/components/learning/MyCoursesTab.tsx` (if it embeds chat) — pass IDs.
- `.lovable/plan.md`, `mem://index.md`

---

### Approval options
- **continue with 3.5** — ship a–e together (recommended).
- **continue with 3.5.a+b** — backend only (RPC + edge function), starter chips in a follow-up.
---

## 3.5 ship notes

- DB: `get_tutor_mastery_context(_talent_id, _module_id, _content_id)` returns weak/strong topics, due-for-review count, credentials, last scenario.
- Edge `ai-instructor-chat` resolves talentId from auth and appends a LEARNER MASTERY SNAPSHOT block to the system prompt with a "coach to weakest topic, reference wins, link /app/talent-mirror" directive.
- `<AIChatPanel>` adds optional `moduleId`/`contentId` props (auto-derived from contextType/contextId), renders dynamic starter chips and a one-time hint on empty state via new `useTutorMasteryContext` hook.
- Phase 3 progress: ~62% (5 of 8).

**Up next:** 3.6 Authoring Feedback Loop. Reply **continue with 3.6**.
