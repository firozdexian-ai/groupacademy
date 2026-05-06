
-- ============= Phase 3.6: Employer CRM & Talent Sourcing =============

-- ---- Enums ----
DO $$ BEGIN
  CREATE TYPE public.talent_relationship_stage AS ENUM
    ('prospect','contacted','engaged','interviewing','offered','hired','passed','nurture');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.talent_activity_kind AS ENUM
    ('note','message','status_change','call','email','task','list_added','invited');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---- talent_lists ----
CREATE TABLE IF NOT EXISTS public.talent_lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_talent_lists_company ON public.talent_lists(company_id);
ALTER TABLE public.talent_lists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members view talent_lists" ON public.talent_lists FOR SELECT TO authenticated
USING (public.is_company_member(auth.uid(), company_id) OR public.has_any_admin_role(auth.uid()));
CREATE POLICY "Members insert talent_lists" ON public.talent_lists FOR INSERT TO authenticated
WITH CHECK (public.is_company_member(auth.uid(), company_id));
CREATE POLICY "Members update talent_lists" ON public.talent_lists FOR UPDATE TO authenticated
USING (public.is_company_member(auth.uid(), company_id))
WITH CHECK (public.is_company_member(auth.uid(), company_id));
CREATE POLICY "Members delete talent_lists" ON public.talent_lists FOR DELETE TO authenticated
USING (public.is_company_member(auth.uid(), company_id));

CREATE TRIGGER trg_talent_lists_updated BEFORE UPDATE ON public.talent_lists
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---- talent_list_members ----
CREATE TABLE IF NOT EXISTS public.talent_list_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id uuid NOT NULL REFERENCES public.talent_lists(id) ON DELETE CASCADE,
  talent_id uuid NOT NULL REFERENCES public.talents(id) ON DELETE CASCADE,
  added_by uuid NOT NULL,
  note text,
  added_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(list_id, talent_id)
);
CREATE INDEX IF NOT EXISTS idx_talent_list_members_list ON public.talent_list_members(list_id);
CREATE INDEX IF NOT EXISTS idx_talent_list_members_talent ON public.talent_list_members(talent_id);
ALTER TABLE public.talent_list_members ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.talent_list_company_id(_list_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT company_id FROM public.talent_lists WHERE id = _list_id
$$;

CREATE POLICY "Members view list_members" ON public.talent_list_members FOR SELECT TO authenticated
USING (
  public.is_company_member(auth.uid(), public.talent_list_company_id(list_id))
  OR public.has_any_admin_role(auth.uid())
  OR EXISTS (SELECT 1 FROM public.talents t WHERE t.id = talent_id AND t.user_id = auth.uid())
);
CREATE POLICY "Members manage list_members" ON public.talent_list_members FOR ALL TO authenticated
USING (public.is_company_member(auth.uid(), public.talent_list_company_id(list_id)))
WITH CHECK (public.is_company_member(auth.uid(), public.talent_list_company_id(list_id)));

-- ---- talent_relationships ----
CREATE TABLE IF NOT EXISTS public.talent_relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  talent_id uuid NOT NULL REFERENCES public.talents(id) ON DELETE CASCADE,
  stage public.talent_relationship_stage NOT NULL DEFAULT 'prospect',
  owner_id uuid,
  source text,
  next_step text,
  next_step_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, talent_id)
);
CREATE INDEX IF NOT EXISTS idx_talent_rel_company_stage ON public.talent_relationships(company_id, stage);
CREATE INDEX IF NOT EXISTS idx_talent_rel_talent ON public.talent_relationships(talent_id);
ALTER TABLE public.talent_relationships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members view rel" ON public.talent_relationships FOR SELECT TO authenticated
USING (
  public.is_company_member(auth.uid(), company_id)
  OR public.has_any_admin_role(auth.uid())
  OR EXISTS (SELECT 1 FROM public.talents t WHERE t.id = talent_id AND t.user_id = auth.uid() AND stage <> 'prospect')
);
CREATE POLICY "Members manage rel" ON public.talent_relationships FOR ALL TO authenticated
USING (public.is_company_member(auth.uid(), company_id))
WITH CHECK (public.is_company_member(auth.uid(), company_id));

CREATE TRIGGER trg_talent_rel_updated BEFORE UPDATE ON public.talent_relationships
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---- talent_relationship_activities ----
CREATE TABLE IF NOT EXISTS public.talent_relationship_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  relationship_id uuid NOT NULL REFERENCES public.talent_relationships(id) ON DELETE CASCADE,
  actor_id uuid,
  actor_role text,
  kind public.talent_activity_kind NOT NULL,
  body jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_talent_rel_act_rel ON public.talent_relationship_activities(relationship_id, created_at DESC);
