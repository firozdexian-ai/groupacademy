/**
 * Institutional HR Graph Hook — Phase HR-Z1 Hardened
 * CTO Version: May 2026
 * Fixes: W8 (Hook Factory Anti-pattern), W2 (Headcount Rollups)
 * Purpose: Authoritative source for Org Chart taxonomy and headcount telemetry.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface HrVertical {
  id: string;
  name: string;
  description: string | null;
}
export interface HrFunction {
  id: string;
  name: string;
  vertical_id: string;
}
export interface HrTeam {
  id: string;
  name: string;
  function_id: string;
  lead_user_id: string | null;
}
export interface HrGrade {
  id: string;
  name: string;
  level: number;
  description: string | null;
}

export function useHrGraph() {
  const queryClient = useQueryClient();

  // 1. THE MASTER ORG CHART QUERY (W2 Fix: Validated Rollups)
  const hrGraphQuery = useQuery({
    queryKey: ["hr_internal_graph"],
    queryFn: async () => {
      const [verticalsRes, functionsRes, teamsRes, gradesRes, workforceRes] = await Promise.all([
        supabase.from("hr_verticals").select("*").order("name"),
        supabase.from("hr_functions").select("*").order("name"),
        supabase.from("hr_teams").select("*").order("name"),
        supabase.from("hr_grades").select("*").order("level", { ascending: true }),
        supabase.from("workforce_members").select("id, team_id, grade_id").eq("status", "active"),
      ]);

      if (verticalsRes.error) throw verticalsRes.error;
      if (functionsRes.error) throw functionsRes.error;
      if (teamsRes.error) throw teamsRes.error;
      if (gradesRes.error) throw gradesRes.error;

      // Real-time Headcount Aggregation
      const headcountByTeam: Record<string, number> = {};
      const headcountByGrade: Record<string, number> = {};

      workforceRes.data?.forEach((member: any) => {
        if (member.team_id) headcountByTeam[member.team_id] = (headcountByTeam[member.team_id] || 0) + 1;
        if (member.grade_id) headcountByGrade[member.grade_id] = (headcountByGrade[member.grade_id] || 0) + 1;
      });

      return {
        verticals: verticalsRes.data as HrVertical[],
        functions: functionsRes.data as HrFunction[],
        teams: teamsRes.data as HrTeam[],
        grades: gradesRes.data as HrGrade[],
        headcountByTeam,
        headcountByGrade,
        totalActiveHeadcount: workforceRes.data?.length || 0,
      };
    },
  });

  // 2. HARDENED MUTATION PROTOCOLS (W8 Fix: Static Hook Definition)

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["hr_internal_graph"] });

  // Vertical Mutations
  const upsertVertical = useMutation({
    mutationFn: async (p: Partial<HrVertical>) =>
      p.id ? supabase.from("hr_verticals").update(p as any).eq("id", p.id) : supabase.from("hr_verticals").insert([p as any]),
    onSuccess: () => {
      invalidate();
      toast.success("Vertical Node Synchronized");
    },
  });
  const deleteVertical = useMutation({
    mutationFn: async (id: string) => supabase.from("hr_verticals").delete().eq("id", id),
    onSuccess: () => {
      invalidate();
      toast.success("Vertical Node Purged");
    },
  });

  // Function Mutations
  const upsertFunction = useMutation({
    mutationFn: async (p: Partial<HrFunction>) =>
      p.id ? supabase.from("hr_functions").update(p as any).eq("id", p.id) : supabase.from("hr_functions").insert([p as any]),
    onSuccess: () => {
      invalidate();
      toast.success("Function Node Synchronized");
    },
  });
  const deleteFunction = useMutation({
    mutationFn: async (id: string) => supabase.from("hr_functions").delete().eq("id", id),
    onSuccess: () => {
      invalidate();
      toast.success("Function Node Purged");
    },
  });

  // Team Mutations
  const upsertTeam = useMutation({
    mutationFn: async (p: Partial<HrTeam>) =>
      p.id ? supabase.from("hr_teams").update(p as any).eq("id", p.id) : supabase.from("hr_teams").insert([p as any]),
    onSuccess: () => {
      invalidate();
      toast.success("Team Node Synchronized");
    },
  });
  const deleteTeam = useMutation({
    mutationFn: async (id: string) => supabase.from("hr_teams").delete().eq("id", id),
    onSuccess: () => {
      invalidate();
      toast.success("Team Node Purged");
    },
  });

  // Grade Mutations
  const upsertGrade = useMutation({
    mutationFn: async (p: Partial<HrGrade>) =>
      p.id ? supabase.from("hr_grades").update(p as any).eq("id", p.id) : supabase.from("hr_grades").insert([p as any]),
    onSuccess: () => {
      invalidate();
      toast.success("Grade Node Synchronized");
    },
  });
  const deleteGrade = useMutation({
    mutationFn: async (id: string) => supabase.from("hr_grades").delete().eq("id", id),
    onSuccess: () => {
      invalidate();
      toast.success("Grade Node Purged");
    },
  });

  // Helper selectors for the Deploy Member UI
  const teamsQuery = { data: hrGraphQuery.data?.teams, isLoading: hrGraphQuery.isLoading };
  const gradesQuery = { data: hrGraphQuery.data?.grades, isLoading: hrGraphQuery.isLoading };

  return {
    hrGraphQuery,
    verticalsQuery: { data: hrGraphQuery.data?.verticals, isLoading: hrGraphQuery.isLoading },
    functionsQuery: { data: hrGraphQuery.data?.functions, isLoading: hrGraphQuery.isLoading },
    teamsQuery,
    gradesQuery,
    mutations: {
      upsertVertical,
      deleteVertical,
      upsertFunction,
      deleteFunction,
      upsertTeam,
      deleteTeam,
      upsertGrade,
      deleteGrade,
    },
  };
}
