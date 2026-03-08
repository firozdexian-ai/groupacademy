import { useState, useEffect, useCallback } from "react";
import { X, Download, Share } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePWADetect } from "@/hooks/usePWADetect";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "pwa_install_dismissed";
const DISMISS_DAYS = 7;

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const isMobile = useIsMobile();
  const { isPWA } = usePWADetect();

  useEffect(() => {
    // Don't show if already installed
    if (isPWA) return;

    // Check if dismissed recently
    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (dismissed) {
      const dismissedAt = parseInt(dismissed, 10);
      if (Date.now() - dismissedAt < DISMISS_DAYS * 24 * 60 * 60 * 1000) return;
    }

    // Detect iOS Safari
    const ua = navigator.userAgent;
    const isIOSDevice = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    const isSafari = /Safari/.test(ua) && !/CriOS|Chrome/.test(ua);
    if (isIOSDevice && isSafari) {
      setIsIOS(true);
      setShowBanner(true);
      return;
    }

    // Listen for beforeinstallprompt (Chrome/Edge/Samsung)
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, [isPWA]);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
    setShowBanner(false);
  };

  if (!showBanner || !isMobile) return null;

  return (
    <div className="fixed bottom-20 left-3 right-3 z-50 animate-in slide-in-from-bottom-4 duration-500">
      <div className="bg-card border border-border rounded-2xl p-4 shadow-lg">
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Download className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-foreground">Install GroUp Academy</h3>
            <p className="text-xs text-muted-foreground">Get the full app experience — fast, offline-ready & instant access</p>
          </div>
        </div>

        {isIOS ? (
          <div className="flex items-center gap-2 bg-muted/50 rounded-xl px-3 py-2.5 text-xs text-muted-foreground">
            <Share className="h-4 w-4 shrink-0 text-primary" />
            <span>Tap <strong>Share</strong> then <strong>"Add to Home Screen"</strong></span>
          </div>
        ) : (
          <Button onClick={handleInstall} size="sm" className="w-full rounded-xl">
            <Download className="h-4 w-4 mr-2" />
            Install App
          </Button>
        )}
      </div>
    </div>
  );
}
