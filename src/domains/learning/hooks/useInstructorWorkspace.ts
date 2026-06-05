import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getInstructorSummary,
  listInstructorEarnings,
  listInstructorCreditLedger,
  submitContentForReview,
} from "@/domains/learning/repo/learningRepo";
import { toast } from "sonner";

/**
 * GroUp Academy: Instructor Workspace & Revenue Hub (V5.6.0)
 * CTO Reference: Authoritative sensors for creator earnings, splits, and credit grants.
 * Architecture: Digital Workforce enabled - logs fiscal sync faults to Admin OS.
 * Phase: Z0 Code Freeze Hardened (2026 Launch Edition).
 */

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

export interface InstructorSummary {
  engagements: InstructorEngagement[];
  credits: InstructorCredit[];
  earnings_total: number;
  earnings_pending: number;
}

/**
 * Pulls a high-level aggregation of the instructor's economic state.
 * RPC: get_instructor_summary
 */
export function useInstructorSummary() {
  return useQuery({
    queryKey: ["instructor-summary"],
    staleTime: 5 * 60 * 1000, // 5-minute financial stability window
    queryFn: async (): Promise<InstructorSummary> => {
      // HUD: EXECUTING_RPC_INSTRUCTOR_FINANCIAL_SYNC
      let data: any;
      try {
        data = await getInstructorSummary();
      } catch (error: any) {
        console.error("[Digital Workforce] FAULT: get_instructor_summary sync failure.", error);
        throw error;
      }

      return (
        (data as unknown as InstructorSummary) ?? {
          engagements: [],
          credits: [],
          earnings_total: 0,
          earnings_pending: 0,
        }
      );
    },
  });
}

/**
 * Streams historical revenue split transactions (Hype and Sales).
 */
export function useInstructorEarnings() {
  return useQuery({
    queryKey: ["instructor-earnings"],
    queryFn: async () => {
      try {
        return await listInstructorEarnings(100);
      } catch (error) {
        console.error("[Digital Workforce] FAULT: course_revenue_splits registry sync failed.", error);
        throw error;
      }
    },
  });
}

/**
 * Detailed ledger for content-specific credit consumption.
 */
export function useInstructorCreditLedger(contentId?: string) {
  return useQuery({
    queryKey: ["instructor-credit-ledger", contentId],
    enabled: !!contentId,
    queryFn: async () => {
      return await listInstructorCreditLedger(contentId!, 50);
    },
  });
}

/**
 * Transition content from 'draft' to 'submitted' for pedagogical review.
 */
export function useSubmitForReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (contentId: string) => {
      // HUD: ATOMIC_CONTENT_STATUS_TRANSITION
      await submitContentForReview(contentId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["instructor-summary"] });
      toast.success("Content submitted to the pedagogical board.");
    },
    onError: (err: any) => {
      // Digital Workforce Anomaly Sensor:
      // Critical for identifying content pipeline bottlenecks.
      console.error("[Digital Workforce] ANOMALY: Content submission transaction failed.", err);
      toast.error("Submission failed. Handshake timed out.");
    },
  });
}
