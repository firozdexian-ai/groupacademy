# Platform

Cross-domain primitives shared by every shell and domain:

- `ui/` — leaf UI primitives (shadcn re-exports, design tokens)
- `auth/` — auth context, hooks, guards
- `design-system/` — theme tokens, motion presets

Platform code must have **no domain or shell imports**. It's the bottom of
the dependency graph.
