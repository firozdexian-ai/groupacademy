import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCurrentUser } from "@/lib/auth";
import {
  listTalentLists as repoListTalentLists,
  listTalentListMembers,
  createTalentList,
  upsertTalentListMember,
} from "@/domains/profile/repo/profileRepo";
import { toast } from "sonner";


/**
 * GroUp Academy: Enterprise Sourcing & Talent Shortlists Engine (V5.6.0)
 * CTO Reference: Authoritative transactional interface managing corporate talent lists.
 * Architecture: Optimized via TanStack Query v5 with targeted invalidation and data boundaries.
 * Phase: Z0 Code Freeze Hardened (May 2026 Launch Edition).
 */

export interface TalentList {
  id: string;
  company_id: string;
  name: string;
  description: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  member_count: number;
}

export interface ListMember {
  id: string;
  list_id: string;
  talent_id: string;
  added_by: string;
  added_at: string;
  note: string | null;
  talents: {
    id: string;
    full_name: string;
    profile_photo_url: string | null;
    custom_profession: string | null;
    country: string | null;
    public_handle: string | null;
  } | null;
}

// --- SENSORS: CORPORATE REGISTRY OBSERVERS ---

/**
 * Fetches all talent lists associated with a specific enterprise company context.
 */
export function useTalentLists(companyId?: string | null) {
  return useQuery({
    queryKey: ["talent-lists", companyId],
    enabled: !!companyId,
    staleTime: 30 * 1000, // 30-second list cache consistency window
    queryFn: async (): Promise<TalentList[]> => {
      let data: any[];
      try {
        data = await repoListTalentLists(companyId!);
      } catch (error) {
        console.error("[Digital Workforce] FAULT: talent_lists collection channel dropped.", error);
        throw error;
      }
      return data.map((row: any) => ({
        id: String(row.id),
        company_id: String(row.company_id),
        name: String(row.name ?? "Untitled Procurement List"),
        description: row.description ?? null,
        created_by: String(row.created_by),
        created_at: String(row.created_at),
        updated_at: String(row.updated_at),
        member_count: Number(row.talent_list_members?.[0]?.count ?? 0),
      }));
    },
  });
}

/**
 * Retrieves the profile records and operational tags for all members of a targeted shortlist.
 */
export function useListMembers(listId?: string | null) {
  return useQuery({
    queryKey: ["talent-list-members", listId],
    enabled: !!listId,
    queryFn: async (): Promise<ListMember[]> => {
      let data: any[];
      try {
        data = await listTalentListMembers(listId!);
      } catch (error) {
        console.error("[Digital Workforce] FAULT: talent_list_members lookup failed.", error);
        throw error;
      }
      return data.map((row: any) => ({
        id: String(row.id),
        list_id: String(row.list_id),
        talent_id: String(row.talent_id),
        added_by: String(row.added_by),
        added_at: String(row.added_at),
        note: row.note ?? null,
        talents: row.talents
          ? {
              id: String(row.talents.id),
              full_name: String(row.talents.full_name ?? "Candidate Node"),
              profile_photo_url: row.talents.profile_photo_url ?? null,
              custom_profession: row.talents.custom_profession ?? null,
              country: row.talents.country ?? null,
              public_handle: row.talents.public_handle ?? null,
            }
          : null,
      }));
    },
  });
}

// --- ACTIONS: PIPELINE_MUTATION_WORKFLOWS ---

/**
 * Initializes a new corporate talent bucket folder ledger record.
 */
export function useCreateTalentList() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: { companyId: string; name: string; description?: string }) => {
      const user = await getCurrentUser();
      if (!user) throw new Error("Authentication session required.");

      try {
        return await createTalentList({
          companyId: input.companyId,
          name: input.name,
          description: input.description ?? null,
          createdBy: user.id,
        });
      } catch (error) {
        console.error("[Digital Workforce] FAULT: talent_lists registry insertion rejected.", error);
        throw error;
      }
    },
    onSuccess: (_, variables) => {
      // Target invalidation to protect sibling corporate views from reload thashing
      void qc.invalidateQueries({
        queryKey: ["talent-lists", variables.companyId],
        exact: true,
      });
      toast.success("Sourcing shortlist initialized successfully.");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to finalize new talent shortlist record.");
    },
  });
}

/**
 * Appends a talent identity node to an active pipeline list folder record.
 */
export function useAddToList() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: { listId: string; talentId: string; note?: string; companyId: string }) => {
      const user = await getCurrentUser();
      if (!user) throw new Error("Authentication session required.");

      try {
        await upsertTalentListMember({
          listId: input.listId,
          talentId: input.talentId,
          addedBy: user.id,
          note: input.note ?? null,
        });
      } catch (error: any) {
        console.error("[Digital Workforce] ANOMALY: talent_list_members operation rejected.", {
          listId: input.listId,
          talentId: input.talentId,
          message: error?.message,
        });
        throw error;
      }
    },
    onSuccess: (_, variables) => {
      // Evict specific cache lines cleanly to update counters instantly across UI shells
      void qc.invalidateQueries({ queryKey: ["talent-list-members", variables.listId] });
      void qc.invalidateQueries({ queryKey: ["talent-lists", variables.companyId] });

      toast.success("Candidate node appended to your active sourcing list.");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to commit candidate link transaction.");
    },
  });
}
