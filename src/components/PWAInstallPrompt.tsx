import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePWADetect } from "@/hooks/usePWADetect";
import { trackError, trackEvent } from "@/lib/errorTracking";
import { X, Download, Share, Zap, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const REGISTRY_DISMISS_KEY_TOKEN = "pwa_sync_dismissed_v4";
const SYNC_COOLDOWN_TIMEFRAME_DAYS = 7;

/**
 * GroUp Academy: PWA Mobile Native Synchronization Ingress (PWAInstallPrompt)
 * Authoritative interceptor capturing application installation queries and managing local deployment cooldown caches.
 * Version: Launch Candidate · Phase Z0 Hardened
 */
export function PWAInstallPrompt() {
  const queryClient = useQueryClient();
  const isMobileViewport = useIsMobile();
  const { isPWA } = usePWADetect();
  const isMountedRef = useRef<boolean>(true);

  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOSDevicePlatform, setIsIOSDevicePlatform] = useState(false);

  // Synchronize component lifecycles to insulate background operations from state drops
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    // Phase 1: Already synchronized within PWA standalone wrappers
    if (isPWA) {
      if (isMountedRef.current) setShowBanner(false);
      return;
    }

    // Phase 2: Registry Retention Cooldown Validation Check
    try {
      const systemicDismissedTimestampStr = localStorage.getItem(REGISTRY_DISMISS_KEY_TOKEN);
      if (systemicDismissedTimestampStr) {
        const parsedDismissedEpochNum = parseInt(systemicDismissedTimestampStr, 10) || 0;
        const compiledCooldownThresholdNum = SYNC_COOLDOWN_TIMEFRAME_DAYS * 24 * 60 * 60 * 1000;

        if (Date.now() - parsedDismissedEpochNum < compiledCooldownThresholdNum) {
          if (isMountedRef.current) setShowBanner(false);
          return;
        }
      }
    } catch (storageExceptionErr) {
      trackError(storageExceptionErr, { component: "PWAInstallPrompt", action: "local_storage_cooldown_read" });
    }

    // Phase 3: WebKit/iOS Instructional User Agent Analysis Parsing Pass
    const targetUserAgentSignatureStr = typeof navigator !== "undefined" ? navigator.userAgent : "";
    const isIOSDetectedBool = /iPad|iPhone|iPod/.test(targetUserAgentSignatureStr) && !(window as any).MSStream;
    const isSafariDetectedBool =
      /Safari/.test(targetUserAgentSignatureStr) && !/CriOS|Chrome/.test(targetUserAgentSignatureStr);

    if (isIOSDetectedBool && isSafariDetectedBool) {
      if (isMountedRef.current) {
        setIsIOSDevicePlatform(true);
        setShowBanner(true);
        trackEvent("pwa_prompt_ios_safari_surfaced");
      }
      return;
    }

    // Phase 4: Chromium Handshake Ingress Event Binding Allocation
    const handleChromiumPromptIngressEvent = (nativeEventTarget: Event) => {
      nativeEventTarget.preventDefault();
      if (!isMountedRef.current) return;

      setDeferredPrompt(nativeEventTarget as BeforeInstallPromptEvent);
      setShowBanner(true);
      trackEvent("pwa_prompt_chromium_intercepted");
    };

    window.addEventListener("beforeinstallprompt", handleChromiumPromptIngressEvent);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleChromiumPromptIngressEvent);
    };
  }, [isPWA]);

  const executeInstallSyncProtocol = useCallback(async () => {
    const activeDeferredPromptObj = deferredPrompt;
    if (!activeDeferredPromptObj) return;

    trackEvent("pwa_installation_handshake_initiated");

    try {
      await activeDeferredPromptObj.prompt();
      const { outcome: targetUserDecisionOutcomeKeyStr } = await activeDeferredPromptObj.userChoice;

      trackEvent("pwa_installation_user_decision_resolved", { outcome: targetUserDecisionOutcomeKeyStr });

      if (targetUserDecisionOutcomeKeyStr === "accepted") {
        await queryClient.invalidateQueries({ queryKey: ["pwa-status-metrics"] });
        if (isMountedRef.current) {
          setShowBanner(false);
        }
      }
    } catch (caughtPromptExceptionErr) {
      trackError(caughtPromptExceptionErr, { component: "PWAInstallPrompt", action: "execute_install_sync_protocol" });
    } finally {
      if (isMountedRef.current) {
        setDeferredPrompt(null);
      }
    }
  }, [deferredPrompt, queryClient]);

  const handleRegistryDismissalProtocol = () => {
    trackEvent("pwa_prompt_dismissal_logged", { cooldownDays: SYNC_COOLDOWN_TIMEFRAME_DAYS });
    try {
      localStorage.setItem(REGISTRY_DISMISS_KEY_TOKEN, Date.now().toString());
    } catch (storageExceptionErr) {
      trackError(storageExceptionErr, { component: "PWAInstallPrompt", action: "local_storage_dismissal_write" });
    }
    if (isMountedRef.current) {
      setShowBanner(false);
    }
  };

  const shouldRenderPanelLayoutBool = useMemo(() => {
    return showBanner && isMobileViewport;
  }, [showBanner, isMobileViewport]);

  if (!shouldRenderPanelLayoutBool) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 z-[100] font-bold text-xs select-none transform-gpu animate-in slide-in-from-bottom-5 fade-in duration-300 max-w-md mx-auto">
      <div className="relative rounded-xl border border-border/40 bg-card/95 backdrop-blur-xl p-4 sm:p-5 shadow-xl overflow-hidden text-left flex flex-col justify-center">
        {/* HUD LEVEL 1: TOP ATMOSPHERIC SYNCHRONIZATION LIGHT BLOB */}
        <div
          className="absolute -right-6 -top-6 h-20 w-20 bg-primary/5 blur-2xl rounded-full pointer-events-none select-none"
          aria-hidden="true"
        />

        {/* HUD LEVEL 2: CLOSE DISMISS OVERLAY TRIGGER CONTROL ACTION BUTTON */}
        <button
          type="button"
          onClick={handleRegistryDismissalProtocol}
          className="absolute top-3.5 right-3.5 h-7 w-7 rounded-lg bg-muted/30 border border-border/5 text-muted-foreground hover:text-foreground flex items-center justify-center cursor-pointer transition-colors outline-none focus-visible:ring-1 focus-visible:ring-ring"
          aria-label="Abort application synchronization prompt layout"
        >
          <X className="h-4 w-4 stroke-[2.5]" />
        </button>

        {/* HUD LEVEL 3: COMPOSITE METADATA IDENTIFICATION CONTAINER SPLIT VIEW */}
        <div className="flex items-start gap-3.5 mb-4 w-full min-w-0 pr-6">
          <div className="relative shrink-0 select-none pointer-events-none">
            <div className="h-11 w-11 rounded-xl bg-primary/10 border border-primary/5 text-primary flex items-center justify-center shadow-inner">
              <Download className="h-5 w-5 text-primary stroke-[2.2] animate-pulse" />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-md p-0.5 border border-card shadow-xs">
              <ShieldCheck className="h-2.5 w-2.5 text-white stroke-[2.5]" />
            </div>
          </div>

          <div className="space-y-1 min-w-0 flex-1 flex flex-col justify-center leading-none">
            <h3 className="text-xs sm:text-sm font-black uppercase italic tracking-tight text-foreground/90 block leading-none">
              Deploy Native Workspace Node
            </h3>
            <p className="text-[10px] font-semibold text-muted-foreground/60 leading-normal block italic pr-0.5 pt-0.5 select-text selection:bg-primary/10">
              Authorize offline-ready career track syncing, standalone app velocity, and immediate classroom ledger
              access variables.
            </p>
          </div>
        </div>

        {/* HUD LEVEL 4: PLATFORM INTERACTIVE CONTEXT FORKING INTERACTION STRIPS */}
        {isIOSDevicePlatform ? (
          /* SAFARI / WEBKIT TARGET CHANNEL DIRECTIONS SLAT */
          <div className="flex items-center gap-2.5 bg-primary/[0.01] rounded-xl px-3 py-2.5 border border-primary/10 select-none leading-none text-left w-full min-w-0 shadow-xs h-9 shrink-0">
            <Share className="h-3.5 w-3.5 text-primary stroke-[2.5] shrink-0" />
            <span className="text-[9px] font-mono font-extrabold uppercase tracking-wide text-muted-foreground/80 block pt-0.5 truncate text-ellipsis max-w-full">
              Tap <strong className="text-primary font-black italic">"Share"</strong> icon then select{" "}
              <strong className="text-primary font-black italic">"Add to Home Screen"</strong>
            </span>
          </div>
        ) : (
          /* CHROMIUM STANDALONE SHELL ENGINE TRIGGER SUBMISSION LINK */
          <Button
            type="button"
            onClick={executeInstallSyncProtocol}
            className="w-full h-11 rounded-xl font-bold text-xs uppercase tracking-wider shadow-md transform-gpu active:scale-[0.995] transition-transform flex items-center justify-center cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 select-none"
          >
            <Zap className="h-4 w-4 fill-primary-foreground/10 stroke-[2.5]" />
            <span>Initialize Standalone Application Deployment</span>
          </Button>
        )}

        {/* HUD LEVEL 5: OVERLAY BOTTOM OMNIPRESENCE SHIELD RIBBON FOOTER */}
        <div className="flex items-center justify-center gap-1.5 py-1 opacity-25 select-none pointer-events-none tracking-normal font-bold text-[8px] text-muted-foreground/50 font-mono leading-none shrink-0 uppercase w-full mt-3">
          <ShieldCheck className="h-3 w-3 stroke-[2.5]" />
          <span>Neural Ingress Matrix Pipeline Sync Core Verified</span>
        </div>
      </div>
    </div>
  );
}
