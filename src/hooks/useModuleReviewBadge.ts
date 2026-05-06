import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface DigestSummary {
  flagged_quiz: number;
  flagged_scenarios: number;
  quiz_items: number;
  scenario_items: number;
}

export interface ModuleReviewBadge {
  flagged: number;
  summary: DigestSummary | null;
  loading: boolean;
}

const cache = new Map<string, { value: ModuleReviewBadge; expires: number }>();
const TTL = 5 * 60 * 1000;

export function useModuleReviewBadge(moduleId: string | null | undefined): ModuleReviewBadge {
  const [state, setState] = useState<ModuleReviewBadge>(() => {
    if (!moduleId) return { flagged: 0, summary: null, loading: false };
    const c = cache.get(moduleId);
    if (c && c.expires > Date.now()) return c.value;
    return { flagged: 0, summary: null, loading: true };
  });
  const inFlight = useRef(false);

  useEffect(() => {
    if (!moduleId) {
      setState({ flagged: 0, summary: null, loading: false });
      return;
    }
    const c = cache.get(moduleId);
    if (c && c.expires > Date.now()) {
      setState(c.value);
      return;
    }
    if (inFlight.current) return;
    inFlight.current = true;
    setState(s => ({ ...s, loading: true }));

    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("authoring-review-digest", {
          body: { mode: "single", module_id: moduleId, days: 30 },
        });
        if (error) throw error;
        const summary = (data as any)?.summary ?? null;
        const flagged = (summary?.flagged_quiz ?? 0) + (summary?.flagged_scenarios ?? 0);
        const value = { flagged, summary, loading: false };
        cache.set(moduleId, { value, expires: Date.now() + TTL });
        setState(value);
      } catch {
        setState({ flagged: 0, summary: null, loading: false });
      } finally {
        inFlight.current = false;
      }
    })();
  }, [moduleId]);

  return state;
}
