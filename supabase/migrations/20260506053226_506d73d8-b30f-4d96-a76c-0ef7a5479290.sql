CREATE OR REPLACE FUNCTION public.fn_notify_course_completed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_talent_id uuid;
  v_title text;
  v_slug text;
BEGIN
  IF NEW.status = 'completed'
     AND (OLD.status IS DISTINCT FROM 'completed')
     AND NEW.completed_at IS NOT NULL
  THEN
    v_talent_id := COALESCE(NEW.talent_id, NEW.student_id);
    SELECT title, slug INTO v_title, v_slug FROM public.content WHERE id = NEW.content_id;

    IF v_talent_id IS NOT NULL THEN
      INSERT INTO public.notifications (talent_id, type, title, message, icon, link)
      VALUES (
        v_talent_id,
        'course_completed',
        'Course completed!',
        COALESCE('You finished ' || v_title || '. Claim your certificate.', 'You completed a course. Claim your certificate.'),
        'graduation-cap',
        COALESCE('/app/learning/courses/' || v_slug || '/certificate', '/app/learning/my-courses')
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_course_completed ON public.enrollments;
CREATE TRIGGER trg_notify_course_completed
AFTER UPDATE OF status ON public.enrollments
FOR EACH ROW
EXECUTE FUNCTION public.fn_notify_course_completed();