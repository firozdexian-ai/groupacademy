import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SkillCredential {
  id: string;
  talent_id: string;
  topic_tag: string;
  content_id: string | null;
  module_id: string | null;
  level: "foundational" | "proficient" | "expert";
  mastery_at_issue: number;
  attempts_at_issue: number;
  evidence: any;
  verify_code: string;
  issued_at: string;
  revoked_at: string | null;
}

export function useSkillCredentials(talentId?: string | null) {
  return useQuery({
    queryKey: ["skill-credentials", talentId],
    enabled: !!talentId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("skill_credentials")
        .select("*, content:content_id(title, slug)")
        .eq("talent_id", talentId!)
        .is("revoked_at", null)
        .order("issued_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Array<SkillCredential & { content?: any }>;
    },
  });
}

export function useIssueSkillCredentials() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("issue-skill-credentials", {
        body: {},
      });
      if (error) throw error;
      return data as { newly_issued: SkillCredential[]; evaluated: number };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["skill-credentials"] });
    },
  });
}
