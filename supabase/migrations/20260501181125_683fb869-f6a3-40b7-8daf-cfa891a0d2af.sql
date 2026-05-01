CREATE TABLE IF NOT EXISTS public.instructor_connection_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  talent_id uuid NOT NULL REFERENCES public.talents(id) ON DELETE CASCADE,
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  profession_id uuid,
  instructor_id uuid REFERENCES public.ai_instructors(id) ON DELETE SET NULL,
  message text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_icr_talent ON public.instructor_connection_requests(talent_id);
CREATE INDEX IF NOT EXISTS idx_icr_school ON public.instructor_connection_requests(school_id);

ALTER TABLE public.instructor_connection_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Talent inserts own connection request"
ON public.instructor_connection_requests
FOR INSERT TO authenticated
WITH CHECK (
  talent_id IN (SELECT id FROM public.talents WHERE user_id = auth.uid())
);

CREATE POLICY "Talent views own connection requests"
ON public.instructor_connection_requests
FOR SELECT TO authenticated
USING (
  talent_id IN (SELECT id FROM public.talents WHERE user_id = auth.uid())
);

CREATE POLICY "Admins manage all connection requests"
ON public.instructor_connection_requests
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_icr_updated_at
BEFORE UPDATE ON public.instructor_connection_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.notify_instructor_connection_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_talent_name text;
  v_school_name text;
  v_admin_talent uuid;
BEGIN
  SELECT full_name INTO v_talent_name FROM public.talents WHERE id = NEW.talent_id;
  SELECT name INTO v_school_name FROM public.schools WHERE id = NEW.school_id;

  -- Notify admin talents (notifications.talent_id is NOT NULL FK to talents)
  FOR v_admin_talent IN
    SELECT t.id
    FROM public.user_roles ur
    JOIN public.talents t ON t.user_id = ur.user_id
    WHERE ur.role = 'admin'
  LOOP
    INSERT INTO public.notifications (talent_id, title, message, type, link, icon)
    VALUES (
      v_admin_talent,
      'New instructor connection request',
      COALESCE(v_talent_name, 'A student') || ' is interested in ' || COALESCE(v_school_name, 'a school'),
      'instructor_request',
      '/dashboard/learning/requests',
      'user-plus'
    );
  END LOOP;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_instructor_connection_request_created
AFTER INSERT ON public.instructor_connection_requests
FOR EACH ROW EXECUTE FUNCTION public.notify_instructor_connection_request();