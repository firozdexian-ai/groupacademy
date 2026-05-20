import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { GRO10X_MUTED } from "@/gro10x/lib/tokens";
import { Briefcase, ChevronRight } from "lucide-react";

export function Gro10xOpenGigs() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: gigs, isLoading } = useQuery({
    queryKey: ["gro10x-open-gigs", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("marketplace_gigs")
        .select("id,title,status,total_bids,budget_amount,selected_bid_id")
        .eq("posted_by", user.id)
        .in("status", ["pending", "approved", "active", "in_progress"])
        .order("created_at", { ascending: false })
        .limit(20);
      return data ?? [];
    },
    enabled: !!user,
  });

  if (isLoading || !gigs?.length) return null;

  return (
    <div className="px-4 pt-4">
      <p className={`text-[11px] uppercase tracking-wider ${GRO10X_MUTED} mb-2`}>
        Your gigs · {gigs.length}
      </p>
      <div className="space-y-2">
        {gigs.map((g) => (
          <button
            key={g.id}
            onClick={() => navigate(`/gro10x/work/gigs/${g.id}/bids`)}
            className="w-full text-left rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] p-3 flex items-center gap-3"
          >
            <div className="h-9 w-9 rounded-full bg-[#33E1E4]/10 text-[#33E1E4] flex items-center justify-center">
              <Briefcase className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{g.title}</p>
              <p className={`text-[11px] ${GRO10X_MUTED}`}>
                {g.total_bids ?? 0} bid{(g.total_bids ?? 0) === 1 ? "" : "s"} ·{" "}
                {g.selected_bid_id ? "awarded" : g.status}
                {g.budget_amount ? ` · ${g.budget_amount}cr` : ""}
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        ))}
      </div>
    </div>
  );
}
