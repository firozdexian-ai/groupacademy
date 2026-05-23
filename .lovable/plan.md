# B5 — Agents + Wallet + Player + Shared Components Jargon Cleanup

Final talent-facing sweep. Continues the plain-English voice locked in by B3 and B4 across the remaining shared/UI surfaces.

## Scope (~50 user-visible hits, ~30 files)

**Agents (~7 hits)**
- `src/components/agents/CreatorOnboardingDialog.tsx` (5)
- `src/domains/agents/components/dashboard/AgentTriggers.tsx` (2)
- `src/domains/agents/components/chat/AgentChatDialog.tsx` (1)
- `src/domains/agents/hooks/useAgentRuntime.ts` (1)

**Player (~18 hits)**
- `src/components/player/ShortcutsDialog.tsx` (4)
- `src/components/player/stages/PracticeStage.tsx` (3)
- `src/components/player/AIScenarioPlayer.tsx` (3)
- `src/components/player/stages/OrientationStage.tsx` (2)
- `src/components/player/stages/LearnStage.tsx` (2)
- `src/components/player/stages/ProgressStage.tsx`, `AssessStage.tsx`, `DiscussStage.tsx` (1 each)
- `src/components/player/VideoPlayer.tsx`, `FlashcardPlayer.tsx`, `ResourceViewer.tsx`, `ModuleList.tsx`, `ImmersiveModuleList.tsx` (1 each)

**Wallet / Finance + Career Services (~3 hits)**
- `src/domains/finance/components/talent/CreditPurchaseSheet.tsx` (1)
- `src/components/talents/InboxUnlockCard.tsx` (1)
- `src/components/sourcing/SaveToListSheet.tsx` (1)

**PDF templates + portfolio + assessment (~13 hits)**
- `src/components/Footer.tsx` (8)
- `src/components/portfolio/ProfileBuilderForm.tsx` (4) + `SimpleFileUpload.tsx` (2)
- `src/components/salary-analysis/SalaryAnalysisPDFTemplate.tsx` (4)
- `src/components/certificate/CertificatePDFTemplate.tsx` (2)
- `src/components/report/ReportCardTemplate.tsx` (1)
- `src/components/mock-interview/MockInterviewPDFTemplate.tsx` (1)
- `src/components/assessment/LeadCaptureForm.tsx` (2) + `AssessmentStepper.tsx` (1)

**Shared UI / misc (~9 hits)**
- `src/components/ui/retry-error-card.tsx` (2), `phone-input.tsx` (1)
- `src/components/job-application/InlineCVUpload.tsx` (2)
- `src/components/cv/ExistingCVCard.tsx` (1)
- `src/components/ai-instructor/AIChatPanel.tsx` (1)
- `src/components/modules/ResearchPromptDialog.tsx` (1)
- `src/components/interviews/InterviewPanel.tsx` (1)
- `src/components/applications/ApplicationKanbanCard.tsx` (1) + `ApplicationDetailSheet.tsx` (1)
- `src/components/CourseShareButtons.tsx` (1), `AccessCodeDialog.tsx` (1), `ProtectedRoute.tsx` (1)

## Replacement voice (same as B3/B4)

- Drop "Digital Workforce", "Anomaly", "Telemetry", "Pipeline", "Ingress", "Synthesis", "Handshake", "Ledger", "Matrix", "Vector", "Node", "Vacuum", "Protocol" from user-visible strings.
- Toast titles describe outcomes plainly ("Saved", "Couldn't load", "Upload failed").
- Buttons/CTAs use verbs ("Buy credits", "Unlock inbox", "Save to list", "Continue").
- Player keyboard/shortcut labels use familiar terms ("Play/Pause", "Next module", "Show transcript").
- Footer copy is brand-clean and human.
- PDF templates use professional report language (no sci-fi labels in user-delivered files).
- Internal console.error prefixes normalized to `[agents]`, `[player]`, `[wallet]`, `[portfolio]`, `[shared]`.

## Process

1. Edit in 4 parallel batches: Agents → Player → PDF/Portfolio/Assessment → Shared UI/Wallet.
2. Spot-read each touched file for nearby stray jargon and fix opportunistically.
3. Re-run jargon sweep; expect remaining hits to be acronym false positives only.
4. Update `.lovable/plan.md`: mark B5 done and close out the V0.5 jargon cleanup track.

## Out of scope

- Admin / Gro10x / instructor staff routes.
- Any logic, styling, layout, schema, or copy beyond jargon→plain-English rewrites.
- PDF template visual redesign — copy edits only.
