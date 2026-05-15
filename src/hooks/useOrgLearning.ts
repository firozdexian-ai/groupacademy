import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * GroUp Academy: B2B Enterprise Console Engine (V5.6.0)
 * CTO Reference: Authoritative controller for organizational learning, seat telemetry, and credit ledgers.
 * Architecture: Digital Workforce enabled - logs enterprise allocation faults to Admin OS.
 * Phase: Z0 Code Freeze Hardened (May 202 launch variant).
 */

export interface OrgLearningHealth {
  completion_rate: number;
  active_learners: number;
  total_hours_spent: number;
  overdue_assignments_count: number;
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
  talent_id: string;
  talent_name: string;
  topic_tag: string;
  mastery_score: number;
  last_evaluated_at: string;
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
      // HUD: EXECUTING_RPC_ORG_LEARNING_HEALTH
      const { data, error } = await supabase.rpc("org_learning_health", {
        p_company_id: companyId!,
      });

      if (error) {
        console.error("[Digital Workforce] FAULT: org_learning_health calculation rejected.", error);
        throw error;
      }
      return data as OrgLearningHealth;
    },
  });
}

export function useOrgAssignments(companyId: string | undefined) {
  return useQuery({
    queryKey: ["org-assignments", companyId],
    enabled: !!companyId,
    queryFn: async (): Promise<OrgAssignment[]> => {
      const { data, error } = await supabase
        .from("company_course_assignments")
        .select("*, content:content_id(id,title), cohort:cohort_id(id,name)")
        .eq("company_id", companyId!)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("[Digital Workforce] FAULT: company_course_assignments ingress dropped.", error);
        throw error;
      }
      return (data ?? []) as unknown as OrgAssignment[];
    },
  });
}

export function useOrgTeamMastery(companyId: string | undefined, contentId?: string) {
  return useQuery({
    queryKey: ["org-team-mastery", companyId, contentId],
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000, // 5-minute psychometric consistency window for bulk sets
    queryFn: async (): Promise<OrgTeamMastery[]> => {
      // HUD: EXECUTING_RPC_ORG_TEAM_MASTERY
      const { data, error } = await supabase.rpc("org_team_mastery", {
        p_company_id: companyId!,
        p_content_id: contentId ?? null,
      });

      if (error) {
        console.error("[Digital Workforce] FAULT: org_team_mastery query rejected.", error);
        throw error;
      }
      return (data as OrgTeamMastery[]) ?? [];
    },
  });
}

export function useOrgSeats(companyId: string | undefined) {
  return useQuery({
    queryKey: ["org-seats", companyId],
    enabled: !!companyId,
    queryFn: async (): Promise<OrgSeat[]> => {
      const { data, error } = await supabase
        .from("company_learning_seats")
        .select("*, content:content_id(id,title)")
        .eq("company_id", companyId!);

      if (error) {
        console.error("[Digital Workforce] FAULT: company_learning_seats lookup failed.", error);
        throw error;
      }
      return (data ?? []) as unknown as OrgSeat[];
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
      // Wrapped in an atomic bundle to eliminate visual balance desynchronization vectors
      const [balanceResult, transactionsResult] = await Promise.all([
        supabase.from("company_credits").select("balance, earned_balance").eq("company_id", companyId!).maybeSingle(),
        supabase
          .from("company_credit_transactions")
          .select("*")
          .eq("company_id", companyId!)
          .order("created_at", { ascending: false })
          .limit(50),
      ]);

      if (balanceResult.error) {
        console.error("[Digital Workforce] FAULT: company_credits sync failure.", balanceResult.error);
        throw balanceResult.error;
      }
      if (transactionsResult.error) {
        console.error("[Digital Workforce] FAULT: company_credit_transactions ledger drop.", transactionsResult.error);
        throw transactionsResult.error;
      }

      return {
        balance: balanceResult.data,
        transactions: transactionsResult.data ?? [],
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
      // HUD: ATOMIC_BULK_ENTERPRISE_ASSIGNMENT_RPC
      const { data, error } = await supabase.rpc("org_assign_talents", {
        p_company_id: input.company_id,
        p_content_id: input.content_id,
        p_cohort_id: input.cohort_id ?? null,
        p_user_ids: input.user_ids,
        p_due_at: input.due_at ?? null,
        p_budget_per_seat: input.budget_per_seat ?? null,
        p_note: input.note ?? null,
      });

      if (error) {
        // Digital Workforce Anomaly Trigger:
        // Captures business logic blocks (such as fiscal deficits or registration locks)
        console.error("[Digital Workforce] ANOMALY: org_assign_talents bulk operation rejected.", {
          companyId: input.company_id,
          message: error.message,
        });
        throw error;
      }
      return data;
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
