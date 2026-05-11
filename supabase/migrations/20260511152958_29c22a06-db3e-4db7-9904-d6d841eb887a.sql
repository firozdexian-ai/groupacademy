
CREATE EXTENSION IF NOT EXISTS vector;

-- 1. Master templates
CREATE TABLE IF NOT EXISTS public.workforce_master_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_key VARCHAR NOT NULL UNIQUE,
  name VARCHAR NOT NULL,
  description TEXT,
  base_system_prompt TEXT NOT NULL,
  default_model VARCHAR DEFAULT 'google/gemini-2.5-flash',
  base_message_credit_cost NUMERIC DEFAULT 1.0,
  capabilities JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 2. Hired instances
CREATE TABLE IF NOT EXISTS public.workforce_hired_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.workforce_master_templates(id) ON DELETE RESTRICT,
  tenant_id UUID NOT NULL,
  cluster_geo_id VARCHAR,
  name_override VARCHAR,
  prompt_override TEXT,
  model_override VARCHAR,
  status VARCHAR NOT NULL DEFAULT 'provisioning'
    CHECK (status IN ('provisioning','active','paused','terminated')),
  kill_switch BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_workforce_instances_tenant   ON public.workforce_hired_instances(tenant_id);
CREATE INDEX IF NOT EXISTS idx_workforce_instances_template ON public.workforce_hired_instances(template_id);
CREATE INDEX IF NOT EXISTS idx_workforce_instances_geo      ON public.workforce_hired_instances(cluster_geo_id);

-- 3. Instance credentials
CREATE TABLE IF NOT EXISTS public.workforce_instance_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id UUID NOT NULL REFERENCES public.workforce_hired_instances(id) ON DELETE CASCADE,
  channel_provider VARCHAR NOT NULL
    CHECK (channel_provider IN ('telegram','whatsapp','messenger','web')),
  bot_token TEXT,
  webhook_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE (instance_id, channel_provider)
);

CREATE INDEX IF NOT EXISTS idx_workforce_creds_instance ON public.workforce_instance_credentials(instance_id);

-- 4. Instance tools
CREATE TABLE IF NOT EXISTS public.workforce_instance_tools (
  instance_id UUID NOT NULL REFERENCES public.workforce_hired_instances(id) ON DELETE CASCADE,
  tool_key VARCHAR NOT NULL,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  PRIMARY KEY (instance_id, tool_key)
);

-- updated_at triggers (reuse existing helper if present)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'set_updated_at_workforce') THEN
    CREATE OR REPLACE FUNCTION public.set_updated_at_workforce()
    RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $f$
    BEGIN NEW.updated_at = timezone('utc', now()); RETURN NEW; END;
    $f$;
  END IF;
END$$;

DROP TRIGGER IF EXISTS trg_workforce_templates_updated ON public.workforce_master_templates;
CREATE TRIGGER trg_workforce_templates_updated
  BEFORE UPDATE ON public.workforce_master_templates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_workforce();

DROP TRIGGER IF EXISTS trg_workforce_instances_updated ON public.workforce_hired_instances;
CREATE TRIGGER trg_workforce_instances_updated
  BEFORE UPDATE ON public.workforce_hired_instances
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_workforce();

-- 5. RLS
ALTER TABLE public.workforce_master_templates    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workforce_hired_instances     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workforce_instance_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workforce_instance_tools      ENABLE ROW LEVEL SECURITY;

-- Helper: is the caller an active member of a given company/tenant?
CREATE OR REPLACE FUNCTION public.is_tenant_member(_tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.company_members
    WHERE company_id = _tenant_id
      AND user_id = auth.uid()
      AND status = 'active'
  );
$$;

-- Templates: readable by any authenticated user; admin-only writes
DROP POLICY IF EXISTS "templates_read_authenticated" ON public.workforce_master_templates;
CREATE POLICY "templates_read_authenticated"
  ON public.workforce_master_templates FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "templates_admin_write" ON public.workforce_master_templates;
CREATE POLICY "templates_admin_write"
  ON public.workforce_master_templates FOR ALL
  TO authenticated
  USING (public.has_any_admin_role(auth.uid()))
  WITH CHECK (public.has_any_admin_role(auth.uid()));

-- Hired instances: tenant members or admins
DROP POLICY IF EXISTS "instances_tenant_or_admin_read" ON public.workforce_hired_instances;
CREATE POLICY "instances_tenant_or_admin_read"
  ON public.workforce_hired_instances FOR SELECT
  TO authenticated
  USING (public.has_any_admin_role(auth.uid()) OR public.is_tenant_member(tenant_id));

DROP POLICY IF EXISTS "instances_tenant_or_admin_write" ON public.workforce_hired_instances;
CREATE POLICY "instances_tenant_or_admin_write"
  ON public.workforce_hired_instances FOR ALL
  TO authenticated
  USING (public.has_any_admin_role(auth.uid()) OR public.is_tenant_member(tenant_id))
  WITH CHECK (public.has_any_admin_role(auth.uid()) OR public.is_tenant_member(tenant_id));

-- Credentials: admin-only (bot tokens are sensitive)
DROP POLICY IF EXISTS "credentials_admin_only" ON public.workforce_instance_credentials;
CREATE POLICY "credentials_admin_only"
  ON public.workforce_instance_credentials FOR ALL
  TO authenticated
  USING (public.has_any_admin_role(auth.uid()))
  WITH CHECK (public.has_any_admin_role(auth.uid()));

-- Instance tools: tenant members or admins
DROP POLICY IF EXISTS "instance_tools_tenant_or_admin" ON public.workforce_instance_tools;
CREATE POLICY "instance_tools_tenant_or_admin"
  ON public.workforce_instance_tools FOR ALL
  TO authenticated
  USING (
    public.has_any_admin_role(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.workforce_hired_instances i
      WHERE i.id = workforce_instance_tools.instance_id
        AND public.is_tenant_member(i.tenant_id)
    )
  )
  WITH CHECK (
    public.has_any_admin_role(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.workforce_hired_instances i
      WHERE i.id = workforce_instance_tools.instance_id
        AND public.is_tenant_member(i.tenant_id)
    )
  );
