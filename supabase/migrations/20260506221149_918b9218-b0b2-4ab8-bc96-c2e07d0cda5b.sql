
CREATE TABLE IF NOT EXISTS public.gig_briefs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  posted_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  poster_kind text NOT NULL DEFAULT 'talent' CHECK (poster_kind IN ('talent','company','admin')),
  company_id uuid,
  raw_ask text NOT NULL,
  context jsonb DEFAULT '{}'::jsonb,
  preferred_kind text,
  preferred_deadline timestamptz,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','scoping','scoped','published','cancelled')),
  published_gig_kind text,
  published_gig_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_gig_briefs_user ON public.gig_briefs(posted_by, created_at DESC);
ALTER TABLE public.gig_briefs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_view_briefs" ON public.gig_briefs FOR SELECT USING (posted_by = auth.uid() OR public.has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "owner_insert_briefs" ON public.gig_briefs FOR INSERT WITH CHECK (posted_by = auth.uid());
CREATE POLICY "owner_update_briefs" ON public.gig_briefs FOR UPDATE USING (posted_by = auth.uid() OR public.has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "admins_manage_briefs" ON public.gig_briefs FOR ALL USING (public.has_role(auth.uid(),'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(),'admin'::app_role));

CREATE TABLE IF NOT EXISTS public.gig_scope_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brief_id uuid NOT NULL REFERENCES public.gig_briefs(id) ON DELETE CASCADE,
  version int NOT NULL DEFAULT 1,
  recommended_kind text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  deliverables jsonb NOT NULL DEFAULT '[]'::jsonb,
  acceptance_criteria jsonb NOT NULL DEFAULT '[]'::jsonb,
  required_skills text[] DEFAULT '{}',
  estimated_credits numeric(12,1),
  suggested_deadline_days int,
  rationale text,
  model_used text,
  is_chosen boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_gig_scope_drafts_brief ON public.gig_scope_drafts(brief_id, version DESC);
ALTER TABLE public.gig_scope_drafts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view_drafts_via_brief" ON public.gig_scope_drafts FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.gig_briefs b WHERE b.id = brief_id AND (b.posted_by = auth.uid() OR public.has_role(auth.uid(),'admin'::app_role)))
);
CREATE POLICY "admins_manage_drafts" ON public.gig_scope_drafts FOR ALL USING (public.has_role(auth.uid(),'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(),'admin'::app_role));

ALTER TABLE public.gigs ADD COLUMN IF NOT EXISTS acceptance_criteria jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.gigs ADD COLUMN IF NOT EXISTS source_brief_id uuid REFERENCES public.gig_briefs(id) ON DELETE SET NULL;
ALTER TABLE public.marketplace_gigs ADD COLUMN IF NOT EXISTS acceptance_criteria jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.marketplace_gigs ADD COLUMN IF NOT EXISTS source_brief_id uuid REFERENCES public.gig_briefs(id) ON DELETE SET NULL;

CREATE OR REPLACE FUNCTION public.touch_gig_briefs_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
DROP TRIGGER IF EXISTS trg_gig_briefs_touch ON public.gig_briefs;
CREATE TRIGGER trg_gig_briefs_touch BEFORE UPDATE ON public.gig_briefs FOR EACH ROW EXECUTE FUNCTION public.touch_gig_briefs_updated_at();

CREATE OR REPLACE FUNCTION public.publish_gig_from_draft(_draft_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_draft public.gig_scope_drafts;
  v_brief public.gig_briefs;
  v_new_gig_id uuid;
BEGIN
  SELECT * INTO v_draft FROM public.gig_scope_drafts WHERE id = _draft_id;
  IF v_draft.id IS NULL THEN RAISE EXCEPTION 'draft not found'; END IF;
  SELECT * INTO v_brief FROM public.gig_briefs WHERE id = v_draft.brief_id;
  IF NOT (v_brief.posted_by = auth.uid() OR public.has_role(auth.uid(),'admin'::app_role)) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  INSERT INTO public.marketplace_gigs (
    title, description, skill_category, pricing_type, budget_amount, budget_currency,
    deadline, requirements, posted_by, status, acceptance_criteria, source_brief_id
  ) VALUES (
    v_draft.title,
    v_draft.description,
    COALESCE((v_draft.required_skills)[1], 'general'),
    'fixed',
    GREATEST(1, COALESCE(v_draft.estimated_credits, 10))::int,
    'credits',
    CASE WHEN v_draft.suggested_deadline_days IS NOT NULL THEN now() + make_interval(days => v_draft.suggested_deadline_days) ELSE NULL END,
    v_draft.rationale,
    v_brief.posted_by,
    CASE WHEN public.has_role(auth.uid(),'admin'::app_role) THEN 'approved' ELSE 'pending' END,
    v_draft.acceptance_criteria,
    v_brief.id
  ) RETURNING id INTO v_new_gig_id;

  UPDATE public.gig_scope_drafts SET is_chosen = true WHERE id = _draft_id;
  UPDATE public.gig_briefs
  SET status = 'published', published_gig_kind = 'marketplace', published_gig_id = v_new_gig_id
  WHERE id = v_brief.id;

  RETURN v_new_gig_id;
END;
$$;
