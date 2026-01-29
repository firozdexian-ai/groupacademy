

# Monetization Expansion Plan for Services Hub

## Current Monetization Status

### Already Credit-Gated Services
| Service | Credits | Status |
|---------|---------|--------|
| Career Scorecard | 50 | ✅ Active |
| Mock Interview | 50 | ✅ Active |
| Salary Analysis | 50 | ✅ Active |
| Portfolio Creation | 500 | ✅ Active |
| Job Application | 25 | ✅ Active |
| AI Agent Chat Session | 10 | ✅ Active |
| AI Feed Refresh | 20 | ✅ Active (SUGGESTED_JOBS) |

### Defined but NOT Implemented
| Service | Credits | Status |
|---------|---------|--------|
| IELTS Mock Test | 100 | ❌ Not wired up |

### No Monetization (Free Features)
| Feature | Current State |
|---------|---------------|
| IELTS Resources | Premium badge shown but no credit gate |
| Study Abroad Programs | Free to browse |
| AI Speaking Practice CTA | Links to agents (already gated) |

---

## Monetization Opportunities

### 1. IELTS Mock Test Credit Gate (High Priority)

**Current State**: IELTS resources show "Premium" badge but clicking "Unlock" does nothing.

**Implementation**:
- Wire up the `IELTS_MOCK` service type (100 credits) defined in `creditPricing.ts`
- Add credit gate modal when user clicks "Unlock" on premium IELTS resources
- After payment, grant access to the resource content

**Files to Modify**:
- `src/pages/app/IELTSPrep.tsx` - Add CreditGateModal integration

```text
User Flow:
┌────────────────┐     ┌─────────────────┐     ┌──────────────────┐
│ Click "Unlock" │ ──► │ Credit Gate     │ ──► │ Access Content   │
│ on Premium     │     │ Modal (100 cr)  │     │ (Open resource)  │
└────────────────┘     └─────────────────┘     └──────────────────┘
```

---

### 2. Study Abroad Application Assistance (Medium Priority)

**Current State**: Programs link to external university websites. No value capture.

**New Service**: "Application Prep Package" - 150 credits
- AI-powered SOP (Statement of Purpose) generation
- Document checklist personalized to program
- Visa guidance document
- Scholarship essay tips

**Files to Create/Modify**:
- `src/lib/creditPricing.ts` - Add `STUDY_ABROAD_ASSIST` service
- `src/pages/app/StudyAbroadDetail.tsx` - Add "Get Application Help" CTA
- Create edge function `generate-study-abroad-sop`

---

### 3. Premium Feed Features (Low-Medium Priority)

**Current State**: Feed refresh charges 20 credits after first load.

**Enhancement Options**:
- "Priority Matching" - 30 credits: Get jobs you match 80%+ first
- "Hidden Jobs" - 50 credits: Access unlisted/confidential job postings
- "Salary Preview" - 15 credits: See salary range before applying

---

### 4. IELTS Band Score Prediction (Medium Priority)

**Current State**: AI Speaking Practice CTA exists but links to generic agents page.

**New Service**: "IELTS Band Predictor" - 75 credits
- User submits writing sample or records speaking
- AI analyzes and predicts band score (1-9)
- Provides detailed feedback on improvement areas

**Files to Create**:
- Add to `creditPricing.ts`
- Create `src/pages/app/IELTSBandPredictor.tsx`
- Create edge function `predict-ielts-band`

---

### 5. Study Abroad Counselor Session (High Priority)

**Current State**: "Chat with Counselor" links to generic Career Consultant.

**New AI Agent**: "Study Abroad Advisor" - 10 credits/session
- Specialized prompts for:
  - University selection based on profile
  - Visa process guidance
  - Scholarship hunting
  - Country comparison

**Files to Modify**:
- `src/lib/constants/agents.ts` - Add new agent definition
- Database: Insert into `ai_agents` table

---

### 6. CV Tailor for Abroad Jobs (New Service)

**New Service**: "International CV Formatter" - 40 credits
- Converts CV to country-specific format (US, UK, EU standards)
- Adds region-specific keywords
- Generates cover letter template for international applications

---

## Implementation Priority

