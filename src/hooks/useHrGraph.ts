import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface HrVertical { id: string; name: string; description: string | null; }
export interface HrFunction { id: string; name: string; vertical_id: string; }
export interface HrTeam { id: string; name: string; function_id: string; lead_user_id: string | null; }
export interface HrGrade { id: string; name: string; level: number; description: string | null; }

export function useHrGraph() {
  const queryClient = useQueryClient();
  const client = supabase as any;

  // 1. The Master Org Chart Query
  const hrGraphQuery = useQuery({
    queryKey: ["hr_internal_graph"],
    queryFn: async () => {
      const [verticalsRes, functionsRes, teamsRes, gradesRes, workforceRes] = await Promise.all([
        client.from("hr_verticals").select("*").order("name"),
        client.from("hr_functions").select("*").order("name"),
        client.from("hr_teams").select("*").order("name"),
        client.from("hr_grades").select("*").order("level", { ascending: true }),
        client.from("workforce_members").select("id, team_id, grade_id, status").eq("status", "active"),
      ]);

      if (verticalsRes.error) throw verticalsRes.error;
      if (functionsRes.error) throw functionsRes.error;
      if (teamsRes.error) throw teamsRes.error;
      if (gradesRes.error) throw gradesRes.error;

      // Calculate Headcount Rollups
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

  // 2. Generic Mutation Generator
  const createUpsertMutation = (table: string, entityName: string) => {
    return useMutation({
      mutationFn: async (payload: any) => {
        if (payload.id) {
          const { error } = await client.from(table).update(payload).eq("id", payload.id);
          if (error) throw error;
        } else {
          const { error } = await client.from(table).insert(payload);
          if (error) throw error;
        }
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["hr_internal_graph"] });
        toast.success(`${entityName} synchronized successfully.`);
      },
      onError: (e: Error) => toast.error(`Sync Failed: ${e.message}`),
    });
  };

  const createDeleteMutation = (table: string, entityName: string) => {
    return useMutation({
      mutationFn: async (id: string) => {
        const { error } = await client.from(table).delete().eq("id", id);
        if (error) throw error;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["hr_internal_graph"] });
        toast.success(`${entityName} purged from the graph.`);
      },
      onError: (e: Error) => toast.error(`Purge Failed: ${e.message}`),
    });
  };

  return {
    hrGraphQuery,
    mutations: {
      upsertVertical: createUpsertMutation("hr_verticals", "Vertical Node"),
      deleteVertical: createDeleteMutation("hr_verticals", "Vertical Node"),
      upsertFunction: createUpsertMutation("hr_functions", "Function Node"),
      deleteFunction: createDeleteMutation("hr_functions", "Function Node"),
      upsertTeam: createUpsertMutation("hr_teams", "Team Node"),
      deleteTeam: createDeleteMutation("hr_teams", "Team Node"),
      upsertGrade: createUpsertMutation("hr_grades", "Grade Node"),
      deleteGrade: createDeleteMutation("hr_grades", "Grade Node"),
    },
  };
}
