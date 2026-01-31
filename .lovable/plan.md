

# Delete Jobs with Missing Emails - Implementation Plan

## Summary

This plan will safely delete the 17 jobs that have `application_type = 'email'` but no `application_email` configured, and handle the related applications gracefully.

---

## Current Data State

| Metric | Count |
|--------|-------|
| Jobs with missing email | 17 |
| Stuck applications on these jobs | 4 |
| Credits already deducted from users | 100 credits (4 × 25 credits) |

### Affected Jobs (17 total):
1. Architect (4-5 Years Experience) - SLATE
2. Head of Department (Telesales & CRM) - Nationwide ISP
3. Client Partner – Digital Transformation - Kyro Solutions
4. **AI/ML Intern** - Cloudly (3 pending applications)
5. Quality Control Engineer - LIFECO
6. Trainee Assistant Manager - City Bank (1 pending application)
7. Client Relationship Officers - Winbridge Tech
8. Tele Sales Executive - Herbheez Management
9. Typist - Chalk Board
10. কাস্টমার সার্ভিস এক্সিকিউটিভ - সিটি ওয়াটার পিউরিফায়ার
11. Officer (Fire & Safety) - Akij Plastics
12. Call Centre Executive (Remote) - Insight Master
13. Vendor Manager - Elite Serve Global
14. Office Executive - Chonk Pet Food
15. Online Customer Service - Anzara Bangladesh
16. Strategic HR leader - Talen Tracker
17. Asst. Manager/Manager – Distribution & Trading Activation

---

## Implementation Steps

### Step 1: Handle Stuck Applications First

Before deleting jobs, we need to handle the 4 applications that are stuck in "pending":

**Option A - Refund Credits (Recommended)**
- Refund 25 credits to each affected user
- Mark applications as `delivery_status: 'failed'`
- Add note explaining job was removed

**Option B - Keep Applications, Just Delete Jobs**
- Applications will become orphaned (job_id references deleted job)
- May cause errors in user's "My Applications" page

**Recommendation**: Option A - Refund the 4 affected users before deletion.

---

### Step 2: Delete Jobs with Missing Emails

Execute deletion via SQL:

```sql
-- First, mark applications as failed
UPDATE job_applications 
SET delivery_status = 'failed',
    delivery_error = 'Job listing removed due to missing employer email'
WHERE job_id IN (
  SELECT id FROM jobs 
  WHERE application_type = 'email' 
    AND (application_email IS NULL OR application_email = '')
);

-- Then delete the jobs
DELETE FROM jobs 
WHERE application_type = 'email' 
  AND (application_email IS NULL OR application_email = '');
```

---

### Step 3: Add Database Safeguard (Optional but Recommended)

Add a database trigger to prevent this issue in the future:

```sql
CREATE OR REPLACE FUNCTION validate_job_application_email()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.application_type = 'email' 
     AND (NEW.application_email IS NULL OR NEW.application_email = '') THEN
    RAISE EXCEPTION 'Jobs with application_type=email must have a valid application_email';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_job_application_email
  BEFORE INSERT OR UPDATE ON jobs
  FOR EACH ROW
  EXECUTE FUNCTION validate_job_application_email();
```

---

## Execution Plan

| Step | Action | Risk Level |
|------|--------|------------|
| 1 | Refund credits to 4 affected users | Low |
| 2 | Update stuck applications to 'failed' status | Low |
| 3 | Delete 17 jobs with missing emails | Medium |
| 4 | Add validation trigger (optional) | Low |

---

## Credits Refund Details

| User | Job Applied | Credits to Refund |
|------|-------------|-------------------|
| SAMIHA TABASSUM KABITA | AI/ML Intern | 25 |
| Souhardo Rahman | AI/ML Intern | 25 |
| Md Emran Nazir Efty | AI/ML Intern | 25 |
| Mohammad Nashib Siam | Trainee Assistant Manager | 25 |
| **Total** | | **100 credits** |

---

## Technical Notes

### Why not just deactivate?
- Deactivating (`is_active = false`) keeps the jobs in the database
- They could confuse future queries or reports
- Deleting is cleaner since these jobs were never valid

### Cascade behavior:
- `job_applications` has `ON DELETE CASCADE` for `job_id`? Let me verify...
- If not, we need to handle applications first before deleting jobs

### Current "Forward Manually" workflow:
- Already exists in `JobApplicationsManager.tsx` (lines 489-527)
- Opens mailto: link with pre-filled email content
- Updates `delivery_status` to 'sent' after forwarding
- This workflow will continue to work for valid jobs

