
-- Cleanup
CREATE TABLE IF NOT EXISTS public.reviewer_calibration_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL DEFAULT 'general',
  prompt text NOT NULL,
  reference_answer text NOT NULL,
  rubric jsonb NOT NULL DEFAULT '{}'::jsonb,
  difficulty text NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy','medium','hard')),
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_rci_active ON public.reviewer_calibration_items(is_active, category);
ALTER TABLE public.reviewer_calibration_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin manage calibration items" ON public.reviewer_calibration_items FOR ALL TO authenticated
USING (has_any_admin_role(auth.uid())) WITH CHECK (has_any_admin_role(auth.uid()));
CREATE POLICY "Authenticated read active calibration items" ON public.reviewer_calibration_items FOR SELECT TO authenticated
USING (is_active = true);

CREATE OR REPLACE FUNCTION public.get_reviewer_program_health()
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT jsonb_build_object(
    'reviewers_by_tier', (SELECT jsonb_object_agg(tier, c) FROM (SELECT tier, count(*) c FROM public.reviewer_profiles WHERE status='active' GROUP BY tier) t),
    'assignments_by_status', (SELECT jsonb_object_agg(status, c) FROM (SELECT status, count(*) c FROM public.gig_review_assignments GROUP BY status) t),
    'open_disputes', (SELECT count(*) FROM public.gig_disputes WHERE status NOT IN ('resolved','withdrawn')),
    'avg_panel_agreement', (SELECT round(avg(confidence)::numeric, 2) FROM public.gig_review_assignments WHERE status='submitted'),
    'payouts_30d', (SELECT coalesce(sum(delta),0) FROM public.reviewer_credit_ledger WHERE created_at > now() - interval '30 days')
  );
$$;

