/**
 * Shared enrollment lookup + create flow used by AppCourseDetail and WebinarEnrollPanel.
 */
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";

export function useEnrollment(contentId: string | undefined) {
  const { talent } = useTalent();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["enrollment", talent?.id, contentId],
    enabled: !!talent?.id && !!contentId,
    queryFn: async () => {
      const { data } = await supabase
        .from("enrollments")
        .select("id, status, enrolled_at, progress")
        .eq("talent_id", talent!.id)
        .eq("content_id", contentId!)
        .maybeSingle();
      return data;
    },
  });

  const invalidate = () =>
    qc.invalidateQueries({ queryKey: ["enrollment", talent?.id, contentId] });

  return { ...query, invalidate };
}
