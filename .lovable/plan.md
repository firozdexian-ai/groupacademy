

# Fix Click Tracking and Notification Query Issues

## Problems Found

### 1. Clicks not counted on published site
The click tracking code is working correctly (confirmed by testing in the preview). The issue is that the **published version** of the app may not have the latest code deployed. When you opened the link on `groupacademy.lovable.app`, it was running an older version that didn't include the `trackRefClick()` function. You need to **publish the latest version** for the tracking to work on the live site.

### 2. Notification badge query uses wrong column name
In `src/layouts/TalentAppShell.tsx` line 64, the unread notification count query uses `.eq("user_id", talent.id)` but the `notifications` table has a `talent_id` column, not `user_id`. This causes a 400 error on every page load, meaning the notification badge never shows unread counts.

## Changes

### Fix 1: `src/layouts/TalentAppShell.tsx`
Change `.eq("user_id", talent.id)` to `.eq("talent_id", talent.id)` in the unread notification count query. This fixes the notification badge so seekers can see when they have new notifications (including the auto-approval reward notifications).

### Fix 2: Publish reminder
After the code fix, the latest version needs to be published so the click tracking and notifications work on the live `groupacademy.lovable.app` domain.

## Files Changed

| File | Change |
|------|--------|
| `src/layouts/TalentAppShell.tsx` | Fix `user_id` to `talent_id` in notification count query |

