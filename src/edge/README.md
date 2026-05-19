# Edge

Typed contracts mirroring `supabase/functions/`. Each domain re-exports its
slice of these contracts through `domains/<name>/api/manifest.ts`. UI code
never imports from here directly — always go through the domain client.

```
edge/
  contracts/            # Request/response types per function
```
