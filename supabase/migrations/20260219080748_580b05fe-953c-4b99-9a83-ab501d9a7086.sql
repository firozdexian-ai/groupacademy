
-- Create gig_share_logs table for tracking seeker job shares
CREATE TABLE public.gig_share_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  talent_id UUID NOT NULL REFERENCES public.talents(id),
  gig_submission_id UUID REFERENCES public.gig_submissions(id),
  job_id UUID REFERENCES public.jobs(id),
  channel TEXT NOT NULL,
  shared_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.gig_share_logs ENABLE ROW LEVEL SECURITY;

-- Users can view their own share logs
CREATE POLICY "Users can view own share logs"
ON public.gig_share_logs FOR SELECT
USING (talent_id IN (SELECT id FROM public.talents WHERE user_id = auth.uid()));

-- Users can insert their own share logs
CREATE POLICY "Users can insert own share logs"
ON public.gig_share_logs FOR INSERT
WITH CHECK (talent_id IN (SELECT id FROM public.talents WHERE user_id = auth.uid()));

-- Admins can view all share logs
CREATE POLICY "Admins can view all share logs"
ON public.gig_share_logs FOR SELECT
USING (public.has_any_admin_role(auth.uid()));
