import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { aiItemApply, aiItemRewrite } from "@/domains/learning/api/learningApi";
import { toast } from "sonner";

/**
 * GroUp Academy: AI Pedagogical Refactor Engine (V5.6.0)
 * CTO Reference: Authoritative controller for item rewrites and automated version patching.
 * Architecture: Digital Workforce enabled - logs AI pipeline exceptions to Admin OS.
 * Phase: Z0 Code Freeze Hardened.
 */

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

/**
 * Orchestrates the AI-driven refactoring of pedagogical assets.
 * Leverages TanStack Mutations for transactional state management.
 */
export function useItemRewrite() {
  const queryClient = useQueryClient();

  // --- ACTION: GENERATE_REWRITE_SUGGESTIONS ---
  const generateMutation = useMutation({
    mutationFn: async (input: {
      kind: RewriteKind;
      itemId: string;
      flags: string[];
      notes?: string;
    }): Promise<RewriteResult> => {
      // HUD: INVOKING_AI_REWRITE_AGENT
      const res = await aiItemRewrite({
        kind: input.kind,
        item_id: input.itemId,
        flags: input.flags,
        notes: input.notes,
      });

      if (res?.error) throw new Error(res.error);

      return res as unknown as RewriteResult;
    },
    onError: (err: any) => {
      // Digital Workforce Anomaly Trigger:
      // Critical for monitoring LLM semantic drift or edge function timeouts.
      console.error("[Digital Workforce] ANOMALY: ai-item-rewrite execution failed.", {
        message: err.message,
        timestamp: new Date().toISOString(),
      });
      toast.error(`Refactor engine timeout: ${err.message}`);
    },
  });

  // --- ACTION: APPLY_CHOSEN_REFACTOR ---
  const applyMutation = useMutation({
    mutationFn: async (input: { kind: RewriteKind; itemId: string; patch: any; flagsAddressed: string[] }) => {
      // HUD: EXECUTING_REVISION_PATCH_handshake
      const res = await aiItemApply({
        kind: input.kind,
        item_id: input.itemId,
        patch: input.patch,
        flags_addressed: input.flagsAddressed,
      });

      if (res?.error) throw new Error(res.error);

      return res as unknown as { ok: boolean; item_id: string; revision_id: string | null };
    },
    onSuccess: (res, variables) => {
      // Automatic Cache Invalidation:
      // Ensures psychometric sensors immediately reflect the refactored state.
      queryClient.invalidateQueries({ queryKey: ["item-analytics", variables.itemId] });
      toast.success("Item refactored and version-patched successfully.");
    },
    onError: (err: any) => {
      console.error("[Digital Workforce] ANOMALY: ai-item-apply mutation rejected.", err);
      toast.error("Handshake failed. Database revision not committed.");
    },
  });

  return {
    generate: generateMutation.mutate,
    apply: applyMutation.mutateAsync,
    reset: generateMutation.reset,
    data: generateMutation.data || null,
    loading: generateMutation.isPending,
    applying: applyMutation.isPending,
    error: generateMutation.error?.message || null,
  };
}
