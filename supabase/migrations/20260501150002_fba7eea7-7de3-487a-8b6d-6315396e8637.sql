-- Helper: is the caller a content lead for this school?
CREATE OR REPLACE FUNCTION public.is_content_lead_for_school(_user_id uuid, _school_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'content_lead'
      AND (scope_school_id IS NULL OR scope_school_id = _school_id)
  )
$$;

-- Readiness columns
ALTER TABLE public.content
  ADD COLUMN IF NOT EXISTS is_ready boolean NOT NULL DEFAULT false;

ALTER TABLE public.schools
  ADD COLUMN IF NOT EXISTS is_ready boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_content_is_ready ON public.content (is_ready) WHERE is_ready = true;

CREATE OR REPLACE FUNCTION public.school_id_for_content(_content_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT pc.school_id
  FROM public.content c
  LEFT JOIN public.profession_categories pc ON pc.id = c.profession_line_id
  WHERE c.id = _content_id;
$$;

CREATE OR REPLACE FUNCTION public.recompute_school_readiness(_school_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_total int; v_ready int;
BEGIN
  SELECT COUNT(*), COUNT(*) FILTER (WHERE c.is_ready)
  INTO v_total, v_ready
  FROM public.content c
  JOIN public.profession_categories pc ON pc.id = c.profession_line_id
  WHERE pc.school_id = _school_id
    AND c.is_published = true
    AND c.content_type IN ('recorded_course','batch_class','live_webinar');
  UPDATE public.schools
  SET is_ready = (v_total > 0 AND v_ready = v_total)
  WHERE id = _school_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.recompute_content_readiness(_content_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_modules int; v_modules_with_resources int; v_required_missing int;
  v_ready boolean; v_school_id uuid;
BEGIN
  SELECT COUNT(*) INTO v_modules FROM public.course_modules WHERE content_id = _content_id;
  IF v_modules = 0 THEN
    UPDATE public.content SET is_ready = false WHERE id = _content_id;
    RETURN;
  END IF;

  SELECT COUNT(DISTINCT cm.id) INTO v_modules_with_resources
  FROM public.course_modules cm
  JOIN public.module_resources mr ON mr.module_id = cm.id
  WHERE cm.content_id = _content_id
    AND mr.resource_url IS NOT NULL AND mr.resource_url <> '';

  SELECT COUNT(*) INTO v_required_missing
  FROM public.course_modules cm
  JOIN public.module_resources mr ON mr.module_id = cm.id
  WHERE cm.content_id = _content_id
    AND mr.is_required = true
    AND (mr.resource_url IS NULL OR mr.resource_url = '');

  v_ready := (v_modules_with_resources = v_modules) AND (v_required_missing = 0);
  UPDATE public.content SET is_ready = v_ready WHERE id = _content_id;

  SELECT public.school_id_for_content(_content_id) INTO v_school_id;
  IF v_school_id IS NOT NULL THEN
    PERFORM public.recompute_school_readiness(v_school_id);
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.tg_module_resource_readiness()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_content_id uuid;
BEGIN
  SELECT cm.content_id INTO v_content_id
  FROM public.course_modules cm
  WHERE cm.id = COALESCE(NEW.module_id, OLD.module_id);
  IF v_content_id IS NOT NULL THEN
    PERFORM public.recompute_content_readiness(v_content_id);
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_mr_readiness ON public.module_resources;
CREATE TRIGGER trg_mr_readiness
AFTER INSERT OR UPDATE OR DELETE ON public.module_resources
FOR EACH ROW EXECUTE FUNCTION public.tg_module_resource_readiness();

CREATE OR REPLACE VIEW public.school_readiness_v
WITH (security_invoker = on) AS
SELECT
  s.id AS school_id, s.slug AS school_slug, s.name AS school_name, s.is_ready,
  COUNT(c.id) AS total_courses,
  COUNT(c.id) FILTER (WHERE c.is_ready) AS ready_courses,
  CASE WHEN COUNT(c.id) > 0
       THEN ROUND(100.0 * COUNT(c.id) FILTER (WHERE c.is_ready) / COUNT(c.id))
       ELSE 0 END AS pct_ready
FROM public.schools s
LEFT JOIN public.profession_categories pc ON pc.school_id = s.id
LEFT JOIN public.content c
  ON c.profession_line_id = pc.id
 AND c.is_published = true
 AND c.content_type IN ('recorded_course','batch_class','live_webinar')
GROUP BY s.id;

-- school_waitlist
CREATE TABLE IF NOT EXISTS public.school_waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  talent_id uuid NOT NULL REFERENCES public.talents(id) ON DELETE CASCADE,
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (talent_id, school_id)
);
ALTER TABLE public.school_waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Talent can view own waitlist" ON public.school_waitlist FOR SELECT
  USING (talent_id IN (SELECT id FROM public.talents WHERE user_id = auth.uid()));
CREATE POLICY "Talent can join waitlist" ON public.school_waitlist FOR INSERT
  WITH CHECK (talent_id IN (SELECT id FROM public.talents WHERE user_id = auth.uid()));
CREATE POLICY "Talent can leave waitlist" ON public.school_waitlist FOR DELETE
  USING (talent_id IN (SELECT id FROM public.talents WHERE user_id = auth.uid()));
CREATE POLICY "Admins can view all waitlist" ON public.school_waitlist FOR SELECT
  USING (public.has_any_admin_role(auth.uid()));

-- content_gigs
CREATE TABLE IF NOT EXISTS public.content_gigs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES public.course_modules(id) ON DELETE CASCADE,
  content_id uuid NOT NULL REFERENCES public.content(id) ON DELETE CASCADE,
  school_id uuid REFERENCES public.schools(id) ON DELETE SET NULL,
  stage_number int NOT NULL DEFAULT 2,
  resource_type text NOT NULL,
  title text NOT NULL,
  brief text,
  expected_format text,
  credit_reward numeric(12,1) NOT NULL DEFAULT 10,
  status text NOT NULL DEFAULT 'open',
  claimed_by uuid REFERENCES public.talents(id) ON DELETE SET NULL,
  claimed_at timestamptz,
  submitted_url text,
  submitted_data jsonb,
  submitted_at timestamptz,
  reviewed_by uuid,
  reviewed_at timestamptz,
  review_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT content_gigs_status_check CHECK (status IN ('open','claimed','submitted','approved','rejected'))
);
CREATE INDEX IF NOT EXISTS idx_content_gigs_school_status ON public.content_gigs (school_id, status);
CREATE INDEX IF NOT EXISTS idx_content_gigs_module ON public.content_gigs (module_id);
CREATE INDEX IF NOT EXISTS idx_content_gigs_claimed_by ON public.content_gigs (claimed_by);

CREATE TRIGGER trg_content_gigs_updated_at
BEFORE UPDATE ON public.content_gigs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.content_gigs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Content leads see scoped gigs" ON public.content_gigs FOR SELECT
  USING (public.has_any_admin_role(auth.uid())
         OR public.is_content_lead_for_school(auth.uid(), school_id));

CREATE POLICY "Content leads can update own/open gigs" ON public.content_gigs FOR UPDATE
  USING (public.has_any_admin_role(auth.uid())
    OR (public.is_content_lead_for_school(auth.uid(), school_id)
        AND (claimed_by IS NULL
             OR claimed_by IN (SELECT id FROM public.talents WHERE user_id = auth.uid()))))
  WITH CHECK (public.has_any_admin_role(auth.uid())
    OR (public.is_content_lead_for_school(auth.uid(), school_id)
        AND (claimed_by IS NULL
             OR claimed_by IN (SELECT id FROM public.talents WHERE user_id = auth.uid()))));

CREATE POLICY "Admins insert content gigs" ON public.content_gigs FOR INSERT
  WITH CHECK (public.has_any_admin_role(auth.uid()));
CREATE POLICY "Admins delete content gigs" ON public.content_gigs FOR DELETE
  USING (public.has_any_admin_role(auth.uid()));

-- Generator
CREATE OR REPLACE FUNCTION public.generate_content_gigs_for_course(_content_id uuid)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_school_id uuid; v_inserted int := 0; v_module RECORD; v_stage int;
  v_stage_label text; v_existing int;
BEGIN
  IF NOT public.has_any_admin_role(auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  v_school_id := public.school_id_for_content(_content_id);

  FOR v_module IN
    SELECT id, title FROM public.course_modules WHERE content_id = _content_id ORDER BY display_order
  LOOP
    FOR v_stage IN 1..6 LOOP
      v_stage_label := CASE v_stage WHEN 1 THEN 'Orientation' WHEN 2 THEN 'Learn'
        WHEN 3 THEN 'Discuss' WHEN 4 THEN 'Practice' WHEN 5 THEN 'Assess' WHEN 6 THEN 'Progress' END;

      SELECT COUNT(*) INTO v_existing
      FROM public.module_resources
      WHERE module_id = v_module.id AND stage_number = v_stage
        AND resource_url IS NOT NULL AND resource_url <> '';
      IF v_existing > 0 THEN CONTINUE; END IF;

      SELECT COUNT(*) INTO v_existing
      FROM public.content_gigs
      WHERE module_id = v_module.id AND stage_number = v_stage
        AND status IN ('open','claimed','submitted','approved');
      IF v_existing > 0 THEN CONTINUE; END IF;

      INSERT INTO public.content_gigs (
        module_id, content_id, school_id, stage_number, resource_type,
        title, brief, expected_format, credit_reward
      ) VALUES (
        v_module.id, _content_id, v_school_id, v_stage,
        CASE v_stage WHEN 1 THEN 'video' WHEN 2 THEN 'slides' WHEN 3 THEN 'video'
                     WHEN 4 THEN 'flashcards' WHEN 5 THEN 'quiz' WHEN 6 THEN 'report' END,
        v_stage_label || ' resource for: ' || v_module.title,
        'Create the ' || v_stage_label || ' stage resource for this module. Follow the school style guide.',
        CASE v_stage
          WHEN 1 THEN '60-90s intro video (mp4 link or YouTube unlisted)'
          WHEN 2 THEN 'Slide deck (PDF) + summary text'
          WHEN 3 THEN '5 discussion prompts (text)'
          WHEN 4 THEN '10 flashcards (front/back)'
          WHEN 5 THEN '5-10 question quiz'
          WHEN 6 THEN 'Capstone reflection prompt + rubric'
        END,
        CASE v_stage WHEN 1 THEN 30 WHEN 2 THEN 20 WHEN 3 THEN 10
                     WHEN 4 THEN 15 WHEN 5 THEN 15 WHEN 6 THEN 10 END
      );
      v_inserted := v_inserted + 1;
    END LOOP;
  END LOOP;
  RETURN v_inserted;
END;
$$;

CREATE OR REPLACE FUNCTION public.approve_content_gig(p_gig_id uuid, p_admin_notes text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_gig RECORD; v_balance numeric; v_earned numeric; v_new_balance numeric;
BEGIN
  IF NOT public.has_any_admin_role(auth.uid()) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;
  SELECT * INTO v_gig FROM public.content_gigs WHERE id = p_gig_id FOR UPDATE;
  IF v_gig IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Gig not found');
  END IF;
  IF v_gig.status NOT IN ('submitted') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Gig is not in submitted state');
  END IF;

  INSERT INTO public.module_resources (
    module_id, resource_type, title, description, resource_url, resource_data,
    stage_number, is_required, display_order
  ) VALUES (
    v_gig.module_id, v_gig.resource_type::resource_type, v_gig.title, v_gig.brief,
    v_gig.submitted_url, v_gig.submitted_data, v_gig.stage_number, true,
    COALESCE((SELECT MAX(display_order)+1 FROM public.module_resources WHERE module_id = v_gig.module_id), 0)
  );

  IF v_gig.claimed_by IS NOT NULL THEN
    SELECT balance, earned_balance INTO v_balance, v_earned
    FROM public.talent_credits WHERE talent_id = v_gig.claimed_by FOR UPDATE;
    IF v_balance IS NULL THEN
      v_balance := 0; v_earned := 0;
      INSERT INTO public.talent_credits (talent_id, balance, earned_balance)
      VALUES (v_gig.claimed_by, 0, 0);
    END IF;
    v_new_balance := v_balance + v_gig.credit_reward;
    UPDATE public.talent_credits
    SET balance = v_new_balance, earned_balance = COALESCE(v_earned,0) + v_gig.credit_reward
    WHERE talent_id = v_gig.claimed_by;
    INSERT INTO public.credit_transactions (
      talent_id, amount, balance_after, transaction_type, service_type,
      reference_id, description, is_earned
    ) VALUES (
      v_gig.claimed_by, v_gig.credit_reward, v_new_balance, 'gig_reward', 'content_gig',
      p_gig_id, 'Content gig approved: ' || v_gig.title, true
    );
  END IF;

  UPDATE public.content_gigs
  SET status = 'approved', reviewed_by = auth.uid(), reviewed_at = now(),
      review_notes = COALESCE(p_admin_notes, review_notes)
  WHERE id = p_gig_id;
  RETURN jsonb_build_object('success', true, 'credits_awarded', v_gig.credit_reward);
END;
$$;

CREATE OR REPLACE FUNCTION public.reject_content_gig(p_gig_id uuid, p_admin_notes text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_any_admin_role(auth.uid()) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;
  UPDATE public.content_gigs
  SET status = 'open', claimed_by = NULL, claimed_at = NULL,
      submitted_url = NULL, submitted_data = NULL, submitted_at = NULL,
      review_notes = COALESCE(p_admin_notes, review_notes),
      reviewed_by = auth.uid(), reviewed_at = now()
  WHERE id = p_gig_id AND status = 'submitted';
  RETURN jsonb_build_object('success', true);
END;
$$;

-- Backfill readiness
DO $$ DECLARE r RECORD;
BEGIN
  FOR r IN SELECT id FROM public.content WHERE content_type IN ('recorded_course','batch_class','live_webinar') LOOP
    PERFORM public.recompute_content_readiness(r.id);
  END LOOP;
END $$;