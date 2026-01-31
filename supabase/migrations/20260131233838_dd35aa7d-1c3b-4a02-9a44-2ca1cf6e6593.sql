
-- Fix critical security issues

-- 1. Add RLS to contacts table (currently completely unprotected)
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- Contacts should only be accessible by admins
CREATE POLICY "Admins can view all contacts"
ON public.contacts FOR SELECT
TO authenticated
USING (public.has_any_admin_role(auth.uid()));

CREATE POLICY "Admins can insert contacts"
ON public.contacts FOR INSERT
TO authenticated
WITH CHECK (public.has_any_admin_role(auth.uid()));

CREATE POLICY "Admins can update contacts"
ON public.contacts FOR UPDATE
TO authenticated
USING (public.has_any_admin_role(auth.uid()));

CREATE POLICY "Admins can delete contacts"
ON public.contacts FOR DELETE
TO authenticated
USING (public.has_any_admin_role(auth.uid()));

-- 2. Tighten career_assessments INSERT policy - require email to match or talent_id
DROP POLICY IF EXISTS "Anyone can submit career assessments" ON public.career_assessments;
CREATE POLICY "Authenticated users can submit career assessments"
ON public.career_assessments FOR INSERT
TO authenticated
WITH CHECK (
  auth.jwt()->>'email' = email
  OR talent_id IN (SELECT id FROM public.talents WHERE user_id = auth.uid())
);

-- 3. Tighten mock_interviews INSERT policy - require email to match
DROP POLICY IF EXISTS "Anyone can submit mock interviews" ON public.mock_interviews;
CREATE POLICY "Authenticated users can submit mock interviews"
ON public.mock_interviews FOR INSERT
TO authenticated
WITH CHECK (
  auth.jwt()->>'email' = email
  OR talent_id IN (SELECT id FROM public.talents WHERE user_id = auth.uid())
);

-- 4. Tighten salary_analyses INSERT policy - require email to match
DROP POLICY IF EXISTS "Anyone can submit salary analyses" ON public.salary_analyses;
CREATE POLICY "Authenticated users can submit salary analyses"
ON public.salary_analyses FOR INSERT
TO authenticated
WITH CHECK (
  auth.jwt()->>'email' = email
  OR talent_id IN (SELECT id FROM public.talents WHERE user_id = auth.uid())
);

-- 5. Tighten portfolio_requests INSERT policy - require email to match
DROP POLICY IF EXISTS "Anyone can submit portfolio requests" ON public.portfolio_requests;
CREATE POLICY "Authenticated users can submit portfolio requests"
ON public.portfolio_requests FOR INSERT
TO authenticated
WITH CHECK (
  auth.jwt()->>'email' = email
);

-- 6. Tighten professionals INSERT policy - require matching email or admin
DROP POLICY IF EXISTS "Anyone can create professional profile" ON public.professionals;
CREATE POLICY "Authenticated users can create professional profile"
ON public.professionals FOR INSERT
TO authenticated
WITH CHECK (
  auth.jwt()->>'email' = email
  OR public.has_any_admin_role(auth.uid())
);

-- 7. Tighten notifications INSERT - only system/admin can insert
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
CREATE POLICY "Admins can insert notifications"
ON public.notifications FOR INSERT
TO authenticated
WITH CHECK (
  public.has_any_admin_role(auth.uid())
  OR talent_id IN (SELECT id FROM public.talents WHERE user_id = auth.uid())
);
