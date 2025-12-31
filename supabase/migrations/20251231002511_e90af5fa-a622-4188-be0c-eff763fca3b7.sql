-- Part A: Orphaned Data Cleanup Migration

-- 1. Link talents to users by email matching (where user_id is null)
UPDATE public.talents t
SET user_id = u.id
FROM auth.users u
WHERE LOWER(t.email) = LOWER(u.email)
AND t.user_id IS NULL;

-- 2. Link career_assessments to talents by email (where talent_id is null)
UPDATE public.career_assessments ca
SET talent_id = t.id
FROM public.talents t
WHERE LOWER(ca.email) = LOWER(t.email)
AND ca.talent_id IS NULL;

-- 3. Link mock_interviews to talents by email (where talent_id is null)
UPDATE public.mock_interviews mi
SET talent_id = t.id
FROM public.talents t
WHERE LOWER(mi.email) = LOWER(t.email)
AND mi.talent_id IS NULL;

-- 4. Link salary_analyses to talents by email (where talent_id is null)
UPDATE public.salary_analyses sa
SET talent_id = t.id
FROM public.talents t
WHERE LOWER(sa.email) = LOWER(t.email)
AND sa.talent_id IS NULL;

-- 5. Link portfolio_requests to talents by email (where talent_id is null)
UPDATE public.portfolio_requests pr
SET talent_id = t.id
FROM public.talents t
WHERE LOWER(pr.email) = LOWER(t.email)
AND pr.talent_id IS NULL;