# Domains

Business-domain modules. Each domain owns its UI components, hooks, typed
edge-function client (`api/manifest.ts`), and types.

Layout:

```
domains/<name>/
  index.ts              # Public surface — shells import only from here
  registry.ts           # Optional declarative catalog (see agents/)
  api/manifest.ts       # Typed wrappers around supabase.functions.invoke
  components/<shell>/   # Shell-scoped UI (talent/, admin/, gro10x/)
  hooks/                # Domain hooks
  lib/                  # Pure domain helpers
  types.ts              # Domain types
```

Domains may import from `@/platform/*` and sibling `@/domains/*` (sparingly).
They must never import from `@/shells/*`.
