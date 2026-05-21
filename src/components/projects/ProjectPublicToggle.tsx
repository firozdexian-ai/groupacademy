import { useEffect, useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getProjectPublicSettings } from "@/domains/ugc/repo/ugcRepo";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trackError, trackEvent } from "@/lib/errorTracking";
import { Eye, ExternalLink, Share2, Loader2, Zap } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ogImageRender, aiGigPublicSummary } from "@/domains/gigs/api/gigsApi";

interface ProjectPublicToggleProps {
  projectId: string;
}

/**
 * GroUp Academy: Project Public Visibility Synchronization Node (ProjectPublicToggle)
 * An authoritative operational sandbox managing public route claiming, metrics ledger tracking, and OG metadata generation hooks.
 * Version: Launch Candidate · Phase Z0 Hardened
 */
export function ProjectPublicToggle({ projectId }: ProjectPublicToggleProps) {
  const queryClient = useQueryClient();
  const isMountedRef = useRef<boolean>(true);

  const [pub, setPub] = useState(false);
  const [slug, setSlug] = useState<string | null>(null);
  const [views, setViews] = useState(0);
  const [shares, setShares] = useState(0);
  const [loading, setLoading] = useState(false);

  // Synchronize component lifecycles to safely drop background thread state writes
  useEffect(() => {
    isMountedRef.current = true;
    trackEvent("project_public_toggle_mounted", { projectId });
    return () => {
      isMountedRef.current = false;
    };
  }, [projectId]);

  // Secure Ingress Pass: Fetch initial public configuration states with explicit cleanups
  useEffect(() => {
    let isRequestActive = true;

    getProjectPublicSettings(projectId)
      .then((data) => {
        if (isRequestActive && isMountedRef.current && data) {
          setPub(!!data.is_public);
          setSlug(data.slug);
          setViews(data.view_count ?? 0);
          setShares(data.share_count ?? 0);
          trackEvent("project_public_settings_loaded", { projectId, isPublic: !!data.is_public });
        }
      })
      .catch((error) => {
        trackError(error, { component: "ProjectPublicToggle", action: "initial_fetch_settings", projectId });
      });

    return () => {
      isRequestActive = false;
    };
  }, [projectId]);

  const handleVisibilityToggleProtocol = async (nextVisibilityStateBool: boolean) => {
    if (loading) return;

    setLoading(true);
    trackEvent("project_public_toggle_requested", { projectId, nextState: nextVisibilityStateBool });
    const dynamicToastTrackerId = toast.loading("Mutating privacy indicators over secure lookup rows...");

    try {
      // Execute the RPC visibility update routine via a cryptographically unified endpoint
      const { data: responseRpcPayload, error: rpcError } = await supabase.rpc("toggle_project_public", {
        _project_id: projectId,
        _public: nextVisibilityStateBool,
      });

      if (rpcError) throw rpcError;

      const normalizedRowData = responseRpcPayload as unknown as { is_public: boolean; slug: string | null };

      // Secondary Microservice Dispatches: Process parallel Edge workers securely inside isolated try blocks
      if (nextVisibilityStateBool) {
        try {
          await Promise.allSettled([
            ogImageRender({ project_id: projectId }),
            aiGigPublicSummary({ project_id: projectId }),
          ]);
          trackEvent("project_public_edge_workers_notified", { projectId });
        } catch (edgeWorkerException) {
          trackError(edgeWorkerException, {
            component: "ProjectPublicToggle",
            action: "invoke_edge_workers",
            projectId,
          });
        }
      }

      // Automated Efficiency: Synchronize cache streams immediately to avoid state drift across layouts
      await queryClient.invalidateQueries({ queryKey: ["projects"] });
      await queryClient.invalidateQueries({ queryKey: ["project-public-settings", projectId] });

      if (isMountedRef.current) {
        setPub(!!normalizedRowData.is_public);
        setSlug(normalizedRowData.slug);

        toast.success(
          nextVisibilityStateBool
            ? "Project visibility successfully opened to public indexing."
            : "Listing un-published from shared metrics ledgers.",
          { id: dynamicToastTrackerId },
        );
        trackEvent("project_public_toggle_success", { projectId, nextState: nextVisibilityStateBool });
      }
    } catch (caughtPipelineExceptionErr: any) {
      const formattedExceptionMsgStr =
        caughtPipelineExceptionErr instanceof Error
          ? caughtPipelineExceptionErr.message
          : String(caughtPipelineExceptionErr);

      trackError(formattedExceptionMsgStr, {
        component: "ProjectPublicToggle",
        action: "commit_visibility_toggle_rpc",
        projectId,
      });

      toast.error(`Ecosystem write validation error: ${formattedExceptionMsgStr}`, { id: dynamicToastTrackerId });
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  const currentConstructedPublicUrlStr = slug ? `/projects/${slug}` : null;

  return (
    <Card className="w-full text-left rounded-xl border border-border/40 bg-card/40 backdrop-blur-md shadow-sm antialiased transform-gpu overflow-hidden select-none sm:select-text">
      <CardContent className="p-4 sm:p-5 space-y-4 w-full min-w-0 flex flex-col justify-center font-semibold text-xs text-foreground/90">
        {/* HUD LEVEL 1: VISIBILITY CONTROL STATUS TOGGLE ROW */}
        <div className="flex items-center justify-between gap-4 p-3 rounded-xl border border-border/40 bg-background/30 w-full min-w-0 select-none leading-none shadow-xs">
          <div className="min-w-0 flex-1 space-y-1.5 flex flex-col justify-center text-left leading-none">
            <p className="text-xs sm:text-sm font-bold text-foreground/90 uppercase tracking-wide leading-none">
              Public Trajectory Discoverability
            </p>
            <p className="text-[10px] font-semibold text-muted-foreground/60 leading-none pt-0.5 block truncate">
              Expose this creative artifact on dynamic index listings, search pages, and shared community leaderboards.
            </p>
          </div>

          <div className="flex items-center shrink-0 pl-1">
            {loading ? <Loader2 className="h-4 w-4 animate-spin text-primary stroke-[2.5] mr-2" /> : null}
            <Switch
              checked={pub}
              disabled={loading}
              onCheckedChange={handleVisibilityToggleProtocol}
              className="cursor-pointer"
            />
          </div>
        </div>

        {/* HUD LEVEL 2: DYNAMIC ANALYTICAL PLOT TRACK BADGES AND ACTION ROW */}
        {pub && slug && (
          <div className="flex items-center justify-between gap-3 flex-wrap w-full font-bold text-xs tracking-tight select-none border-t border-border/10 pt-3 mt-1 leading-none animate-in slide-in-from-top-1 duration-200">
            <div className="flex items-center gap-3 font-mono text-[10px] text-muted-foreground/60 tracking-wider font-extrabold uppercase tabular-nums">
              <div className="flex items-center gap-1.5 bg-muted/40 border border-border/5 rounded px-2 py-1 shadow-xs h-6">
                <Eye className="h-3.5 w-3.5 stroke-[2.2] text-muted-foreground/80" />
                <span>{views} Index Loads</span>
              </div>
              <div className="flex items-center gap-1.5 bg-muted/40 border border-border/5 rounded px-2 py-1 shadow-xs h-6">
                <Share2 className="h-3.5 w-3.5 stroke-[2.2] text-muted-foreground/80" />
                <span>{shares} Dispatches</span>
              </div>
            </div>

            {currentConstructedPublicUrlStr && (
              <Button
                asChild
                size="sm"
                type="button"
                variant="outline"
                className="ml-auto h-7 px-3 rounded-lg font-bold text-[10px] uppercase tracking-wide border border-border/40 bg-background/30 text-muted-foreground hover:text-foreground hover:bg-accent cursor-pointer transition-colors"
              >
                <a
                  href={currentConstructedPublicUrlStr}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => trackEvent("project_public_preview_clicked", { projectId })}
                >
                  <ExternalLink className="h-3.5 w-3.5 mr-1 stroke-[2.5]" />
                  <span>Preview Ingress</span>
                </a>
              </Button>
            )}
          </div>
        )}

        {/* HUD LEVEL 3: RECTILINEAR OVERLAY BOTTOM METRIC LOG SHIELD */}
        <div className="flex items-center justify-center gap-1.5 py-2 border-t border-border/10 select-none shadow-none pointer-events-none tracking-normal font-bold text-[9px] text-muted-foreground/40 font-mono leading-none shrink-0 uppercase w-full pt-3 mt-1">
          <Zap className="h-3 w-3 text-amber-500 fill-amber-500/10 stroke-[2.2] shrink-0 animate-pulse" />
          <span>Public visibility metadata indexing synchronization core complete</span>
        </div>
      </CardContent>
    </Card>
  );
}
