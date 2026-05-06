import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type TalentRelStage =
  | "prospect"
  | "contacted"
  | "engaged"
  | "interviewing"
  | "offered"
  | "hired"
  | "passed"
  | "nurture";

export const TALENT_REL_STAGES: { id: TalentRelStage; label: string }[] = [
  { id: "prospect", label: "Prospect" },
  { id: "contacted", label: "Contacted" },
  { id: "engaged", label: "Engaged" },
  { id: "interviewing", label: "Interviewing" },
  { id: "offered", label: "Offered" },
  { id: "hired", label: "Hired" },
  { id: "passed", label: "Passed" },
  { id: "nurture", label: "Nurture" },
];

export interface TalentRelationship {
  id: string;
  company_id: string;
  talent_id: string;
  stage: TalentRelStage;
  owner_id: string | null;
  source: string | null;
  next_step: string | null;
  next_step_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  talent?: {
    id: string;
    full_name: string;
    profile_photo_url: string | null;
    custom_profession: string | null;
    public_handle: string | null;
  } | null;
}

export function useTalentRelationships(companyId?: string | null) {
  return useQuery({
    queryKey: ["talent-relationships", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data } = await supabase
        .from("talent_relationships")
        .select(
          "*, talent:talents(id, full_name, profile_photo_url, custom_profession, public_handle)",
        )
        .eq("company_id", companyId!)
        .order("updated_at", { ascending: false });
      return (data ?? []) as TalentRelationship[];
    },
  });
}

export function useUpsertRelationship() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      companyId: string;
      talentId: string;
      stage?: TalentRelStage;
      source?: string;
    }) => {
      const { data, error } = await supabase
        .from("talent_relationships")
        .upsert(
          {
            company_id: input.companyId,
            talent_id: input.talentId,
            stage: input.stage ?? "prospect",
            source: input.source ?? "sourcing",
          },
          { onConflict: "company_id,talent_id" },
        )
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["talent-relationships"] }),
  });
}

export function useMoveRelationshipStage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; stage: TalentRelStage }) => {
      const { error } = await supabase
        .from("talent_relationships")
        .update({ stage: input.stage })
        .eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["talent-relationships"] }),
  });
}
