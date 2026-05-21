import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getAbroadGraphMaster,
  upsertGraphRow,
  deleteGraphRow,
} from "@/domains/abroad/repo/abroadRepo";

export interface AbroadApplication { id: string; talent_user_id: string; program_id: string; status: string; created_at: string; }
export interface AbroadProgram { id: string; title: string; institution_id: string; status: string; created_at: string; }
export interface RoadmapLead { id: string; talent_id: string; destination: string; status: string; created_at: string; }
export interface DestinationAgent { id: string; name: string; country: string; status: string; created_at: string; }
export interface IeltsAttempt { id: string; user_id: string; prompt_id: string; score?: number; status: string; created_at: string; }
export interface IeltsResource { id: string; title: string; resource_type: string; status: string; created_at: string; }

export function useAbroadGraph() {
  const queryClient = useQueryClient();

  const abroadGraphQuery = useQuery({
    queryKey: ["abroad_graph_master"],
    queryFn: async () => {
      const master = await getAbroadGraphMaster();

      const applications: AbroadApplication[] = (master.apps ?? []).map((r: any) => ({
        id: r.id, talent_user_id: r.talent_user_id, program_id: r.program_id,
        status: r.stage ?? "unknown", created_at: r.created_at,
      }));
      const programs: AbroadProgram[] = (master.programs ?? []).map((r: any) => ({
        id: r.id, title: r.program_name ?? "Untitled Program",
        institution_id: r.university_name ?? "", status: r.is_active ? "active" : "inactive",
        created_at: r.created_at,
      }));
      const roadmaps: RoadmapLead[] = (master.roadmaps ?? []).map((r: any) => ({
        id: r.id, talent_id: r.talent_id,
        destination: Array.isArray(r.target_countries) && r.target_countries.length > 0 ? String(r.target_countries[0]) : "—",
        status: r.status ?? "pending", created_at: r.created_at,
      }));
      const agents: DestinationAgent[] = (master.agents ?? []).map((r: any) => ({
        id: r.id, name: r.display_name ?? "Unnamed", country: r.country_code ?? "",
        status: r.is_active ? "active" : "inactive", created_at: r.created_at,
      }));
      const ieltsAttempts: IeltsAttempt[] = (master.ielts ?? []).map((r: any) => ({
        id: r.id, user_id: r.user_id, prompt_id: r.prompt_id,
        score: r.ai_band_score ?? undefined,
        status: r.ai_band_score != null ? "scored" : "pending",
        created_at: r.created_at,
      }));
      const ieltsResources: IeltsResource[] = (master.resources ?? []).map((r: any) => ({
        id: r.id, title: r.title ?? "Untitled", resource_type: r.content_type ?? "unknown",
        status: r.is_active ? "active" : "inactive", created_at: r.created_at,
      }));

      return { applications, programs, roadmaps, agents, ieltsAttempts, ieltsResources };
    },
  });

  const createUpsertMutation = (table: string, entityName: string) =>
    useMutation({
      mutationFn: (payload: any) => upsertGraphRow(table, payload),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["abroad_graph_master"] });
        toast.success(`${entityName} synchronized successfully.`);
      },
      onError: (e: Error) => toast.error(`Sync Failed: ${e.message}`),
    });

  const createDeleteMutation = (table: string, entityName: string) =>
    useMutation({
      mutationFn: (id: string) => deleteGraphRow(table, id),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["abroad_graph_master"] });
        toast.success(`${entityName} purged from the network.`);
      },
      onError: (e: Error) => toast.error(`Purge Failed: ${e.message}`),
    });

  return {
    abroadGraphQuery,
    mutations: {
      upsertApplication: createUpsertMutation("abroad_applications", "Application Node"),
      deleteApplication: createDeleteMutation("abroad_applications", "Application Node"),
      upsertProgram: createUpsertMutation("study_abroad_programs", "University Program"),
      deleteProgram: createDeleteMutation("study_abroad_programs", "University Program"),
      upsertRoadmap: createUpsertMutation("study_abroad_roadmaps", "Roadmap Lead"),
      deleteRoadmap: createDeleteMutation("study_abroad_roadmaps", "Roadmap Lead"),
      upsertAgent: createUpsertMutation("destination_agents", "Destination Agent"),
      deleteAgent: createDeleteMutation("destination_agents", "Destination Agent"),
      upsertIeltsAttempt: createUpsertMutation("ielts_mock_attempts", "IELTS Attempt"),
      deleteIeltsAttempt: createDeleteMutation("ielts_mock_attempts", "IELTS Attempt"),
      upsertIeltsResource: createUpsertMutation("ielts_resources", "IELTS Resource"),
      deleteIeltsResource: createDeleteMutation("ielts_resources", "IELTS Resource"),
    },
  };
}
