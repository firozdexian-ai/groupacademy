import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getCompanyWallet,
  getOrgLearningHealth,
  getOrgTeamMastery,
  orgAssignTalents,
  listCompanyCourseAssignments,
  listCompanyLearningSeats,
} from "@/domains/learning/repo/learningRepo";
import { toast } from "sonner";

/**
 * GroUp Academy: B2B Enterprise Console Engine (V5.6.0)
 * CTO Reference: Authoritative controller for organizational learning, seat telemetry, and credit ledgers.
 * Architecture: Digital Workforce enabled - logs enterprise allocation faults to Admin OS.
 * Phase: Z0 Code Freeze Hardened (May 202 launch variant).
 */

export interface OrgLearningHealth {
  completion_rate?: number;
  active_learners?: number;
  total_hours_spent?: number;
  overdue_assignments_count?: number;
  active?: number;
  on_track_pct?: number;
  overdue?: number;
  completed?: number;
  wallet_balance?: number;
  credits_burned_mtd?: number;
}

export interface OrgAssignment {
  id: string;
  company_id: string;
  content_id: string;
  cohort_id: string | null;
  user_id: string;
  status: string;
  due_at: string | null;
  created_at: string;
  content?: { id: string; title: string } | null;
  cohort?: { id: string; name: string } | null;
}

export interface OrgTeamMastery {
  talent_id?: string;
  talent_name?: string;
  user_id?: string;
  topic_tag?: string;
  mastery_score?: number;
  last_evaluated_at?: string;
}

export interface OrgSeat {
  id: string;
  company_id: string;
  content_id: string;
  user_id: string | null;
  status: "available" | "occupied" | "revoked";
  created_at: string;
  content?: { id: string; title: string } | null;
}

export interface OrgWalletData {
  balance: { balance: number; earned_balance: number } | null;
  transactions: any[];
}

// --- SENSORS: ORGANIZATIONAL METRIC OBSERVERS ---

export function useOrgLearningHealth(companyId: string | undefined) {
  return useQuery({
    queryKey: ["org-learning-health", companyId],
    enabled: !!companyId,
    staleTime: 60 * 1000, // 1-minute organizational health consistency boundary
    queryFn: async (): Promise<OrgLearningHealth> => {
      try {
        return await getOrgLearningHealth<OrgLearningHealth>(companyId!);
      } catch (error: any) {
        console.error("[Digital Workforce] FAULT: org_learning_health calculation rejected.", error);
        throw error;
      }
    },

  });
}

export function useOrgAssignments(companyId: string | undefined) {
  return useQuery({
    queryKey: ["org-assignments", companyId],
    enabled: !!companyId,
    queryFn: async (): Promise<OrgAssignment[]> => {
      try {
        const data = await listCompanyCourseAssignments(companyId!);
        return (data ?? []) as unknown as OrgAssignment[];
      } catch (error) {
        console.error("[Digital Workforce] FAULT: company_course_assignments ingress dropped.", error);
        throw error;
      }
    },
  });
}

export function useOrgTeamMastery(companyId: string | undefined, contentId?: string) {
  return useQuery({
    queryKey: ["org-team-mastery", companyId, contentId],
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000, // 5-minute psychometric consistency window for bulk sets
    queryFn: async (): Promise<OrgTeamMastery[]> => {
      try {
        return await getOrgTeamMastery<OrgTeamMastery>({ companyId: companyId!, contentId: contentId ?? null });
      } catch (error: any) {
        console.error("[Digital Workforce] FAULT: org_team_mastery query rejected.", error);
        throw error;
      }
    },

  });
}

export function useOrgSeats(companyId: string | undefined) {
  return useQuery({
    queryKey: ["org-seats", companyId],
    enabled: !!companyId,
    queryFn: async (): Promise<OrgSeat[]> => {
      try {
        const data = await listCompanyLearningSeats(companyId!);
        return (data ?? []) as unknown as OrgSeat[];
      } catch (error) {
        console.error("[Digital Workforce] FAULT: company_learning_seats lookup failed.", error);
        throw error;
      }
    },
  });
}

export function useOrgWallet(companyId: string | undefined) {
  return useQuery({
    queryKey: ["org-wallet", companyId],
    enabled: !!companyId,
    staleTime: 30000, // 30-second balance security window
    queryFn: async (): Promise<OrgWalletData> => {
      // HUD: CONCURRENT_MONETARY_LEDGER_HANDSHAKE
      const wallet = await getCompanyWallet(companyId!);
      return {
        balance: wallet.balance,
        transactions: wallet.transactions,
      };
    },
  });
}

// --- ACTIONS: BULK_RECRUITMENT_MUTATIONS ---

export function useAssignTalents() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      company_id: string;
      content_id: string;
      cohort_id?: string | null;
      user_ids: string[];
      due_at?: string | null;
      budget_per_seat?: number | null;
      note?: string | null;
    }) => {
      try {
        return await orgAssignTalents(input);
      } catch (error: any) {
        console.error("[Digital Workforce] ANOMALY: org_assign_talents bulk operation rejected.", {
          companyId: input.company_id,
          message: error?.message,
        });
        throw error;
      }
    },

    onSuccess: (_, vars) => {
      // Invalidate the full dependency graph to prevent stale presentation grids
      void qc.invalidateQueries({ queryKey: ["org-assignments", vars.company_id] });
      void qc.invalidateQueries({ queryKey: ["org-learning-health", vars.company_id] });
      void qc.invalidateQueries({ queryKey: ["org-wallet", vars.company_id] });
      void qc.invalidateQueries({ queryKey: ["org-seats", vars.company_id] });
      void qc.invalidateQueries({ queryKey: ["org-team-mastery", vars.company_id] });

      toast.success("Enterprise training track assigned to selected talent pool.");
    },
    onError: (err: any) => {
      toast.error(err.message ?? "Bulk assignment failed. Check credit availability.");
    },
  });
}