### Phase 1: Quick Wins (1-2 days)
1. **IELTS Premium Resource Gate** - Wire up existing IELTS_MOCK pricing
2. **Study Abroad Advisor Agent** - Add to agents list

### Phase 2: New Revenue Streams (3-5 days)
3. **Study Abroad Application Package** - SOP generation + docs
4. **IELTS Band Predictor** - AI-powered score prediction

### Phase 3: Enhancement (5-7 days)
5. **Premium Feed Features** - Priority matching, hidden jobs
6. **International CV Formatter** - Region-specific CV conversion

---

## Credit Pricing Summary

| New Service | Proposed Credits | Revenue Potential |
|-------------|------------------|-------------------|
| IELTS Premium Unlock | 100 | High (existing users) |
| Study Abroad Package | 150 | Medium-High |
| IELTS Band Predictor | 75 | Medium |
| Study Abroad Advisor | 10/session | Medium |
| International CV Format | 40 | Low-Medium |
| Priority Job Matching | 30 | Medium |

---

## Technical Implementation Details

### IELTS Premium Gate (Phase 1)

```typescript
// In IELTSPrep.tsx - Add state
const [selectedResource, setSelectedResource] = useState(null);
const [showCreditGate, setShowCreditGate] = useState(false);

// On Unlock click
const handleUnlock = (resource) => {
  if (resource.is_free) {
    window.open(resource.content_url, '_blank');
  } else {
    setSelectedResource(resource);
    setShowCreditGate(true);
  }
};

// On confirm
const handleConfirmPurchase = async () => {
  const success = await deductCredits("IELTS_MOCK", selectedResource.id);
  if (success) {
    // Track access in database
    await supabase.from('ielts_resource_access').insert({
      talent_id: talent.id,
      resource_id: selectedResource.id
    });
    window.open(selectedResource.content_url, '_blank');
  }
};
```

### Study Abroad Advisor Agent (Phase 1)

```typescript
// In src/lib/constants/agents.ts - Add new agent
{
  id: "study-abroad-advisor",
  name: "Study Abroad Advisor",
  shortName: "Abroad",
  description: "Plan your international education",
  icon: GraduationCap,
  bgColor: "bg-cyan-500/10",
  iconColor: "text-cyan-600",
  expertise: ["University Selection", "Visa Guidance", "Scholarships"],
  context: "You are an expert Study Abroad Advisor. Help users choose universities, navigate visa processes, and find scholarships."
}
```

---

## Database Changes Required

### New Table: `ielts_resource_access`
```sql
CREATE TABLE ielts_resource_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  talent_id UUID REFERENCES talents(id),
  resource_id UUID REFERENCES ielts_resources(id),
  purchased_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(talent_id, resource_id)
);

-- RLS
ALTER TABLE ielts_resource_access ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own access" ON ielts_resource_access
  FOR SELECT USING (talent_id IN (SELECT id FROM talents WHERE user_id = auth.uid()));
CREATE POLICY "Users can insert own access" ON ielts_resource_access
  FOR INSERT WITH CHECK (talent_id IN (SELECT id FROM talents WHERE user_id = auth.uid()));
```

### Update `creditPricing.ts`
```typescript
STUDY_ABROAD_ASSIST: {
  name: 'Study Abroad Package',
  cost: 150,
  description: 'SOP generation + visa guidance'
},
IELTS_BAND_PREDICT: {
  name: 'IELTS Band Predictor',
  cost: 75,
  description: 'AI band score prediction with feedback'
},
INTERNATIONAL_CV: {
  name: 'International CV Format',
  cost: 40,
  description: 'Convert CV to country-specific format'
}
```

---

## Expected Revenue Impact

| Feature | Est. Monthly Uses | Credits | Monthly Revenue |
|---------|-------------------|---------|-----------------|
| IELTS Premium | 100 users | 100 | 10,000 credits |
| Study Abroad Package | 50 users | 150 | 7,500 credits |
| Band Predictor | 75 users | 75 | 5,625 credits |
| Study Advisor Sessions | 200 sessions | 10 | 2,000 credits |
| **Total New Revenue** | | | **25,125 credits/month** |

At 1 credit = ৳2, this equals approximately **৳50,250/month** in new revenue potential.

