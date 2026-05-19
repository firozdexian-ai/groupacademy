import * as React from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowLeft,
  Eye,
  Flame,
  MessageCircle,
  Bookmark,
  Share2,
  TrendingUp,
  TrendingDown,
  Coins,
  Loader2,
  BarChart3,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTalent } from "@/hooks/useTalent";
import { useCreatorScorecard, useCreatorTopPosts } from "@/hooks/useCreatorAnalytics";
import { cn } from "@/lib/utils";

// =========================================================================
// DETERMINISTIC COMPONENT DATA TYPE CONTRACTS
// =========================================================================
interface MetricBreakdown {
  impressions?: number;
  hypes?: number;
  credits_earned?: number | string;
  comments?: number;
  saves?: number;
  shares?: number;
}

interface ScorecardResponse {
  current?: MetricBreakdown;
  previous?: MetricBreakdown;
  post_count?: number;
}

interface PostTelemetryNode {
  id: string;
  snippet: string | null;
  impression_count: number;
  hype_count: number;
  comment_count: number;
  save_count: number;
  share_count: number;
  credits_earned: number | string;
}

interface TileProps {
  label: string;
  value: number | string;
  delta?: number;
  icon: React.ReactNode;
  accent?: string;
}

interface FunnelRowItem {
  label: string;
  value: number;
  color: string;
}

// Pure utility computing delta variance values without main thread side-effects
function calculatePercentageDeltaInt(currentValueNum: number, previousValueNum: number): number {
  if (!previousValueNum) {
    return currentValueNum > 0 ? 100 : 0;
  }
  return Math.round(((currentValueNum - previousValueNum) / previousValueNum) * 100);
}

// =========================================================================
// INTERMEDIATE LAYOUT HELPER STRUCTURE: DATA TILES CANVAS GRID
// =========================================================================
const Tile = React.memo(function Tile({ label, value, delta, icon, accent = "text-primary" }: TileProps) {
  const isTrendUpwardsFlag = (delta ?? 0) >= 0;

  return (
    <Card className="rounded-lg border border-border/40 bg-card shadow-xs">
      <CardContent className="p-3.5 space-y-2 block w-full leading-none">
        <div className="flex items-center justify-between gap-4 leading-none w-full block shrink-0 select-none">
          <div
            className={cn(
              "h-7 w-7 rounded border border-border/10 flex items-center justify-center bg-muted/30 shrink-0",
              accent,
            )}
          >
            {icon}
          </div>
          {delta !== undefined && (
            <span
              className={cn(
                "font-mono text-[10px] font-bold inline-flex items-center gap-0.5 tracking-tight tabular-nums",
                isTrendUpwardsFlag ? "text-emerald-600" : "text-rose-600",
              )}
            >
              {isTrendUpwardsFlag ? (
                <TrendingUp className="h-3 w-3 stroke-[2.2]" />
              ) : (
                <TrendingDown className="h-3 w-3 stroke-[2.2]" />
              )}
              {Math.abs(delta).toLocaleString()}%
            </span>
          )}
        </div>

        <div className="text-base sm:text-lg font-black text-foreground leading-none tracking-tight block select-text font-mono tabular-nums">
          {value}
        </div>
        <p className="font-mono text-[9px] font-bold uppercase tracking-wide text-muted-foreground/50 block select-none pointer-events-none">
          {label}
        </p>
      </CardContent>
    </Card>
  );
});

/**
 * GroUp Academy: Creator Engagement Telemetry Insights Panel (CreatorAnalytics)
 * Hardened statistics cockpit locking transaction metrics, calculating conversion funnels, and tracking performance indices safely.
 * Version: Launch Candidate · Phase Z1 Analytics Matrix Sealed
 */
