

# Add Course/Content Revenue Tracking to IR Dashboard

## The Gap

Currently, course enrollment credits (e.g., 50 credits for a paid course) are:
- Counted in the total MRR calculation
- NOT shown in the service-wise breakdown
- NOT configurable in the service mix targets

## Proposed Solution

Add a separate "Content Revenue" category alongside "Service Revenue" to track both revenue streams.

### Option A: Add to Service Mix (Recommended)

Add `COURSE_ENROLLMENT` as a trackable service type in the IR config:

```typescript
// irConfig.ts - Add to SERVICE_COSTS
SERVICE_COSTS: {
  // ... existing services
  COURSE_ENROLLMENT: 0,  // Variable cost (depends on course price)
}

// Add to SERVICE_LABELS
SERVICE_LABELS: {
  // ... existing services  
  COURSE_ENROLLMENT: 'Course Purchases',
}

// Add to DEFAULT_SERVICE_MIX (optional - can be 0 if not targeting)
DEFAULT_SERVICE_MIX: {
  // ... existing mix
  COURSE_ENROLLMENT: 0,  // User can set target percentage
}
```

### Dashboard Enhancements

**1. Service Breakdown Update**
- Show COURSE_ENROLLMENT in the breakdown with actual usage
- If not in target mix, show as "Other Revenue" section

**2. Add Revenue Split Card**
Show a summary of revenue sources:
```
┌─────────────────────────────────────────────────┐
│  Revenue by Category                            │
│                                                 │
│  AI Services    $42  ████████████████████ 93%  │
│  Course Sales   $3   ██                   7%   │
│                                                 │
│  Total MRR: $45                                │
└─────────────────────────────────────────────────┘
```

**3. Handle Dynamic Pricing**
Unlike services with fixed credit costs, courses have variable prices. The system will:
- Track actual credits consumed (already working)
- Show usage count (number of course enrollments)
- Not calculate "usage target" since pricing varies

### Implementation

**Files to Modify:**

| File | Changes |
|------|---------|
| `src/lib/irConfig.ts` | Add COURSE_ENROLLMENT to SERVICE_COSTS, LABELS, and optionally DEFAULT_SERVICE_MIX |
| `src/components/dashboard/ir/IRDashboard.tsx` | Show all service types including COURSE_ENROLLMENT in breakdown |
| `src/components/dashboard/ir/MRRTargetManager.tsx` | Add COURSE_ENROLLMENT to configurable mix (optional target) |

**Code Changes:**

```typescript
// irConfig.ts additions
SERVICE_COSTS: {
  // ... existing
  COURSE_ENROLLMENT: 0, // Variable - shows actual usage
}

SERVICE_LABELS: {
  // ... existing
  COURSE_ENROLLMENT: 'Course Purchases',
}

DEFAULT_SERVICE_MIX: {
  // ... existing
  COURSE_ENROLLMENT: 0, // Can be set if targeting content sales
}
```

```typescript
// IRDashboard.tsx - Show "Other" services not in mix
const allServiceUsage = creditUsage?.byService || {};
const unmappedServices = Object.entries(allServiceUsage)
  .filter(([key]) => !IR_CONFIG.SERVICE_LABELS[key])
  .map(([key, value]) => ({ service: key, credits: value }));

// Display COURSE_ENROLLMENT and any other unmapped types
```

### Benefits

1. **Complete Revenue Picture** - All credit usage visible, not just predefined services
2. **Flexible Targeting** - Can set 0% target for courses or include them in planning
3. **Clear Breakdown** - See exactly where revenue comes from
4. **Future-Proof** - Any new service types automatically appear in "Other"

### Summary

This enhancement ensures:
- Course enrollment credits appear in the service breakdown
- Admins can optionally set targets for content sales
- Total MRR includes ALL revenue sources with clear visibility
- Dashboard shows both service revenue and content revenue separately

