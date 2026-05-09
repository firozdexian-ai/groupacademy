/**
 * Phase 4.1 — Admin Course Briefs.
 * Briefs auto-create a hidden instructor job when published.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

export function useCourseBriefs() {
  return useQuery({
    queryKey: ["course-briefs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("course_briefs" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as CourseBrief[];
    },
  });
}

export function useCreateBrief() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<CourseBrief>) => {
      const { data: u } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("course_briefs" as any)
        .insert({ ...input, created_by: u.user!.id } as any)
        .select()
        .maybeSingle();
      if (error) throw error;
      if (!data) {
        // Insert succeeded but RLS hid the row from us — surface a friendly hint
        // instead of crashing the screen with "Cannot read properties of null".
        throw new Error("Brief saved but could not be read back. Refresh the page to see it.");
      }
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["course-briefs"] });
      toast.success("Brief saved");
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to save brief"),
  });
}

export function usePublishBrief() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (briefId: string) => {
      const { data, error } = await supabase.functions.invoke("create-instructor-job-from-brief", {
        body: { brief_id: briefId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["course-briefs"] });
      toast.success("Brief published — instructor job is now open");
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to publish brief"),
  });
}
