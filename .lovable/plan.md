

# WhatsApp Connect Button with Credit Incentive

## Overview

Transform the redundant `FloatingAIButton` into a **WhatsApp Connect Button** that incentivizes job seekers to connect with GroUp Academy on WhatsApp. Users receive **10 bonus credits** for their first WhatsApp contact, creating a valuable lead generation channel while resolving the UI duplication issue.

---

## Current State Analysis

### Redundancy Issue Confirmed
- **FloatingAIButton** (`src/components/feed/FloatingAIButton.tsx`): Floating button at `bottom-24` navigates to `/app/agents`
- **Bottom Navigation** (`src/layouts/TalentAppShell.tsx`): "AI" tab in mobile nav also goes to `/app/agents`
- **Result**: Two buttons doing the same thing, wasting valuable screen real estate

### Current Usage
- FloatingAIButton is only used in `Feed.tsx` (line 376)
- Shows tooltip "Need career advice? Chat with our AI assistants"
- Conditional display based on whether user has used services

---

## Proposed Solution

### New Component: `FloatingWhatsAppButton`

Replace the AI floating button with a WhatsApp connect button that:
1. Opens WhatsApp with a pre-filled introductory message
2. Grants 10 bonus credits on first tap (one-time reward)
3. Disappears after the bonus is claimed (resolving redundancy)
4. Uses existing `SUPPORT_CONFIG` for consistency

---

## Technical Implementation

### 1. Database Schema Change

Add tracking column to `talents` table:

```sql
ALTER TABLE public.talents 
ADD COLUMN whatsapp_bonus_claimed_at TIMESTAMP WITH TIME ZONE;
```

**Purpose**: Track when user claimed the WhatsApp bonus to prevent duplicate claims

### 2. New Component: `FloatingWhatsAppButton.tsx`

**Location**: `src/components/feed/FloatingWhatsAppButton.tsx`

**Features**:
- WhatsApp icon (green theme) instead of Bot icon
- Tooltip: "Connect on WhatsApp - Get 10 free credits!"
- On click:
  1. Add 10 credits via `useCredits().addCredits()`
  2. Update `whatsapp_bonus_claimed_at` timestamp
  3. Open WhatsApp link with pre-filled message
  4. Show success toast
- After claim: Button no longer renders

**Pre-filled Message**:
```
Hi! I'm [User's Name] from GroUp Academy app. I'd like to connect for career support! 🎯
```

### 3. Update Support Constants

**File**: `src/lib/constants/support.ts`

Add new message generator:
```typescript
export function getWhatsAppConnectMessage(userName: string): string {
  return `Hi! I'm ${userName} from GroUp Academy app. I'd like to connect for career support! 🎯`;
}
```

### 4. Update Credit Pricing Config

**File**: `src/lib/creditPricing.ts`

Add constant for WhatsApp bonus:
```typescript
WHATSAPP_CONNECT_BONUS: 10,
```

### 5. Update Feed.tsx

**File**: `src/pages/app/Feed.tsx`

- Replace `FloatingAIButton` import with `FloatingWhatsAppButton`
- Update conditional logic:
  - Show button only if `!talent?.whatsappBonusClaimedAt`
  - Hide button once bonus is claimed

### 6. Update useTalent Hook

**File**: `src/hooks/useTalent.ts`

Add `whatsappBonusClaimedAt` to the TalentProfile interface and query

### 7. Update Common Types

**File**: `src/types/common.ts`

Add to TalentProfile interface:
```typescript
whatsappBonusClaimedAt: string | null;
```

---

## User Flow

```text
1. User opens Feed page
   ↓
2. FloatingWhatsAppButton appears (green, bottom-right)
   with tooltip "Connect on WhatsApp - Get 10 free credits!"
   ↓
3. User taps button
   ↓
4. System adds 10 credits + records timestamp
   ↓
5. WhatsApp opens with pre-filled message
   ↓
6. Toast: "🎉 You earned 10 bonus credits!"
   ↓
7. Button no longer appears (bonus claimed)
```

---

## UI Design Changes

### Button Styling
- **Icon**: WhatsApp icon from lucide-react (or custom SVG for brand accuracy)
- **Color**: WhatsApp green (`#25D366`) instead of primary color
- **Size**: Same as current floating button (h-14 w-14)
- **Position**: Same position (bottom-24 right-4 on mobile, bottom-6 on desktop)

### Tooltip Content
- **Header**: "Connect on WhatsApp"
- **Subtext**: "Get 10 free credits! 🎁"
- **Dismiss X**: Keep the dismiss functionality

---

## Files to Create/Modify

| Action | File | Description |
|--------|------|-------------|
| Create | `src/components/feed/FloatingWhatsAppButton.tsx` | New WhatsApp button component |
| Modify | `src/lib/constants/support.ts` | Add `getWhatsAppConnectMessage()` |
| Modify | `src/lib/creditPricing.ts` | Add `WHATSAPP_CONNECT_BONUS` constant |
| Modify | `src/pages/app/Feed.tsx` | Replace FloatingAIButton with FloatingWhatsAppButton |
| Modify | `src/hooks/useTalent.ts` | Add whatsappBonusClaimedAt field |
| Modify | `src/types/common.ts` | Update TalentProfile interface |
| Delete | `src/components/feed/FloatingAIButton.tsx` | Remove unused component |
| DB | Migration | Add `whatsapp_bonus_claimed_at` column |

---

## Security Considerations

1. **One-Time Claim**: Database timestamp prevents multiple claims
2. **Server-Side Validation**: Could add RPC function for atomic operation (optional)
3. **Rate Limiting**: Not needed since it's a one-time action

---

## Analytics Value

After implementation, you can query:
```sql
-- Users who connected via WhatsApp
SELECT COUNT(*) FROM talents WHERE whatsapp_bonus_claimed_at IS NOT NULL;

-- Conversion rate
SELECT 
  COUNT(*) FILTER (WHERE whatsapp_bonus_claimed_at IS NOT NULL) * 100.0 / COUNT(*) 
FROM talents WHERE onboarding_completed_at IS NOT NULL;
```

---

## Implementation Order

1. Run database migration (add column)
2. Update `support.ts` with new message function
3. Update `creditPricing.ts` with bonus constant
4. Update `useTalent.ts` and types
5. Create `FloatingWhatsAppButton.tsx` component
6. Update `Feed.tsx` to use new component
7. Delete old `FloatingAIButton.tsx`
8. Test end-to-end flow

---

## Expected Outcomes

- **Lead Generation**: Direct WhatsApp contacts with pre-qualified users
- **User Engagement**: 10-credit incentive encourages action
- **UI Cleanup**: Resolves floating button redundancy
- **Trackable Metrics**: Database column enables conversion analysis

