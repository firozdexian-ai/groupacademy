import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AuthoringTrends = {
  totals: { courses: number; modules: number; items: number; flagged_items: number; translated_items: number };
  flag_breakdown: Record<string, number>;
  ai_assist: { rewrites_applied: number; translations_applied: number };
  hotspots: Array<{ course_id: string; course_title: string; flagged_count: number }>;
  wins: Array<{ course_id: string; course_title: string; resolved_count: number }>;
  window_days: number;
};

export function useAuthoringTrends(instructorId: string | undefined, days = 30) {
  const [data, setData] = useState<AuthoringTrends | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!instructorId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    (supabase.rpc as any)("get_authoring_trends", { _instructor_id: instructorId, _days: days })
      .then(({ data, error }: any) => {
        if (cancelled) return;
        if (error) setError(error.message);
        else setData(data as AuthoringTrends);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [instructorId, days]);

  return { data, loading, error };
}
