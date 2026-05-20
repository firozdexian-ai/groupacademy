import { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trackError, trackEvent } from "@/lib/errorTracking";
import { BadgeCheck, Award, Trophy, ExternalLink, Sparkles, Share2, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSkillCredentials, useIssueSkillCredentials, type SkillCredential } from "@/hooks/useSkillCredentials";
import { useTalent } from "@/hooks/useTalent";
import { usePublicProfileSettings } from "@/hooks/usePublicProfileSettings";
import { useToast } from "@/hooks/use-toast";

const LEVEL_META: Record<SkillCredential["level"], { icon: any; label: string; tone: string }> = {
  foundational: {
    icon: BadgeCheck,
    label: "Foundational",
    tone: "text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20",
  },
  proficient: {
    icon: Award,
    label: "Proficient",
    tone: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  },
  expert: {
    icon: Trophy,
    label: "Expert",
    tone: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20",
  },
};

/**
 * GroUp Academy: Psychometric Verification Ledger Node (SkillCredentialsPanel)
 * CTO Reference: Authoritative panel validating candidate competency scores and orchestrating multi-channel social verification routes.
 * Version: Launch Candidate · Phase Z0 Hardened
 */
export function SkillCredentialsPanel({ compact = false, limit }: { compact?: boolean; limit?: number }) {
  const queryClient = useQueryClient();
  const { talent } = useTalent();
  const { toast } = useToast();

  const { data = [], isLoading, error: queryFetchError } = useSkillCredentials(talent?.id);
  const issue = useIssueSkillCredentials();
  const { data: pub } = usePublicProfileSettings();

  // Monitor skill credential panel impressions safely via telemetry hooks
  useEffect(() => {
    if (talent?.id && data.length > 0) {
      trackEvent("skill_credentials_panel_mounted", { talentId: talent.id, totalEarned: data.length });
    }
  }, [talent?.id, data.length]);

  // 1. Opportunistic Mint Hardening: Safeguard background mutators via strict identity validation constraints
  useEffect(() => {
    if (!talent?.id) return;

    const operationalMintTokenKey = `skill-cred-mint:${talent.id}`;
    if (sessionStorage.getItem(operationalMintTokenKey)) return;

    sessionStorage.setItem(operationalMintTokenKey, "1");
    trackEvent("skill_credentials_lazy_mint_triggered", { talentId: talent.id });

    try {
      issue.mutate(undefined, {
        onSuccess: () => {
          trackEvent("skill_credentials_lazy_mint_success", { talentId: talent.id });
          queryClient.invalidateQueries({ queryKey: ["skill-credentials", talent.id] });
          queryClient.invalidateQueries({ queryKey: ["feed-posts"] });
        },
        onError: (mutationErr) => {
          trackError(mutationErr, {
            component: "SkillCredentialsPanel",
            action: "lazy_mint_background_mutation",
            talentId: talent.id,
          });
        },
      });
    } catch (err) {
      trackError(err, {
        component: "SkillCredentialsPanel",
        action: "lazy_mint_try_catch_block",
        talentId: talent.id,
      });
    }
  }, [talent?.id, issue, queryClient]);

  // Handle pipeline error ingestion boundaries cleanly
  useEffect(() => {
    if (queryFetchError) {
      trackError(queryFetchError, {
        component: "SkillCredentialsPanel",
        action: "fetch_useSkillCredentials_hook_api",
        talentId: talent?.id,
      });
    }
  }, [queryFetchError, talent?.id]);

  if (isLoading) {
    return (
      <Card className="border border-border/40 bg-card/60 backdrop-blur-md rounded-2xl select-none w-full animate-pulse">
        <CardContent className="p-4 space-y-3 w-full">
          <Skeleton className="h-5 w-36 rounded-lg opacity-60" />
          <Skeleton className="h-10 w-full rounded-xl opacity-40" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return null;
  }

  const items = limit ? data.slice(0, limit) : data;

  const handleSharePublicProfileLink = () => {
    if (!pub?.public_handle) return;

    const absoluteProfileShareUrl = `${window.location.origin}/t/${pub.public_handle}`;
    trackEvent("skill_credentials_share_profile_clicked", { publicHandle: pub.public_handle });

    try {
      navigator.clipboard.writeText(absoluteProfileShareUrl);
      toast({
        title: "Share link copied",
        description: "Public verification address added to your operational ledger.",
      });
    } catch (clipboardErr) {
      trackError(clipboardErr, { component: "SkillCredentialsPanel", action: "copy_to_clipboard" });
      toast({
        variant: "destructive",
        title: "Clipboard interaction blocked",
        description: "Please copy the address bar link manually.",
      });
    }
  };

  return (
    <Card className="w-full text-left rounded-2xl border border-border/40 bg-card/60 backdrop-blur-md shadow-sm antialiased transform-gpu overflow-hidden">
      {/* HUD HEADER: REGISTRY META INFORMATION SECTION */}
      <CardHeader className="p-4 pb-2 select-none border-b border-border/10 bg-muted/20">
        <CardTitle className="text-xs font-bold text-foreground/90 uppercase tracking-wider flex items-center justify-between gap-4 w-full">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary fill-primary/5 stroke-[2.2] animate-pulse" />
            <span>Verified Skill Competency Credentials</span>
          </div>
          <Badge
            variant="secondary"
            className="text-[10px] font-extrabold px-2 h-5 bg-background shadow-inner text-muted-foreground shrink-0 rounded tabular-nums"
          >
            {data.length} validated
          </Badge>
        </CardTitle>
      </CardHeader>

      {/* HUD CONTENT: INTERACTIVE STREAM CONTAINER AREA */}
      <CardContent className="p-4 space-y-3 w-full min-w-0 flex flex-col font-bold text-xs tracking-tight">
        <div className="space-y-2 w-full min-w-0">
          {items.map((credentialItem) => {
            if (!credentialItem || !credentialItem.level) return null;

            const meta = LEVEL_META[credentialItem.level] || LEVEL_META.foundational;
            const Icon = meta.icon || BadgeCheck;
            const calculatedMasteryScore = Math.round(Number(credentialItem.mastery_at_issue || 0) * 100);

            return (
              <div
                key={credentialItem.id}
                className={cn(
                  "flex items-center justify-between gap-3.5 rounded-xl border p-3 bg-background/40 backdrop-blur-sm shadow-sm transition-all hover:border-border/60 w-full min-w-0 group animate-in fade-in duration-200",
                )}
              >
                {/* Icon marker shield layout frame */}
                <div
                  className={cn(
                    "h-8 w-8 rounded-lg border flex items-center justify-center shrink-0 shadow-inner select-none transition-transform duration-300 group-hover:rotate-2",
                    meta.tone,
                  )}
                >
                  <Icon className="h-4 w-4 text-current stroke-[2.2]" />
                </div>

                {/* Text Taxonomy Metadata Rows Block */}
                <div className="min-w-0 flex-1 space-y-0.5 text-left">
                  <p className="text-xs font-bold text-foreground/90 tracking-tight truncate capitalize text-ellipsis pr-1 select-text">
                    {credentialItem.topic_tag ? credentialItem.topic_tag.replace(/_/g, " ") : "Competency Node"}
                  </p>
                  {!compact && (
                    <p className="text-[11px] font-semibold text-muted-foreground/80 tracking-tight truncate text-ellipsis select-all leading-none pt-0.5">
                      <span>{meta.label}</span> &bull;{" "}
                      <span>{(credentialItem as any).content?.title || "Cross-Course Index"}</span> &bull;{" "}
                      <span className="font-mono text-[10px] bg-muted/40 border px-1 rounded shadow-sm leading-none inline-block tabular-nums">
                        {calculatedMasteryScore}% mastery
                      </span>
                    </p>
                  )}
                </div>

                {/* External route public registry verification block */}
                <Link
                  to={`/verify/skill/${credentialItem.verify_code}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() =>
                    trackEvent("skill_credentials_verify_link_clicked", { verifyCode: credentialItem.verify_code })
                  }
                  className="text-[11px] font-extrabold uppercase tracking-wide text-primary hover:text-primary hover:underline transition-colors flex items-center gap-0.5 select-none shrink-0"
                  aria-label={`Verify skill credential validation asset for ${credentialItem.topic_tag}`}
                >
                  <span>Verify</span>
                  <ExternalLink className="h-3.5 w-3.5 stroke-[2.5]" />
                </Link>
              </div>
            );
          })}
        </div>

        {/* HUD FOOTER: WORKSPACE MANAGEMENT CONTROLS LINKING STRIP */}
        <div className="space-y-2 pt-2 border-t border-border/10 w-full select-none text-center">
          {limit && data.length > limit && (
            <Link
              to="/app/talent-mirror"
              onClick={() => trackEvent("skill_credentials_see_all_clicked")}
              className="block w-full text-center text-xs font-bold text-primary hover:underline transition-colors pb-0.5"
            >
              See all {data.length.toLocaleString()} verified assets &rarr;
            </Link>
          )}

          {pub?.public_profile_enabled && pub.public_handle ? (
            <Button
              size="sm"
              variant="ghost"
              type="button"
              onClick={pub?.public_handle ? handleSharePublicProfileLink : undefined}
              className="w-full h-8 text-xs font-bold text-primary hover:text-primary hover:bg-primary/5 rounded-xl cursor-pointer shadow-none gap-1.5 flex items-center justify-center transition-colors"
            >
              <Share2 className="h-3.5 w-3.5 stroke-[2.2]" />
              <span>Share Public Verification Profile</span>
            </Button>
          ) : (
            <Link
              to="/app/profile"
              onClick={() => trackEvent("skill_credentials_make_public_clicked")}
              className="w-full h-8 text-xs font-bold text-muted-foreground/80 hover:text-primary rounded-xl flex items-center justify-center gap-1.5 transition-colors border border-dashed border-border/40 bg-muted/10 hover:bg-background hover:border-solid"
            >
              <Lock className="h-3.5 w-3.5 text-muted-foreground/60 stroke-[2.2]" />
              <span>Publish Credentials over Main Network Profile &rarr;</span>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
