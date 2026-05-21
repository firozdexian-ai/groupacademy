import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  listFollowedCompanyNames,
  followCompany,
  unfollowCompany,
} from "@/domains/companies/repo/companiesRepo";
import { toast } from "sonner";

/**
 * GroUp Academy: Company Interest & Follow Sentinel (V5.6.0)
 * Phase 10f: now routes table I/O through companiesRepo.
 */

export function useFollowedCompanies() {
  const qc = useQueryClient();
  const queryKey = ["followed-companies"];

  const list = useQuery({
    queryKey,
    staleTime: 1000 * 60 * 5,
    queryFn: async (): Promise<string[]> => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return [];
      return listFollowedCompanyNames(user.id);
    },
  });

  const toggle = useMutation({
    mutationFn: async (company_name: string) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Please sign in to follow companies");

      const isCurrentlyFollowing = (list.data ?? []).includes(company_name);
      if (isCurrentlyFollowing) {
        await unfollowCompany(user.id, company_name);
        return { company_name, following: false };
      } else {
        await followCompany(user.id, company_name);
        return { company_name, following: true };
      }
    },
    onMutate: async (company_name) => {
      await qc.cancelQueries({ queryKey });
      const previousFollows = qc.getQueryData<string[]>(queryKey);
      if (previousFollows) {
        const isFollowing = previousFollows.includes(company_name);
        const nextFollows = isFollowing
          ? previousFollows.filter((name) => name !== company_name)
          : [...previousFollows, company_name];
        qc.setQueryData(queryKey, nextFollows);
      }
      return { previousFollows };
    },
    onSuccess: (res) => {
      toast.success(res.following ? `Now following ${res.company_name}` : `Unfollowed ${res.company_name}`);
    },
    onError: (err: any, _company_name, context) => {
      if (context?.previousFollows) qc.setQueryData(queryKey, context.previousFollows);
      toast.error(err.message ?? "Connection timeout. Follow state not updated.");
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey });
    },
  });

  return {
    followed: list.data ?? [],
    isLoading: list.isLoading,
    isFollowing: (name: string) => (list.data ?? []).includes(name),
    toggle: toggle.mutate,
    toggling: toggle.isPending,
  };
}