export default function CreatorAnalytics() {
  const { talent: talentProfileRecord } = useTalent();
  const [activeDaysFilterInterval, setActiveDaysFilterInterval] = React.useState<7 | 30>(7);

  // Cast incoming query responses to explicit contract shapes to protect analytics processing tasks
  const scorecardQueryResponse = useCreatorScorecard(talentProfileRecord?.id, activeDaysFilterInterval);
  const topPostsQueryResponse = useCreatorTopPosts(talentProfileRecord?.id, activeDaysFilterInterval, 10);

  const isScorecardResolving = scorecardQueryResponse.isLoading;
  const resolvedScorecardData = scorecardQueryResponse.data as unknown as ScorecardResponse | undefined;
  const resolvedTopPostsArray = (topPostsQueryResponse.data as unknown as PostTelemetryNode[]) || [];

  const currentMetricsMap = resolvedScorecardData?.current ?? {};
  const previousMetricsMap = resolvedScorecardData?.previous ?? {};
  const globalPublishedPostCount = resolvedScorecardData?.post_count ?? 0;

  // =========================================================================
  // MEMOIZED PARAMETER SECTOR: SECURE ANALYTICS FUNNEL CALCULATION MATRIX
  // =========================================================================
  const calculatedEngagementFunnel = React.useMemo(() => {
    const totalImpressionsDenom = Number(currentMetricsMap.impressions || 0);

    // Safety check divisor threshold to block NaN or Infinite calculations
    if (totalImpressionsDenom <= 0) {
      return { hype: 0, comment: 0, save: 0, share: 0 };
    }

    return {
      hype: Math.round((Number(currentMetricsMap.hypes || 0) / totalImpressionsDenom) * 1000) / 10,
      comment: Math.round((Number(currentMetricsMap.comments || 0) / totalImpressionsDenom) * 1000) / 10,
      save: Math.round((Number(currentMetricsMap.saves || 0) / totalImpressionsDenom) * 1000) / 10,
      share: Math.round((Number(currentMetricsMap.shares || 0) / totalImpressionsDenom) * 1000) / 10,
    };
  }, [currentMetricsMap]);

  const funnelDatasetRows = React.useMemo<FunnelRowItem[]>(() => {
    return [
      { label: "Hype Conversion Factor", value: calculatedEngagementFunnel.hype, color: "bg-orange-500" },
      { label: "Comment Generation Density", value: calculatedEngagementFunnel.comment, color: "bg-blue-500" },
      { label: "Bookmark Preservation Index", value: calculatedEngagementFunnel.save, color: "bg-purple-500" },
      { label: "Broadcast Redistribution Ratio", value: calculatedEngagementFunnel.share, color: "bg-cyan-500" },
    ];
  }, [calculatedEngagementFunnel]);

  const handleIntervalRangeToggleAction = React.useCallback((extractedValue: string) => {
    setActiveDaysFilterInterval(Number(extractedValue) as 7 | 30);
  }, []);

  return (
    <div className="min-h-screen bg-muted/10 pb-32 text-left antialiased block transform-gpu w-full">
      {/* HUD LEVEL 1: APPLICATION COCKPIT ACTION BAR HEADER */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/40 select-none">
        <div className="max-w-2xl mx-auto px-4 h-12 flex items-center gap-3.5 leading-none w-full">
          <Button
            asChild
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-lg cursor-pointer border border-border/5 bg-background hover:bg-muted shrink-0"
          >
            <Link to="/app/feed" aria-label="Return to parent index track link">
              <ArrowLeft className="h-4 w-4 stroke-[2.5]" />
            </Link>
          </Button>
          <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wide text-foreground pt-0.5">
            <BarChart3 className="h-4 w-4 text-primary stroke-[2.2] shrink-0" />
            <span>Creative Telemetry Diagnostics</span>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4 block w-full">
        {/* HUD LEVEL 2: CALENDAR TIMELINE SCOPE SELECT Tabs */}
        <div className="w-full block shrink-0 select-none leading-none h-10">
          <Tabs
            value={String(activeDaysFilterInterval)}
            onValueChange={handleIntervalRangeToggleAction}
            className="w-full block leading-none"
          >
            <TabsList className="grid w-full grid-cols-2 p-1 h-10 bg-muted/40 rounded-lg border border-border/10 select-none">
              <TabsTrigger
                value="7"
                className="rounded-md font-mono text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wide h-8 cursor-pointer outline-none pt-0.5"
              >
                7-Day Analysis Frame
              </TabsTrigger>
              <TabsTrigger
                value="30"
                className="rounded-md font-mono text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wide h-8 cursor-pointer outline-none pt-0.5"
              >
                30-Day Evaluation Frame
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* HUD LEVEL 3: DISCRETE DATA INVENTORY CONDITIONAL CHECKPOINT BLOCKS */}
        {isScorecardResolving ? (
          <div className="grid grid-cols-2 gap-2 select-none pointer-events-none w-full block">
            {SKELETON_ROWS_ROSTER.map((numericalIndex) => (
              <Skeleton
                key={`analytics-tile-loading-row-${numericalIndex}`}
                className="h-20 w-full rounded-lg bg-card/20 block border border-transparent shadow-none"
              />
            ))}
          </div>
        ) : globalPublishedPostCount === 0 ? (
          <Card className="rounded-lg border border-dashed border-border/80 bg-card/20 text-center select-none block w-full shadow-none mt-2">
            <CardContent className="p-8 space-y-4 block w-full leading-none">
              <div className="h-9 w-9 rounded-lg bg-background border border-border/40 flex items-center justify-center text-muted-foreground/30 mx-auto pointer-events-none">
                <BarChart3 className="h-4 w-4 stroke-[2.2]" />
              </div>
              <div className="space-y-1 block max-w-xs mx-auto">
                <p className="text-xs font-bold text-foreground uppercase tracking-wide">Creative Footprint Absent</p>
                <p className="text-[11px] font-semibold text-muted-foreground/50 leading-normal">
                  No active publishing record was tracked inside this candidate identity ledger block sequence.
                </p>
              </div>
              <Button
                asChild
                type="button"
                size="sm"
                className="h-8.5 rounded-lg font-mono text-[10px] font-extrabold uppercase tracking-wider px-4 cursor-pointer shadow-2xs transform-gpu active:scale-[0.985]"
              >
                <Link to="/app/feed">Initialize Blueprint Post</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* HUD LEVEL 4: SYSTEM DATA TILES PLACEMENT CONTAINER */}
            <div className="grid grid-cols-2 gap-2 w-full block align-top">
              <Tile
                label="System Impressions"
                value={(currentMetricsMap.impressions || 0).toLocaleString()}
                delta={calculatePercentageDeltaInt(
                  currentMetricsMap.impressions || 0,
                  previousMetricsMap.impressions || 0,
                )}
                icon={<Eye className="h-4 w-4 stroke-[2.2]" />}
              />
              <Tile
                label="Hype Factor Units"
                value={(currentMetricsMap.hypes || 0).toLocaleString()}
                delta={calculatePercentageDeltaInt(currentMetricsMap.hypes || 0, previousMetricsMap.hypes || 0)}
                icon={<Flame className="h-4 w-4 stroke-[2.2]" />}
                accent="text-orange-600"
              />
              <Tile
                label="Bounty Credits Settled"
                value={Number(currentMetricsMap.credits_earned || 0).toFixed(1)}
                delta={calculatePercentageDeltaInt(
                  Math.round(Number(currentMetricsMap.credits_earned || 0)),
                  Math.round(Number(previousMetricsMap.credits_earned || 0)),
                )}
                icon={<Coins className="h-4 w-4 stroke-[2]" />}
                accent="text-emerald-600"
              />
              <Tile
                label="Response Comments"
                value={(currentMetricsMap.comments || 0).toLocaleString()}
                delta={calculatePercentageDeltaInt(currentMetricsMap.comments || 0, previousMetricsMap.comments || 0)}
                icon={<MessageCircle className="h-4 w-4 stroke-[2.2]" />}
                accent="text-blue-600"
              />
              <Tile
                label="Ledger Preservations"
                value={(currentMetricsMap.saves || 0).toLocaleString()}
                delta={calculatePercentageDeltaInt(currentMetricsMap.saves || 0, previousMetricsMap.saves || 0)}
                icon={<Bookmark className="h-4 w-4 stroke-[2.2]" />}
                accent="text-purple-600"
              />
              <Tile
                label="Redistribution Shares"
                value={(currentMetricsMap.shares || 0).toLocaleString()}
                delta={calculatePercentageDeltaInt(currentMetricsMap.shares || 0, previousMetricsMap.shares || 0)}
                icon={<Share2 className="h-4 w-4 stroke-[2.2]" />}
                accent="text-cyan-600"
              />
            </div>

            {/* HUD LEVEL 5: ENGAGEMENT PIPELINE CONVERSION FLOW CARD */}
            <Card className="rounded-lg border border-border/60 bg-card/40 shadow-none overflow-hidden block w-full">
              <CardContent className="p-4 space-y-4 block w-full leading-none">
                <h2 className="text-xs font-mono font-extrabold uppercase tracking-wide text-muted-foreground/50 select-none block leading-none pb-2 border-b border-border/5">
                  Algorithmic Conversion Funnel Telemetry
                </h2>

                <div className="space-y-3.5 block w-full leading-none pt-0.5">
                  {funnelDatasetRows.map((rowItem) => (
                    <div
                      key={`funnel-telemetry-row-${rowItem.label}`}
                      className="space-y-1 block w-full leading-none font-sans font-medium"
                    >
                      <div className="flex justify-between items-center text-xs w-full block">
                        <span className="text-muted-foreground/80 font-semibold">{rowItem.label}</span>
                        <span className="font-mono font-bold text-foreground/90 tabular-nums">
                          {rowItem.value.toLocaleString()}%
                        </span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden block w-full select-none pointer-events-none shadow-inner border border-border/5">
                        <div
                          className={cn("h-full rounded-full transition-all duration-300", rowItem.color)}
                          style={{ width: `${Math.min(100, rowItem.value).toString()}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* HUD LEVEL 6: TOP LEVEL CONTENT PERFORMANCE MANIFEST TRACKS */}
            {resolvedTopPostsArray.length > 0 && (
              <Card className="rounded-lg border border-border/60 bg-card/40 shadow-none overflow-hidden block w-full">
                <CardContent className="p-3.5 space-y-3 block w-full leading-none">
                  <h2 className="text-xs font-mono font-extrabold uppercase tracking-wide text-muted-foreground/50 select-none block leading-none pb-2 border-b border-border/5 px-0.5">
                    Highest-Yield Publication Registry
                  </h2>

                  <div className="space-y-2 block w-full pt-0.5">
                    {resolvedTopPostsArray.map((postRecordNode) => (
                      <Link
                        key={`top-performing-post-link-${postRecordNode.id}`}
                        to={`/app/feed/post/${postRecordNode.id}`}
                        className="block p-3 rounded-lg border border-border/50 bg-background/50 hover:border-border-foreground/10 transition-colors block w-full leading-none"
                      >
                        <p className="text-xs font-semibold text-foreground/80 leading-normal mb-2 select-text whitespace-normal break-words tracking-normal line-clamp-2 pr-1">
                          {postRecordNode.snippet || "— Empty Abstract Parameters Specification —"}
                        </p>

                        {/* Analytical Sub-Metrics Label Rows */}
                        <div className="flex flex-wrap items-center gap-3 font-mono text-[9px] font-bold text-muted-foreground/40 uppercase tracking-tight select-none pointer-events-none leading-none tabular-nums w-full shrink-0">
                          <span className="flex items-center gap-1 shrink-0">
                            <Eye className="h-3 w-3 stroke-[2]" />
                            <span>{postRecordNode.impression_count.toLocaleString()}</span>
                          </span>
                          <span className="flex items-center gap-1 text-orange-600 shrink-0">
                            <Flame className="h-3 w-3 stroke-[2] fill-orange-500/10" />
                            <span>{postRecordNode.hype_count.toLocaleString()}</span>
                          </span>
                          <span className="flex items-center gap-1 text-blue-600 shrink-0">
                            <MessageCircle className="h-3 w-3 stroke-[2]" />
                            <span>{postRecordNode.comment_count.toLocaleString()}</span>
                          </span>
                          <span className="flex items-center gap-1 text-purple-600 shrink-0">
                            <Bookmark className="h-3 w-3 stroke-[2]" />
                            <span>{postRecordNode.save_count.toLocaleString()}</span>
                          </span>
                          <span className="flex items-center gap-1 text-cyan-600 shrink-0">
                            <Share2 className="h-3 w-3 stroke-[2]" />
                            <span>{postRecordNode.share_count.toLocaleString()}</span>
                          </span>
                          <span className="flex items-center gap-1 text-emerald-600 ml-auto shrink-0 font-extrabold tracking-wide">
                            <Coins className="h-3 w-3 stroke-[2]" />
                            <span>+{Number(postRecordNode.credits_earned || 0).toFixed(1)}</span>
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// Low-profile index tracking array initialization helper
const SKELETON_ROWS_ROSTER = [1, 2, 3, 4, 5, 6];
