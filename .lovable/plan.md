

# Comprehensive Fix Plan: Sign-In/Sign-Up & Feed Improvements

## Issues Identified & Fixes

---

## Part A: Authentication Fixes (Sign-In / Sign-Up)

### Issue 1: Phone Lookup Query is Too Loose (Security Risk)
**File:** `src/hooks/useAuth.ts` (lines 82-88)

**Current Problem:**
```typescript
.or(`phone.ilike.%${cleanPhone},phone.eq.${cleanPhone}`)
```
This uses `ILIKE %phone` which matches partial phone numbers (e.g., entering `1234` would match `+8801234567890`). This is a security vulnerability.

**Fix:** Tighten the phone lookup to use exact matching with multiple formats:
```typescript
// Try exact match with different formats
const { data, error } = await supabase
  .from('talents')
  .select('email, phone, country_code')
  .or(`phone.eq.${cleanPhone},phone.eq.+${cleanPhone.replace(/^\+/, '')}`)
  .not('email', 'is', null)
  .limit(5);
```

Also add secondary check: if the phone entered includes a country code, strip it and try matching the local portion too.

---

### Issue 2: Missing Database Trigger for Phone Normalization
**Current Problem:** The `normalize_phone` function exists but there's no trigger on the `talents` table to automatically normalize phone numbers on insert/update.

**Fix:** Create a database migration to add a trigger that normalizes phones on insert/update:
```sql
CREATE OR REPLACE FUNCTION normalize_talent_phone()
RETURNS trigger AS $$
BEGIN
  NEW.phone := normalize_phone(NEW.country_code, NEW.phone);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_normalize_talent_phone
BEFORE INSERT OR UPDATE OF phone, country_code ON talents
FOR EACH ROW EXECUTE FUNCTION normalize_talent_phone();
```

---

### Issue 3: No Form-Level Validation Using Zod Schemas
**File:** `src/pages/Auth.tsx`

**Current Problem:** The `loginSchema` in `validations.ts` is defined but not used in the login form. Form validation is done manually.

**Fix:** Keep manual validation for simplicity (Zod integration would require react-hook-form refactoring), but add clear user-friendly error messages for edge cases.

---

## Part B: Feed Transformation Fixes

### Issue 4: FeedPostsManager Not Accessible from Admin Dashboard (Critical)
**Files:** `src/components/dashboard/AdminSidebar.tsx`, `src/pages/Dashboard.tsx`

**Current Problem:** The `FeedPostsManager` component was created but:
1. Not added to the admin sidebar navigation
2. Not added to the Dashboard switch/case for rendering
3. Not added to `tabAccessMap` for role-based access

**Fix:** Add "Feed Posts" to the Content Management group in AdminSidebar and wire it up in Dashboard.tsx.

**AdminSidebar.tsx changes:**
- Add to Content Management group: `{ title: "Feed Posts", icon: MessageSquare, value: "feed-posts" }`

**Dashboard.tsx changes:**
- Add import: `import { FeedPostsManager } from "@/components/dashboard/FeedPostsManager";`
- Add to `tabAccessMap`: `"feed-posts": ["admin"]`
- Add to `renderContent` switch: `case "feed-posts": return <FeedPostsManager />;`
- Add to `getPageTitle`: `"feed-posts": "Feed Posts"`

---

### Issue 5: Empty Feed (No Seed Data)
**Current Problem:** The `feed_posts` table is empty, so users see an empty feed.

**Fix:** After the admin nav fix is deployed, use the FeedPostsManager to create initial content. Alternatively, I can seed 3-5 sample posts via SQL insert.

**Sample seed data:**
```sql
INSERT INTO feed_posts (author_name, author_title, content_type, text_content, tags, is_active, is_pinned)
VALUES 
  ('GRO10X Team', 'Career Experts', 'tip', 'Resume tip: Always quantify your achievements. Instead of "Managed a team", write "Led a team of 8 engineers, delivering 3 projects ahead of schedule."', '{"CareerTips", "Resume", "FreshGraduates"}', true, true),
  ('GRO10X Team', 'Career Experts', 'announcement', 'Welcome to our new social feed! Share your career journey, get insights, and connect with opportunities.', '{"Announcement", "Welcome"}', true, false),
  ('GRO10X Team', 'Career Experts', 'poll', 'What skill would you like to learn next?', '{"Poll", "Learning"}', true, false);

-- Add poll options for the poll post (need to update with actual UUID after insert)
```

