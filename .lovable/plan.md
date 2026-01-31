

# Sign In & Sign Up Flow Improvements Plan

## Current State Analysis

### Sign In (Login)
- **Currently**: Email + Password only
- **User's Question**: Should we support phone number + password as an alternative?

### Sign Up
- **Currently**: Collects Full Name, Email, Phone (with country code), and Password
- **Duplicate Prevention**: 
  - Email: **Protected** - Unique index exists on `lower(email)`
  - Phone: **NOT Protected** - No unique constraint, found 3 duplicate phone numbers already

### Existing Duplicate Phones Found:
| Phone | Accounts |
|-------|----------|
| +8801708459008 | 2 different emails |
| +8801779579170 | 2 different emails |
| 01867136282 | 2 different emails |

---

## Proposed Improvements

### 1. Allow Login with Phone OR Email

**Current Flow**:
```
Email → Password → Sign In
```

**Proposed Flow**:
```
Email or Phone → Password → Sign In
```

**How it works**:
1. User enters either email OR phone number in a single input field
2. System auto-detects if input is email (contains @) or phone (numeric/starts with +)
3. If phone number entered, lookup talent by phone to find associated email
4. Authenticate using the found email + password

**Technical Implementation**:
- Add phone lookup helper function in `useAuth.ts`
- Modify login form to accept "Email or Phone" input
- Query talents table to resolve phone → email before auth

---

### 2. Prevent Duplicate Phone Numbers on Signup

**Current State**: Phone numbers can be duplicated (3 cases already exist)

**Proposed Solution**:

**Option A: Database Constraint (Recommended)**
- Add unique index on normalized phone column
- Normalize phone format: store as `country_code + digits_only`
- Clean existing duplicates first (merge or flag)

**Option B: Application-Level Check**
- Before signup, query if phone exists
- Show friendly error: "This phone number is already registered"

**Recommended**: Implement both - app-level for good UX, database for safety

---

## Implementation Plan

### Phase 1: Prevent Duplicate Phones on Signup

**Step 1.1: Normalize Phone Storage**
- Create function to normalize phone: `+880` + `1712345678` → `+8801712345678`
- Update signup flow to store normalized phone

**Step 1.2: Add Pre-Signup Phone Check**
- In `Auth.tsx`, before calling `signUp()`:
  ```
  Check if normalized phone exists in talents table
  If exists → Show "Phone already registered. Did you mean to sign in?"
  ```

**Step 1.3: Add Database Constraint (After Data Cleanup)**
- Create unique index on normalized phone
- Handle the 3 existing duplicates (merge accounts or contact users)

### Phase 2: Phone-Based Login

**Step 2.1: Update Login Form**
- Change label from "Email" to "Email or Phone"
- Accept both formats in the input field

**Step 2.2: Add Phone Resolution Logic**
- Detect if input is phone (no @ symbol, starts with + or digits)
- If phone: Query `talents` table to find matching `phone` → get `email`
- Use resolved email for `signInWithPassword()`

**Step 2.3: Handle Edge Cases**
- Phone not found → "No account found with this phone number"
- Multiple accounts with same phone (legacy) → "Please use your email to login"

---

## Detailed Technical Changes

### File: `src/pages/Auth.tsx`

**Login Form Changes**:
```typescript
// Before
const [loginData, setLoginData] = useState({ email: "", password: "" });

// After  
const [loginData, setLoginData] = useState({ identifier: "", password: "" });
// identifier can be email or phone
```

**Input Field Change**:
```typescript
// Before
<Label htmlFor="login-email">Email</Label>
<Input type="email" placeholder="you@example.com" ... />

// After
<Label htmlFor="login-identifier">Email or Phone</Label>
<Input type="text" placeholder="Email or phone number" ... />
```

