
-- Company members link table (multi-user company portal access)
CREATE TABLE IF NOT EXISTS public.company_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner','admin','member')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','invited','revoked')),
  invited_email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_company_members_user ON public.company_members(user_id);
CREATE INDEX IF NOT EXISTS idx_company_members_company ON public.company_members(company_id);

ALTER TABLE public.company_members ENABLE ROW LEVEL SECURITY;

-- Helper: check if user belongs to a company
CREATE OR REPLACE FUNCTION public.is_company_member(_user_id uuid, _company_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.company_members
    WHERE user_id = _user_id AND company_id = _company_id AND status = 'active'
  )
$$;

-- Helper: get all company ids for a user
CREATE OR REPLACE FUNCTION public.user_company_ids(_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT company_id FROM public.company_members
  WHERE user_id = _user_id AND status = 'active'
$$;

-- RLS: users see their own membership rows; admins see all
CREATE POLICY "Members view own membership"
ON public.company_members FOR SELECT
USING (auth.uid() = user_id OR public.has_any_admin_role(auth.uid()));

CREATE POLICY "Admins manage memberships"
ON public.company_members FOR ALL
USING (public.has_any_admin_role(auth.uid()))
WITH CHECK (public.has_any_admin_role(auth.uid()));

CREATE POLICY "Owners manage own company memberships"
ON public.company_members FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.company_members cm
    WHERE cm.company_id = company_members.company_id
      AND cm.user_id = auth.uid()
      AND cm.role IN ('owner','admin')
      AND cm.status = 'active'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.company_members cm
    WHERE cm.company_id = company_members.company_id
      AND cm.user_id = auth.uid()
      AND cm.role IN ('owner','admin')
      AND cm.status = 'active'
  )
);

CREATE TRIGGER trg_company_members_updated_at
BEFORE UPDATE ON public.company_members
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Allow company members to view their own company row
DROP POLICY IF EXISTS "Company members view own company" ON public.companies;
CREATE POLICY "Company members view own company"
ON public.companies FOR SELECT
USING (
  public.has_any_admin_role(auth.uid())
  OR public.is_company_member(auth.uid(), id)
);

-- agent_threads: ensure company subjects can list/insert their own threads
-- (Phase 1 already created RLS; we add a company-aware policy if not present)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='agent_threads') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Company members view company threads" ON public.agent_threads';
    EXECUTE $POL$
      CREATE POLICY "Company members view company threads"
      ON public.agent_threads FOR SELECT
      USING (
        subject_kind = 'company'
        AND subject_id IN (SELECT public.user_company_ids(auth.uid()))
      )
    $POL$;
    EXECUTE 'DROP POLICY IF EXISTS "Company members create company threads" ON public.agent_threads';
    EXECUTE $POL$
      CREATE POLICY "Company members create company threads"
      ON public.agent_threads FOR INSERT
      WITH CHECK (
        subject_kind = 'company'
        AND subject_id IN (SELECT public.user_company_ids(auth.uid()))
      )
    $POL$;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='agent_messages') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Company members view company messages" ON public.agent_messages';
    EXECUTE $POL$
      CREATE POLICY "Company members view company messages"
      ON public.agent_messages FOR SELECT
      USING (
        thread_id IN (
          SELECT id FROM public.agent_threads
          WHERE subject_kind = 'company'
            AND subject_id IN (SELECT public.user_company_ids(auth.uid()))
        )
      )
    $POL$;
  END IF;
END $$;
