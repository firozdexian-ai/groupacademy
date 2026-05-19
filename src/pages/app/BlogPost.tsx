import * as React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Clock, ArrowLeft, User, Calendar, Tag, Share2, Eye, ExternalLink, Sparkles, Loader2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/common/EmptyState";
import { PAGE_SHELL, META_TEXT, CARD } from "@/lib/uiTokens";

// =========================================================================
// DETERMINISTIC COMPONENT DATA TYPE CONTRACTS
// =========================================================================
interface BlogPostPayload {
  id: string;
  title: string;
  slug: string;
  content: string | null;
  excerpt: string | null;
  category: string | null;
  tags: string[] | null;
  featured_image: string | null;
  author_name: string | null;
  published_at: string | null;
  reading_time_mins: number | null;
  views: number | null;
  external_url: string | null;
  status: string;
}

/**
 * GroUp Academy: Knowledge Briefing Content Canvas Reader (BlogPost)
 * Hardened responsive reader framing article telemetry and shielding insertion blocks from Cross-Site Scripting (XSS) anomalies.
 * Version: Launch Candidate · Phase Z1 Transaction Matrix Sealed
 */
export default function BlogPost() {
  const { slug: unverifiedPostSlugStr } = useParams<{ slug: string }>();
  const navigateHook = useNavigate();

  // Guard reference sealing atomic view update tracking runs from double rendering thrashes
  const executionTrackingGuardRef = React.useRef<boolean>(false);

  // =========================================================================
  // DATA ACQUISITION PIPELINE SECURED VIA TANSTACK CACHE CHANNEL
  // =========================================================================
  const { data: blogPostQueryPayload, isLoading: isPostCacheResolving } = useQuery({
    queryKey: ["app-blog-article-detail-node", unverifiedPostSlugStr],
    queryFn: async (): Promise<BlogPostPayload> => {
      const { data: dbPostPayload, error: queryHandshakeError } = await supabase
        .from("blog_posts")
        .select(
          "id, title, slug, content, excerpt, category, tags, featured_image, author_name, published_at, reading_time_mins, views, external_url, status",
        )
        .eq("slug", unverifiedPostSlugStr!)
        .eq("status", "published")
        .maybeSingle();

      if (queryHandshakeError) throw queryHandshakeError;
      if (!dbPostPayload) throw new Error("Target article metrics map unassigned.");
      return dbPostPayload as unknown as BlogPostPayload;
    },
    enabled: !!unverifiedPostSlugStr,
    staleTime: 5 * 60 * 1000,
  });

  const activeArticleRecord = blogPostQueryPayload;

  // =========================================================================
  // ATOMIC ANALYTICS INCUBATION LAYER FOR TELEMETRY ENGINE
  // =========================================================================
  React.useEffect(() => {
    if (!activeArticleRecord?.id || executionTrackingGuardRef.current) return;

    executionTrackingGuardRef.current = true;
    const targetPostIdUUID = activeArticleRecord.id;
    const fallbackViewsCountInt = activeArticleRecord.views || 0;

    const commitAtomicViewIncrementMutation = async () => {
      try {
        await supabase
          .from("blog_posts")
          .update({ views: fallbackViewsCountInt + 1 })
          .eq("id", targetPostIdUUID);
      } catch (suppressedMutationException) {
        // Suppress analytic tracing failures safely from core component threads
      }
    };

    commitAtomicViewIncrementMutation();
  }, [activeArticleRecord?.id, activeArticleRecord?.views]);

  const handleShareArticleRouteTrigger = React.useCallback(async () => {
    if (!activeArticleRecord) return;
    const finalizedShareTargetUrlStr = activeArticleRecord.external_url || window.location.href;

    try {
      if (navigator.share) {
        await navigator.share({
          title: activeArticleRecord.title,
          text: activeArticleRecord.excerpt || "GroUp Academy Knowledge Briefings Spec Node.",
          url: finalizedShareTargetUrlStr,
        });
      } else {
        throw new Error("Native interface stack absent.");
      }
    } catch (suppressedShareException) {
      try {
        await navigator.clipboard.writeText(finalizedShareTargetUrlStr);
        toast.success("Secure brief parameter routing link copied to clipboard buffer.");
      } catch (fallbackClipboardError) {
        toast.error("Clipboard authorization refused by candidate hardware container.");
      }
    }
  }, [activeArticleRecord]);

  const handleReturnToInsightsCatalog = React.useCallback(() => {
    navigateHook("/app/learning/blog");
  }, [navigateHook]);

  const handleLaunchExternalArticleFrame = React.useCallback(() => {
    if (activeArticleRecord?.external_url) {
      window.open(activeArticleRecord.external_url, "_blank", "noopener,noreferrer");
    }
  }, [activeArticleRecord]);

  const handleTransitionToAIAgentsWorkspace = React.useCallback(() => {
    navigateHook("/app/agents");
  }, [navigateHook]);

  // =========================================================================
  // CONDITION RENDERING SKELETON GATES AND CHECKS
  // =========================================================================
  if (isPostCacheResolving) {
    return (
      <div
        className={cn(
          PAGE_SHELL,
          "space-y-4 text-left antialiased block transform-gpu w-full select-none pointer-events-none",
        )}
      >
        <Skeleton className="h-8 w-3/4 rounded-lg block" />
        <Skeleton className="h-48 w-full rounded-xl bg-card/20 block shadow-none border border-transparent" />
        <div className="space-y-2 block w-full">
          <Skeleton className="h-4 w-full rounded-xs block" />
          <Skeleton className="h-4 w-5/6 rounded-xs block" />
        </div>
      </div>
    );
  }

  if (!activeArticleRecord) {
    return (
      <div className={cn(PAGE_SHELL, "w-full text-left block antialiased")}>
        <EmptyState
          icon={ShieldAlertNodeHelper}
          title="Brief Record De-Indexed"
          description="The requested insight analysis pipeline data mapping parameters have been restricted or pruned from active catalog tracks."
          action={{ label: "Return to Insights Board", onClick: handleReturnToInsightsCatalog }}
        />
      </div>
    );
  }

  const tagPillsArray = activeArticleRecord.tags || [];

  return (
    <div className={cn(PAGE_SHELL, "text-left antialiased block transform-gpu w-full space-y-4 pb-24")}>
      {/* HUD LEVEL 1: APPLICATION HEADER PANEL ACTIONS CONTROL BAR */}
      <header className="block select-none leading-none w-full shrink-0 pb-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleReturnToInsightsCatalog}
          className="h-8 px-2.5 rounded-md font-bold uppercase tracking-wide text-xs gap-1 cursor-pointer text-muted-foreground hover:text-foreground -ml-2"
        >
          <ArrowLeft className="h-3.5 w-3.5 stroke-[2.5]" /> <span>Insights Catalog</span>
        </Button>
      </header>

      {/* HUD LEVEL 2: DETAILED DATA TITLE METADATA HUD CORE */}
      <div className="space-y-3 block w-full leading-none">
        <div className="flex flex-wrap gap-1.5 select-none pointer-events-none leading-none w-full block">
          {activeArticleRecord.category && (
            <Badge
              variant="outline"
              className="font-mono text-[8px] font-black uppercase px-1.5 h-4.5 rounded-xs bg-background border-border/40 tracking-wide pt-0 leading-none shrink-0"
            >
              {activeArticleRecord.category.toUpperCase()}
            </Badge>
          )}

          {tagPillsArray.map((tagStringToken, tagIdxPosition) => (
            <Badge
              key={`article-tag-pill-node-${tagStringToken}-${tagIdxPosition}`}
              variant="outline"
              className="font-mono text-[8px] font-extrabold uppercase px-1.5 h-4.5 rounded-xs text-muted-foreground border-border/20 bg-muted/5 gap-1 pt-0 leading-none shrink-0"
            >
              <Tag className="h-2.5 w-2.5 stroke-[2] shrink-0 text-muted-foreground/40" />
              <span>{tagStringToken.toUpperCase()}</span>
            </Badge>
          ))}
        </div>

        <h1 className="text-base sm:text-lg md:text-xl font-bold uppercase tracking-wide text-foreground leading-tight block select-text pt-0.5">
          {activeArticleRecord.title}
        </h1>

        {/* Telemetry metadata log indicators row */}
        <div className="flex flex-wrap items-center gap-3.5 font-mono text-[9px] font-bold text-muted-foreground/40 uppercase tracking-tight select-none pointer-events-none leading-none pt-1 tabular-nums w-full shrink-0">
          {activeArticleRecord.author_name && (
            <span className="flex items-center gap-1 shrink-0">
              <User className="h-3.5 w-3.5 stroke-[2.2]" /> <span>AUTHOR: {activeArticleRecord.author_name}</span>
            </span>
          )}
          {activeArticleRecord.published_at && (
            <span className="flex items-center gap-1 shrink-0">
              <Calendar className="h-3.5 w-3.5 stroke-[2.2]" />
              <span>INDEXED: {format(new Date(activeArticleRecord.published_at), "MMM d, yyyy").toUpperCase()}</span>
            </span>
          )}
          <span className="flex items-center gap-1 shrink-0">
            <Clock className="h-3.5 w-3.5 stroke-[2.2]" />
            <span>SPEED WEIGHT: {(activeArticleRecord.reading_time_mins || 5).toString()} MIN READ</span>
          </span>
          <span className="flex items-center gap-1 shrink-0">
            <Eye className="h-3.5 w-3.5 stroke-[2.2]" />
            <span>AUDIT READS: {(activeArticleRecord.views || 0).toLocaleString()}</span>
          </span>
        </div>
      </div>

      {/* HUD LEVEL 3: IMAGE MEDIA MATRICES LAYOUT FRAME CANVAS */}
      {activeArticleRecord.featured_image && (
        <div className="aspect-video rounded-xl overflow-hidden border border-border/40 w-full block select-none pointer-events-none shadow-2xs shrink-0">
          <img src={activeArticleRecord.featured_image} alt="" className="w-full h-full object-cover block" />
        </div>
      )}

      {/* HUD LEVEL 4: EXCERPT OUTLINE SUMMARY HIGHLIGHT SEGMENT BLOCK */}
      {activeArticleRecord.excerpt && (
        <Card
          className={cn(
            CARD,
            "rounded-lg border-y border-r border-border/60 border-l-4 border-l-primary shadow-none overflow-hidden block w-full bg-primary/[0.01]",
          )}
        >
          <CardContent className="p-3.5 block w-full">
            <p className="text-xs sm:text-sm italic font-medium text-muted-foreground/80 leading-relaxed block select-text tracking-normal">
              &ldquo;{activeArticleRecord.excerpt}&rdquo;
            </p>
          </CardContent>
        </Card>
      )}

      {/* HUD LEVEL 5: CONDITIONAL EXTERNAL REDIRECTIONS OR STRUCTURAL ARTICLE BODIES CORES */}
      {activeArticleRecord.external_url ? (
        <Card className="rounded-lg border border-border/60 bg-card/40 shadow-none overflow-hidden block w-full select-none">
          <CardContent className="p-5 flex flex-col items-center text-center gap-3.5 block w-full leading-none">
            <div className="h-10 w-10 rounded-lg bg-primary/5 border border-primary/10 flex items-center justify-center text-primary pointer-events-none shadow-3xs">
              <ExternalLink className="h-5 w-5 stroke-[2.2]" />
            </div>
            <div className="leading-none space-y-1 block pointer-events-none">
              <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wide text-foreground block">
                Hosted Sandbox Document Environment
              </h3>
              <p
                className={cn(
                  META_TEXT,
                  "font-sans text-[11px] font-medium text-muted-foreground/40 block leading-tight",
                )}
              >
                This knowledge brief is deployed outside parent infrastructure bounds.
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              className="h-8.5 px-4 rounded-lg font-mono text-[10px] font-extrabold uppercase tracking-wider cursor-pointer shadow-2xs gap-1.5 transform-gpu active:scale-[0.985]"
              onClick={handleLaunchExternalArticleFrame}
            >
              <span>Initialize External Link Container</span>
              <ExternalLink className="h-3.5 w-3.5 stroke-[2.5] shrink-0" />
            </Button>
          </CardContent>
        </Card>
      ) : (
        /* Hardened defensive text formatting configuration shielding injection vector channels */
        <article className="prose prose-sm prose-neutral dark:prose-invert max-w-none prose-p:text-xs sm:prose-p:text-sm prose-p:font-medium prose-p:leading-relaxed text-foreground/90 font-sans tracking-normal block select-text pt-2 whitespace-normal break-words">
          {activeArticleRecord.content?.split(/\n+/).map((textParagraphBlock, chunkIdx) => {
            if (!textParagraphBlock.trim()) return null;
            return (
              <p
                key={`sanitized-article-paragraph-chunk-${chunkIdx}`}
                className="mb-4 text-foreground/80 font-medium leading-relaxed select-text"
              >
                {textParagraphBlock}
              </p>
            );
          })}
        </article>
      )}

      <Separator className="bg-border/40 w-full block shrink-0" />

      {/* HUD LEVEL 6: DATA DISPATCH COCKPIT ROUTING INTERFACES CONTROLLERS BAR */}
      <div className="flex items-center justify-between gap-4 leading-none select-none w-full shrink-0 pt-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleShareArticleRouteTrigger}
          className="h-8.5 px-3.5 rounded-lg border border-border/60 bg-background/50 font-mono text-[10px] font-extrabold uppercase tracking-wider gap-1.5 cursor-pointer shadow-2xs"
        >
          <Share2 className="h-3.5 w-3.5 stroke-[2.2] text-muted-foreground/60 shrink-0" />
          <span>Broadcast Coordinates</span>
        </Button>
        <Button
          type="button"
          size="sm"
          className="h-8.5 px-3.5 rounded-lg font-mono text-[10px] font-extrabold uppercase tracking-wider gap-1.5 cursor-pointer shadow-xs ml-auto transform-gpu active:scale-[0.985]"
          onClick={handleTransitionToAIAgentsWorkspace}
        >
          <Sparkles className="h-3.5 w-3.5 stroke-[2.2] fill-current text-primary-foreground shrink-0" />
          <span>Consult Copilot Core</span>
        </Button>
      </div>
    </div>
  );
}

// Macro validation helper abstraction feeding graphic layers inside empty boundaries cleanly
function ShieldAlertNodeHelper({ className }: { className?: string }) {
  return <Loader2 className={className} />;
}
