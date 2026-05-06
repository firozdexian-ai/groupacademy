import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";

export interface PublicProfileSettings {
  public_handle: string | null;
  public_profile_enabled: boolean;
  public_show_mastery: boolean;
  public_show_credentials: boolean;
  public_bio: string | null;
}

export function usePublicProfileSettings() {
  const { talent } = useTalent();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["public-profile-settings", talent?.id],
    enabled: !!talent?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("talents")
        .select("public_handle, public_profile_enabled, public_show_mastery, public_show_credentials, public_bio")
        .eq("id", talent!.id)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as PublicProfileSettings | null;
    },
  });

  const update = useMutation({
    mutationFn: async (patch: Partial<PublicProfileSettings>) => {
      if (!talent?.id) throw new Error("no_talent");
      const { error } = await supabase.from("talents").update(patch).eq("id", talent.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["public-profile-settings", talent?.id] }),
  });

  const claimHandle = useMutation({
    mutationFn: async (handle: string) => {
      const { data, error } = await supabase.functions.invoke("claim-public-handle", {
        body: { handle },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).message ?? (data as any).error);
      return data as { handle: string };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["public-profile-settings", talent?.id] }),
  });

  return { ...query, update, claimHandle };
}
