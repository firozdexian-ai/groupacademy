import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TalentList {
  id: string;
  company_id: string;
  name: string;
  description: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  member_count?: number;
}

export function useTalentLists(companyId?: string | null) {
  return useQuery({
    queryKey: ["talent-lists", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data } = await supabase
        .from("talent_lists")
        .select("*, talent_list_members(count)")
        .eq("company_id", companyId!)
        .order("updated_at", { ascending: false });
      return (data ?? []).map((r: any) => ({
        ...r,
        member_count: r.talent_list_members?.[0]?.count ?? 0,
      })) as TalentList[];
    },
  });
}

export function useListMembers(listId?: string | null) {
  return useQuery({
    queryKey: ["talent-list-members", listId],
    enabled: !!listId,
    queryFn: async () => {
      const { data } = await supabase
        .from("talent_list_members")
        .select("*, talents(id, full_name, profile_photo_url, custom_profession, country, public_handle)")
        .eq("list_id", listId!)
        .order("added_at", { ascending: false });
      return data ?? [];
    },
  });
}

export function useCreateTalentList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { companyId: string; name: string; description?: string }) => {
      const { data: u } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("talent_lists")
        .insert({
          company_id: input.companyId,
          name: input.name,
          description: input.description ?? null,
          created_by: u.user!.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["talent-lists"] }),
  });
}

export function useAddToList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { listId: string; talentId: string; note?: string }) => {
      const { data: u } = await supabase.auth.getUser();
      const { error } = await supabase.from("talent_list_members").upsert(
        {
          list_id: input.listId,
          talent_id: input.talentId,
          added_by: u.user!.id,
          note: input.note ?? null,
        },
        { onConflict: "list_id,talent_id" },
      );
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["talent-list-members"] }),
  });
}
