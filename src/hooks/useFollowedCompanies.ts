import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useFollowedCompanies() {
  const qc = useQueryClient();

  const list = useQuery({
    queryKey: ["followed-companies"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return [] as string[];
      const { data, error } = await supabase
        .from("followed_companies")
        .select("company_name")
        .eq("user_id", u.user.id);
      if (error) throw error;
      return (data ?? []).map((r) => r.company_name);
    },
  });

  const toggle = useMutation({
    mutationFn: async (company_name: string) => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Sign in to follow companies");
      const isFollowing = (list.data ?? []).includes(company_name);
      if (isFollowing) {
        const { error } = await supabase
          .from("followed_companies")
          .delete()
          .eq("user_id", u.user.id)
          .eq("company_name", company_name);
        if (error) throw error;
        return { company_name, following: false };
      } else {
        const { error } = await supabase
          .from("followed_companies")
          .insert({ user_id: u.user.id, company_name });
        if (error) throw error;
        return { company_name, following: true };
      }
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["followed-companies"] });
      toast.success(res.following ? `Following ${res.company_name}` : `Unfollowed ${res.company_name}`);
    },
    onError: (e: any) => toast.error(e.message ?? "Could not update follow"),
  });

  return {
    followed: list.data ?? [],
    isLoading: list.isLoading,
    isFollowing: (name: string) => (list.data ?? []).includes(name),
    toggle: toggle.mutate,
    toggling: toggle.isPending,
  };
}
