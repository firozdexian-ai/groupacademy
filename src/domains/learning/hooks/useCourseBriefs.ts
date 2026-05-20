import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

/**
 * GroUp Academy: Creator Engine Course Brief Orchestrator
 * CTO Reference: Primary data controller for pedagogical demand modeling.
 * Architecture: Digital Workforce enabled - anomaly monitoring on job provisioning failures.
 * Phase: Z0 Code Freeze Hardened.
 */

export type CourseBrief = {
  id: string;
  title: string;
  summary: string | null;
  syllabus: any;
  mode: "recorded" | "live_cohort" | "hybrid";
  language: string;
  duration_weeks: number | null;
  target_launch: string | null;
  budget_amount: number | null;
  budget_currency: string;
  revenue_share_pct: number;
  required_skills: any;
  status: "draft" | "open" | "filled" | "archived" | "closed";
  content_id: string | null;
  instructor_job_id: string | null;
  instructor_user_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
};

/**
 * Streams all existing course briefs ordered chronologically.
 */
export function useCourseBriefs() {
  return useQuery({
    queryKey: ["course-briefs"],
    staleTime: 5 * 60 * 1000, // 5-minute stability baseline
    queryFn: async (): Promise<CourseBrief[]> => {
      // HUD: EXECUTING_INDEX_SYNC
      const { data, error } = await supabase
        .from("course_briefs" as any)
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("[Digital Workforce] FAULT: course_briefs table selection failure.", {
          message: error.message,
          code: error.code,
        });
        throw error;
      }
      return (data ?? []) as unknown as CourseBrief[];
    },
  });
}

/**
 * Handles initialization and insertion of new content factory mandates.
 */
export function useCreateBrief() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: Partial<CourseBrief>): Promise<CourseBrief> => {
      if (!user?.id) {
        throw new Error("UNAUTHORIZED_IDENTITY_NODE: Authentication required to create brief.");
      }

      // HUD: ATOMIC_INGRESS_TRANSACTION
      const { data, error } = await supabase
        .from("course_briefs" as any)
        .insert({ ...input, created_by: user.id } as any)
        .select()
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!data) {
        // Enforce fallback transparency if row is hidden via strict RLS settings
        throw new Error("Brief saved but could not be read back due to row isolation settings. Refresh screen.");
      }

      return data as unknown as CourseBrief;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["course-briefs"] });
      toast.success("Brief saved");
    },
    onError: (err: any) => {
      console.error("[Digital Workforce] ANOMALY: course_brief creation transaction dropout.", {
        userId: user?.id,
        message: err.message,
      });
      toast.error(err.message ?? "Failed to save brief");
    },
  });
}

/**
 * Triggers the remote edge compiler to translate a brief into an open infrastructure instructor job.
 * Prioritizes Automated Efficiency tracking patterns.
 */
export function usePublishBrief() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (briefId: string) => {
      // HUD: CORE_SWARM_PROVISIONING_TRIGGER
      const { data, error } = await supabase.functions.invoke("create-instructor-job-from-brief", {
        body: { brief_id: briefId },
      });

      if (error) {
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["course-briefs"] });
      toast.success("Brief published — instructor job is now open");
    },
    onError: (err: any) => {
      // Digital Workforce Sensor: Critical interceptor for background orchestration faults
      console.error("[Digital Workforce] ANOMALY: create-instructor-job-from-brief edge runtime failure.", {
        briefId: err.brief_id,
        message: err.message,
      });
      toast.error(err.message ?? "Failed to publish brief");
    },
  });
}
