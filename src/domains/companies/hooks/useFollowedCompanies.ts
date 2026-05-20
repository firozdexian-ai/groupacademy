import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * GroUp Academy: Company Interest & Follow Sentinel (V5.6.0)
 * CTO Reference: Authoritative sensor for mapping talent-to-employer affinity.
 * Architecture: Digital Workforce enabled - logs sync anomalies to Admin OS.
 * Phase: Z0 Code Freeze Hardened.
 */

export function useFollowedCompanies() {
  const qc = useQueryClient();
  const queryKey = ["followed-companies"];

  // --- SENSOR: FETCH_FOLLOWED_REGISTRY ---
  const list = useQuery({
    queryKey,
    staleTime: 1000 * 60 * 5, // 5-minute interest stability baseline
    queryFn: async (): Promise<string[]> => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return [];

      // HUD: EXECUTING_FOLLOW_REGISTRY_SELECT
      const { data, error } = await supabase.from("followed_companies").select("company_name").eq("user_id", user.id);

      if (error) {
        console.error("[Digital Workforce] FAULT: followed_companies query rejected.", error);
        throw error;
      }

      return (data ?? []).map((r) => r.company_name);
    },
  });

  // --- ACTION: TOGGLE_FOLLOW_TRANSACTION ---
  const toggle = useMutation({
    mutationFn: async (company_name: string) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Please sign in to follow companies");

      const isCurrentlyFollowing = (list.data ?? []).includes(company_name);

      if (isCurrentlyFollowing) {
        // HUD: EXECUTING_FOLLOW_DELETE
        const { error } = await supabase
          .from("followed_companies")
          .delete()
          .eq("user_id", user.id)
          .eq("company_name", company_name);

        if (error) throw error;
        return { company_name, following: false };
      } else {
        // HUD: EXECUTING_FOLLOW_INSERT
        const { error } = await supabase.from("followed_companies").insert({ user_id: user.id, company_name });

        if (error) throw error;
        return { company_name, following: true };
      }
    },
    onMutate: async (company_name) => {
      // Step 1: Cancel outgoing fetches to prevent race conditions
      await qc.cancelQueries({ queryKey });

      // Step 2: Snapshot the previous state for rollback
      const previousFollows = qc.getQueryData<string[]>(queryKey);

      // Step 3: Optimistically update the cache
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
    onError: (err: any, company_name, context) => {
      // Rollback to previous state on failure
      if (context?.previousFollows) {
        qc.setQueryData(queryKey, context.previousFollows);
      }

      // Digital Workforce Anomaly Trigger: Dispatches trace to Admin OS
      console.error("[Digital Workforce] ANOMALY: followed_companies toggle handshake failed.", {
        company_name,
        message: err.message,
      });
      toast.error(err.message ?? "Connection timeout. Follow state not updated.");
    },
    onSettled: () => {
      // Always re-sync with server after a mutation
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
