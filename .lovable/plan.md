# Phase 8 — Webinar Launch Readiness (Friday 10 PM BDT)

Four-track plan to ship before the live session.

## 1. Why the webinar doesn't appear in the talent panel

I checked the database — your webinar **"The AI-Powered Professional"** is in `content` with:
- `is_published = true` ✅
- `is_private = false` ✅
- `is_ready = false` ❌ ← this is why it's hidden
- `event_date = 2026-05-08 22:03 UTC` (which is **May 9, 4:03 AM BDT**, not Friday 10 PM BDT — see issue #2)

The talent-side `CoursesTab` query filters `.eq("is_ready", true)`, so unready content is invisible. Two fixes:

- **Auto-mark live events ready on publish**: Add a DB trigger so `content_type IN ('live_webinar','batch_class','offline_seminar')` rows are automatically `is_ready = true` when `is_published = true` and `event_date` is set. (Live events have nothing to "process" — `is_ready` only makes sense for recorded courses being transcoded.)
- **Backfill** the existing webinar + batch row to `is_ready = true`.
- **Surface a "Live" filter chip** in the Academy tab so the webinar is one tap away (currently buried under "All").

## 2. Timezone correctness (BDT vs UTC)

Right now the admin form uses `<input type="datetime-local">`, which silently records whatever timezone the **admin's browser** is in. Your row stored 22:03 UTC, meaning it was entered as if it were a UTC-local browser — that's why "10 PM Friday" became "4 AM Saturday BDT".

Fix:

- **Admin side (`ContentNew` + `ContentEdit`)**:
  - Add an `Event timezone` selector next to the date input (default `Asia/Dhaka`, persisted per-admin).
  - Show a live preview: *"This event will start: **Fri, May 8 at 10:00 PM (BDT)** · 4:00 PM UTC · 12:00 PM EDT"*.
  - Convert correctly to UTC before insert using `date-fns-tz`.
  - Add an `event_timezone text default 'Asia/Dhaka'` column on `content`.
- **Talent side (everywhere we render `event_date`)**: format with `formatInTimeZone(date, 'Asia/Dhaka', 'EEE, MMM d · h:mm a')` and append `BDT` badge. Also show user's local time in a tooltip (`"Your time: 10:30 PM IST"`) so international talents aren't confused.
- **Backfill**: Update the existing webinar to the correct UTC timestamp for Fri May 8 22:00 BDT (= 16:00 UTC).

## 3. Onboarding → webinar acquisition loop

Goal: *"Sign up → get 250 free credits → join Friday's webinar (100 cr) for free."* Make this story unmissable.

- **WelcomeBonus screen** (post-signup): if any live event is within the next 7 days, render a featured "Your first event is on us" card with countdown, credit math (`250 free − 100 webinar = 150 left`), and one-tap **Reserve seat**.
- **Onboarding completion CTA**: replace generic "Explore" with "Join Friday's live webinar" when an upcoming event exists.
- **Shareable webinar landing** (`/webinar/:slug`): public page with hero, host, agenda, countdown, and **"Sign up & join free"** CTA that:
  1. Captures `?ref=<talent_id>` (already wired in Phase 7) so the inviter earns referral credit if the new user later upgrades.
  2. Routes to `/auth?redirect=/app/learning/courses/<slug>&promo=webinar-friday`.
  3. After signup, auto-enrolls the user (deducting from welcome credits) and shows a confirmation toast.
- **Auto-enroll edge function** `enroll-event`: server-side credit deduction + capacity check + WhatsApp link reveal + reminder email scheduling (24h, 1h before).
- **Reminders**: leverage existing `notify.groupacademy.online` queue — cron job (`event-reminders`) every 15 min, idempotent.

## 4. UI cleanup — retire the "2026 Ultra SaaS" styling

Audit shows ~40 files still use the loud aesthetic (`font-black uppercase tracking-[0.4em] italic`, oversized rotated icon tiles, `rounded-[32px]`). I'll do a focused pass on the highest-traffic talent surfaces this round and queue the rest:

**This phase (must-fix before Friday)**:
- `src/pages/app/AppEvents.tsx` — replace 5xl italic header with the standard compact header from `uiTokens.ts`.
- `src/pages/ContentNew.tsx` + `ContentEdit.tsx` — calmer admin forms, focus on readability.
- `src/components/learning/UnifiedDiscovery.tsx` — remove italics + extreme tracking.
- `src/components/learning/CoursesTab.tsx` & `EventsTab.tsx` — already mostly clean, just normalize chip styling.
- `src/pages/app/Transactions.tsx`, `StudyAbroadRoadmapResults.tsx` — header normalization.

**Queued for Phase 9** (not blocking Friday): MockInterview pages, AssessmentStepper, RoadmapTimeline, AI agent cards. I'll list these in `.lovable/plan.md`.

Standard adopted from `src/lib/uiTokens.ts`:
```text
PAGE_SHELL  → max-w-2xl mx-auto px-3 py-3 pb-28 space-y-4
PAGE_TITLE  → text-xl font-bold (no uppercase, no italic, no tracking)
SECTION     → text-sm font-semibold
CARD        → rounded-2xl border-border/40
```

## Technical Implementation

### Database migration
```sql
ALTER TABLE content ADD COLUMN IF NOT EXISTS event_timezone text DEFAULT 'Asia/Dhaka';

-- Auto-ready for live events
CREATE OR REPLACE FUNCTION public.auto_ready_live_events()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.content_type IN ('live_webinar','batch_class','offline_seminar')
     AND NEW.is_published = true AND NEW.event_date IS NOT NULL THEN
    NEW.is_ready := true;
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_auto_ready_live BEFORE INSERT OR UPDATE ON content
  FOR EACH ROW EXECUTE FUNCTION auto_ready_live_events();

-- Backfill the Friday webinar
UPDATE content
   SET is_ready = true,
       event_date = '2026-05-08 16:00:00+00',  -- Fri May 8, 10 PM BDT
       event_timezone = 'Asia/Dhaka'
 WHERE slug = 'the-ai-powered-professional-10x-your-productivity-with-agentic-ai';
```

### New / edited files
- **New**: `src/pages/public/WebinarLanding.tsx`, `src/components/admin/EventDateTimeField.tsx`, `src/lib/eventTime.ts`, `supabase/functions/enroll-event/index.ts`, `supabase/functions/event-reminders/index.ts`.
- **Edited**: `ContentNew.tsx`, `ContentEdit.tsx`, `CoursesTab.tsx`, `EventsTab.tsx`, `AppEvents.tsx`, `WelcomeBonus.tsx`, `OnboardingWizard.tsx`, `App.tsx` (route), `useOnboarding.ts` (post-onboarding redirect when upcoming event exists), `uiTokens.ts` cleanup pass on listed files, `.lovable/plan.md` (Phase 9 queue).

### Memory updates
- New `mem://product/live-events-timezone-and-publishing` — capture `event_timezone` rule + `is_ready` auto-flag for live events.
- Update Core: "Live events: store UTC, render in `event_timezone` (default Asia/Dhaka), label as BDT."

## Out of scope (next phase)
- Live streaming embed (Zoom/Meet/Whereby) inside the app
- In-event chat & polls
- Post-event recording auto-publish to "My Hub"
- Remaining Ultra SaaS UI cleanup (queued list above)
