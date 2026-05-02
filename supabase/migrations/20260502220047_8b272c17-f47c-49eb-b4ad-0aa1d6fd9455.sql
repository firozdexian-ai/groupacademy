
-- Professional Roles (child of profession_categories)
CREATE TABLE public.professional_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profession_category_id uuid NOT NULL REFERENCES public.profession_categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  description text,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (profession_category_id, slug)
);
CREATE INDEX idx_professional_roles_category ON public.professional_roles(profession_category_id);
ALTER TABLE public.professional_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active professional roles"
  ON public.professional_roles FOR SELECT
  USING (is_active = true);
CREATE POLICY "Admins manage professional roles"
  ON public.professional_roles
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Talent exec can view professional roles"
  ON public.professional_roles FOR SELECT
  USING (has_role(auth.uid(), 'talent_exec'::app_role));

-- Talent ↔ Professional Role link
ALTER TABLE public.talents
  ADD COLUMN IF NOT EXISTS professional_role_id uuid
  REFERENCES public.professional_roles(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_talents_professional_role ON public.talents(professional_role_id);

-- Aisha onboarding conversation log
CREATE TABLE public.aisha_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text UNIQUE NOT NULL,
  email text,
  name text,
  country text,
  phone text,
  last_step text,
  message_count integer DEFAULT 0,
  abandoned boolean DEFAULT false,
  completed_at timestamptz,
  talent_id uuid REFERENCES public.talents(id) ON DELETE SET NULL,
  raw_messages jsonb DEFAULT '[]'::jsonb,
  started_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_aisha_conv_started ON public.aisha_conversations(started_at DESC);
CREATE INDEX idx_aisha_conv_step ON public.aisha_conversations(last_step);
ALTER TABLE public.aisha_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage aisha conversations"
  ON public.aisha_conversations
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Talent exec view aisha conversations"
  ON public.aisha_conversations FOR SELECT
  USING (has_role(auth.uid(), 'talent_exec'::app_role));

-- Super-admin notification stream (separate from user notifications)
CREATE TABLE public.admin_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  link text,
  metadata jsonb DEFAULT '{}'::jsonb,
  is_read boolean DEFAULT false,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_admin_notifications_unread ON public.admin_notifications(is_read, created_at DESC);
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins manage admin notifications"
  ON public.admin_notifications
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- Trigger: notify super admin on new talent
CREATE OR REPLACE FUNCTION public.notify_admin_on_new_talent()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.admin_notifications (type, title, message, link, metadata)
  VALUES (
    'new_talent',
    'New talent onboarded',
    COALESCE(NEW.full_name, NEW.email, 'A new talent') || ' just joined the platform',
    '/dashboard?tab=talent&id=' || NEW.id::text,
    jsonb_build_object('talent_id', NEW.id, 'email', NEW.email, 'country', NEW.country)
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_admin_on_new_talent ON public.talents;
CREATE TRIGGER trg_notify_admin_on_new_talent
  AFTER INSERT ON public.talents
  FOR EACH ROW EXECUTE FUNCTION public.notify_admin_on_new_talent();

-- updated_at triggers
CREATE TRIGGER trg_professional_roles_updated_at
  BEFORE UPDATE ON public.professional_roles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_aisha_conversations_updated_at
  BEFORE UPDATE ON public.aisha_conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
