# Carry-over P1/P2 Sweep — shipped 2026-05-24

Quick wins before resuming Track C/D.

## Shipped
1. **Admin talents.country_code backfill** — UPDATE on `talents` set the 1 legacy row with `country_code = 'BD'` to `'+880'`. All 2,757 rows now use canonical `+`-prefix dial codes.
2. **`BatchTalentUpload.tsx:172`** — default `country_code: "BD"` → `"+880"` (was inserting bad data on every Shomvob batch import).
3. **`AuthClassic.tsx:408`** — "Try the chat experience instead" → "Prefer to chat? Sign in with our assistant" (clearer that it's a sign-in alternative, not a separate product).

## Verified
- DB read: 0 rows with non-`+`-prefixed `country_code`.
- TS clean.

## Not actionable from code (verify on production)
- **PWA `/manifest.json` 401 in preview** — Lovable preview iframe gates static assets; check 200 on `https://groupacademy.online` and `https://groupacademy.lovable.app` post-deploy.
- **`auth.audit_log_entries` retention** — confirm in Cloud dashboard.

## Already shipped in earlier batches
- Friendly "email not confirmed" copy (A1-FIX #6)
- AuthChat honors `?tab=signup` (A1-FIX #5)
- `useAuth.signOut` unified destination (A1 re-audit)
- `safeReturnTo` validation (A1 re-audit)

Ready for **Track C (admin shell)** or **Track D (Gro10x employer)**.
