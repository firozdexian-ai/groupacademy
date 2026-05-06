import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";

export interface TutorMasteryContext {
  weak_topics: Array<{ tag: string; mastery: number; attempts: number }>;
  strong_topics: Array<{ tag: string; mastery: number }>;
  due_for_review_count: number;
  credentials: Array<{ tag: string; level: string }>;
  last_scenario: { tag: string; mastery: number; when: string } | null;
}

export function useTutorMasteryContext(opts: {
  enabled?: boolean;
  moduleId?: string;
  contentId?: string;
}) {
  const { talent } = useTalent();
  return useQuery({
    queryKey: ["tutor-mastery-ctx", talent?.id, opts.moduleId, opts.contentId],
    enabled: !!talent?.id && opts.enabled !== false,
    queryFn: async (): Promise<TutorMasteryContext | null> => {
      if (!talent?.id) return null;
      const { data, error } = await supabase.rpc("get_tutor_mastery_context", {
        _talent_id: talent.id,
        _module_id: opts.moduleId || null,
        _content_id: opts.contentId || null,
      });
      if (error) return null;
      return data as unknown as TutorMasteryContext;
    },
    staleTime: 60_000,
  });
}
