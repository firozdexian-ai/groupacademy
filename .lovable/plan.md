

# UX Improvements Plan: Mobile Navigation Header + PhoneInput Integration

## Overview

This plan addresses two UX improvements:
1. **Mobile Navigation Header** - Add avatar and quick actions to the mobile header for better navigation
2. **ProfileEdit Phone Input** - Ensure country/country_code fields are properly persisted when saving

---

## Issue 1: Mobile Navigation Header Enhancement

### Current State
The mobile header in `TalentAppShell.tsx` (lines 198-208) currently shows:
- Logo icon (left)
- Notification dropdown (right)

**Problem:** Users must open the hamburger menu to access their profile. The header lacks quick access to the user avatar and key actions.

### Proposed Enhancement
Add the user's avatar to the mobile header with a tap-to-navigate action to their profile, matching the pattern already used in `FeedHeader.tsx`.

### Files to Modify
**`src/layouts/TalentAppShell.tsx`**

### Changes
Update the mobile header section (lines 198-208) to include:
1. User avatar next to the notification icon
2. Tap-to-navigate functionality to profile page

```tsx
{/* Mobile Header */}
<header className="md:hidden sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border/50 shadow-sm h-14 px-4 flex items-center justify-between">
  <NavLink to="/app/feed">
    <img src={logoIcon} alt="GroUp" className="h-8 w-8" />
  </NavLink>

  <div className="flex items-center gap-2">
    <NotificationDropdown />
    <Avatar 
      className="h-9 w-9 cursor-pointer ring-2 ring-border hover:ring-primary/50 transition-all"
      onClick={() => navigate('/app/profile')}
    >
      <AvatarImage src={talent?.profilePhotoUrl || undefined} />
      <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
        {talent?.fullName?.charAt(0)?.toUpperCase() || 'U'}
      </AvatarFallback>
    </Avatar>
  </div>
</header>
```

---

## Issue 2: ProfileEdit Phone Input Persistence

### Current State
Looking at `ProfileEdit.tsx`, I can see:
1. ✅ The `PhoneInput` component is already imported (line 16)
2. ✅ The form already has `countryCode` and `country` in state (lines 31-32)
3. ✅ The `PhoneInput` is already being used (lines 366-375)
4. ⚠️ **The `handleSubmit` function does NOT persist `country` and `countryCode`** (lines 218-233)

### Problem
When the user updates their profile, the `country_code` and `country` fields are NOT being sent to the database in the `updateTalent` call.

### Files to Modify
**`src/pages/app/ProfileEdit.tsx`** - Update `handleSubmit` function
**`src/contexts/TalentContext.tsx`** - Ensure `updateTalent` maps country fields

### Changes

**1. Update `ProfileEdit.tsx` handleSubmit (line 219-233):**

```tsx
await updateTalent({
  fullName: formData.fullName,
  phone: formData.phone,
  countryCode: formData.countryCode,  // ADD THIS
  country: formData.country,           // ADD THIS
  customProfession: formData.customProfession,
  currentStatus: formData.currentStatus,
  institution: formData.institution,
  fieldOfStudy: formData.fieldOfStudy,
  linkedinUrl: formData.linkedinUrl,
  portfolioUrl: formData.portfolioUrl,
  profilePhotoUrl: profilePhotoUrl || undefined,
  cvUrl: cvUrl || undefined,
  skills: skills as any,
  experience: experience as any,
  education: education as any,
});
```

**2. Update `TalentContext.tsx` updateTalent function (add mappings around line 205):**

```tsx
// Add these field mappings
mapField("country", "country");
mapField("countryCode", "country_code");
```

---

## Implementation Summary

| File | Changes |
|------|---------|
| `src/layouts/TalentAppShell.tsx` | Add avatar to mobile header with profile navigation |
| `src/pages/app/ProfileEdit.tsx` | Include `country` and `countryCode` in `updateTalent` call |
| `src/contexts/TalentContext.tsx` | Add `country` and `country_code` field mappings in `updateTalent` |

---

## Technical Details

### Mobile Header Visual Layout

```text
┌──────────────────────────────────────────┐
│ [Logo]               [🔔] [Avatar]       │
└──────────────────────────────────────────┘
```

- Logo: Links to /app/feed
- Bell icon: Notification dropdown (existing)
- Avatar: NEW - Links to /app/profile with user's photo or initials

### Data Persistence Flow

```text
ProfileEdit Form
    ↓ (includes countryCode, country)
updateTalent()
    ↓ (maps to country_code, country)
Supabase talents table
    ↓
TalentContext refreshTalent()
    ↓
UI updated with persisted values
```

---

## Expected Outcomes

1. **Mobile Navigation:** Users can tap their avatar in the header to quickly access their profile without opening the menu
2. **Phone Data Integrity:** Country and country code are properly persisted when editing profile, maintaining geographic segmentation data
3. **Consistency:** Mobile header now matches the pattern used in `FeedHeader.tsx`

