import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, TrendingDown, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trackError, trackEvent } from "@/lib/errorTracking";
import { cn } from "@/lib/utils";

interface VerifiedMatch {
  mastery_score?: number;
  matched_count?: number;
  total_required?: number;
  mastery_topics?: Array<{ tag: string; mastery: number }>;
  gap_topics?: Array<{ tag: string; mastery: number }>;
  verified_credentials?: Array<{ topic_tag: string; level: string; verify_code?: string }>;
}

interface WhyYouMatchPanelProps {
  verifiedMatch?: VerifiedMatch | null;
}

/**
 * Why-you-match panel: surfaces verified credentials, mastery topics, and
 * skill gaps from score-job-match's verified_match payload.
 */
export function WhyYouMatchPanel({ verifiedMatch }: WhyYouMatchPanelProps) {
  // Monitor algorithmic matching panel initialization configurations via telemetry
  useEffect(() => {
    if (verifiedMatch) {
      trackEvent("why_you_match_panel_rendered", {
        hasScore: typeof verifiedMatch.mastery_score === "number",
        credentialsCount: verifiedMatch.verified_credentials?.length || 0,
        gapsCount: verifiedMatch.gap_topics?.length || 0,
      });
    }
  }, [verifiedMatch]);

  if (!verifiedMatch) return null;

  const credentials = verifiedMatch.verified_credentials || [];
  const masteryTopics = verifiedMatch.mastery_topics || [];
  const gaps = verifiedMatch.gap_topics || [];

  // Prevent rendering empty placeholder blocks onto user timeline containers
  if (credentials.length === 0 && masteryTopics.length === 0 && gaps.length === 0) {
    return null;
  }

  const handlePracticeNavigationTracking = () => {
    trackEvent("why_you_match_practice_redirect_clicked");
  };

  return (
    <Card className="rounded-2xl border border-success/20 bg-success/5 select-none sm:select-text antialiased transform-gpu shadow-sm relative overflow-hidden">
      <CardContent className="p-4 space-y-3.5 w-full min-w-0">
        {/* Header */}
        <div className="flex items-center gap-2 w-full select-none border-b border-success/10 pb-2">
          <ShieldCheck className="h-4 w-4 text-success dark:text-success shrink-0 stroke-[2.5]" />
          <h3 className="text-xs sm:text-sm font-bold tracking-tight text-foreground/90 uppercase tracking-wide">
            Why you match
          </h3>
          {typeof verifiedMatch.mastery_score === "number" && (
            <Badge
              variant="outline"
              className="ml-auto border-success/30 bg-success/10 text-success dark:text-success text-[10px] font-extrabold h-5 px-2 rounded-md shadow-sm tabular-nums"
            >
              <span>{Math.round(verifiedMatch.mastery_score)} / 100 fit</span>
            </Badge>
          )}
        </div>

        {/* Verified credentials */}
        {credentials.length > 0 && (
          <div className="space-y-1 w-full text-left">
            <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/80 pl-0.5 select-none leading-none">
              Verified credentials
            </p>
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5 max-w-full">
              {credentials.map((credentialItem, index) => {
                if (!credentialItem || !credentialItem.topic_tag) return null;

                // 1. Key Ingestion Resolved: Prevent matching array list crashes via deterministic indices
                const compoundRowKey = `${credentialItem.topic_tag}_${credentialItem.level}_${index}`;

                return (
                  <Badge
                    key={compoundRowKey}
                    variant="outline"
                    className="border-success/20 bg-success/10 text-success dark:text-success text-[9px] font-extrabold px-2 h-5 rounded-md uppercase tracking-wide shrink-0 shadow-sm max-w-[45%] truncate text-ellipsis"
                  >
                    <span className="truncate text-ellipsis">
                      {credentialItem.topic_tag} &bull; {credentialItem.level}
                    </span>
                  </Badge>
                );
              })}
            </div>
          </div>
        )}

        {/* Mastered topics */}
        {masteryTopics.length > 0 && (
          <div className="space-y-1 w-full text-left">
            <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/80 pl-0.5 select-none leading-none">
              Skills you've shown
            </p>
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5 max-w-full">
              {masteryTopics.slice(0, 6).map((topicItem, index) => {
                if (!topicItem || !topicItem.tag) return null;
                const computedTopicKey = `${topicItem.tag}_mastery_${index}`;

                return (
                  <Badge
                    key={computedTopicKey}
                    variant="secondary"
                    className="text-[9px] font-extrabold uppercase tracking-wide bg-background/50 border border-border/40 text-muted-foreground/90 px-2 h-5 rounded-md shadow-sm shrink-0 max-w-[45%] truncate text-ellipsis tabular-nums"
                  >
                    <span className="truncate text-ellipsis">
                      {topicItem.tag} &bull; {Math.round(Number(topicItem.mastery || 0) * 100)}%
                    </span>
                  </Badge>
                );
              })}
            </div>
          </div>
        )}

        {/* Skill gaps */}
        {gaps.length > 0 && (
          <div className="space-y-1.5 pt-1.5 border-t border-success/10 w-full text-left">
            <div className="flex items-center gap-1.5 select-none leading-none pl-0.5">
              <TrendingDown className="h-3.5 w-3.5 text-warning shrink-0 stroke-[2.2]" />
              <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/80">
                Skills to practice
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 max-w-full">
              {gaps.slice(0, 5).map((gapItem, index) => {
                if (!gapItem || !gapItem.tag) return null;
                const computedGapKey = `${gapItem.tag}_gap_${index}`;

                return (
                  <Badge
                    key={computedGapKey}
                    variant="outline"
                    className="border-warning/20 bg-warning/10 text-warning dark:text-warning text-[9px] font-extrabold px-2 h-5 rounded-md uppercase tracking-wide shrink-0 max-w-[45%] truncate text-ellipsis"
                  >
                    <span className="truncate text-ellipsis">{gapItem.tag}</span>
                  </Badge>
                );
              })}
            </div>

            {/* Outbound interactive learning redirect bridge with wired telemetry controls */}
            <div className="pt-0.5 select-none">
              <Link
                to="/app/talent-mirror"
                onClick={handlePracticeNavigationTracking}
                className="inline-flex items-center gap-1 text-[11px] font-bold tracking-tight text-primary hover:text-primary hover:underline transition-colors mt-0.5 cursor-pointer"
              >
                <span>Practice these skills</span>
                <ArrowRight className="h-3.5 w-3.5 text-primary stroke-[2.5] animate-in slide-in-from-left-1 duration-300" />
              </Link>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