-- Projects
CREATE TABLE IF NOT EXISTS public.gig_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  created_by uuid NOT NULL,
  title text NOT NULL,
  summary text,
  category text,
  budget_credits numeric(12,1) NOT NULL DEFAULT 0,
  currency_display text NOT NULL DEFAULT 'BDT',
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','funded','active','completed','cancelled','disputed')),
  starts_at timestamptz,
  due_at timestamptz,
  scope_doc jsonb NOT NULL DEFAULT '{}'::jsonb,
  visibility text NOT NULL DEFAULT 'private' CHECK (visibility IN ('private','invite','public')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_gp_company ON public.gig_projects(company_id, status);
ALTER TABLE public.gig_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Company members view their projects" ON public.gig_projects FOR SELECT TO authenticated
USING (is_company_member(auth.uid(), company_id) OR has_any_admin_role(auth.uid()));
CREATE POLICY "Company admins manage their projects" ON public.gig_projects FOR ALL TO authenticated
USING (is_company_admin(auth.uid(), company_id) OR has_any_admin_role(auth.uid()))
WITH CHECK (is_company_admin(auth.uid(), company_id) OR has_any_admin_role(auth.uid()));
CREATE TRIGGER trg_gig_projects_uat BEFORE UPDATE ON public.gig_projects
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Milestones (no select policy yet)
CREATE TABLE IF NOT EXISTS public.gig_project_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.gig_projects(id) ON DELETE CASCADE,
  gig_id uuid,
  gig_kind text CHECK (gig_kind IN ('quick','marketplace','content')),
  seq int NOT NULL DEFAULT 1,
  title text NOT NULL,
  summary text,
  acceptance_criteria jsonb NOT NULL DEFAULT '{}'::jsonb,
  budget_credits numeric(12,1) NOT NULL DEFAULT 0,
  due_at timestamptz,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','open','in_progress','submitted','approved','revising','rejected','cancelled')),
  submission_id uuid,
  verification_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_gpm_project ON public.gig_project_milestones(project_id, seq);
CREATE INDEX IF NOT EXISTS idx_gpm_status ON public.gig_project_milestones(status);
ALTER TABLE public.gig_project_milestones ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_gpm_uat BEFORE UPDATE ON public.gig_project_milestones
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Assignments
CREATE TABLE IF NOT EXISTS public.gig_project_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  milestone_id uuid NOT NULL REFERENCES public.gig_project_milestones(id) ON DELETE CASCADE,
  talent_id uuid NOT NULL REFERENCES public.talents(id) ON DELETE CASCADE,
  role text,
  split_pct numeric(5,2) NOT NULL DEFAULT 100,
  status text NOT NULL DEFAULT 'invited' CHECK (status IN ('invited','accepted','declined','removed')),
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(milestone_id, talent_id)
);
CREATE INDEX IF NOT EXISTS idx_gpa_milestone ON public.gig_project_assignments(milestone_id);
CREATE INDEX IF NOT EXISTS idx_gpa_talent ON public.gig_project_assignments(talent_id, status);
ALTER TABLE public.gig_project_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Assignments readable by parties" ON public.gig_project_assignments FOR SELECT TO authenticated
USING (
  talent_id IN (SELECT id FROM public.talents WHERE user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.gig_project_milestones m JOIN public.gig_projects p ON p.id = m.project_id
             WHERE m.id = milestone_id AND (is_company_member(auth.uid(), p.company_id) OR has_any_admin_role(auth.uid())))
);
CREATE POLICY "Company admin or talent manages assignments" ON public.gig_project_assignments FOR ALL TO authenticated
USING (
  talent_id IN (SELECT id FROM public.talents WHERE user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.gig_project_milestones m JOIN public.gig_projects p ON p.id = m.project_id
             WHERE m.id = milestone_id AND (is_company_admin(auth.uid(), p.company_id) OR has_any_admin_role(auth.uid())))
)
WITH CHECK (
  talent_id IN (SELECT id FROM public.talents WHERE user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.gig_project_milestones m JOIN public.gig_projects p ON p.id = m.project_id
             WHERE m.id = milestone_id AND (is_company_admin(auth.uid(), p.company_id) OR has_any_admin_role(auth.uid())))
);
CREATE TRIGGER trg_gpa_uat BEFORE UPDATE ON public.gig_project_assignments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Now milestone policies that reference assignments
CREATE POLICY "Milestones visible to company + assigned talents" ON public.gig_project_milestones FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.gig_projects p WHERE p.id = project_id AND (is_company_member(auth.uid(), p.company_id) OR has_any_admin_role(auth.uid())))
  OR EXISTS (SELECT 1 FROM public.gig_project_assignments a JOIN public.talents t ON t.id = a.talent_id
             WHERE a.milestone_id = gig_project_milestones.id AND t.user_id = auth.uid())
);
CREATE POLICY "Company admin manage milestones" ON public.gig_project_milestones FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.gig_projects p WHERE p.id = project_id AND (is_company_admin(auth.uid(), p.company_id) OR has_any_admin_role(auth.uid()))))
WITH CHECK (EXISTS (SELECT 1 FROM public.gig_projects p WHERE p.id = project_id AND (is_company_admin(auth.uid(), p.company_id) OR has_any_admin_role(auth.uid()))));

