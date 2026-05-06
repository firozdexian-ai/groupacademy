import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type RewriteKind = "quiz" | "scenario";

export interface QuizSuggestion {
  label: string;
  question: string;
  options: string[];
  correct_index: number;
  explanation?: string;
  difficulty: "easy" | "medium" | "hard";
  change_summary: string;
  rationale: string;
}
export interface ScenarioSuggestion {
  label: string;
  title: string;
  scenario_prompt: string;
  rubric: { criterion: string; weight: number; description: string }[];
  difficulty: "easy" | "medium" | "hard";
  change_summary: string;
  rationale: string;
}

export interface RewriteResult {
  kind: RewriteKind;
  item: any;
  flags: string[];
  stats?: any;
  suggestions: (QuizSuggestion | ScenarioSuggestion)[];
}

export function useItemRewrite() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<RewriteResult | null>(null);

  const generate = useCallback(async (
    kind: RewriteKind, itemId: string, flags: string[], notes?: string,
  ) => {
    setLoading(true); setError(null); setData(null);
    try {
      const { data: res, error: e } = await supabase.functions.invoke("ai-item-rewrite", {
        body: { kind, item_id: itemId, flags, notes },
      });
      if (e) throw new Error(e.message);
      if ((res as any)?.error) throw new Error((res as any).error);
      setData(res as RewriteResult);
    } catch (err: any) {
      setError(err?.message ?? "Failed to generate rewrite");
    } finally {
      setLoading(false);
    }
  }, []);

  const apply = useCallback(async (
    kind: RewriteKind, itemId: string, patch: any, flagsAddressed: string[],
  ) => {
    const { data: res, error: e } = await supabase.functions.invoke("ai-item-apply", {
      body: { kind, item_id: itemId, patch, flags_addressed: flagsAddressed },
    });
    if (e) throw new Error(e.message);
    if ((res as any)?.error) throw new Error((res as any).error);
    return res as { ok: boolean; item_id: string; revision_id: string | null };
  }, []);

  const reset = useCallback(() => { setData(null); setError(null); }, []);

  return { loading, error, data, generate, apply, reset };
}
