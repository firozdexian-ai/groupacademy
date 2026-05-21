# Next Course of Action — Finish the Supabase isolation refactor

Phase 10j.5 is complete: **zero** raw `supabase.from(...)` calls remain anywhere outside `src/domains/` and `src/integrations/` (verified across `src/pages`, `src/components`, `src/hooks`, `src/lib`, `src/gro10x`, `src/platform`).

What still leaks the Supabase client outside the repo layer:

| Surface | Calls outside `src/domains` | Risk |
|---|---|---|
| `supabase.rpc(...)` | **67** | Same coupling problem `.from()` had |
| `supabase.auth.*` | **58** | Scattered session logic |
| `supabase.storage.*` | **12** | Bucket names duplicated |
| `supabase.functions.invoke` | 2 | Already mostly wrapped |
| `supabase.channel(...)` | 0 | Clean |

The plan picks these off in the same incremental, low-risk way as 10j.5.

---

## Phase 10j.6 — RPC consolidation (recommended next)

Move all 67 `supabase.rpc("...")` calls into typed repo helpers. Same pattern as `.from()` migration.

Top hotspots to tackle first:
- `src/hooks/useCreatorAnalytics.ts` (6)
- `src/gro10x/pages/work/Gro10xProjects.tsx` (4)
- `src/pages/app/ReviewerCockpit.tsx` (3)
- Then sweep remaining single/double-call files in batches of ~15 per sub-phase (10j.6a, 10j.6b, 10j.6c).

Helper convention: one function per RPC, named after the RPC, returning typed data, living in the domain repo that already owns the table family (e.g. `getEmployerPipeline` → `jobsRepo`, `recordDiscoverySignal` → `discoveryRepo`).

## Phase 10j.7 — Storage consolidation

12 `supabase.storage.from(...)` sites → new `src/domains/storage/repo/storageRepo.ts` with helpers like `uploadTalentCv`, `getSignedCvUrl`, `uploadDiscoveryOg`. Centralizing bucket names also reduces the risk of breaking the signed-URL rule for `talent-cvs`.

## Phase 10j.8 — Auth wrapper

58 `supabase.auth.*` calls → `src/domains/auth/repo/authRepo.ts` exposing `getSession`, `getUser`, `signInWithPassword`, `signInWithOtp`, `signUp`, `signOut`, `updateUser`, `resetPasswordForEmail`, `onAuthStateChange`. Keep `AuthProvider` as the only place that subscribes; everything else calls helpers. Largest payoff: removes the most common reason for non-repo files to import the client at all.

## Phase 10j.9 — Lock it in

1. Add an ESLint `no-restricted-imports` rule forbidding `@/integrations/supabase/client` outside `src/domains/**` and `src/integrations/**`.
2. CI-equivalent guard: a tiny script that greps `supabase\.(from|rpc|auth|storage|channel)\(` outside `src/domains` and fails on non-zero.
3. Document the repo-only rule in a short architecture note.

---

## Technical notes

- Keep helpers thin — one RPC / one query per function, no business logic.
- Preserve existing return shapes so call sites only swap the import, not the data handling.
- Use `(supabase as any).rpc(...)` only when the generated types don't include the RPC; add a TODO to regenerate types afterwards.
- Continue verifying each sub-phase with `rg -c 'supabase\.<api>\(' src | grep -v src/domains`.

## Suggested order & rough size

```text
10j.6a  RPC — hooks + gro10x (high churn)     ~15 sites
10j.6b  RPC — app pages                        ~25 sites
10j.6c  RPC — public + admin + dashboard       ~27 sites
10j.7   Storage repo + 12 call sites
10j.8a  Auth repo + AuthProvider migration
10j.8b  Auth — remaining 50+ call sites
10j.9   ESLint guard + grep CI script + doc
```

Say **"continue 10j.6a"** to start the RPC migration with the hooks and gro10x hotspots.