-- Escrow
CREATE TABLE IF NOT EXISTS public.gig_escrow_accounts (
  project_id uuid PRIMARY KEY REFERENCES public.gig_projects(id) ON DELETE CASCADE,
  balance_credits numeric(12,1) NOT NULL DEFAULT 0,
  held_credits numeric(12,1) NOT NULL DEFAULT 0,
  released_credits numeric(12,1) NOT NULL DEFAULT 0,
  refunded_credits numeric(12,1) NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.gig_escrow_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Escrow accounts visible to company + admin" ON public.gig_escrow_accounts FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.gig_projects p WHERE p.id = project_id AND (is_company_member(auth.uid(), p.company_id) OR has_any_admin_role(auth.uid()))));
CREATE POLICY "Admin only direct escrow account write" ON public.gig_escrow_accounts FOR ALL TO authenticated
USING (has_any_admin_role(auth.uid())) WITH CHECK (has_any_admin_role(auth.uid()));

CREATE TABLE IF NOT EXISTS public.gig_escrow_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.gig_projects(id) ON DELETE CASCADE,
  milestone_id uuid REFERENCES public.gig_project_milestones(id) ON DELETE SET NULL,
  talent_id uuid REFERENCES public.talents(id) ON DELETE SET NULL,
  delta numeric(12,1) NOT NULL,
  kind text NOT NULL CHECK (kind IN ('fund','hold','release','refund','adjustment')),
  reason text,
  actor_id uuid,
  tx_ref text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_gel_project ON public.gig_escrow_ledger(project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gel_milestone ON public.gig_escrow_ledger(milestone_id);
CREATE INDEX IF NOT EXISTS idx_gel_talent ON public.gig_escrow_ledger(talent_id);
ALTER TABLE public.gig_escrow_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Escrow ledger readable to parties" ON public.gig_escrow_ledger FOR SELECT TO authenticated
USING (
  has_any_admin_role(auth.uid())
  OR EXISTS (SELECT 1 FROM public.gig_projects p WHERE p.id = project_id AND is_company_member(auth.uid(), p.company_id))
  OR (talent_id IS NOT NULL AND talent_id IN (SELECT id FROM public.talents WHERE user_id = auth.uid()))
);
CREATE POLICY "Admin only direct escrow ledger write" ON public.gig_escrow_ledger FOR ALL TO authenticated
USING (has_any_admin_role(auth.uid())) WITH CHECK (has_any_admin_role(auth.uid()));

-- Project messages
CREATE TABLE IF NOT EXISTS public.gig_project_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.gig_projects(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  body text NOT NULL,
  attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_gpmsg_project ON public.gig_project_messages(project_id, created_at);
ALTER TABLE public.gig_project_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Project room readable" ON public.gig_project_messages FOR SELECT TO authenticated
USING (
  has_any_admin_role(auth.uid())
  OR EXISTS (SELECT 1 FROM public.gig_projects p WHERE p.id = project_id AND is_company_member(auth.uid(), p.company_id))
  OR EXISTS (SELECT 1 FROM public.gig_project_milestones m JOIN public.gig_project_assignments a ON a.milestone_id = m.id
             JOIN public.talents t ON t.id = a.talent_id
             WHERE m.project_id = gig_project_messages.project_id AND t.user_id = auth.uid())
);
CREATE POLICY "Project room insert by participant" ON public.gig_project_messages FOR INSERT TO authenticated
WITH CHECK (
  sender_id = auth.uid() AND (
    has_any_admin_role(auth.uid())
    OR EXISTS (SELECT 1 FROM public.gig_projects p WHERE p.id = project_id AND is_company_member(auth.uid(), p.company_id))
    OR EXISTS (SELECT 1 FROM public.gig_project_milestones m JOIN public.gig_project_assignments a ON a.milestone_id = m.id
               JOIN public.talents t ON t.id = a.talent_id
               WHERE m.project_id = gig_project_messages.project_id AND t.user_id = auth.uid())
  )
);

-- Invitations
CREATE TABLE IF NOT EXISTS public.gig_project_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.gig_projects(id) ON DELETE CASCADE,
  milestone_id uuid REFERENCES public.gig_project_milestones(id) ON DELETE CASCADE,
  talent_id uuid NOT NULL REFERENCES public.talents(id) ON DELETE CASCADE,
  invited_by uuid NOT NULL,
  note text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined','expired')),
  responded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_gpi_talent ON public.gig_project_invitations(talent_id, status);
CREATE INDEX IF NOT EXISTS idx_gpi_project ON public.gig_project_invitations(project_id);
ALTER TABLE public.gig_project_invitations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Invitations readable by parties" ON public.gig_project_invitations FOR SELECT TO authenticated
USING (
  has_any_admin_role(auth.uid())
  OR talent_id IN (SELECT id FROM public.talents WHERE user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.gig_projects p WHERE p.id = project_id AND is_company_member(auth.uid(), p.company_id))
);
CREATE POLICY "Company admin manage invitations" ON public.gig_project_invitations FOR ALL TO authenticated
USING (has_any_admin_role(auth.uid()) OR EXISTS (SELECT 1 FROM public.gig_projects p WHERE p.id = project_id AND is_company_admin(auth.uid(), p.company_id)))
WITH CHECK (has_any_admin_role(auth.uid()) OR EXISTS (SELECT 1 FROM public.gig_projects p WHERE p.id = project_id AND is_company_admin(auth.uid(), p.company_id)));
CREATE POLICY "Invitee can update own invitation" ON public.gig_project_invitations FOR UPDATE TO authenticated
USING (talent_id IN (SELECT id FROM public.talents WHERE user_id = auth.uid()))
WITH CHECK (talent_id IN (SELECT id FROM public.talents WHERE user_id = auth.uid()));
CREATE TRIGGER trg_gpi_uat BEFORE UPDATE ON public.gig_project_invitations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ==================== RPCs ====================

CREATE OR REPLACE FUNCTION public.create_gig_project(_payload jsonb)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_project_id uuid; v_company_id uuid;
BEGIN
  v_company_id := (_payload->>'company_id')::uuid;
  IF NOT (is_company_admin(auth.uid(), v_company_id) OR has_any_admin_role(auth.uid())) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  INSERT INTO public.gig_projects(
    company_id, created_by, title, summary, category, budget_credits,
    currency_display, starts_at, due_at, scope_doc, visibility
  ) VALUES (
    v_company_id, auth.uid(),
    _payload->>'title', _payload->>'summary', _payload->>'category',
    COALESCE((_payload->>'budget_credits')::numeric, 0),
    COALESCE(_payload->>'currency_display','BDT'),
    NULLIF(_payload->>'starts_at','')::timestamptz,
    NULLIF(_payload->>'due_at','')::timestamptz,
    COALESCE(_payload->'scope_doc','{}'::jsonb),
    COALESCE(_payload->>'visibility','private')
  ) RETURNING id INTO v_project_id;
  INSERT INTO public.gig_escrow_accounts(project_id) VALUES (v_project_id);
  RETURN v_project_id;
END $$;

CREATE OR REPLACE FUNCTION public.add_project_milestone(_project_id uuid, _payload jsonb)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_id uuid; v_seq int; v_company uuid;
BEGIN
  SELECT company_id INTO v_company FROM public.gig_projects WHERE id=_project_id;
  IF NOT (is_company_admin(auth.uid(), v_company) OR has_any_admin_role(auth.uid())) THEN RAISE EXCEPTION 'forbidden'; END IF;
  SELECT COALESCE(MAX(seq),0)+1 INTO v_seq FROM public.gig_project_milestones WHERE project_id=_project_id;
  INSERT INTO public.gig_project_milestones(project_id, seq, title, summary, acceptance_criteria, budget_credits, due_at, gig_kind)
  VALUES (_project_id, v_seq, _payload->>'title', _payload->>'summary',
          COALESCE(_payload->'acceptance_criteria','{}'::jsonb),
          COALESCE((_payload->>'budget_credits')::numeric, 0),
          NULLIF(_payload->>'due_at','')::timestamptz,
          COALESCE(_payload->>'gig_kind','marketplace'))
  RETURNING id INTO v_id;
  RETURN v_id;
END $$;

CREATE OR REPLACE FUNCTION public.fund_gig_project(_project_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_project public.gig_projects; v_balance numeric;
BEGIN
  SELECT * INTO v_project FROM public.gig_projects WHERE id=_project_id FOR UPDATE;
  IF v_project.id IS NULL THEN RAISE EXCEPTION 'not found'; END IF;
  IF NOT (is_company_admin(auth.uid(), v_project.company_id) OR has_any_admin_role(auth.uid())) THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF v_project.status <> 'draft' THEN RAISE EXCEPTION 'project not in draft'; END IF;
  IF v_project.budget_credits <= 0 THEN RAISE EXCEPTION 'budget required'; END IF;
  SELECT balance INTO v_balance FROM public.company_credits WHERE company_id=v_project.company_id FOR UPDATE;
  IF COALESCE(v_balance,0) < v_project.budget_credits THEN RAISE EXCEPTION 'insufficient company credits'; END IF;
  UPDATE public.company_credits SET balance = balance - v_project.budget_credits WHERE company_id=v_project.company_id;
  UPDATE public.gig_escrow_accounts SET balance_credits = balance_credits + v_project.budget_credits, updated_at=now() WHERE project_id=_project_id;
  INSERT INTO public.gig_escrow_ledger(project_id, delta, kind, reason, actor_id)
  VALUES (_project_id, v_project.budget_credits, 'fund', 'Project funded', auth.uid());
  UPDATE public.gig_projects SET status='funded', updated_at=now() WHERE id=_project_id;
  RETURN jsonb_build_object('ok', true, 'funded', v_project.budget_credits);
END $$;

CREATE OR REPLACE FUNCTION public.publish_milestone(_milestone_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_m public.gig_project_milestones; v_p public.gig_projects;
BEGIN
  SELECT * INTO v_m FROM public.gig_project_milestones WHERE id=_milestone_id FOR UPDATE;
  IF v_m.id IS NULL THEN RAISE EXCEPTION 'not found'; END IF;
  SELECT * INTO v_p FROM public.gig_projects WHERE id=v_m.project_id FOR UPDATE;
  IF NOT (is_company_admin(auth.uid(), v_p.company_id) OR has_any_admin_role(auth.uid())) THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF v_p.status NOT IN ('funded','active') THEN RAISE EXCEPTION 'project not funded'; END IF;
  IF v_m.status <> 'draft' THEN RAISE EXCEPTION 'milestone not draft'; END IF;
  UPDATE public.gig_escrow_accounts
    SET balance_credits = balance_credits - v_m.budget_credits,
        held_credits = held_credits + v_m.budget_credits, updated_at=now()
    WHERE project_id=v_p.id;
  INSERT INTO public.gig_escrow_ledger(project_id, milestone_id, delta, kind, reason, actor_id)
  VALUES (v_p.id, v_m.id, v_m.budget_credits, 'hold', 'Milestone published', auth.uid());
  UPDATE public.gig_project_milestones SET status='open', updated_at=now() WHERE id=v_m.id;
  UPDATE public.gig_projects SET status='active', updated_at=now() WHERE id=v_p.id AND status='funded';
  RETURN jsonb_build_object('ok', true);
END $$;

CREATE OR REPLACE FUNCTION public.award_milestone(_milestone_id uuid, _assignments jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_m public.gig_project_milestones; v_p public.gig_projects; v_row jsonb; v_total numeric := 0;
BEGIN
  SELECT * INTO v_m FROM public.gig_project_milestones WHERE id=_milestone_id;
  SELECT * INTO v_p FROM public.gig_projects WHERE id=v_m.project_id;
  IF NOT (is_company_admin(auth.uid(), v_p.company_id) OR has_any_admin_role(auth.uid())) THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF v_m.status <> 'open' THEN RAISE EXCEPTION 'milestone not open'; END IF;
  FOR v_row IN SELECT * FROM jsonb_array_elements(_assignments) LOOP
    v_total := v_total + COALESCE((v_row->>'split_pct')::numeric, 0);
    INSERT INTO public.gig_project_assignments(milestone_id, talent_id, role, split_pct, status, accepted_at)
    VALUES (_milestone_id, (v_row->>'talent_id')::uuid, v_row->>'role',
            COALESCE((v_row->>'split_pct')::numeric, 100), 'accepted', now())
    ON CONFLICT (milestone_id, talent_id) DO UPDATE SET status='accepted', split_pct=EXCLUDED.split_pct, accepted_at=now();
  END LOOP;
  IF abs(v_total - 100) > 0.01 THEN RAISE EXCEPTION 'split must total 100'; END IF;
  UPDATE public.gig_project_milestones SET status='in_progress', updated_at=now() WHERE id=_milestone_id;
  RETURN jsonb_build_object('ok', true);
END $$;

CREATE OR REPLACE FUNCTION public.submit_milestone_deliverables(_milestone_id uuid, _payload jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_m public.gig_project_milestones; v_is_assignee boolean;
BEGIN
  SELECT * INTO v_m FROM public.gig_project_milestones WHERE id=_milestone_id;
  IF v_m.id IS NULL THEN RAISE EXCEPTION 'not found'; END IF;
  SELECT EXISTS(SELECT 1 FROM public.gig_project_assignments a JOIN public.talents t ON t.id=a.talent_id
                WHERE a.milestone_id=_milestone_id AND t.user_id=auth.uid() AND a.status='accepted')
  INTO v_is_assignee;
  IF NOT v_is_assignee THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF v_m.status NOT IN ('in_progress','revising') THEN RAISE EXCEPTION 'wrong state'; END IF;
  UPDATE public.gig_project_milestones
    SET status='submitted', updated_at=now(),
        acceptance_criteria = COALESCE(acceptance_criteria,'{}') || jsonb_build_object('last_submission', _payload, 'submitted_at', now())
    WHERE id=_milestone_id;
  RETURN jsonb_build_object('ok', true);
END $$;

CREATE OR REPLACE FUNCTION public.release_milestone_funds(_milestone_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_m public.gig_project_milestones; v_p public.gig_projects; v_a record; v_share numeric;
BEGIN
  SELECT * INTO v_m FROM public.gig_project_milestones WHERE id=_milestone_id FOR UPDATE;
  SELECT * INTO v_p FROM public.gig_projects WHERE id=v_m.project_id FOR UPDATE;
  IF NOT (is_company_admin(auth.uid(), v_p.company_id) OR has_any_admin_role(auth.uid())) THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF v_m.status NOT IN ('submitted','approved') THEN RAISE EXCEPTION 'wrong state'; END IF;
  FOR v_a IN SELECT * FROM public.gig_project_assignments WHERE milestone_id=_milestone_id AND status='accepted' LOOP
    v_share := round(v_m.budget_credits * v_a.split_pct / 100.0, 1);
    INSERT INTO public.talent_credits(talent_id, balance, earned_balance) VALUES (v_a.talent_id, v_share, v_share)
      ON CONFLICT (talent_id) DO UPDATE SET balance = talent_credits.balance + v_share,
                                            earned_balance = talent_credits.earned_balance + v_share,
                                            updated_at = now();
    INSERT INTO public.gig_escrow_ledger(project_id, milestone_id, talent_id, delta, kind, reason, actor_id)
    VALUES (v_p.id, v_m.id, v_a.talent_id, -v_share, 'release', 'Milestone payout', auth.uid());
  END LOOP;
  UPDATE public.gig_escrow_accounts
    SET held_credits = held_credits - v_m.budget_credits,
        released_credits = released_credits + v_m.budget_credits, updated_at=now()
    WHERE project_id=v_p.id;
  UPDATE public.gig_project_milestones SET status='approved', updated_at=now() WHERE id=_milestone_id;
  IF NOT EXISTS (SELECT 1 FROM public.gig_project_milestones WHERE project_id=v_p.id AND status NOT IN ('approved','cancelled','rejected')) THEN
    UPDATE public.gig_projects SET status='completed', updated_at=now() WHERE id=v_p.id;
  END IF;
  RETURN jsonb_build_object('ok', true);
END $$;

CREATE OR REPLACE FUNCTION public.request_milestone_revision(_milestone_id uuid, _notes text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_company uuid;
BEGIN
  SELECT p.company_id INTO v_company FROM public.gig_project_milestones m JOIN public.gig_projects p ON p.id=m.project_id WHERE m.id=_milestone_id;
  IF NOT (is_company_admin(auth.uid(), v_company) OR has_any_admin_role(auth.uid())) THEN RAISE EXCEPTION 'forbidden'; END IF;
  UPDATE public.gig_project_milestones
    SET status='revising', updated_at=now(),
        acceptance_criteria = COALESCE(acceptance_criteria,'{}') || jsonb_build_object('revision_note', _notes, 'revision_requested_at', now())
    WHERE id=_milestone_id;
  RETURN jsonb_build_object('ok', true);
END $$;

CREATE OR REPLACE FUNCTION public.cancel_milestone(_milestone_id uuid, _reason text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_m public.gig_project_milestones; v_p public.gig_projects; v_refund numeric;
BEGIN
  SELECT * INTO v_m FROM public.gig_project_milestones WHERE id=_milestone_id FOR UPDATE;
  SELECT * INTO v_p FROM public.gig_projects WHERE id=v_m.project_id FOR UPDATE;
  IF NOT (is_company_admin(auth.uid(), v_p.company_id) OR has_any_admin_role(auth.uid())) THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF v_m.status IN ('approved','cancelled') THEN RAISE EXCEPTION 'cannot cancel'; END IF;
  IF v_m.status IN ('draft','open') THEN v_refund := v_m.budget_credits;
  ELSIF v_m.status = 'in_progress' THEN v_refund := round(v_m.budget_credits * 0.5, 1);
  ELSE v_refund := 0;
  END IF;
  IF v_refund > 0 AND v_m.status <> 'draft' THEN
    UPDATE public.gig_escrow_accounts
      SET held_credits = held_credits - v_refund,
          balance_credits = balance_credits + v_refund, updated_at=now()
      WHERE project_id=v_p.id;
    INSERT INTO public.gig_escrow_ledger(project_id, milestone_id, delta, kind, reason, actor_id)
    VALUES (v_p.id, v_m.id, -v_refund, 'refund', COALESCE(_reason,'Milestone cancelled'), auth.uid());
  END IF;
  UPDATE public.gig_project_milestones SET status='cancelled', updated_at=now() WHERE id=_milestone_id;
  RETURN jsonb_build_object('ok', true, 'refunded', v_refund);
END $$;

CREATE OR REPLACE FUNCTION public.cancel_gig_project(_project_id uuid, _reason text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_p public.gig_projects; v_m record; v_balance numeric;
BEGIN
  SELECT * INTO v_p FROM public.gig_projects WHERE id=_project_id FOR UPDATE;
  IF NOT (is_company_admin(auth.uid(), v_p.company_id) OR has_any_admin_role(auth.uid())) THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF v_p.status IN ('completed','cancelled') THEN RAISE EXCEPTION 'cannot cancel'; END IF;
  FOR v_m IN SELECT id FROM public.gig_project_milestones WHERE project_id=_project_id AND status NOT IN ('approved','cancelled') LOOP
    PERFORM public.cancel_milestone(v_m.id, _reason);
  END LOOP;
  SELECT balance_credits INTO v_balance FROM public.gig_escrow_accounts WHERE project_id=_project_id FOR UPDATE;
  IF v_balance > 0 THEN
    UPDATE public.company_credits SET balance = balance + v_balance WHERE company_id=v_p.company_id;
    UPDATE public.gig_escrow_accounts
      SET balance_credits=0, refunded_credits = refunded_credits + v_balance, updated_at=now()
      WHERE project_id=_project_id;
    INSERT INTO public.gig_escrow_ledger(project_id, delta, kind, reason, actor_id)
    VALUES (_project_id, -v_balance, 'refund', COALESCE(_reason,'Project cancelled'), auth.uid());
  END IF;
  UPDATE public.gig_projects SET status='cancelled', updated_at=now() WHERE id=_project_id;
  RETURN jsonb_build_object('ok', true, 'refunded', v_balance);
END $$;

CREATE OR REPLACE FUNCTION public.get_company_project_pipeline(_company_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NOT (is_company_member(auth.uid(), _company_id) OR has_any_admin_role(auth.uid())) THEN RAISE EXCEPTION 'forbidden'; END IF;
  RETURN (
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'project', to_jsonb(p),
      'escrow', to_jsonb(e),
      'milestones', COALESCE((SELECT jsonb_agg(to_jsonb(m) ORDER BY m.seq) FROM public.gig_project_milestones m WHERE m.project_id=p.id), '[]'::jsonb)
    ) ORDER BY p.created_at DESC), '[]'::jsonb)
    FROM public.gig_projects p
    LEFT JOIN public.gig_escrow_accounts e ON e.project_id=p.id
    WHERE p.company_id=_company_id
  );
END $$;

CREATE OR REPLACE FUNCTION public.get_talent_project_workload(_talent_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NOT (EXISTS (SELECT 1 FROM public.talents WHERE id=_talent_id AND user_id=auth.uid()) OR has_any_admin_role(auth.uid())) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  RETURN (
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'milestone', to_jsonb(m), 'project', to_jsonb(p), 'role', a.role, 'split_pct', a.split_pct, 'status', a.status
    ) ORDER BY m.due_at NULLS LAST), '[]'::jsonb)
    FROM public.gig_project_assignments a
    JOIN public.gig_project_milestones m ON m.id=a.milestone_id
    JOIN public.gig_projects p ON p.id=m.project_id
    WHERE a.talent_id=_talent_id AND a.status='accepted'
  );
END $$;
