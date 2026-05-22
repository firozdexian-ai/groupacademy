import * as React from "react";
import { useParams, Link, NavLink } from "react-router-dom";
import { getLeaderboard } from "@/domains/ugc/repo/ugcRepo";
import { setHead } from "@/lib/setHead";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trophy, ArrowLeft, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

type Period = "weekly" | "monthly" | "alltime";
type Kind = "talents" | "companies" | "reviewers";

const KIND_MAP: Record<Kind, "talent" | "company" | "reviewer"> = {
  talents: "talent",
  companies: "company",
  reviewers: "reviewer",
};

interface LeaderboardTab {
  key: Kind;
  label: string;
}

/**
 * GroUp Academy: Dynamic Cross-Sector Leaderboard Matrix (PublicLeaderboard)
 * Hardened responsive page node isolating metadata handshakes and securing component mapping hooks from structural drift.
 * Version: Launch Candidate · Phase Z0 Lifecycle Integration Hardened
 */
export default function PublicLeaderboard() {
  const { kind: unverifiedRouteKindParamStr } = useParams<{ kind: Kind }>();

  // Defensively isolate parameter lookups to protect data pipelines from undefined parameters
  const activeKindToken: Kind =
    unverifiedRouteKindParamStr && KIND_MAP[unverifiedRouteKindParamStr] ? unverifiedRouteKindParamStr : "talents";

  const dbMappedKindKey = KIND_MAP[activeKindToken];

  const [activePeriodFilter, setActivePeriodFilter] = React.useState<Period>("weekly");
  const [rankingRowsRegistry, setRankingRowsRegistry] = React.useState<Array<Record<string, unknown>>>([]);
  const [isNetworkLookupProcessing, setIsNetworkLookupProcessing] = React.useState<boolean>(true);

  // =========================================================================
  // UNIFIED LIFECYCLE SECTOR: DATA RESOLUTION AND METADATA HANDSHAKE SYNCHRONIZER
  // =========================================================================
  React.useEffect(() => {
    let isExecutionPipelineValid = true;
    setIsNetworkLookupProcessing(true);

    const processLeaderboardSynchronization = async () => {
      try {
        const fetchOutputPayload = await getLeaderboard<Record<string, unknown>>({
          kind: dbMappedKindKey,
          period: activePeriodFilter,
          category: null,
        });

        if (!isExecutionPipelineValid) return;

        setRankingRowsRegistry(fetchOutputPayload ?? []);

        // Apply synchronized metadata metrics inside the data pipeline resolution thread
        setHead({
          title: `Top ${activeKindToken} · Gro10x Leaderboard`,
          description: `Live leaderboard metric monitoring top ${activeKindToken} allocations on Gro10x. Refreshed systematically from verified project completions, trust milestones, and verification accuracy logs.`,
          canonical: `https://groupacademy.online/leaderboards/${activeKindToken}`,
          jsonLd: {
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: `Top ${activeKindToken} on Gro10x Workspace Registry`,
          },
          key: `lb-registry-${activeKindToken}-${activePeriodFilter}`,
        });
      } catch (fatalExecutionException) {
        if (isExecutionPipelineValid) setRankingRowsRegistry([]);
      } finally {
        if (isExecutionPipelineValid) setIsNetworkLookupProcessing(false);
      }
    };

    processLeaderboardSynchronization();

    return () => {
      isExecutionPipelineValid = false;
    };
  }, [dbMappedKindKey, activeKindToken, activePeriodFilter]);

  const directoryTabsMatrix: Array<LeaderboardTab> = [
    { key: "talents", label: "Top Talents" },
    { key: "companies", label: "Top Companies" },
    { key: "reviewers", label: "Top Reviewers" },
  ];

  const periodOptionsFilterArray: Array<Period> = ["weekly", "monthly", "alltime"];

  return (
    <div className="min-h-screen bg-background text-foreground antialiased selection:bg-primary/10 block text-left transform-gpu w-full">
      {/* HUD LEVEL 1: CONTROL BOARD DIRECTORY HEADER */}
      <header className="border-b border-border/40 bg-card/10 block w-full select-none">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6 block w-full leading-none">
          <Link
            to="/projects"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors leading-none"
          >
            <ArrowLeft className="h-3 w-3 stroke-[2.2]" /> <span>Return to Project Index</span>
          </Link>

          <h1 className="text-lg sm:text-xl md:text-2xl font-bold uppercase tracking-wide text-foreground flex items-center gap-2 mt-3 block leading-none">
            <Trophy className="h-5 w-5 sm:h-6 sm:w-6 text-primary stroke-[2.2] shrink-0" />
            <span className="pt-0.5">Gro10x Performance Leaderboards</span>
          </h1>

          {/* LAYER A: WORKSPACE INTERCEPT SEGMENT TRIGGERS */}
          <div className="flex flex-wrap gap-1.5 mt-4 block w-full">
            {directoryTabsMatrix.map((tabNodeItem) => (
              <NavLink
                key={`leaderboard-tab-trigger-${tabNodeItem.key}`}
                to={`/leaderboards/${tabNodeItem.key}`}
                className={({ isActive }) =>
                  cn(
                    "h-8 px-3 rounded-lg text-xs font-bold uppercase tracking-wide inline-flex items-center justify-center border transition-colors outline-none focus:outline-none focus-visible:ring-1 focus-visible:ring-ring shrink-0 pt-0.5",
                    isActive
                      ? "bg-primary border-primary text-primary-foreground font-extrabold shadow-2xs"
                      : "bg-background border-border/60 text-muted-foreground/80 hover:bg-accent hover:text-foreground",
                  )
                }
              >
                {tabNodeItem.label}
              </NavLink>
            ))}
          </div>

          {/* LAYER B: TIMEFRAME INTERVAL PARAMETER ACTIONS */}
          <div className="flex items-center gap-1.5 mt-3 border-t border-border/5 pt-3 block w-full">
            {periodOptionsFilterArray.map((periodKeyString) => (
              <button
                key={`timeframe-selector-action-${periodKeyString}`}
                type="button"
                onClick={() => setActivePeriodFilter(periodKeyString)}
                className={cn(
                  "h-7 px-2.5 rounded-md text-[10px] sm:text-xs font-mono font-extrabold uppercase tracking-wider border transition-all cursor-pointer pt-0.5 shadow-2xs shrink-0 outline-none focus:outline-none",
                  activePeriodFilter === periodKeyString
                    ? "bg-muted text-foreground font-black border-border-foreground/10"
                    : "bg-transparent border-transparent text-muted-foreground/50 hover:text-foreground hover:bg-accent/40",
                )}
              >
                {periodKeyString}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* HUD LEVEL 2: DETERMINISTIC RANK PAYLOAD DATA VIEWPORT */}
      <main className="mx-auto max-w-4xl px-4 sm:px-6 py-6 block w-full">
        {isNetworkLookupProcessing ? (
          <div
            role="status"
            className="w-full flex items-center justify-center py-12 font-mono text-[10px] sm:text-xs font-bold uppercase tracking-widest text-muted-foreground/50 select-none pointer-events-none gap-2.5"
          >
            <div className="h-3.5 w-3.5 rounded-full border border-muted-foreground/20 border-t-primary animate-spin shrink-0" />
            <span>Compiling Performance Matrix...</span>
          </div>
        ) : rankingRowsRegistry.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border/60 bg-card/20 p-8 text-center select-none block mt-2">
            <Inbox className="h-5 w-5 text-muted-foreground/30 mx-auto stroke-[2.2] pointer-events-none" />
            <p className="text-xs font-semibold text-muted-foreground/60 leading-normal mt-2 max-w-xs mx-auto">
              No performance allocations or ranks logged within this tracking interval sequence.
            </p>
          </div>
        ) : (
          <div className="space-y-2 block w-full">
            {rankingRowsRegistry.map((rowItemNode, structuralArrayIndexIdx) => {
              const baseIdentificationHashStr = String(
                rowItemNode.id || rowItemNode.user_id || rowItemNode.company_id || structuralArrayIndexIdx,
              );

              const publicHandleAccessorStr = rowItemNode.public_handle as string | undefined;
              const companySlugAccessorStr = rowItemNode.slug as string | undefined;

              const computedEntityNameStr =
                (rowItemNode.full_name as string) || (rowItemNode.name as string) || "Anonymous Profile Node";
              const parsedAvatarImageSourceRoute =
                (rowItemNode.profile_photo_url as string) || (rowItemNode.logo_url as string) || undefined;

              const numericalMetricScoreValue = rowItemNode.score as number | undefined;
              const activeAccountTierLevel = rowItemNode.tier as string | undefined;

              const compositeTargetNavigationRoute = publicHandleAccessorStr
                ? `/t/${publicHandleAccessorStr}`
                : companySlugAccessorStr
                  ? `/c/${companySlugAccessorStr}/projects`
                  : "#";

              return (
                <Link
                  to={compositeTargetNavigationRoute}
                  key={`deterministic-leaderboard-row-${baseIdentificationHashStr}`}
                  className="group block rounded-lg outline-none focus:outline-none focus-visible:ring-1 focus-visible:ring-ring overflow-hidden"
                >
                  <Card className="rounded-lg border border-border/60 bg-card/30 hover:border-border-foreground/10 transition-colors duration-100 shadow-none">
                    <CardContent className="p-3 flex items-center gap-3.5 leading-none">
                      {/* Placement Marker */}
                      <span className="w-6 text-center font-mono text-xs font-extrabold text-muted-foreground/40 shrink-0 select-none tabular-nums">
                        {(structuralArrayIndexIdx + 1).toString().padStart(2, "0")}
                      </span>

                      {/* Identity Component Avatar Cluster */}
                      <Avatar className="h-8 w-8 rounded-md border border-border/40 bg-background/50 text-xs shrink-0 select-none pointer-events-none shadow-2xs">
                        <AvatarImage src={parsedAvatarImageSourceRoute} alt="" className="object-cover" />
                        <AvatarFallback className="font-bold text-primary bg-muted rounded-none uppercase">
                          {computedEntityNameStr.charAt(0)}
                        </AvatarFallback>
                      </Avatar>

                      {/* Detail Metric Data Captures */}
                      <div className="flex-1 min-w-0 leading-none space-y-1 block">
                        <p className="text-xs sm:text-sm font-bold text-foreground group-hover:text-primary transition-colors truncate block pt-0.5 uppercase tracking-wide">
                          {computedEntityNameStr}
                        </p>
                        <p className="font-mono text-[10px] font-bold text-muted-foreground/40 leading-none flex items-center gap-3 select-text tracking-tight uppercase">
                          {activeAccountTierLevel && (
                            <span className="shrink-0">
                              TIER: <span className="text-muted-foreground/70">{activeAccountTierLevel}</span>
                            </span>
                          )}
                          {numericalMetricScoreValue !== undefined && (
                            <span className="shrink-0 tabular-nums">
                              SCORE:{" "}
                              <span className="text-muted-foreground/70">
                                {numericalMetricScoreValue.toLocaleString()}
                              </span>
                            </span>
                          )}
                        </p>
                      </div>

                      {/* Contingent Completion Badges */}
                      {dbMappedKindKey === "talent" &&
                        rowItemNode.completed !== undefined &&
                        rowItemNode.completed !== null && (
                          <Badge
                            variant="secondary"
                            className="font-mono text-[9px] font-extrabold uppercase tracking-wide rounded border border-border/40 select-none shrink-0 pointer-events-none tabular-nums bg-muted/40 h-5 px-1.5 pt-0.5 leading-none"
                          >
                            {String(rowItemNode.completed)} COMPLETED
                          </Badge>
                        )}
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
