

# Add Country Flag to Sidebar Profile Card

## What Changes

Add the country flag emoji next to the phone number in the sidebar profile card, similar to how bKash displays it -- a small flag icon preceding the phone number.

## Implementation

**File: `src/layouts/TalentAppShell.tsx`**

1. Import `getCountryFlag` from `@/lib/constants/countries`
2. Update line 137 (the phone display) to prepend the country flag:

Before:
```
<p className="text-xs text-muted-foreground truncate">{talent?.phone || ""}</p>
```

After:
```
<p className="text-xs text-muted-foreground truncate">
  {talent?.countryCode && <span className="mr-1">{getCountryFlag(talent.countryCode)}</span>}
  {talent?.phone || ""}
</p>
```

This will show the flag emoji (e.g. "BD" renders as the Bangladeshi flag) right before the phone number, matching the bKash-style layout from the wireframe.

