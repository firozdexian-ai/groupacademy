
CREATE TABLE IF NOT EXISTS public.ir_influencers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role text,
  organization text,
  country text,
  tier text DEFAULT 'standard',
  tags text[] DEFAULT '{}',
  email text,
  linkedin_url text,
  contact_json jsonb DEFAULT '{}'::jsonb,
  notes text,
  owner_user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ir_influencers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage influencers" ON public.ir_influencers
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.ir_outreach_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type text NOT NULL CHECK (target_type IN ('vc','investor','influencer')),
  target_id uuid,
  target_label text,
  channel text NOT NULL CHECK (channel IN ('mailto','in_app','note','call','meeting','linkedin')),
  subject text,
  body text,
  sentiment text,
  status text DEFAULT 'logged',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ir_outreach_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage outreach log" ON public.ir_outreach_log
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.ir_fpa_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL UNIQUE,
  user_id uuid,
  last_question text,
  last_answer_summary text,
  message_count int DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ir_fpa_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read fpa conversations" ON public.ir_fpa_conversations
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS ir_outreach_log_target_idx ON public.ir_outreach_log(target_type, target_id);
CREATE INDEX IF NOT EXISTS ir_outreach_log_created_idx ON public.ir_outreach_log(created_at DESC);
CREATE INDEX IF NOT EXISTS ir_influencers_tier_idx ON public.ir_influencers(tier);

CREATE TRIGGER trg_ir_influencers_updated
  BEFORE UPDATE ON public.ir_influencers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
