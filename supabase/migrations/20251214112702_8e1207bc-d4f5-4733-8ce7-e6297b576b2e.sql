-- =============================================
-- PHASE 1: FIX RLS SECURITY VULNERABILITIES
-- =============================================

-- 1. FIX career_assessments: Remove email-based access, require user_id only
-- Drop the vulnerable policy that allows email-based enumeration
DROP POLICY IF EXISTS "Users can view own assessments" ON public.career_assessments;

-- Create stricter policy requiring authenticated user_id match only
CREATE POLICY "Users can view own assessments by user_id"
ON public.career_assessments
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR user_id = auth.uid()
);

-- Allow updating assessments (for AI analysis completion) only by admins or owner
DROP POLICY IF EXISTS "Admins can manage all assessments" ON public.career_assessments;

CREATE POLICY "Admins can manage all assessments"
ON public.career_assessments
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 2. FIX ai_chat_sessions: Remove "OR user_id IS NULL" vulnerability
-- Drop vulnerable policies
DROP POLICY IF EXISTS "Users can view own chat sessions" ON public.ai_chat_sessions;
DROP POLICY IF EXISTS "Users can update own chat sessions" ON public.ai_chat_sessions;
DROP POLICY IF EXISTS "Users can create chat sessions" ON public.ai_chat_sessions;

-- Recreate policies WITHOUT the NULL user_id loophole
CREATE POLICY "Users can view own chat sessions"
ON public.ai_chat_sessions
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can update own chat sessions"
ON public.ai_chat_sessions
FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can create own chat sessions"
ON public.ai_chat_sessions
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- 3. FIX students table: Audit and tighten policies
-- Current policies are OK but add explicit denial for sensitive operations
-- Ensure students can only see their own records
DROP POLICY IF EXISTS "Students can view own enrollments" ON public.enrollments;

CREATE POLICY "Students can view own enrollments"
ON public.enrollments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM students 
    WHERE students.id = enrollments.student_id 
    AND students.user_id = auth.uid()
  )
);

-- Add policy to prevent students from viewing other students' data directly
-- (This is already implicit in "no policy = no access" but let's be explicit)

-- 4. ADD rate limiting tracking table for public endpoints
CREATE TABLE IF NOT EXISTS public.rate_limit_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_hash text NOT NULL,
  endpoint text NOT NULL,
  request_count integer DEFAULT 1,
  window_start timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_rate_limit_ip_endpoint ON public.rate_limit_tracking(ip_hash, endpoint);
CREATE INDEX IF NOT EXISTS idx_rate_limit_window ON public.rate_limit_tracking(window_start);

-- Enable RLS on rate limiting table
ALTER TABLE public.rate_limit_tracking ENABLE ROW LEVEL SECURITY;

-- Only edge functions (service role) can manage rate limits
CREATE POLICY "Service role manages rate limits"
ON public.rate_limit_tracking
FOR ALL
USING (false)
WITH CHECK (false);

-- 5. Create rate limiting function for edge functions to use
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_ip_hash text,
  p_endpoint text,
  p_max_requests integer DEFAULT 10,
  p_window_minutes integer DEFAULT 1
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
  v_window_start timestamp with time zone;
BEGIN
  v_window_start := now() - (p_window_minutes || ' minutes')::interval;
  
  -- Count requests in current window
  SELECT COALESCE(SUM(request_count), 0) INTO v_count
  FROM rate_limit_tracking
  WHERE ip_hash = p_ip_hash
    AND endpoint = p_endpoint
    AND window_start > v_window_start;
  
  -- If under limit, record the request and return true (allowed)
  IF v_count < p_max_requests THEN
    INSERT INTO rate_limit_tracking (ip_hash, endpoint, request_count, window_start)
    VALUES (p_ip_hash, p_endpoint, 1, now());
    RETURN true;
  END IF;
  
  -- Over limit, return false (blocked)
  RETURN false;
END;
$$;

-- 6. Cleanup old rate limit records (run periodically)
CREATE OR REPLACE FUNCTION public.cleanup_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM rate_limit_tracking
  WHERE window_start < now() - interval '1 hour';
END;
$$;