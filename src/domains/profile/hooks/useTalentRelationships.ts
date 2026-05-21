import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listTalentRelationships as repoListTalentRelationships,
  upsertTalentRelationship,
  updateTalentRelationshipStage,
} from "@/domains/profile/repo/profileRepo";
import { toast } from "sonner";


/**
 * GroUp Academy: Enterprise CRM & Talent Pipeline Lifecycle Funnel (V5.6.0)
 * CTO Reference: Authoritative transactional interface managing candidate staging states.
 * Architecture: Optimized via TanStack Query v5 with targeted eviction and protective boundaries.
 * Phase: Z0 Code Freeze Hardened (May 2026 Launch Edition).
 */

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
  talent: {
    id: string;
    full_name: string;
    profile_photo_url: string | null;
    custom_profession: string | null;
    public_handle: string | null;
  } | null;
}

// --- SENSORS: PIPELINE STATUS OBSERVERS ---

/**
 * Fetches all candidate relationship logs associated with a specific enterprise company.
 */
export function useTalentRelationships(companyId?: string | null) {
  return useQuery({
    queryKey: ["talent-relationships", companyId],
    enabled: !!companyId,
    staleTime: 30 * 1000, // 30-second pipeline cache consistency boundary
    queryFn: async (): Promise<TalentRelationship[]> => {
      let data: any[];
      try {
        data = await repoListTalentRelationships(companyId!);
      } catch (error) {
        console.error("[Digital Workforce] FAULT: talent_relationships query pipeline dropped.", error);
        throw error;
      }
      return data.map((row: any) => ({
        id: String(row.id),
        company_id: String(row.company_id),
        talent_id: String(row.talent_id),
        stage: (TALENT_REL_STAGES.some((s) => s.id === row.stage) ? row.stage : "prospect") as TalentRelStage,
        owner_id: row.owner_id ? String(row.owner_id) : null,
        source: row.source ? String(row.source) : null,
        next_step: row.next_step ? String(row.next_step) : null,
        next_step_at: row.next_step_at ? String(row.next_step_at) : null,
        notes: row.notes ? String(row.notes) : null,
        created_at: String(row.created_at),
        updated_at: String(row.updated_at),
        talent: row.talent
          ? {
              id: String(row.talent.id),
              full_name: String(row.talent.full_name ?? "Candidate Profile"),
              profile_photo_url: row.talent.profile_photo_url ?? null,
              custom_profession: row.talent.custom_profession ?? null,
              public_handle: row.talent.public_handle ?? null,
            }
          : null,
      }));
    },
  });
}

// --- ACTIONS: PIPELINE MUTATION WORKFLOWS ---

/**
 * Appends or initializes a candidate relationship log row inside a company pipeline.
 */
export function useUpsertRelationship() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: { companyId: string; talentId: string; stage?: TalentRelStage; source?: string }) => {
      try {
        return await upsertTalentRelationship(input);
      } catch (error) {
        console.error("[Digital Workforce] FAULT: talent_relationships upsert transaction rejected.", error);
        throw error;
      }
    },
    onSuccess: (_, variables) => {
      // Evict targeted query line cleanly to maintain corporate dashboard load balance
      void qc.invalidateQueries({
        queryKey: ["talent-relationships", variables.companyId],
        exact: true,
      });
      toast.success("Pipeline status committed successfully.");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to finalize pipeline tracking record.");
    },
  });
}

/**
 * Updates the structural pipeline stage tracking flag for a designated relationship id link.
 */
export function useMoveRelationshipStage(companyId?: string | null) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: { id: string; stage: TalentRelStage }) => {
      try {
        await updateTalentRelationshipStage(input.id, input.stage);
      } catch (error: any) {
        console.error("[Digital Workforce] ANOMALY: talent_relationships update operation rejected.", {
          relationshipId: input.id,
          targetStage: input.stage,
          message: error?.message,
        });
        throw error;
      }
    },
    onSuccess: () => {
      // Clear specific cache branches explicitly to refresh pipeline boards instantly
      void qc.invalidateQueries({ queryKey: ["talent-relationships", companyId] });
      toast.success("Candidate migrated smoothly across your funnel grid.");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to commit stage advancement transaction.");
    },
  });
}
