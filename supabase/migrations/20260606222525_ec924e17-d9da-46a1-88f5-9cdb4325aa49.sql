
-- 1. ai_agents
REVOKE SELECT (system_prompt, prompt_variants, allowed_tools, model, builder_model, kill_switch)
  ON public.ai_agents FROM anon, authenticated;

-- 2. instructors
REVOKE SELECT (bank_details, email, phone) ON public.instructors FROM anon, authenticated;

-- 3. marketplace_gigs
REVOKE SELECT (employer_email) ON public.marketplace_gigs FROM anon, authenticated;

-- 4. talents featured
DROP POLICY IF EXISTS "Anyone can view featured talents" ON public.talents;

-- 5. professionals featured + own-view
DROP POLICY IF EXISTS "Anyone can view featured professionals" ON public.professionals;
DROP POLICY IF EXISTS "Users can view own professional profile" ON public.professionals;
CREATE POLICY "Users can view own professional profile"
  ON public.professionals FOR SELECT
  TO public
  USING (
    auth.uid() = user_id
    OR email = (auth.jwt() ->> 'email'::text)
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- 6. gig_disputes: opener + admins only
DROP POLICY IF EXISTS "Disputes party read" ON public.gig_disputes;
CREATE POLICY "Disputes party read"
  ON public.gig_disputes FOR SELECT
  TO authenticated
  USING (
    opened_by = auth.uid()
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- 7. talent_inbox_settings
DROP POLICY IF EXISTS "Inbox settings readable by authenticated users" ON public.talent_inbox_settings;
CREATE POLICY "Talent can read own inbox settings"
  ON public.talent_inbox_settings FOR SELECT
  TO authenticated
  USING (
    talent_id IN (SELECT id FROM public.talents WHERE user_id = auth.uid())
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- 8. Access codes
DROP POLICY IF EXISTS "Users can validate their assessment codes" ON public.assessment_access_codes;
DROP POLICY IF EXISTS "Users can use their assessment codes" ON public.assessment_access_codes;
DROP POLICY IF EXISTS "Users can validate their salary codes" ON public.salary_analysis_access_codes;
DROP POLICY IF EXISTS "Users can use their salary codes" ON public.salary_analysis_access_codes;
DROP POLICY IF EXISTS "Users can validate their mock interview codes" ON public.mock_interview_access_codes;
DROP POLICY IF EXISTS "Users can use their mock interview codes" ON public.mock_interview_access_codes;
DROP POLICY IF EXISTS "Users can validate their job application codes" ON public.job_application_access_codes;
DROP POLICY IF EXISTS "Users can use their job application codes" ON public.job_application_access_codes;

-- 9. course-content bucket
DROP POLICY IF EXISTS "Anyone can view course content" ON storage.objects;
DROP POLICY IF EXISTS "Public can view course content" ON storage.objects;
CREATE POLICY "Authenticated users can view course content"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'course-content');

-- 10. aisha_conversations: store CAPTCHA answer server-side
ALTER TABLE public.aisha_conversations
  ADD COLUMN IF NOT EXISTS pending_quiz_answer text;
