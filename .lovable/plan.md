# Phase B3 — Learning Hub Jargon Cleanup (DONE)

## Result
- Sweep counts: 248 → **239 hits (T1: 79, T2: 160)**
- Sweep regex captures a narrow vocabulary (Telemetry, Anomaly, Sentinel, Cognitive, Logic Node, HUD, Protocol:, cite:); most of the B3 cleanup hit user-visible *Ecosystem / Calibration / Pipeline / Ingress / Matrix* copy that isn't tracked by the sweep but was the actual reputational risk.
- Estimated ~50+ user-visible strings rewritten in 20 files across the Learning surface.

## Files modified
- `src/pages/app/LearningHub.tsx` — "Academic Hub" → "Learning"
- `src/pages/app/TalentMirror.tsx` — removed Logic Node Fault, Telemetry sync error, Digital Workforce Anomaly, Protocol footer badge, Executive Logic comment
- `src/domains/learning/components/talent/TalentMirrorPanel.tsx` — error + empty-state copy
- `src/domains/learning/components/talent/ReviewQueueRunner.tsx` — error, empty, loading, badges, rationale label
- `src/domains/learning/components/talent/ItemBankAnalyticsPanel.tsx` — error, stats labels, filter, AI rewrite button, scenario row copy
- `src/domains/learning/components/talent/ItemRewriteSheet.tsx` — toasts, header, descriptions, difficulty/prompt labels
- `src/domains/learning/components/talent/MyCoursesTab.tsx` — error state
- `src/domains/learning/components/talent/CoursesTab.tsx` — section headings, status fallbacks, empty state, scroll loaders
- `src/domains/learning/components/talent/EventsTab.tsx` — filter labels, empty states, status fallbacks
- `src/domains/learning/components/talent/UnifiedDiscovery.tsx` — header, subtitle, audit button, empty state
- `src/domains/learning/components/talent/ActiveCourseHero.tsx` — heading + subtitle
- `src/domains/learning/components/talent/AdaptiveSnapshotCard.tsx` — synchronized state
- `src/domains/learning/components/talent/NextActionsCard.tsx` — section title
- `src/domains/learning/components/talent/JoinLivePanel.tsx` — CTAs + recording note
- `src/domains/learning/components/talent/WebinarEnrollPanel.tsx` — error toast
- `src/domains/learning/components/talent/UpcomingSessionsRail.tsx` — CTA
- `src/domains/learning/components/talent/QuickActionCard.tsx` — placeholder badge
- `src/domains/learning/components/talent/QuickStats.tsx` — header
- `src/domains/learning/components/talent/LearningStreak.tsx` — empty state
- `src/domains/learning/components/talent/StudyAbroadSection.tsx` — header, IELTS card, CTA
- `src/domains/learning/components/talent/TracksTab.tsx` — empty state
- `src/domains/learning/components/talent/ModuleQuizRunner.tsx` + `ModuleScenarioRunner.tsx` — error toasts

## Next batches (priority order)
- **B4** — Jobs + Gigs + Career Abroad talent surfaces (~70 hits)
- **B5** — AI Agents + Wallet + Misc talent pages (~50 hits)
- **B6** — Final sweep + regex broadening (add Ecosystem/Calibration/Pipeline/Ingress to sweep vocab) + verify

## Stop point
B3 complete. Awaiting go for B4.
