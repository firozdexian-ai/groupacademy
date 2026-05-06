import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

export function useItemTranslate() {
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [draft, setDraft] = useState<TranslationDraft | null>(null);

  const generate = async (item_id: string, item_type: "quiz" | "scenario", target_language: string) => {
    setLoading(true);
    setDraft(null);
    try {
      const { data, error } = await supabase.functions.invoke("ai-item-translate", {
        body: { item_id, item_type, target_language },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      setDraft(data as TranslationDraft);
      return data as TranslationDraft;
    } catch (e: any) {
      toast.error(e?.message ?? "Translation failed");
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const apply = async (
    item_id: string,
    item_type: "quiz" | "scenario",
    language_code: string,
    payload: any,
    source: "ai" | "human" = "ai",
  ) => {
    setApplying(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-item-translate-apply", {
        body: { item_id, item_type, language_code, payload, source },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      toast.success(`Translation saved (${language_code})`);
      return data;
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to save translation");
      throw e;
    } finally {
      setApplying(false);
    }
  };

  return { loading, applying, draft, setDraft, generate, apply };
}
