import { useState, useEffect, useCallback } from "react";
import { X, Download, Share, Zap, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePWADetect } from "@/hooks/usePWADetect";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Mobile Native Sync Ingress
 * CTO Reference: Authoritative gateway for PWA installation and offline-readiness.
 */

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const REGISTRY_DISMISS_KEY = "pwa_sync_dismissed_v4";
const SYNC_COOLDOWN_DAYS = 7;

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const isMobile = useIsMobile();
  const { isPWA } = usePWADetect();

  useEffect(() => {
    // PROTOCOL: Already synchronized
    if (isPWA) return;

    // PROTOCOL: Registry Cooldown Check
    const dismissed = localStorage.getItem(REGISTRY_DISMISS_KEY);
    if (dismissed) {
      const timestamp = parseInt(dismissed, 10);
      if (Date.now() - timestamp < SYNC_COOLDOWN_DAYS * 24 * 60 * 60 * 1000) return;
    }

    // PROTOCOL: WebKit/iOS Instructional Detection
    const ua = navigator.userAgent;
    const isIOSDevice = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    const isSafari = /Safari/.test(ua) && !/CriOS|Chrome/.test(ua);

    if (isIOSDevice && isSafari) {
      setIsIOS(true);
      setShowBanner(true);
      return;
    }

    // PROTOCOL: Chromium Neural Prompt Handshake
    const ingressHandler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    window.addEventListener("beforeinstallprompt", ingressHandler);
    return () => window.removeEventListener("beforeinstallprompt", ingressHandler);
  }, [isPWA]);

  const executeInstallSync = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setShowBanner(false);
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  const handleRegistryDismiss = () => {
    localStorage.setItem(REGISTRY_DISMISS_KEY, Date.now().toString());
    setShowBanner(false);
  };

  if (!showBanner || !isMobile) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 z-[100] animate-in slide-in-from-bottom-6 fade-in duration-700">
      <div className="relative bg-card/80 backdrop-blur-2xl border-2 border-primary/20 rounded-[28px] p-5 shadow-[0_20px_50px_rgba(var(--primary),0.15)] overflow-hidden">
        {/* HUD: DECORATIVE_SYNC_GLOW */}
        <div className="absolute -right-8 -top-8 h-24 w-24 bg-primary/10 blur-3xl rounded-full pointer-events-none" />

        <button
          onClick={handleRegistryDismiss}
          className="absolute top-4 right-4 h-8 w-8 rounded-full bg-muted/20 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          aria-label="SYNC_ABORT"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-4 mb-5">
          {/* COMPONENT: SYNC_NODE_ICON */}
          <div className="relative shrink-0">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-lg">
              <Download className="h-6 w-6 text-primary animate-pulse" />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full p-1 border-2 border-card shadow-sm">
              <ShieldCheck className="h-2.5 w-2.5 text-white" />
            </div>
          </div>

          <div className="space-y-1">
            <h3 className="text-[13px] font-black uppercase italic tracking-tight text-foreground leading-none">
              Deploy_Institutional_App
            </h3>
            <p className="text-[10px] font-medium text-muted-foreground/80 leading-relaxed italic">
              Offline-ready trajectory tracking, high-velocity sync, and instant curriculum access.
            </p>
          </div>
        </div>

        {isIOS ? (
          <div className="flex items-center gap-3 bg-primary/5 rounded-2xl px-4 py-3 border border-primary/10 animate-pulse">
            <Share className="h-4 w-4 shrink-0 text-primary" />
            <span className="text-[10px] font-bold text-muted-foreground/80 uppercase tracking-widest leading-none">
              TAP <strong className="text-primary italic">SHARE</strong> THEN{" "}
              <strong className="text-primary italic">"ADD TO HOME SCREEN"</strong>
            </span>
          </div>
        ) : (
          <Button
            onClick={executeInstallSync}
            size="xl"
            className="w-full h-14 rounded-2xl font-black uppercase italic text-[11px] tracking-[0.2em] shadow-lg shadow-primary/20 transition-all active:scale-95 gap-3"
          >
            <Zap className="h-4 w-4 fill-current" />
            INITIALIZE_APP_DEPLOYMENT
          </Button>
        )}

        <div className="flex items-center justify-center gap-2 mt-4 opacity-30">
          <ShieldCheck className="h-3 w-3" />
          <span className="text-[8px] font-black uppercase tracking-[0.3em]">Neural_Sync_v4.2 // Verified_Edge</span>
        </div>
      </div>
    </div>
  );
}
