/**
 * Phase 4.1 — Instructor Workspace hooks.
 * Closed-loop: instructors are only seeded via accepted offers on instructor briefs.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type InstructorEngagement = {
  id: string;
  content_id: string;
  title: string | null;
  slug: string | null;
  role: string;
  status: string;
  revenue_share_pct: number;
  author_status: string | null;
};

export type InstructorCredit = {
  content_id: string;
  balance: number;
  monthly_grant: number;
};

export type InstructorSummary = {
  engagements: InstructorEngagement[];
  credits: InstructorCredit[];
  earnings_total: number;
  earnings_pending: number;
};

export function useInstructorSummary() {
  return useQuery({
    queryKey: ["instructor-summary"],
    queryFn: async (): Promise<InstructorSummary> => {
      const { data, error } = await supabase.rpc("get_instructor_summary" as any);
      if (error) throw error;
      return (data as any) ?? { engagements: [], credits: [], earnings_total: 0, earnings_pending: 0 };
    },
  });
}

export function useInstructorEarnings() {
  return useQuery({
    queryKey: ["instructor-earnings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("course_revenue_splits" as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useInstructorCreditLedger(contentId?: string) {
  return useQuery({
    queryKey: ["instructor-credit-ledger", contentId],
    enabled: !!contentId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("instructor_credit_ledger" as any)
        .select("*")
        .eq("content_id", contentId!)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useSubmitForReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (contentId: string) => {
      const { error } = await supabase
        .from("content")
        .update({
          author_status: "submitted",
          submitted_at: new Date().toISOString(),
        } as any)
        .eq("id", contentId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["instructor-summary"] }),
  });
}
