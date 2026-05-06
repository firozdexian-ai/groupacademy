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
| 3.3 | Talent Mirror → Public Profile | ✅ Done |
| 3.4 | Mastery-driven Job Match | Pending |
| 3.5 | AI Tutor with mastery context | Pending |
| 3.6 | Authoring feedback loop | Pending |
| 3.7 | Cohort & peer benchmarks | Pending |
| 3.8 | Mastery snapshots & trend lines | Pending |

**Phase 3 completion: ~37%** (3 of 8 sub-phases)

### Recommended order
3.1 ✅ → 3.2 ✅ → 3.3 ✅ → 3.6 → 3.5 → 3.4 → 3.8 → 3.7

---

## 3.3 ship notes

- DB: `talents` extended with `public_handle` (UNIQUE, regex-checked), `public_profile_enabled`, `public_show_mastery`, `public_show_credentials`, `public_bio`. RPC `get_public_talent_profile(_handle)` SECURITY DEFINER returns name + credentials + mastery snapshot only when opted in. Granted to `anon` + `authenticated`.
- Edge fn `claim-public-handle` (JWT) — validates format, checks reserved + uniqueness, writes to caller's talent.
- Public route `/t/:handle` (no auth) — hero, verified skills, mastery snapshot, Connect CTA, JSON-LD `Person` + `hasCredential`, OG/Twitter meta, "Profile is private" fallback.
- `<PublicProfileSettings>` mounted on `/app/profile` — toggle, handle claim with debounced format guard, bio (240 chars), per-section visibility switches, copy/view link.
- `<SkillCredentialsPanel>` shows "Share public profile" when enabled, otherwise nudges "Make your skills public →".
- Out of scope (deferred): custom subdomain mapping, LinkedIn "Add to Profile" button (waits on W3C VC signing), profile view analytics (folded into 3.8), admin reserved-handle UI.

---

## Up next: 3.6 Authoring Feedback Loop

Daily admin digest + inline Module Manager nudges of items flagged by 2.7's `needs_review` codes — closing the loop from analytics → fix → re-test. Reply **continue with 3.6** to move forward.
