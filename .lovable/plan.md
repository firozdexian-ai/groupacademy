## Goal

Add a visible "Install App" button on the Gro10x landing page (`/gro10x`) so visitors can install Gro10x as a PWA on their device.

Note: Gro10x already ships a manifest at `public/gro10x/manifest.webmanifest` with `display: standalone` and icons, so it is installable. Today there is no in-app trigger — users must use the browser menu. This adds a first-class button.

## What we'll build

A small reusable component `Gro10xInstallButton` mounted on `Gro10xLanding.tsx` (just under the existing CTAs).

Behavior:

1. **Already installed** (running in standalone / `display-mode: standalone` or iOS `navigator.standalone`): hide the button entirely — there's nothing to install.
2. **Android / Chrome / Edge / desktop Chromium**: listen for the `beforeinstallprompt` event, prevent the browser's default mini-infobar, and stash the event. When the user taps the button, call `prompt()` on the stashed event and report the outcome via a `sonner` toast.
3. **iOS Safari** (no `beforeinstallprompt` support): show the button anyway, and on tap open a small bottom sheet / dialog explaining "Tap Share → Add to Home Screen" with an icon hint.
4. **Other unsupported browsers** (e.g. desktop Firefox): if no `beforeinstallprompt` fires within ~3s and we're not on iOS, fall back to the same instructional sheet but worded generically ("Use your browser's menu → Install app / Add to Home Screen").

## Files

**New**
- `src/gro10x/components/Gro10xInstallButton.tsx` — self-contained button + install logic + iOS instruction sheet. Uses existing token classes (`#33E1E4`, `#0F172A`, white/10 borders) to match the landing aesthetic.

**Edited**
- `src/gro10x/pages/Gro10xLanding.tsx` — import and render `<Gro10xInstallButton />` directly under the "I already have an account" link, with a thin divider label like "Or install the app".

No changes needed to the manifest, service worker, routes, or any backend.

## Technical notes

- We rely on the existing manifest at `/gro10x/manifest.webmanifest` (already linked from the Gro10x host). No new manifest work.
- iOS detection: `/iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as any).MSStream`.
- Standalone detection mirrors `usePWADetect` (`matchMedia('(display-mode: standalone)')` + `navigator.standalone`). We'll inline this check rather than importing the hook to keep the Gro10x bundle isolated from the talent app, consistent with the rest of `src/gro10x/`.
- The `beforeinstallprompt` event is captured on mount with a `useEffect` and removed on unmount. The button's disabled/visible state is driven by React state.
- No service worker registration is added — Lovable's PWA guidance discourages it, and the existing manifest is sufficient for "Add to Home Screen" installability.

## Out of scope

- No changes to the talent app PWA.
- No new service worker / offline caching.
- No analytics events for install (can be added later if requested).
