import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trackError, trackEvent } from "@/lib/errorTracking";
import { Sparkles, Star, Loader2, RotateCw } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Props {
  gigId: string;
  gigKind?: "marketplace" | "quick";
}

interface BidderMatch {
  id: string;
  talent_id: string;
  score: number;
  signals: any;
  why_text: string | null;
  status: string;
  talents?: {
    full_name: string | null;
    profile_photo_url: string | null;
  } | null;
}

/**
 * Premium, performance-hardened AI-Recommended Bidders Panel.
 * Synchronizes predictive match query lookups with relational profile sub-queries
 * and real-time query invalidation pipelines over vertical PWA workspace grids.
 */
export function RecommendedBiddersPanel({ gigId, gigKind = "marketplace" }: Props) {
  const queryClient = useQueryClient();

  // Monitor dashboard interaction impressions under automated efficiency criteria
  useEffect(() => {
    if (gigId) {
      trackEvent("recommended_bidders_panel_mounted", { gigId, gigKind });
    }
  }, [gigId, gigKind]);

  // 1. Predictive Match Core Query Execution (staleTime 5 min configuration)
  const { data: matches = [], isLoading, error: queryError } = useQuery<BidderMatch[]>({
    queryKey: ["recommended-bidders", gigId, gigKind],
    enabled: !!gigId,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      // Execute explicit criterion lookup while fetching nested profile details in a single pass
      const { data, error } = await supabase
        .from("gig_matches")
        .select(`
          id, talent_id, score, signals, why_text, status,
          talents ( full_name, profile_photo_url )
        `)
        .eq("gig_id", gigId)
        .eq("gig_kind", gigKind)
        .order("score", { ascending: false })
        .limit(5);

      if (error) throw error;
      return (data || []) as any[];
    },
  });

  // 2. Instrument Incident Telemetry Metrics Over Query Exceptions
  useEffect(() => {
    if (queryError) {
      trackError(queryError, {
        component: "RecommendedBiddersPanel",
        action: "fetch_recommended_bidders_api",
        gigId,
        gigKind
      });
    }
  }, [queryError, gigId, gigKind]);

  // 3. Hardened Re-Scoring Model Mutation Engine
  const refresh = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("refresh_gig_matches", {
        _gig_id: gigId,
        _gig_kind: gigKind,
        _limit: 25,
      });
      if (error) throw error;
    },
    onMutate: () => {
      trackEvent("recommended_bidders_refresh_requested", { gigId });
    },
    onSuccess: () => {
      trackEvent("recommended_bidders_refresh_success", { gigId });
      toast.success("Ecosystem talent ranking profiles synchronized cleanly");
      
      // Invalidate target keys dynamically across viewport boundaries
      queryClient.invalidateQueries({ queryKey: ["recommended-bidders", gigId, gigKind] });
      queryClient.invalidateQueries({ queryKey: ["feed-posts"] });
    },
    onError: (mutationErr: any) => {
      trackError(mutationErr, {
        component: "RecommendedBiddersPanel",
        action: "refresh_gig_matches_mutation",
        gigId
      });
      toast.error("Ecosystem calculation timeout. Re-trigger model sync.");
    }
  });

  // 4. Hardened Shortlist Selection Mutation Pipeline
  const shortlist = useMutation({
    mutationFn: async (matchId: string) => {
      const { error } = await supabase.rpc("shortlist_match", { _match_id: matchId });
      if (error) throw error;
    },
    onMutate: (matchId) => {
      trackEvent("recommended_bidders_shortlist_requested", { matchId, gigId });
    },
    onSuccess: (_, matchId) => {
      trackEvent("recommended_bidders_shortlist_success", { matchId, gigId });
      toast.success("Candidate asset shortlisted successfully for review");
      
      queryClient.invalidateQueries({ queryKey: ["recommended-bidders", gigId, gigKind] });
      queryClient.invalidateQueries({ queryKey: ["feed-posts"] });
    },
    onError: (mutationErr: any, matchId) => {
      trackError(mutationErr, {
        component: "RecommendedBiddersPanel",
        action: "shortlist_match_mutation",
        matchId,
        gigId
      });
      toast.error("Ledger modification validation failure.");
    }
  });

  if (isLoading) {
    return (
      <Card className="border border-border/40 bg-card/60 backdrop-blur-md shadow-sm select-none animate-pulse">
        <CardHeader className="py-3 px-4 border-b border-border/10 flex flex-row items-center justify-between">
          <Skeleton className="h-4 w-40 rounded opacity-60" />
          <Skeleton className="h-7 w-16 rounded-xl opacity-40" />
        </CardHeader>
        <CardContent className="space-y-3 p-4">
          {[1, 2, 3].map((skeletonIndex) => (
            <Skeleton key={skeletonIndex} className="h-16 w-full rounded-2xl opacity-50" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-border/40 bg-card/60 backdrop-blur-md shadow-sm transition-all duration-300 relative overflow-hidden select-none w-full max-w-full">
      
      {/* Decorative Blur Mesh Background Pattern */}
      <div className="absolute -top-12 -left-12 w-24 h-24 bg-primary/5 rounded-full blur-2xl pointer-events-none" />

      {/* Main Panel Section Header */}
      <CardHeader className="py-3 px-4 border-b border-border/20 flex flex-row items-center justify-between gap-4 select-none">
        <CardTitle className="text-xs font-bold flex items-center gap-2 text-foreground/90 uppercase tracking-wider">
          <Sparkles className="w-4 h-4 text-primary fill-primary/10 animate-pulse drop-shadow-[0_1px_4px_rgba(var(--primary-rgb),0.2)]" />
          <span>AI-Recommended Candidates</span>
        </CardTitle>
        <Button 
          size="sm" 
          variant="outline" 
          type="button"
          onClick={() => refresh.mutate()} 
          disabled={refresh.isPending}
          className="h-7 px-2.5 text-[10px] font-bold tracking-wide uppercase rounded-xl border-border/60 hover:bg-accent cursor-pointer active:scale-95 transition-transform shrink-0 gap-1.5 shadow-sm"
        >
          {refresh.isPending ? (
            <Loader2 className="h-3 w-3 animate-spin stroke-[2.5]" />
          ) : (
            <RotateCw className="h-3 w-3 stroke-[2.5]" />
          )}
          <span>Recalculate</span>
        </Button>
      </CardHeader>

      {/* Main Iteration Container Block */}
      <CardContent className="space-y-2.5 p-4 w-full min-w-0">
        {matches.length === 0 ? (
          <p className="text-xs font-medium text-muted-foreground/80 leading-normal text-left py-4 select-text selection:bg-primary/20">
            No candidate tracking rows compiled yet &mdash; invoke the re-scoring model to parse talent compatibility profiles.
          </p>
        ) : (
          matches.map((matchItem, index) => {
            if (!matchItem || !matchItem.id) return null;

            const isShortlisted = matchItem.status === "shortlisted";
            const scorePercentageValue = Math.round(Number(matchItem.score || 0));
            const profileName = matchItem.talents?.full_name || `Candidate #${index + 1}`;
            
            const initials = profileName
              ?.split(" ")
              .filter(Boolean)
              .map((word) => word[0])
              .slice(0, 2)
              .join("")
              .toUpperCase() || "??";

            return (
              <div 
                key={matchItem.id} 
                className={cn(
                  "border border-border/30 rounded-2xl p-3 flex items-center justify-between gap-3 w-full min-w-0 transition-all duration-200 bg-background/40 group hover:border-border/60 hover:bg-background/80",
                  isShortlisted && "border-amber-500/20 bg-amber-500/[0.01] dark:bg-amber-500/[0.002] shadow-inner"
                )}
              >
                {/* Profile Avatar Identity Block */}
                <div className="flex items-center gap-3 min-w-0 flex-1 text-left">
                  <Avatar className="h-8 w-8 border border-border/30 shrink-0 shadow-sm transition-transform group-hover:scale-105 duration-200">
                    <AvatarImage src={matchItem.talents?.profile_photo_url || undefined} alt={`${profileName}'s profile`} className="object-cover" />
                    <AvatarFallback className="text-[10px] font-extrabold bg-primary/10 text-primary uppercase select-none">
                      {initials}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0 flex-1 space-y-0.5 flex flex-col justify-center">
                    <div className="flex items-center gap-1.5 flex-wrap w-full select-none leading-none">
                      <span className="font-bold text-xs text-foreground/90 truncate max-w-[120px] select-text tracking-tight group-hover:text-primary transition-colors">
                        {profileName}
                      </span>
                      <Badge className="text-[9px] font-extrabold h-4.5 px-2 rounded-md uppercase tracking-wider bg-primary/10 border-none text-primary group-hover:bg-primary/15 shadow-sm tabular-nums select-none">
                        Fit Score: {scorePercentageValue}%
                      </Badge>
                      {matchItem.status !== "offered" && (
                        <Badge variant="outline" className="text-[9px] font-bold h-4.5 px-2 rounded-md uppercase border-border/40 text-muted-foreground/80 bg-background/50 tracking-wide select-none">
                          {matchItem.status}
                        </Badge>
                      )}
                    </div>
                    {matchItem.why_text && (
                      <p className="text-[11px] font-medium leading-normal text-muted-foreground line-clamp-2 select-text selection:bg-primary/10 mt-0.5 break-words">
                        {matchItem.why_text}
                      </p>
                    )}
                  </div>
                </div>

                {/* Shortlist Curation Strategy CTA Toggle Anchor */}
                <Button 
                  size="sm" 
                  variant="outline" 
                  type="button"
                  disabled={isShortlisted || shortlist.isPending}
                  onClick={() => shortlist.mutate(matchItem.id)} 
                  className={cn(
                    "h-8 text-xs font-bold px-3 rounded-xl border-border/60 hover:bg-accent shrink-0 cursor-pointer active:scale-95 transition-transform flex items-center gap-1 shadow-sm select-none",
                    isShortlisted && "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400 font-extrabold cursor-not-allowed pointer-events-none shadow-inner"
                  )}
                >
                  <Star className={cn("w-3.5 h-3.5 stroke-[2.2]", isShortlisted ? "fill-current animate-in zoom-in duration-300" : "fill-none")} />
                  <span>{isShortlisted ? "Shortlisted" : "Shortlist"}</span>
                </Button>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}