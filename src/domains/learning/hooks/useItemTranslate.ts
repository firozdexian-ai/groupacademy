import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { aiItemTranslate, aiItemTranslateApply } from "@/domains/learning/api/learningApi";
import { toast } from "sonner";

/**
 * GroUp Academy: AI Content Localization Engine (V5.6.0)
 * CTO Reference: Authoritative controller for pedagogical translation and regional patching.
 * Architecture: Digital Workforce enabled - logs localization bottlenecks to Admin OS.
 * Phase: Z0 Code Freeze Hardened (2026 Launch Edition).
 */

export const SUPPORTED_TRANSLATION_LANGS = [
  { code: "bn", name: "Bengali" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "ar", name: "Arabic" },
  { code: "hi", name: "Hindi" },
  { code: "id", name: "Indonesian" },
  { code: "pt", name: "Portuguese" },
  { code: "de", name: "German" },
  { code: "ja", name: "Japanese" },
  { code: "zh", name: "Chinese (Simplified)" },
];

export type TranslationDraft = {
  language_code: string;
  language_name: string;
  source: any;
  translated: any;
};

/**
 * Manages the generation and persistence of localized pedagogical assets.
 * Leverages TanStack Mutations for transactional boundary safety.
 */
export function useItemTranslate() {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<TranslationDraft | null>(null);

  // --- ACTION: GENERATE_AI_TRANSLATION ---
  const generateMutation = useMutation({
    mutationFn: async (input: {
      item_id: string;
      item_type: "quiz" | "scenario";
      target_language: string;
    }): Promise<TranslationDraft> => {
      setDraft(null); // Clear previous draft on new request

      // HUD: INVOKING_AI_LOCALIZATION_AGENT
      const data = await aiItemTranslate({
        item_id: input.item_id,
        item_type: input.item_type,
        target_language: input.target_language,
      });

      if (data?.error) throw new Error(data.error);

      const result = data as unknown as TranslationDraft;
      setDraft(result);
      return result;
    },
    onError: (err: any) => {
      // Digital Workforce Anomaly Trigger:
      // Critical for monitoring translation timeouts or semantic localization failures.
      console.error("[Digital Workforce] ANOMALY: ai-item-translate execution failed.", {
        message: err.message,
        timestamp: new Date().toISOString(),
      });
      toast.error(err.message ?? "Translation engine timeout.");
    },
  });

  // --- ACTION: APPLY_LOCALIZED_PATCH ---
  const applyMutation = useMutation({
    mutationFn: async (input: {
      item_id: string;
      item_type: "quiz" | "scenario";
      language_code: string;
      payload: any;
      source?: "ai" | "human";
    }) => {
      // HUD: EXECUTING_LOCALIZATION_PERSISTENCE_handshake
      const data = await aiItemTranslateApply({
        item_id: input.item_id,
        item_type: input.item_type,
        language_code: input.language_code,
        payload: input.payload,
        source: input.source ?? "ai",
      });

      if (data?.error) throw new Error(data.error);

      return data;
    },
    onSuccess: (res, variables) => {
      // Invalidate analytics to reflect localized version availability
      queryClient.invalidateQueries({ queryKey: ["item-analytics", variables.item_id] });
      toast.success(`Translation saved successfully (${variables.language_code})`);
    },
    onError: (err: any) => {
      console.error("[Digital Workforce] ANOMALY: ai-item-translate-apply mutation rejected.", err);
      toast.error(err.message ?? "Failed to save localized version.");
    },
  });

  return {
    generate: generateMutation.mutateAsync,
    apply: applyMutation.mutateAsync,
    draft,
    setDraft,
    loading: generateMutation.isPending,
    applying: applyMutation.isPending,
    error: generateMutation.error || applyMutation.error,
  };
}
