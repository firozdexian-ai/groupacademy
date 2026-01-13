-- Delete data for @gro10x.com test accounts (excluding gro10xnow@gmail.com)

-- 1. Delete saved items
DELETE FROM public.saved_items WHERE talent_id IN (
  SELECT id FROM public.talents 
  WHERE email LIKE '%@gro10x.%' 
  AND email != 'gro10xnow@gmail.com'
);

-- 2. Delete feed interactions
DELETE FROM public.feed_interactions WHERE talent_id IN (
  SELECT id FROM public.talents 
  WHERE email LIKE '%@gro10x.%'
  AND email != 'gro10xnow@gmail.com'
);

-- 3. Delete AI recommendations
DELETE FROM public.ai_recommendations WHERE talent_id IN (
  SELECT id FROM public.talents 
  WHERE email LIKE '%@gro10x.%'
  AND email != 'gro10xnow@gmail.com'
);

-- 4. Delete agent chat sessions
DELETE FROM public.agent_chat_sessions WHERE talent_id IN (
  SELECT id FROM public.talents 
  WHERE email LIKE '%@gro10x.%'
  AND email != 'gro10xnow@gmail.com'
);

-- 5. Delete notifications
DELETE FROM public.notifications WHERE talent_id IN (
  SELECT id FROM public.talents 
  WHERE email LIKE '%@gro10x.%'
  AND email != 'gro10xnow@gmail.com'
);

-- 6. Delete credit transactions
DELETE FROM public.credit_transactions WHERE talent_id IN (
  SELECT id FROM public.talents 
  WHERE email LIKE '%@gro10x.%'
  AND email != 'gro10xnow@gmail.com'
);

-- 7. Delete talent credits
DELETE FROM public.talent_credits WHERE talent_id IN (
  SELECT id FROM public.talents 
  WHERE email LIKE '%@gro10x.%'
  AND email != 'gro10xnow@gmail.com'
);

-- 8. Delete enrollments
DELETE FROM public.enrollments WHERE talent_id IN (
  SELECT id FROM public.talents 
  WHERE email LIKE '%@gro10x.%'
  AND email != 'gro10xnow@gmail.com'
);

-- 9. Delete job applications
DELETE FROM public.job_applications WHERE talent_id IN (
  SELECT id FROM public.talents 
  WHERE email LIKE '%@gro10x.%'
  AND email != 'gro10xnow@gmail.com'
);

-- 10. Delete job assessments
DELETE FROM public.job_assessments WHERE talent_id IN (
  SELECT id FROM public.talents 
  WHERE email LIKE '%@gro10x.%'
  AND email != 'gro10xnow@gmail.com'
);

-- 11. Delete career assessments
DELETE FROM public.career_assessments WHERE talent_id IN (
  SELECT id FROM public.talents 
  WHERE email LIKE '%@gro10x.%'
  AND email != 'gro10xnow@gmail.com'
);

-- 12. Delete mock interviews
DELETE FROM public.mock_interviews WHERE talent_id IN (
  SELECT id FROM public.talents 
  WHERE email LIKE '%@gro10x.%'
  AND email != 'gro10xnow@gmail.com'
);

-- 13. Delete salary analyses
DELETE FROM public.salary_analyses WHERE talent_id IN (
  SELECT id FROM public.talents 
  WHERE email LIKE '%@gro10x.%'
  AND email != 'gro10xnow@gmail.com'
);

-- 14. Delete portfolio requests
DELETE FROM public.portfolio_requests WHERE talent_id IN (
  SELECT id FROM public.talents 
  WHERE email LIKE '%@gro10x.%'
  AND email != 'gro10xnow@gmail.com'
);

-- 15. Delete competition submissions
DELETE FROM public.competition_submissions WHERE talent_id IN (
  SELECT id FROM public.talents 
  WHERE email LIKE '%@gro10x.%'
  AND email != 'gro10xnow@gmail.com'
);

-- 16. Delete user roles (for test accounts only, not admin)
DELETE FROM public.user_roles WHERE user_id IN (
  SELECT user_id FROM public.talents 
  WHERE email LIKE '%@gro10x.%'
  AND email != 'gro10xnow@gmail.com'
);

-- 17. Delete talent profiles
DELETE FROM public.talents 
WHERE email LIKE '%@gro10x.%'
AND email != 'gro10xnow@gmail.com';