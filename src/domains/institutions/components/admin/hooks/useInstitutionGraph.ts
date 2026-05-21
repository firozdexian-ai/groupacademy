/**
 * Institutional Graph & Taxonomy Hook — Phase 10i.2 (repo-backed)
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  listInstitutionTypes,
  upsertGraphRow,
  deleteGraphRow,
} from "@/domains/institutions/repo/institutionsRepo";

export interface InstitutionType {
  id: string;
  key: string;
  label: string;
  sort_order: number;
  created_at: string;
}

export function useInstitutionGraph() {
  const queryClient = useQueryClient();

  const typesQuery = useQuery({
    queryKey: ["institution_types"],
    queryFn: async () => (await listInstitutionTypes()) as InstitutionType[],
  });

  const upsertType = useMutation({
    mutationFn: (payload: Partial<InstitutionType>) =>
      upsertGraphRow("institution_types", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["institution_types"] });
      toast.success("Taxonomy Node Synchronized");
    },
    onError: (e: Error) => toast.error(`Registry Sync Failed: ${e.message}`),
  });

  const deleteType = useMutation({
    mutationFn: (id: string) => deleteGraphRow("institution_types", id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["institution_types"] });
      toast.success("Taxonomy Node Purged");
    },
    onError: (e: Error) => toast.error(`Purge Failed: ${e.message}`),
  });

  return { typesQuery, upsertType, deleteType };
}
