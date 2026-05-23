import { useEffect, useRef, useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { usePublicProfileSettings } from "@/domains/profile/hooks/usePublicProfileSettings";
import { Globe, Copy, ExternalLink, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { trackError, trackEvent } from "@/lib/errorTracking";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Public Telemetry Profile Settings Terminal (PublicProfileSettings)
 * An authoritative security panel orchestrating public route claiming, bio tagging, and visibility flags.
 * Version: Launch Candidate · Phase Z0 Hardened
 */
export function PublicProfileSettings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const isMountedRef = useRef<boolean>(true);

  const { data, isLoading, update, claimHandle } = usePublicProfileSettings();

  const [handleInput, setHandleInput] = useState("");
  const [bio, setBio] = useState("");

  // Synchronize component lifecycles to safely drop background thread state writes
  useEffect(() => {
    isMountedRef.current = true;
    trackEvent("public_profile_settings_mounted");
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // HYDRATION LIFECYCLE: Synchronize backend configurations defensively into layout input fields
  useEffect(() => {
    if (data) {
      setHandleInput(data.public_handle ?? "");
      setBio(data.public_bio ?? "");
    }
  }, [data]);

  const publicUrl = useMemo(() => {
    if (!data?.public_handle) return null;
    return `${window.location.origin}/t/${data.public_handle}`;
  }, [data?.public_handle]);

  const onClaimHandleProtocol = async () => {
    const sanitizedHandle = handleInput.toLowerCase().trim();
    if (!sanitizedHandle || claimHandle.isPending) return;

    trackEvent("public_profile_handle_claim_requested", { handle: sanitizedHandle });

    try {
      await claimHandle.mutateAsync(sanitizedHandle);

      // Automated Efficiency: Synchronize cache streams immediately to avoid state drift across layouts
      await queryClient.invalidateQueries({ queryKey: ["public-profile-settings"] });
      await queryClient.invalidateQueries({ queryKey: ["talent-profile"] });

      if (isMountedRef.current) {
        toast({
          title: "REGISTRY_LOCKED",
          description: "Your unique profile identity index track handle has been validated down rows.",
        });
      }
    } catch (err: any) {
      const parsedExceptionMsg = err instanceof Error ? err.message : String(err);
      trackError(parsedExceptionMsg, { component: "PublicProfileSettings", action: "commit_handle_claim" });

      toast({
        title: "REGISTRY_SYNC_FAULT",
        description: parsedExceptionMsg || "The selected handle has been claimed by a parallel network entity.",
        variant: "destructive",
      });
    }
  };

  const onSaveBioProtocol = async () => {
    if (update.isPending) return;
    trackEvent("public_profile_bio_save_requested");

    try {
      await update.mutateAsync({ public_bio: bio.trim() });
      await queryClient.invalidateQueries({ queryKey: ["public-profile-settings"] });

      if (isMountedRef.current) {
        toast({ title: "BIO_SYNC_VERIFIED" });
      }
    } catch (err) {
      trackError(err, { component: "PublicProfileSettings", action: "commit_bio_update" });
      toast({ title: "TRANSIT_FAULT", description: "Failed to push narrative modifications.", variant: "destructive" });
    }
  };

  const copyShareLinkToClipboard = () => {
    if (!publicUrl) return;
    trackEvent("public_profile_link_copied");

    try {
      navigator.clipboard.writeText(publicUrl);
      toast({ title: "LINK_COPIED_SYNC" });
    } catch (err) {
      trackError(err, { component: "PublicProfileSettings", action: "copy_clipboard_link" });
    }
  };

  if (isLoading) {
    return <Skeleton className="h-64 w-full rounded-xl transform-gpu bg-muted/20 border border-border/10" />;
  }

  if (!data) return null;

  return (
    <Card className="w-full text-left rounded-xl border border-border/40 bg-card/40 backdrop-blur-md shadow-sm antialiased transform-gpu overflow-hidden select-none sm:select-text flex flex-col justify-center">
      {/* HUD LEVEL 1: OVERVIEW PANEL ROW HEADER */}
      <CardHeader className="p-4 sm:p-5 border-b border-border/10 bg-muted/10 select-none leading-none w-full shrink-0">
        <CardTitle className="text-xs sm:text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2 w-full leading-none">
          <Globe className="h-4 w-4 text-primary stroke-[2.2] shrink-0" />
          <span>Public profile settings</span>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-4 sm:p-5 space-y-4 w-full min-w-0 flex flex-col justify-center font-semibold text-xs text-foreground/90">
        {/* INTERACTIVE TOGGLE BLOCK LAYER A: PUBLIC PROFILE VISIBILITY CONTROL ROW */}
        <div className="flex items-center justify-between gap-4 p-3 rounded-xl border border-border/40 bg-background/30 w-full min-w-0 select-none leading-none shadow-xs">
          <div className="min-w-0 flex-1 space-y-1.5 flex flex-col justify-center text-left leading-none">
            <p className="text-xs sm:text-sm font-bold text-foreground/90 uppercase tracking-wide leading-none">
              Make my profile public
            </p>
            <p className="text-[10px] font-semibold text-muted-foreground/60 leading-none pt-0.5 block truncate">
              Let recruiters and employers find your verified skills and experience.
            </p>
          </div>
          <Switch
            checked={!!data.public_profile_enabled}
            disabled={update.isPending}
            onCheckedChange={async (visibilityStateBool) => {
              trackEvent("public_profile_enabled_toggled", { nextState: visibilityStateBool });
              try {
                await update.mutateAsync({ public_profile_enabled: visibilityStateBool });
                await queryClient.invalidateQueries({ queryKey: ["public-profile-settings"] });
              } catch (err) {
                trackError(err, { component: "PublicProfileSettings", action: "toggle_profile_enabled" });
              }
            }}
            className="shrink-0 cursor-pointer"
          />
        </div>

        {/* CONDITIONAL SUB DIAGNOSTIC INPUT SECTION EXPANSION PANEL */}
        {data.public_profile_enabled && (
          <div className="space-y-4 w-full min-w-0 flex flex-col justify-center animate-in slide-in-from-top-1 duration-200">
            {/* SUB NODE BLOCK B: UNIQUE ALIAS HANDLE INGRESS SLOT */}
            <div className="space-y-1.5 text-left w-full min-w-0 font-bold text-xs tracking-tight">
              <label className="text-[10px] font-extrabold uppercase tracking-wide text-muted-foreground/60 block pl-0.5 leading-none select-none">
                Choose your public handle *
              </label>
              <div className="flex gap-2 w-full font-semibold text-sm">
                <div className="flex-1 flex items-center rounded-xl border border-border/40 bg-background/50 text-xs sm:text-sm text-foreground/90 px-3 shadow-inner h-10 min-w-0 select-none">
                  <span className="text-muted-foreground/40 font-mono select-none pr-0.5">/t/</span>
                  <Input
                    value={handleInput}
                    disabled={claimHandle.isPending}
                    onChange={(e) => setHandleInput(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                    placeholder="your-custom-alias-id"
                    className="border-none bg-transparent shadow-none h-full w-full px-0.5 font-bold italic tracking-wide focus-visible:ring-0 select-text"
                    maxLength={40}
                  />
                </div>

                <Button
                  size="sm"
                  type="button"
                  onClick={onClaimHandleProtocol}
                  disabled={!handleInput || handleInput === data.public_handle || claimHandle.isPending}
                  className="h-10 px-4 rounded-xl text-[10px] font-bold uppercase tracking-wide shrink-0 shadow-md transform-gpu active:scale-[0.985] cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center min-w-16"
                >
                  {claimHandle.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin stroke-[2.5]" />
                  ) : (
                    <span>Claim handle</span>
                  )}
                </Button>
              </div>
              <p className="text-[10px] font-mono text-muted-foreground/40 uppercase pl-0.5 select-none leading-none pt-0.5">
                3-40 characters &bull; letters, digits, and hyphens only.
              </p>
            </div>

            {/* LIVE VERIFIED TRANSMISSION RADAR ROW MODIFIER */}
            {publicUrl && (
              <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/[0.015] p-3.5 space-y-3 font-bold text-xs select-none w-full min-w-0 leading-none shadow-xs">
                <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase text-emerald-600 dark:text-emerald-400 leading-none">
                  <CheckCircle2 className="h-3.5 w-3.5 stroke-[2.5] shrink-0" />
                  <span>Live at:</span>
                </div>
                <code className="text-xs select-all block break-all font-mono font-medium text-foreground/80 leading-normal pl-0.5 selection:bg-emerald-500/10">
                  {publicUrl}
                </code>
                <div className="flex items-center gap-2 select-none font-bold text-xs pt-0.5 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    type="button"
                    onClick={copyShareLinkToClipboard}
                    className="h-7 px-3 rounded-lg font-bold text-[10px] uppercase tracking-wide border border-border/40 bg-background/30 text-muted-foreground hover:text-foreground hover:bg-accent cursor-pointer transition-colors"
                  >
                    <Copy className="h-3 w-3 mr-1 stroke-[2.2]" />
                    <span>Copy Endpoint</span>
                  </Button>
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    type="button"
                    className="h-7 px-3 rounded-lg font-bold text-[10px] uppercase tracking-wide border border-border/40 bg-background/30 text-muted-foreground hover:text-foreground hover:bg-accent cursor-pointer transition-colors"
                  >
                    <a
                      href={publicUrl}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => trackEvent("public_profile_view_external_clicked")}
                    >
                      <ExternalLink className="h-3 w-3 mr-1 stroke-[2.2]" />
                      <span>Launch view</span>
                    </a>
                  </Button>
                </div>
              </div>
            )}

            {/* NO ALIAS HANDLE PENDING FAULT CHIP */}
            {!data.public_handle && (
              <div className="rounded-xl border border-amber-500/15 bg-amber-500/[0.015] p-3 text-[11px] sm:text-xs text-amber-600 dark:text-amber-400 font-bold flex items-center gap-2 select-none leading-none animate-in pulse duration-1000 w-full shrink-0">
                <AlertCircle className="h-4 w-4 shrink-0 stroke-[2.2]" />
                <span>
                  Specify and claim an identity handle node key above to authorize dynamic pipeline routing links.
                </span>
              </div>
            )}

            {/* SUB NODE BLOCK C: PROFILE BIO SYNC EDITOR BOX AREA */}
            <div className="space-y-1.5 text-left w-full min-w-0 font-bold text-xs tracking-tight">
              <label className="text-[10px] font-extrabold uppercase tracking-wide text-muted-foreground/60 block pl-0.5 leading-none select-none">
                Short Core Bio Tagline Summary
              </label>
              <Textarea
                value={bio}
                disabled={update.isPending}
                onChange={(e) => setBio(e.target.value.slice(0, 240))}
                placeholder="Specify an authoritative one-line baseline programmatic professional tagline shown on public frames…"
                rows={2}
                className="w-full rounded-xl border border-border/40 bg-background/50 text-xs sm:text-sm font-semibold tracking-tight text-foreground p-3 leading-relaxed italic resize-none shadow-inner"
              />
              <div className="flex items-center justify-between gap-4 select-none leading-none w-full shrink-0 h-7 pt-0.5 font-bold text-[10px]">
                <span className="font-mono text-muted-foreground/40 tabular-nums font-extrabold">
                  {bio.length} / 240 scalar units
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  type="button"
                  disabled={bio === (data.public_bio ?? "") || update.isPending}
                  onClick={onSaveBioProtocol}
                  className="text-[10px] font-bold uppercase tracking-wider text-primary hover:text-primary hover:bg-primary/5 h-7 rounded-xl px-2.5 cursor-pointer disabled:opacity-30 disabled:hover:bg-transparent"
                >
                  {update.isPending ? "Saving…" : "Save bio"}
                </Button>
              </div>
            </div>

            {/* SUB NODE BLOCK D: METRIC SUB-TOGGLE CONFIGURATION SWITCHES GRID */}
            <div className="space-y-2 pt-2 border-t border-border/10 select-none w-full shrink-0 flex flex-col font-bold text-xs">
              <div className="flex items-center justify-between gap-4 p-2.5 rounded-xl border border-border/5 bg-background/20 transition-colors w-full min-w-0 leading-none font-semibold">
                <span className="text-xs text-foreground/80 truncate pr-1">Expose Verified Skill Registry Badges</span>
                <Switch
                  checked={!!data.public_show_credentials}
                  disabled={update.isPending}
                  onCheckedChange={async (vStateBool) => {
                    trackEvent("public_show_credentials_toggled", { nextState: vStateBool });
                    try {
                      await update.mutateAsync({ public_show_credentials: vStateBool });
                      await queryClient.invalidateQueries({ queryKey: ["public-profile-settings"] });
                    } catch (e) {
                      trackError(e, { component: "PublicProfileSettings", action: "toggle_show_credentials" });
                    }
                  }}
                  className="shrink-0 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between gap-4 p-2.5 rounded-xl border border-border/5 bg-background/20 transition-colors w-full min-w-0 leading-none font-semibold">
                <span className="text-xs text-foreground/80 truncate pr-1">
                  Expose Psychometric Mastery Snapshot Curves
                </span>
                <Switch
                  checked={!!data.public_show_mastery}
                  disabled={update.isPending}
                  onCheckedChange={async (vStateBool) => {
                    trackEvent("public_show_mastery_toggled", { nextState: vStateBool });
                    try {
                      await update.mutateAsync({ public_show_mastery: vStateBool });
                      await queryClient.invalidateQueries({ queryKey: ["public-profile-settings"] });
                    } catch (e) {
                      trackError(e, { component: "PublicProfileSettings", action: "toggle_show_mastery" });
                    }
                  }}
                  className="shrink-0 cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
