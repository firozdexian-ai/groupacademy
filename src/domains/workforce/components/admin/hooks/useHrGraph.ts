/**
 * Institutional HR Graph Hook — Phase HR-Z1 Hardened, repo-backed in 10i.2
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getHrGraphMaster,
  upsertGraphRow,
  deleteGraphRow,
} from "@/domains/workforce/repo/workforceRepo";

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

  const hrGraphQuery = useQuery({
    queryKey: ["hr_internal_graph"],
    queryFn: async () => {
      const master = await getHrGraphMaster();

      const headcountByTeam: Record<string, number> = {};
      const headcountByGrade: Record<string, number> = {};
      master.workforce.forEach((member: any) => {
        if (member.team_id) headcountByTeam[member.team_id] = (headcountByTeam[member.team_id] || 0) + 1;
        if (member.grade_id) headcountByGrade[member.grade_id] = (headcountByGrade[member.grade_id] || 0) + 1;
      });

      return {
        verticals: master.verticals as HrVertical[],
        functions: master.functions as HrFunction[],
        teams: master.teams as HrTeam[],
        grades: master.grades as HrGrade[],
        headcountByTeam,
        headcountByGrade,
        totalActiveHeadcount: master.workforce.length,
      };
    },
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["hr_internal_graph"] });

  const makeUpsert = (table: string, label: string) =>
    useMutation({
      mutationFn: async (p: Record<string, any>) => upsertGraphRow(table, p),
      onSuccess: () => {
        invalidate();
        toast.success(`${label} Synchronized`);
      },
    });
  const makeDelete = (table: string, label: string) =>
    useMutation({
      mutationFn: async (id: string) => deleteGraphRow(table, id),
      onSuccess: () => {
        invalidate();
        toast.success(`${label} Purged`);
      },
    });

  const upsertVertical = makeUpsert("hr_verticals", "Vertical Node");
  const deleteVertical = makeDelete("hr_verticals", "Vertical Node");
  const upsertFunction = makeUpsert("hr_functions", "Function Node");
  const deleteFunction = makeDelete("hr_functions", "Function Node");
  const upsertTeam = makeUpsert("hr_teams", "Team Node");
  const deleteTeam = makeDelete("hr_teams", "Team Node");
  const upsertGrade = makeUpsert("hr_grades", "Grade Node");
  const deleteGrade = makeDelete("hr_grades", "Grade Node");

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
