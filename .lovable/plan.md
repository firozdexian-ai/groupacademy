# Phase A3 — Talent Profile

## What I found

Profile surface = 4 live pages + 1 chat onboarding.

| Route | File | Role | State |
|---|---|---|---|
| `/app/profile` | `Profile.tsx` (276 LOC) | Read view | **Half-built** + jargon |
| `/app/profile/edit` | `ProfileEdit.tsx` (287 LOC) | Edit form | **Broken** + jargon |
| `/app/profile-builder` | `ProfileBuilder.tsx` (186 LOC) | Aisha post-auth chat | Works; minor polish |
| `/app/profile/verify` | `ProfileVerify.tsx` (219 LOC) | KYC / payout | Works; jargon to scan |
| `/app/t/:handle` (public) | `TalentPublicProfile.tsx` (164 LOC) | Public view | Works; jargon to scan |

### P0 — `ProfileEdit` is functionally broken

1. **No `useEffect` to hydrate `formData` / `skills` / `experience` / `education` / `languages` / `achievements` / `profilePhotoUrl` / `coverImageUrl` / `cvUrl` from `talent`.** Opening edit shows empty form; saving wipes the user's existing data.
2. Only **two fields** are actually rendered (`fullName`, `phone`). Everything else (customProfession, currentStatus, institution, fieldOfStudy, linkedinUrl, portfolioUrl, skills, experience, education, languages, achievements) is collected in state and saved, but **never has an input** in the JSX. Editors exist (`SkillsEditor`, `ExperienceEditor`, `EducationEditor`) but are imported and not mounted.
3. Hardcoded `countryCode: "+880"`, `country: "BD"` defaults — violates Global Product Standard.

### P0 — `Profile.tsx` is half-built

4. Only renders **AI Summary** card + `PublicProfileSettings`. Experience / Education / Skills / Achievements / Languages are dropped behind a `{/* Similar pattern for Experience and other sections... */}` comment. User sees a profile page with no resume content.
5. `useTalent()` hydrates `country/countryCode` but they're never shown (no location chip, no contact row). `email`, `phone`, `linkedinUrl`, `portfolioUrl` also missing from render.

### P1 — Copy is corporate techno-babble across all 4 pages

Examples to humanize:
- "Identity List" / "Verified Logic Sync v2.6" / "CANDIDATE_EXPLORER" / "Recalibrate" / "AI Summary" → "My profile" / "Verified" / job title fallback / "Edit" / "About"
- "Identity ledger synchronized." / "Sync failed. Admin agents notified." → "Profile saved." / "Couldn't save — please try again."
- "Neural synthesis complete." / "Synthesis failed. Admin support alerted." → "Updated with AI." / "AI rewrite failed — please try again."
- "Syncing List Node..." → "Loading your profile…"
- ProfileEdit: "Identity Frame" / "Environmental Banner" / "Logic Artifact Ingestion (CV)" / "Authorize CV Ingestion" / "Active List Artifact" / "Verified Payload" / "Entity Name" / "Pending Sync" / "Finalize Sync" / "Discard" / "CV artifacts integrated." / "Extraction error. Admin alerted." → "Profile photo" / "Cover image" / "Upload your CV" / "Upload CV (PDF or Word)" / "CV uploaded" / pill removed / "Full name" / "Unsaved changes" / "Save changes" / "Cancel" / "We pulled your info from the CV." / "Couldn't read that CV — try a different file."
- ProfileBuilder: header sub "Profile Concierge" is fine; minor handoff toast / errors to plain English.

### P1 — Other

6. `useTalentPitches` is exported from `src/domains/profile` index but never imported anywhere (not in the 4 pages). Dead export — verify and drop.
7. `Profile.tsx` `reportAnomaly` and `ProfileEdit.tsx` `reportAnomaly` are no-ops with `console.error`/`warn`. Replace with `errorTracking` helper (already in repo) or drop.
8. `Profile.tsx` "Recalibrate" button + Settings icon both go to `/app/profile/edit` — redundant. Keep one (Edit).
9. `ProfileEdit.tsx` discards on Cancel without confirming `isDirty` — silent data loss.

### P2 (defer)
- `TalentPublicProfile.tsx` invokes `adminSupportAssistant` which has body-shape drift (per `.lovable/known-edge-contract-drift.md`). Drop the call.
- `ProfileVerify.tsx` `reportAnomaly` cleanup.

## Sub-phases (small, independently shippable)

### A3-FIX-1 — Fix `ProfileEdit` (P0, ~60 min)
1. Add `useEffect([talent])` that hydrates every state field from `talent` (and uses `talent.country` / `talent.countryCode` instead of `+880`/`BD` fallback).
2. Render the missing fields inside the existing `Card` block:
   - About: `customProfession`, `currentStatus` (textarea)
   - Education: `institution`, `fieldOfStudy`
   - Links: `linkedinUrl`, `portfolioUrl`
   - Lists: mount `<SkillsEditor>`, `<ExperienceEditor>`, `<EducationEditor>` (each already accepts value + onChange)
   - Languages + Achievements: simple add/remove repeater (same pattern as old `ProfileSectionEditor`).
3. Humanize copy (table above).
4. Add `if (isDirty) confirm()` on Cancel + on back nav.

### A3-FIX-2 — Fix `Profile` read view (P0, ~30 min)
1. Replace the dropped `{/* Similar pattern… */}` comment with real cards: About, Experience, Education, Skills, Languages, Achievements. Each pulls from `talent` and shows the same `SectionHeader` + an empty-state CTA "Add your X" → opens `ProfileSectionEditor`.
2. Add a contact strip below the avatar: country flag + name, email, phone, LinkedIn, portfolio (only when present).
3. Humanize all copy.
4. Drop the redundant "Recalibrate" button — keep only the Settings → Edit action.

### A3-FIX-3 — Copy pass on `ProfileBuilder` / `ProfileVerify` / `TalentPublicProfile` (P1, ~20 min)
Scan each for residual jargon strings (anomaly toasts, header copy) and humanize. No logic changes.

### A3-FIX-4 — Cleanup (P1, ~10 min)
- Replace `reportAnomaly` no-ops in Profile + ProfileEdit with `trackError(...)` from `src/lib/errorTracking.ts` (or drop).
- Drop `useTalentPitches` re-export from `src/domains/profile/index.ts` if confirmed unused (rg -l confirms).
- Drop the `adminSupportAssistant` invoke in `TalentPublicProfile.tsx` (known broken contract).

### A3-FIX-5 — Verification
- Test account `something@gro10x.com`:
  - Sign in → Aisha → finish → land on `/app/feed`.
  - Open `/app/profile` → all sections render with placeholders.
  - Edit → fill fields → save → values persist on re-open.
  - Upload CV → fields auto-fill from parsed CV.
  - Cancel with unsaved changes → confirm dialog fires.
- Admin `gro10xnow@gmail.com` unaffected (admin shell).

## Order & dependencies

A3-FIX-1 → A3-FIX-2 (independent but read view should match edit) → A3-FIX-3 → A3-FIX-4 → A3-FIX-5.

Each phase ships and is verified before the next, matching the "small steps" preference.

## Out of scope (defer to later phases)

- New profile-strength scoring rules (`ProfileCompletionMeter` logic untouched).
- Public profile redesign per LinkedIn-style memory — already shipped at v2; we only humanize copy here.
- KYC flow rewrite — `ProfileVerify` only gets a copy scan.
- Backend column changes / new tables.
