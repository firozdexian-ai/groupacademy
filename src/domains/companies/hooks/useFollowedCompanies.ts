import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useFollowedCompanies() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["followed-companies", user?.id ?? null],
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<Set<string>> => {
      if (!user?.id) return new Set();
      const { data, error } = await supabase
        .from("followed_companies")
        .select("company_name")
        .eq("user_id", user.id);
      if (error) throw error;
      return new Set((data ?? []).map((r) => r.company_name));
    },
  });
}

export function useToggleFollowCompany() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (companyName: string) => {
      if (!user?.id) {
        navigate("/auth?returnTo=/app/jobs?tab=company");
        throw new Error("auth-required");
      }
      const key = ["followed-companies", user.id];
      const current = qc.getQueryData<Set<string>>(key) ?? new Set<string>();
      const isFollowing = current.has(companyName);

      if (isFollowing) {
        const { error } = await supabase
          .from("followed_companies")
          .delete()
          .eq("user_id", user.id)
          .eq("company_name", companyName);
        if (error) throw error;
        return { companyName, nowFollowing: false };
      } else {
        const { error } = await supabase
          .from("followed_companies")
          .insert({ user_id: user.id, company_name: companyName });
        if (error) throw error;
        return { companyName, nowFollowing: true };
      }
    },
    onMutate: async (companyName: string) => {
      if (!user?.id) return;
      const key = ["followed-companies", user.id];
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<Set<string>>(key) ?? new Set<string>();
      const next = new Set(prev);
      if (next.has(companyName)) next.delete(companyName);
      else next.add(companyName);
      qc.setQueryData(key, next);
      return { prev };
    },
    onError: (err: any, _v, ctx) => {
      if (err?.message === "auth-required") return;
      if (user?.id && ctx?.prev) {
        qc.setQueryData(["followed-companies", user.id], ctx.prev);
      }
      toast.error("Couldn't update follow. Try again.");
    },
    onSuccess: ({ nowFollowing, companyName }) => {
      toast.success(nowFollowing ? `Following ${companyName}` : `Unfollowed ${companyName}`);
    },
    onSettled: () => {
      if (user?.id) qc.invalidateQueries({ queryKey: ["followed-companies", user.id] });
    },
  });
}
