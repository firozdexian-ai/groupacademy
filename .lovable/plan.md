# Phase 5 — Vertical-slice migration across remaining domains

## Phase 5.1 — feed: DONE ✅
- 6 hooks → `src/domains/feed/hooks/` (+ barrel re-exports)
- 28 components → `src/domains/feed/components/talent/` (+ barrels)
- `src/edge/contracts/feed.ts` (RPC-only), `feedApi`, `src/domains/feed/index.ts`

## Phase 5.2 — profile: DONE ✅
- 7 hooks → `src/domains/profile/hooks/` (+ barrel re-exports at `src/hooks/*`):
  `usePublicProfileSettings`, `useTalentPitches`, `useTalentMirror`,
  `useTalentOutcomeSignal`, `useTalentLists`, `useTalentRelationships`, `useTalentSearch`
- 15 components → `src/domains/profile/components/talent/` (+ barrels at `src/components/profile/*`)
- `src/edge/contracts/profile.ts` typed contracts: `claim-public-handle`, `parse-cv`
- `src/domains/profile/api/manifest.ts` with `profileApi.{claimPublicHandle, parseCv}`
- `src/domains/profile/index.ts` exposes hooks + api + key UI
- Swept `CVUploadSection.parse-cv` → `profileApi.parseCv`
- Intra-domain imports rewritten to relative paths

## Progress: ~35%

| Domain | Hooks | Talent UI | Admin UI | Gro10x UI | Edge contracts |
|---|---|---|---|---|---|
| agents | ✅ | ✅ | ✅ | – | partial |
| jobs | ✅ | ✅ | ⏳ | ⏳ | ⏳ |
| learning | ✅ | ✅ | ✅ | ✅ | ✅ |
| feed | ✅ | ✅ | – | – | ✅ |
| **profile** | ✅ | ✅ | – | – | ✅ |
| 11 others | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ |

## Next: Phase 5.3 — gigs (189K, talent + admin + gro10x)

## Roadmap

```text
5.3  gigs            (189K)
5.4  abroad          (40K)
5.5  messaging
5.6  companies
5.7  marketing
5.8  ir
5.9  finance
5.10 institutions
5.11 workforce
5.12 ugc
5.13 dashboard residuals

Phase 6  platform/ extraction
Phase 7  shells/*/routes.tsx + React.lazy
Phase 8  retire barrel re-exports
Phase 9  edge/contracts/ for every domain
```
