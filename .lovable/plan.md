## Phase 9b — Harden the wrapper pattern (mini-phase)

Lock in pattern decisions on the talent pilot before they get copied across 11 domains and 60 functions. Small surface, no behavior changes.

### 1. Pick one import convention

Drop the `talentApi` const + `TALENT_EDGE_FUNCTIONS` array. Consumers import named functions only:

```ts
import { batchParseCvs } from "@/domains/talent/api/talentApi";
```

- Remove `export const talentApi` and `export type TalentApi` from `talentApi.ts`.
- Remove `TALENT_EDGE_FUNCTIONS` and `TalentEdgeFunction` from `manifest.ts` (redundant with the named exports).
- Trim `manifest.ts` to a single barrel that re-exports the wrappers and the contract types.

### 2. Add runtime response validation (zod)

`zod` is already in the project. Add a tiny helper so contract drift fails loud instead of silently casting:

```ts
// src/edge/parseEdgeResponse.ts
export function parseEdgeResponse<T>(fnName: string, schema: ZodSchema<T>, data: unknown): T {
  const parsed = schema.safeParse(data);
  if (!parsed.success) throw new EdgeFunctionError(fnName, parsed.error);
  return parsed.data;
}
```

Rewrite `src/edge/contracts/talent.ts` so each response is a zod schema with an inferred type. Update the 3 talent wrappers to call `parseEdgeResponse`. Cost: ~30 LOC across 4 files. Benefit: every wire change throws a typed error at the call site, not deep inside a render.

### 3. Codify the cross-domain ownership rule

Add a 10-line `src/edge/README.md` documenting:
- Contracts live in `src/edge/contracts/<owner-domain>.ts`. "Owner" = the domain whose admin surface conceptually owns the function. Tie-breaker: where most call sites live.
- Wrappers live in `src/domains/<owner>/api/<owner>Api.ts`.
- Cross-domain callers import from the owner's `api/<owner>Api.ts` — never re-wrap.
- One wrapper per edge function, even if multiple body shapes exist in the wild. Use a discriminated union in the request type if the shapes are genuinely polymorphic.

This makes the `admin-support-assistant` decision (Phase 9c) routine instead of a debate.

### 4. Log the two pre-existing edge contract bugs

Create `.lovable/known-edge-contract-drift.md` listing:
- `generate-outreach-message` — call site sends `{ talent_id, product_context }`; edge function expects `{ parsedCV, product }`. Always 400s.
- `ai-support-assistant` — `ProfileVerify`/`ProfileEdit`/`ProfileBuilder` send `{ type, error/event, context }` with no `image`; edge function requires `image`. Always throws.

Phase 9 does not fix these — it surfaces them. A follow-up bug-fix ticket can address them once the wrappers make ownership clear.

### 5. Lock the pilot down in code

After steps 1–2 are applied to the talent wrappers, re-migrate the 4 talent call sites to confirm the new convention compiles. (Should be a no-op except for removing the now-deleted `talentApi.` prefix in any place I used it — currently 0 places, so this is just `tsc` confirmation.)

### Out of scope

- Touching agents/jobs/learning/etc. — that's Phase 9c onward.
- Fixing the two pre-existing contract bugs.
- Adding retries, telemetry, or rate-limit handling around `invoke`.
- Adding request validation (server-side already does it; the client doesn't need a second copy).

### Files touched

- Modify: `src/edge/contracts/talent.ts` (zod-ify), `src/domains/talent/api/talentApi.ts` (use `parseEdgeResponse`, drop `talentApi` const), `src/domains/talent/api/manifest.ts` (slim down)
- Create: `src/edge/parseEdgeResponse.ts`, `src/edge/README.md`, `.lovable/known-edge-contract-drift.md`

Estimated diff: ~80 LOC net change, ~6 files.

### Verification

- `tsc` clean.
- `rg "talentApi\." src` → 0 (no consumers were using the const, confirms removal is safe).
- `rg "supabase\.functions\.invoke" src/domains/talent` → still only inside `talentApi.ts`.
- Smoke: open `/dashboard?tab=talent-batch-upload`, `tab=talent-outreach`, `tab=talent-support-ai` — all three render and fire as before.

### Progress after Phase 9b

~98%. Phase 9c (agents, ~25 sites) begins with a sturdy template.