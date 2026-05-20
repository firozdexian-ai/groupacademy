/**
 * Institutional Graph & Taxonomy Hook — Phase INST-Z2 Hardened
 * CTO Version: May 2026
 * Fixes: D1 (Removed dead client-side rollup logic)
 */
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

  // 1. Fetch Dynamic Taxonomy (The Classification Framework)
  const typesQuery = useQuery({
    queryKey: ["institution_types"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("institution_types")
        .select("*")
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return (data ?? []) as InstitutionType[];
    },
  });

  // 2. Taxonomy Mutations (Administrative Controls)
  const upsertType = useMutation({
    mutationFn: async (payload: Partial<InstitutionType>) => {
      const { id, ...data } = payload;

      const query = id
        ? supabase.from("institution_types").update(data).eq("id", id)
        : supabase.from("institution_types").insert([data as any]);

      const { error } = await query;
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["institution_types"] });
      toast.success("Taxonomy Node Synchronized");
    },
    onError: (e: Error) => toast.error(`Registry Sync Failed: ${e.message}`),
  });

  const deleteType = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("institution_types").delete().eq("id", id);

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
    upsertType,
    deleteType,
  };
}
