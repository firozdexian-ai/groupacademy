# Phase 2 ✅ + Phase 3 — In Flight

## Phase 2 — Adaptive Learning Engine — **100% shipped**

| # | Sub-phase | Outcome |
|---|---|---|
| 2.1 | Item bank | `module_quiz_pool` + `module_scenario_pool` |
| 2.2 | Adaptive sampling | `learner-quiz-pool` + `learner-scenario-pool` |
| 2.3 | Skill profile + EWMA | `talent_skill_profile` |
| 2.4 | Spaced repetition | SM-2 + review queue + `notify-review-due` |
| 2.5 | Scenario → skill signal | `learner-scenario-evaluate` (Gemini) → `last_source='scenario'` |
| 2.6 | Adaptive learner widget | `AdaptiveSnapshotCard` |
| 2.7 | Instructor analytics | `instructor-item-analytics` + `ItemBankAnalyticsPanel` |
| 2.8 | Talent Mirror | `learner-talent-mirror` + `/app/talent-mirror` |

---

## Phase 3 — Activate the Engine

| # | Sub-phase | Status |
|---|---|---|
| 3.1 | Next-Best-Action recommender | ✅ Done |
| 3.2 | Verifiable Skill Credentials | ✅ Done |
| 3.3 | Talent Mirror → Public Profile | Pending |
| 3.4 | Mastery-driven Job Match | Pending |
| 3.5 | AI Tutor with mastery context | Pending |
| 3.6 | Authoring feedback loop | Pending |
| 3.7 | Cohort & peer benchmarks | Pending |
| 3.8 | Mastery snapshots & trend lines | Pending |

**Phase 3 completion: ~25%** (2 of 8 sub-phases)

### Recommended order
3.1 ✅ → 3.2 ✅ → 3.6 → 3.5 → 3.3 → 3.4 → 3.8 → 3.7

---

## 3.2 ship notes

- DB: `skill_credentials` table + `issue_skill_credential(talent, module, topic)` SECURITY DEFINER RPC. Public SELECT (verify), admin-only UPDATE/DELETE, inserts only via RPC.
- Thresholds: foundational ≥0.70/4 attempts · proficient ≥0.82/8 · expert ≥0.92/12 + scenario signal. Idempotent — upgrades in place.
- Edge fn `issue-skill-credentials` (JWT) walks caller's profile, mints qualifying rows, returns `newly_issued`.
- Auto-mint hooks: `learner-scenario-evaluate` calls RPC per evaluated topic; `<SkillCredentialsPanel>` triggers issuer once per session on mount (covers quiz path).
- Public verify route `/verify/skill/:code` — branded card, JSON-LD `EducationalOccupationalCredential` for SEO, no auth.
- UI: condensed panel on My Hub (limit 3, between NextActions and AdaptiveSnapshot), full panel on Talent Mirror page.
- Out of scope (deferred): W3C VC cryptographic signing, LinkedIn share (folded into 3.3), admin revoke UI.

---

## Up next: 3.6 Authoring Feedback Loop

Daily admin digest + inline Module Manager nudges of items flagged by 2.7's `needs_review` codes — closing the loop from analytics → fix → re-test. Reply **continue with 3.6** to move forward.
