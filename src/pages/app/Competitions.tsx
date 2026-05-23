import * as React from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Calendar, ArrowLeft, Clock, Gift, Zap, Target, ShieldCheck, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { format, differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/common/EmptyState";
import { PAGE_SHELL_WIDE, PAGE_TITLE, PAGE_SUBTITLE, CARD, META_TEXT } from "@/lib/uiTokens";

// =========================================================================
// DETERMINISTIC COMPONENT DATA TYPE CONTRACTS
// =========================================================================
interface CompetitionRecord {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  featured_image: string | null;
  is_featured: boolean | null;
  status: "upcoming" | "active" | "judging" | "completed" | "cancelled";
  start_date: string;
  end_date: string;
  submission_deadline: string;
  max_participants: number | null;
  prizes: unknown[] | string[] | null;
}

interface StatusPresetItem {
  label: string;
  color: string;
  icon: React.ComponentType<{ className?: string }>;
}

type FilterScopeVariant = "all" | "active" | "upcoming" | "completed";

const STATUS_CONFIG_PRESETS: Record<string, StatusPresetItem> = {
  upcoming: { label: "Upcoming Challenges", color: "bg-blue-500/5 text-blue-600 border-blue-500/10", icon: Calendar },
  active: { label: "Live Arena", color: "bg-emerald-500/5 text-emerald-600 border-emerald-500/10", icon: Zap },
  judging: { label: "Evaluation Stage", color: "bg-amber-500/5 text-amber-600 border-amber-500/10", icon: Target },
  completed: { label: "Completed Runs", color: "bg-muted text-muted-foreground border-border/40", icon: Trophy },
  cancelled: {
    label: "Cancelled",
    color: "bg-destructive/5 text-destructive border-destructive/10",
    icon: ShieldCheck,
  },
};

const SKELETON_ROWS_ROSTER = [1, 2, 3];

/**
 * GroUp Academy: Capability Arena Competitions Marketplace (Competitions)
 * Hardened list center mapping active hackathons, tracking deadlines dynamically, and insulating text scales.
 * Version: Launch Candidate · Phase Z1 Production Contract Locked
 */
export default function Competitions() {
  const navigateHook = useNavigate();
  const [filterScopeSelection, setFilterScopeSelection] = React.useState<FilterScopeVariant>("all");

  // =========================================================================
  // DATA ACQUISITION PIPELINE SECURED VIA TANSTACK CACHE CHANNEL
  // =========================================================================
  const { data: competitionsPayloadCollection = [], isLoading: isCollectionCacheResolving } = useQuery<
    CompetitionRecord[]
  >({
    queryKey: ["app-arena-competitions-list", filterScopeSelection],
    queryFn: async (): Promise<CompetitionRecord[]> => {
      let databaseQueryBuilder = supabase
        .from("competitions")
        .select(
          "id, title, slug, description, featured_image, is_featured, status, start_date, end_date, submission_deadline, max_participants, prizes",
        )
        .order("is_featured", { ascending: false })
        .order("start_date", { ascending: true });

      if (filterScopeSelection !== "all") {
        databaseQueryBuilder = databaseQueryBuilder.eq("status", filterScopeSelection);
      }

      const { data: fetchOutputPayload, error: queryHandshakeError } = await databaseQueryBuilder;
      if (queryHandshakeError) throw queryHandshakeError;

      return (fetchOutputPayload as unknown as CompetitionRecord[]) ?? [];
    },
    staleTime: 3 * 60 * 1000,
  });

  // Pure data parsing engine compiled out of main paint streams securely
  const calculateChronoTimeRemainingStr = React.useCallback((deadlineTimestampStr: string): string => {
    const totalResidualDaysCount = differenceInDays(new Date(deadlineTimestampStr), new Date());
    if (totalResidualDaysCount < 0) return "Arena Concluded";
    if (totalResidualDaysCount === 0) return "Terminating Today";
    if (totalResidualDaysCount === 1) return "1 Day Left";
    return `${totalResidualDaysCount.toString()} Days Residual`;
  }, []);

  const handleDefensiveReturnSequence = React.useCallback(() => {
    if (window.history.length > 1) {
      navigateHook(-1);
    } else {
      navigateHook("/app/learning", { replace: true });
    }
  }, [navigateHook]);

  const handlePurgeFilterCriteria = React.useCallback(() => {
    setFilterScopeSelection("all");
  }, []);

  const handleNavigateToChallengeDetail = React.useCallback(
    (challengeSlugStr: string) => {
      navigateHook(`/app/learning/competitions/${challengeSlugStr}`);
    },
    [navigateHook],
  );

  return (
    <div
      className={cn(PAGE_SHELL_WIDE, "max-w-4xl mx-auto space-y-5 text-left antialiased block transform-gpu w-full")}
    >
      {/* HUD LEVEL 1: APPLICATION COCKPIT NAVIGATION CONTROL BAR */}
      <header className="block select-none leading-none w-full shrink-0 pb-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleDefensiveReturnSequence}
          className="h-8 px-2.5 rounded-md font-bold uppercase tracking-wide text-xs gap-1 cursor-pointer text-muted-foreground hover:text-foreground -ml-2"
        >
          <ArrowLeft className="h-3.5 w-3.5 stroke-[2.5]" /> <span>Return to Hub</span>
        </Button>
      </header>

      {/* HUD LEVEL 2: COMPOSITE HUB TITLE COMPLIANCE DESCRIPTION BLOCK */}
      <div className="space-y-1 block select-none pointer-events-none border-b border-border/10 pb-3 w-full shrink-0 leading-none">
        <div className="flex items-center gap-2 leading-none w-full block">
          <Trophy className="h-4.5 w-4.5 text-primary stroke-[2.2] shrink-0" />
          <h1
            className={cn(
              PAGE_TITLE,
              "text-base sm:text-lg md:text-xl font-bold uppercase tracking-wide text-foreground pt-0.5 block truncate",
            )}
          >
            Continuous Capability Arena Placements
          </h1>
        </div>
        <p
          className={cn(
            PAGE_SUBTITLE,
            "text-xs sm:text-sm font-semibold text-muted-foreground/60 leading-none block pt-0.5",
          )}
        >
          Compete inside structural technical hackathons, secure dynamic prize payouts, and commit hashed projects to
          your portfolio.
        </p>
      </div>

      {/* HUD LEVEL 3: TAB FILTERS SYSTEM TRACK CONTROLLER */}
      <div className="w-full block shrink-0 select-none leading-none h-10 mt-1">
        <Tabs
          value={filterScopeSelection}
          onValueChange={(extractedVal) => setFilterScopeSelection(extractedVal as FilterScopeVariant)}
          className="w-full block leading-none"
        >
          <TabsList className="grid w-full grid-cols-4 p-1 h-10 bg-muted/40 rounded-lg border border-border/10 select-none">
            <TabsTrigger
              value="all"
              className="rounded-md font-mono text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wide h-8 cursor-pointer outline-none pt-0.5"
            >
              All Tasks
            </TabsTrigger>
            <TabsTrigger
              value="active"
              className="rounded-md font-mono text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wide h-8 cursor-pointer outline-none pt-0.5"
            >
              Live Arena
            </TabsTrigger>
            <TabsTrigger
              value="upcoming"
              className="rounded-md font-mono text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wide h-8 cursor-pointer outline-none pt-0.5"
            >
              Upcoming
            </TabsTrigger>
            <TabsTrigger
              value="completed"
              className="rounded-md font-mono text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wide h-8 cursor-pointer outline-none pt-0.5"
            >
              Concluded
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* HUD LEVEL 4: RELATIONAL COMPETITIONS SYSTEM OUTPUT BOARDS */}
      {isCollectionCacheResolving ? (
        <div className="space-y-2.5 block w-full select-none pointer-events-none">
          {SKELETON_ROWS_ROSTER.map((rowItemNum) => (
            <Card
              key={`arena-challenges-skeleton-row-${rowItemNum}`}
              className="rounded-lg border border-border/40 p-4 bg-card/10 block w-full animate-pulse space-y-2"
            >
              <Skeleton className="h-4.5 w-1/3 rounded-xs block" />
              <Skeleton className="h-3.5 w-2/3 rounded-xs block" />
            </Card>
          ))}
        </div>
      ) : competitionsPayloadCollection.length > 0 ? (
        <div className="space-y-2.5 block w-full align-top">
          {competitionsPayloadCollection.map((challengeItemNode) => {
            const statusPresetNode = STATUS_CONFIG_PRESETS[challengeItemNode.status] || STATUS_CONFIG_PRESETS.upcoming;
            const extractedPrizesCountInt = Array.isArray(challengeItemNode.prizes)
              ? challengeItemNode.prizes.length
              : 0;

            return (
              <Card
                key={`arena-competition-item-card-row-${challengeItemNode.id}`}
                className={cn(
                  CARD,
                  "rounded-lg border border-border/60 bg-card/30 hover:border-border-foreground/10 transition-colors duration-100 shadow-none overflow-hidden cursor-pointer block w-full",
                )}
                onClick={() => handleNavigateToChallengeDetail(challengeItemNode.slug)}
              >
                {challengeItemNode.featured_image && (
                  <div className="h-24 sm:h-28 overflow-hidden select-none pointer-events-none border-b border-border/10 w-full block">
                    <img src={challengeItemNode.featured_image} alt="" className="w-full h-full object-cover block" />
                  </div>
                )}

                <CardContent className="p-3.5 space-y-2.5 block w-full leading-none">
                  <div className="flex items-start justify-between gap-4 leading-none w-full block">
                    <h3 className="text-xs sm:text-sm font-bold text-foreground leading-snug uppercase tracking-wide block pt-0.5 truncate max-w-[200px] sm:max-w-xl select-text">
                      {challengeItemNode.title}
                    </h3>

                    <Badge
                      variant="outline"
                      className={cn(
                        "font-mono text-[8px] font-black uppercase px-1.5 h-4.5 rounded-sm pt-0.5 leading-none shrink-0 border shadow-3xs select-none pointer-events-none",
                        statusPresetNode.color,
                      )}
                    >
                      <statusPresetNode.icon className="h-3 w-3 mr-0.5 stroke-[2] inline-block" />
                      <span>{statusPresetNode.label.toUpperCase()}</span>
                    </Badge>
                  </div>

                  {challengeItemNode.description && (
                    <p className="text-[11px] sm:text-xs font-medium text-muted-foreground/70 leading-relaxed block line-clamp-2 pr-2 select-text">
                      {challengeItemNode.description}
                    </p>
                  )}

                  {/* Operational Telemetry Sub-Row Labels */}
                  <div className="flex items-center gap-3.5 font-mono text-[9px] font-bold text-muted-foreground/40 uppercase tracking-tight flex-wrap select-none pointer-events-none leading-none pt-1 tabular-nums w-full shrink-0">
                    <span className="flex items-center gap-1 shrink-0">
                      <Calendar className="h-3.5 w-3.5 stroke-[2.2]" />
                      <span>STARTS: {format(new Date(challengeItemNode.start_date), "MMM d").toUpperCase()}</span>
                    </span>

                    {challengeItemNode.status === "active" && (
                      <span className="text-amber-600 font-extrabold flex items-center gap-1 shrink-0 animate-pulse">
                        <Clock className="h-3.5 w-3.5 stroke-[2.5]" />
                        <span>
                          {calculateChronoTimeRemainingStr(challengeItemNode.submission_deadline).toUpperCase()}
                        </span>
                      </span>
                    )}

                    {extractedPrizesCountInt > 0 && (
                      <span className="flex items-center gap-1 shrink-0">
                        <Gift className="h-3.5 w-3.5 stroke-[2.2]" />
                        <span>BOUNTIES: {extractedPrizesCountInt.toString()} ITEMS</span>
                      </span>
                    )}

                    {challengeItemNode.is_featured && (
                      <Badge
                        variant="outline"
                        className="font-mono text-[8px] font-black uppercase px-1.5 h-4.5 border-border text-muted-foreground/40 tracking-wide pt-0.5 shrink-0 ml-auto leading-none rounded-xs"
                      >
                        FEATURED RUN
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="block w-full">
          <EmptyState
            icon={Trophy}
            title="No competitions found"
            description="No active competitions match your current filters."
            action={{ label: "Clear filters", onClick: handlePurgeFilterCriteria }}
          />
        </div>
      )}
    </div>
  );
}
