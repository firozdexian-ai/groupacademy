import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface InstitutionType {
  id: string;
  key: string;
  label: string;
  sort_order: number;
  created_at: string;
}

export function useInstitutionGraph() {
  const queryClient = useQueryClient();

  // 1. Fetch Dynamic Taxonomy
  const typesQuery = useQuery({
    queryKey: ["institution_types"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("institution_types" as any)
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as InstitutionType[];
    },
  });

  // 2. Fetch Relational Rollups (The Global Graph Connection)
  const useInstitutionRollups = (institutionId: string | null) => {
    return useQuery({
      queryKey: ["institution_rollups", institutionId],
      enabled: !!institutionId,
      queryFn: async () => {
        const client = supabase as any;
        const [talents, programs, competitions] = await Promise.all([
          client.from("talents").select("id", { count: "exact", head: true }).eq("institution_id", institutionId),
          client.from("study_abroad_programs").select("id", { count: "exact", head: true }).eq("institution_id", institutionId),
          client.from("competitions").select("id", { count: "exact", head: true }).eq("institution_id", institutionId),
        ]);
        return {
          talents: talents.count || 0,
          programs: programs.count || 0,
          competitions: competitions.count || 0,
        };
      },
    });
  };

  // 3. Taxonomy Mutations
  const upsertType = useMutation({
    mutationFn: async (payload: Partial<InstitutionType>) => {
      if (payload.id) {
        const { error } = await supabase.from("institution_types" as any).update(payload as any).eq("id", payload.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("institution_types" as any).insert(payload as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["institution_types"] });
      toast.success("Taxonomy Node Synchronized");
    },
    onError: (e: Error) => toast.error(`Sync Failed: ${e.message}`),
  });

  const deleteType = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("institution_types" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["institution_types"] });
      toast.success("Taxonomy Node Purged");
    },
    onError: (e: Error) => toast.error(`Purge Failed: ${e.message}`),
  });

  return {
    typesQuery,
    useInstitutionRollups,
    upsertType,
    deleteType,
  };
}
