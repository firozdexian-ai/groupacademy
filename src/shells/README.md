# Shells

One folder per top-level bundle boundary:

- `talent/` — authenticated talent app (`/app/*`)
- `admin/` — internal admin / dashboard (`/dashboard/*`)
- `gro10x/` — B2B / employer app (`/gro10x/*`)
- `public/` — unauthenticated marketing / discovery surfaces

**Rule:** Shells may import from `@/domains/*` and `@/platform/*` only.
Shells must never import from another shell. This is what guarantees the
talent bundle doesn't pull in admin code (and vice versa).