ALTER TABLE public.talent_relationship_activities ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.talent_rel_company_id(_rel_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT company_id FROM public.talent_relationships WHERE id = _rel_id
$$;

CREATE POLICY "Members view rel_act" ON public.talent_relationship_activities FOR SELECT TO authenticated
USING (
  public.is_company_member(auth.uid(), public.talent_rel_company_id(relationship_id))
  OR public.has_any_admin_role(auth.uid())
);
CREATE POLICY "Members insert rel_act" ON public.talent_relationship_activities FOR INSERT TO authenticated
WITH CHECK (public.is_company_member(auth.uid(), public.talent_rel_company_id(relationship_id)));

-- ---- crm_audit_log ----
CREATE TABLE IF NOT EXISTS public.crm_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  actor_id uuid,
  actor_role text,
  action text NOT NULL,
  diff jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_crm_audit_entity ON public.crm_audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_crm_audit_company ON public.crm_audit_log(company_id, created_at DESC);
ALTER TABLE public.crm_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members view crm_audit" ON public.crm_audit_log FOR SELECT TO authenticated
USING (
  (company_id IS NOT NULL AND public.is_company_member(auth.uid(), company_id))
  OR public.has_any_admin_role(auth.uid())
);

-- ---- job_applications.sourced flag ----
ALTER TABLE public.job_applications
  ADD COLUMN IF NOT EXISTS sourced boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS sourced_relationship_id uuid REFERENCES public.talent_relationships(id) ON DELETE SET NULL;

-- Trigger: when an application is inserted, link to existing relationship
CREATE OR REPLACE FUNCTION public.trg_app_link_relationship()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_company uuid;
  v_talent uuid;
  v_rel uuid;
BEGIN
  SELECT company_id INTO v_company FROM public.jobs WHERE id = NEW.job_id;
  SELECT id INTO v_talent FROM public.talents WHERE user_id = NEW.user_id LIMIT 1;
  IF v_company IS NULL OR v_talent IS NULL THEN RETURN NEW; END IF;

  SELECT id INTO v_rel FROM public.talent_relationships
  WHERE company_id = v_company AND talent_id = v_talent;

  IF v_rel IS NOT NULL THEN
    NEW.sourced := true;
    NEW.sourced_relationship_id := v_rel;
    INSERT INTO public.talent_relationship_activities(relationship_id, actor_id, actor_role, kind, body)
    VALUES (v_rel, NEW.user_id, 'system', 'status_change',
      jsonb_build_object('event','application_submitted','application_id', NEW.id, 'job_id', NEW.job_id));
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_application_inserted_link_relationship ON public.job_applications;
CREATE TRIGGER trg_application_inserted_link_relationship
BEFORE INSERT ON public.job_applications
FOR EACH ROW EXECUTE FUNCTION public.trg_app_link_relationship();

-- Generic audit logger for relationships
CREATE OR REPLACE FUNCTION public.trg_crm_relationship_audit()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_role text;
BEGIN
  v_role := CASE WHEN public.has_any_admin_role(auth.uid()) THEN 'admin' ELSE 'recruiter' END;
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.crm_audit_log(company_id, entity_type, entity_id, actor_id, actor_role, action, diff)
    VALUES (NEW.company_id, 'talent_relationship', NEW.id, auth.uid(), v_role, 'create',
      jsonb_build_object('stage', NEW.stage));
  ELSIF TG_OP = 'UPDATE' AND NEW.stage IS DISTINCT FROM OLD.stage THEN
    INSERT INTO public.crm_audit_log(company_id, entity_type, entity_id, actor_id, actor_role, action, diff)
    VALUES (NEW.company_id, 'talent_relationship', NEW.id, auth.uid(), v_role, 'stage_change',
      jsonb_build_object('from', OLD.stage, 'to', NEW.stage));
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_crm_rel_audit ON public.talent_relationships;
CREATE TRIGGER trg_crm_rel_audit AFTER INSERT OR UPDATE ON public.talent_relationships
FOR EACH ROW EXECUTE FUNCTION public.trg_crm_relationship_audit();

-- ---- RPC: search_public_talents ----
CREATE OR REPLACE FUNCTION public.search_public_talents(
  p_filters jsonb DEFAULT '{}'::jsonb,
  p_limit int DEFAULT 24,
  p_offset int DEFAULT 0
) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_keyword text := NULLIF(p_filters->>'keyword', '');
  v_country text := NULLIF(p_filters->>'country', '');
  v_skills text[] := CASE WHEN p_filters ? 'skills'
    THEN ARRAY(SELECT jsonb_array_elements_text(p_filters->'skills')) ELSE NULL END;
  v_total int;
  v_rows jsonb;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('total', 0, 'rows', '[]'::jsonb);
  END IF;

  WITH base AS (
    SELECT t.id, t.public_handle, t.full_name, t.profile_photo_url, t.custom_profession,
           t.country, t.public_bio, t.skills,
           COALESCE((SELECT AVG(mastery) FROM public.talent_skill_profile WHERE talent_id = t.id), 0) AS avg_mastery,
           (SELECT COUNT(*) FROM public.skill_credentials sc WHERE sc.talent_id = t.id AND sc.revoked_at IS NULL) AS verified_skills,
           t.updated_at
    FROM public.talents t
    WHERE t.public_profile_enabled = true
      AND (v_country IS NULL OR t.country = v_country)
      AND (v_keyword IS NULL OR t.search_tsv @@ plainto_tsquery('simple', v_keyword)
           OR t.full_name ILIKE '%'||v_keyword||'%'
           OR t.custom_profession ILIKE '%'||v_keyword||'%')
      AND (v_skills IS NULL OR EXISTS (
        SELECT 1 FROM jsonb_array_elements_text(t.skills) s
        WHERE lower(s) = ANY(SELECT lower(x) FROM unnest(v_skills) x)
      ))
  )
  SELECT COUNT(*), COALESCE(jsonb_agg(to_jsonb(b) ORDER BY b.avg_mastery DESC, b.updated_at DESC) FILTER (WHERE rn BETWEEN p_offset+1 AND p_offset+p_limit), '[]'::jsonb)
  INTO v_total, v_rows
  FROM (SELECT b.*, row_number() OVER (ORDER BY b.avg_mastery DESC, b.updated_at DESC) rn FROM base b) b;

  RETURN jsonb_build_object('total', COALESCE(v_total,0), 'rows', COALESCE(v_rows, '[]'::jsonb));
END $$;

GRANT EXECUTE ON FUNCTION public.search_public_talents(jsonb, int, int) TO authenticated;

-- ---- RPC: get_sourcing_stats ----
CREATE OR REPLACE FUNCTION public.get_sourcing_stats(p_company_id uuid, p_window_days int DEFAULT 7)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_since timestamptz := now() - make_interval(days => p_window_days);
  v_saved int;
  v_rels int;
  v_apps int;
  v_hires int;
BEGIN
  IF v_uid IS NULL OR (NOT public.is_company_member(v_uid, p_company_id) AND NOT public.has_any_admin_role(v_uid)) THEN
    RETURN jsonb_build_object('error','forbidden');
  END IF;

  SELECT COUNT(*) INTO v_saved FROM public.talent_list_members m
    JOIN public.talent_lists l ON l.id = m.list_id
    WHERE l.company_id = p_company_id AND m.added_at >= v_since;

  SELECT COUNT(*) INTO v_rels FROM public.talent_relationships
    WHERE company_id = p_company_id AND created_at >= v_since;

  SELECT COUNT(*) INTO v_apps FROM public.job_applications a
    JOIN public.jobs j ON j.id = a.job_id
    WHERE j.company_id = p_company_id AND a.sourced = true AND a.applied_at >= v_since;

  SELECT COUNT(*) INTO v_hires FROM public.job_applications a
    JOIN public.jobs j ON j.id = a.job_id
    WHERE j.company_id = p_company_id AND a.sourced = true
      AND a.application_status = 'hired' AND a.last_status_at >= v_since;

  RETURN jsonb_build_object(
    'window_days', p_window_days,
    'talents_saved', v_saved,
    'new_relationships', v_rels,
    'sourced_applications', v_apps,
    'sourced_hires', v_hires
  );
END $$;

GRANT EXECUTE ON FUNCTION public.get_sourcing_stats(uuid, int) TO authenticated;

-- ---- company_leads enhancements ----
ALTER TABLE public.company_leads
  ADD COLUMN IF NOT EXISTS linkedin_url text,
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS last_contacted_at timestamptz,
  ADD COLUMN IF NOT EXISTS owner_id uuid;
