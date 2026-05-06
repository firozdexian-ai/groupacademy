// Cohort + session hooks for Phase 4.2
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export function useCohorts(contentId?: string) {
  return useQuery({
    queryKey: ["cohorts", contentId],
    enabled: !!contentId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cohorts").select("*").eq("content_id", contentId!)
        .order("starts_on", { ascending: true, nullsFirst: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCohort(cohortId?: string) {
  return useQuery({
    queryKey: ["cohort", cohortId],
    enabled: !!cohortId,
    queryFn: async () => {
      const { data, error } = await supabase.from("cohorts").select("*, content(id,title,thumbnail_url)").eq("id", cohortId!).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useCohortHealth(cohortId?: string) {
  return useQuery({
    queryKey: ["cohort-health", cohortId],
    enabled: !!cohortId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("cohort_health", { _cohort_id: cohortId! });
      if (error) throw error;
      return Array.isArray(data) ? data[0] : data;
    },
  });
}

export function useCohortSessions(cohortId?: string) {
  return useQuery({
    queryKey: ["cohort-sessions", cohortId],
    enabled: !!cohortId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("course_sessions")
        .select("*")
        .eq("cohort_id", cohortId!)
        .order("scheduled_date", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useUpcomingSessions(limit = 6) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["upcoming-sessions", user?.id, limit],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("upcoming_sessions_for_user", {
        _user_id: user!.id, _limit: limit,
      });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useMarkAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (sessionId: string) => {
      const { error } = await supabase.rpc("mark_session_attendance", { _session_id: sessionId });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["session-attendance"] }),
  });
}

export function useInstructorAttendance(sessionId?: string) {
  return useQuery({
    queryKey: ["session-attendance", sessionId],
    enabled: !!sessionId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("instructor_session_attendance", { _session_id: sessionId! });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useSaveSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: any) => {
      const { id, ...rest } = input;
      if (id) {
        const { error } = await supabase.from("course_sessions").update(rest).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("course_sessions").insert(rest);
        if (error) throw error;
      }
    },
    onSuccess: (_, vars: any) => {
      qc.invalidateQueries({ queryKey: ["cohort-sessions", vars.cohort_id] });
    },
  });
}

export function useSaveCohort() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: any) => {
      const { id, ...rest } = input;
      if (id) {
        const { error } = await supabase.from("cohorts").update(rest).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("cohorts").insert(rest);
        if (error) throw error;
      }
    },
    onSuccess: (_, vars: any) => {
      qc.invalidateQueries({ queryKey: ["cohorts", vars.content_id] });
    },
  });
}