---

### Issue 6: Missing UPDATE Policy for post_reactions
**Current Problem:** The RLS policies for `post_reactions` allow INSERT and DELETE but not UPDATE. Users changing their reaction type (e.g., from "like" to "insightful") would fail.

**Current RLS:**
- `Users can manage own reactions` (INSERT)
- `Users can delete own reactions` (DELETE)
- Missing: UPDATE policy

**Fix:** The current implementation in `usePostReactions.ts` already handles this by deleting the old reaction and inserting a new one (lines 93-98). This pattern works correctly. No database change needed.

---

### Issue 7: poll_votes RLS Exposes Individual Votes
**Current Problem:** `poll_votes` has `Anyone can view poll votes` with `qual: true`, meaning anyone can see who voted for what option.

**Analysis:** This is actually acceptable for this use case since:
1. The hook only fetches aggregated counts client-side
2. Knowing who voted for what isn't sensitive information in a career platform context
3. Changing this to aggregate-only would require a database function

**Recommendation:** Leave as-is for now. If privacy becomes a concern, create an RPC function that returns only aggregated counts.

---

## Summary of Required Changes

| Priority | Issue | File(s) | Change Type |
|----------|-------|---------|-------------|
| **Critical** | FeedPostsManager not in admin nav | AdminSidebar.tsx, Dashboard.tsx | Code edit |
| **High** | Phone lookup too loose | useAuth.ts | Code edit |
| **High** | Add phone normalization trigger | Database migration | SQL migration |
| **High** | Seed feed posts | Database | SQL insert |
| **Medium** | loginSchema not enforced | Auth.tsx | Optional enhancement |

---

## Implementation Steps

### Step 1: Fix Admin Dashboard Navigation
1. Edit `AdminSidebar.tsx` to add Feed Posts menu item
2. Edit `Dashboard.tsx` to add import, tabAccessMap entry, and switch case

### Step 2: Improve Phone Login Security
1. Update `resolveEmailFromPhone` in `useAuth.ts` with stricter matching

### Step 3: Add Phone Normalization Trigger (Database)
1. Create migration for trigger on talents table

### Step 4: Seed Initial Feed Content
1. Insert 3-5 starter posts so feed isn't empty

---

## Technical Details

### AdminSidebar.tsx Edit (Content Management group, around line 96):
```typescript
// Add after "Blog Posts" item:
{ title: "Feed Posts", icon: MessageSquare, value: "feed-posts" },
```

### Dashboard.tsx Edits:
```typescript
// Add import (around line 32):
import { FeedPostsManager } from "@/components/dashboard/FeedPostsManager";

// Add to tabAccessMap (around line 87):
"feed-posts": ["admin"],

// Add to renderContent switch (around line 271):
case "feed-posts":
  return <FeedPostsManager />;

// Add to getPageTitle (around line 315):
"feed-posts": "Feed Posts",
```

### useAuth.ts Edit (lines 79-100):
Replace the `resolveEmailFromPhone` function with improved matching logic that:
1. Removes all non-digit characters
2. Tries exact match with and without country code
3. Handles edge cases like leading zeros

### Database Migration:
```sql
-- Add phone normalization trigger
CREATE OR REPLACE FUNCTION normalize_talent_phone()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF NEW.phone IS NOT NULL AND NEW.phone != '' THEN
    NEW.phone := normalize_phone(NEW.country_code, NEW.phone);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER tr_normalize_talent_phone
BEFORE INSERT OR UPDATE ON talents
FOR EACH ROW
WHEN (NEW.phone IS DISTINCT FROM OLD.phone OR NEW.country_code IS DISTINCT FROM OLD.country_code OR OLD.phone IS NULL)
EXECUTE FUNCTION normalize_talent_phone();
```