**Signup Duplicate Check**:
```typescript
// Add before signUp() call
const fullPhone = `${signupData.countryCode}${signupData.phone}`;
const { data: existingTalent } = await supabase
  .from('talents')
  .select('id')
  .or(`phone.eq.${fullPhone},phone.eq.${signupData.phone}`)
  .limit(1);

if (existingTalent?.length) {
  toast.error("This phone number is already registered. Please sign in instead.");
  setActiveTab("login");
  return;
}
```

### File: `src/hooks/useAuth.ts`

**Add Phone Resolution Helper**:
```typescript
const resolveEmailFromPhone = async (phone: string): Promise<string | null> => {
  // Normalize phone - try with and without country code
  const { data } = await supabase
    .from('talents')
    .select('email, phone')
    .or(`phone.ilike.%${phone}`)
    .not('email', 'is', null)
    .limit(1);
  
  return data?.[0]?.email || null;
};
```

**Update signIn Function**:
```typescript
const signIn = async (identifier: string, password: string) => {
  let email = identifier.trim();
  
  // Check if identifier is phone (no @ symbol)
  if (!identifier.includes('@')) {
    const resolvedEmail = await resolveEmailFromPhone(identifier);
    if (!resolvedEmail) {
      throw new Error("No account found with this phone number.");
    }
    email = resolvedEmail;
  }
  
  // Continue with email-based auth
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  // ... rest of function
};
```

### File: `src/lib/validations.ts`

**Add New Schema**:
```typescript
export const loginSchema = z.object({
  identifier: z.string().trim().min(1, "Email or phone is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});
```

### Database Migration

**Phone Normalization Function**:
```sql
CREATE OR REPLACE FUNCTION normalize_phone(
  p_country_code text,
  p_phone text
) RETURNS text AS $$
BEGIN
  -- Remove all non-digit characters except leading +
  RETURN CASE 
    WHEN p_phone IS NULL OR p_phone = '' THEN NULL
    WHEN p_phone LIKE '+%' THEN regexp_replace(p_phone, '[^0-9+]', '', 'g')
    ELSE p_country_code || regexp_replace(p_phone, '[^0-9]', '', 'g')
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
```

**Future: Unique Constraint (After Data Cleanup)**:
```sql
-- Only add after resolving the 3 existing duplicates
CREATE UNIQUE INDEX IF NOT EXISTS talents_phone_unique 
ON talents (normalize_phone(country_code, phone)) 
WHERE phone IS NOT NULL AND phone != '';
```

---

## Migration Strategy for Existing Duplicates

Before adding unique constraint, need to handle 3 duplicate phone cases:

| Phone | User 1 | User 2 | Resolution |
|-------|--------|--------|------------|
| +8801708459008 | firozuddinahmed89@gmail.com | gro10xnow@gmail.com | Admin user - keep both |
| +8801779579170 | ryanhossain9797@gmail.com | ryanhossain9797@protonmail.com | Same person - contact to merge |
| 01867136282 | Syeeda.ikta@gmail.com | syeeda.akter@dexian.com | Same person - contact to merge |

**Recommended**: Keep application-level check first, add database constraint after manual data cleanup.

---

## User Experience Flow

### New Login Flow:
1. User opens login tab
2. Sees "Email or Phone" input field
3. Types phone number (e.g., `+8801712345678` or `01712345678`)
4. Types password
5. System resolves phone → email behind the scenes
6. Authenticates and logs in
7. If phone not found: "No account found with this phone number"

### New Signup Flow:
1. User fills Full Name, Email, Phone, Password
2. Clicks "Create Account"
3. **NEW**: System checks if phone already exists
4. If duplicate phone: "This phone is already registered. Please sign in instead."
5. If unique: Proceeds with account creation

---

## Summary of Changes

| Change | Risk | Priority |
|--------|------|----------|
| Phone duplicate check on signup | Low | High |
| Login with email OR phone | Medium | Medium |
| Phone normalization function | Low | High |
| Database unique constraint | Medium | Low (after cleanup) |
| Update validation schemas | Low | High |

