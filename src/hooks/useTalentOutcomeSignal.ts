import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface TalentOutcomeSignal {
  verified_skills: Array<{
    id: string;
    topic_tag: string;
    level: "foundational" | "proficient" | "expert";
    mastery_at_issue: number;
    verify_code: string;
    issued_at: string;
  }>;
  tracks_completed: Array<{
    assignment_id: string;
    track_id: string;
    track_title: string;
    track_slug: string;
    sponsor_company_id: string | null;
    sponsor_company_name: string | null;
    sponsor_company_logo: string | null;
    completed_at: string | null;
    certificate_code: string | null;
  }>;
  mastery_summary: {
    tracked_topics: number;
    avg_mastery: number;
    strong_topics: Array<{ topic_tag: string; mastery: number }>;
    weak_topic_count: number;
  } | null;
  learning_recency_score: number;
  last_activity_at: string | null;
}

export function useTalentOutcomeSignal(talentId?: string | null) {
  const [signal, setSignal] = useState<TalentOutcomeSignal | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!talentId) {
      setSignal(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      const { data, error } = await supabase.rpc("get_talent_outcome_signal", {
        _talent_id: talentId,
      });
      if (cancelled) return;
      if (error) {
        console.warn("[outcome-signal]", error);
        setSignal(null);
      } else {
        setSignal(data as unknown as TalentOutcomeSignal);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [talentId]);

  return { signal, loading };
}
