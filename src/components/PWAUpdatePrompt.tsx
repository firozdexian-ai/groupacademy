import { useRegisterSW } from "virtual:pwa-register/react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Zap, ShieldCheck, ArrowUpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Neural Versioning Sentinel
 * CTO Reference: Authoritative node for PWA service worker synchronization.
 */

export function PWAUpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, r) {
      // PROTOCOL: 30-minute high-frequency update check
      if (r) {
        setInterval(
          () => {
            console.log("[Sentinel] Verifying_Registry_Firmware...");
            r.update();
          },
          30 * 60 * 1000,
        );
      }
    },
    onRegisterError(err) {
      console.error("[Sentinel] Sync_Fault:", err);
    },
  });

  if (!needRefresh) return null;

  return (
    <div
      className={cn(
        "fixed bottom-24 left-4 right-4 z-[110] animate-in slide-in-from-bottom-6 fade-in duration-700",
        "sm:left-auto sm:right-6 sm:w-[380px]",
      )}
    >
      <div className="relative bg-card/80 backdrop-blur-2xl border-2 border-primary/20 rounded-[28px] p-5 shadow-[0_20px_50px_rgba(var(--primary),0.15)] overflow-hidden">
        {/* HUD: DECORATIVE_SYNC_BEAM */}
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />

        <div className="flex items-center gap-4">
          {/* COMPONENT: UPDATE_ICON_NODE */}
          <div className="relative shrink-0">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-lg group">
              <RefreshCw className="h-6 w-6 text-primary animate-spin-slow group-hover:rotate-180 transition-transform duration-700" />
            </div>
            <Zap className="absolute -top-1 -right-1 h-4 w-4 text-primary fill-current animate-pulse" />
          </div>

          <div className="flex-1 min-w-0 space-y-1">
            <h3 className="text-[13px] font-black uppercase italic tracking-tight text-foreground leading-none">
              New_Firmware_Detected
            </h3>
            <p className="text-[10px] font-medium text-muted-foreground/80 leading-relaxed italic">
              Synchronize now for the latest career intelligence and performance patches.
            </p>
          </div>

          {/* ACTION: SYNC_TRIGGER */}
          <Button
            size="sm"
            className="h-12 px-6 rounded-xl font-black uppercase italic text-[11px] tracking-widest shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all active:scale-95 gap-2"
            onClick={() => updateServiceWorker(true)}
          >
            <ArrowUpCircle className="h-4 w-4" />
            SYNC
          </Button>
        </div>

        {/* HUD: FOOTER_STATUS */}
        <div className="flex items-center justify-center gap-2 mt-4 opacity-30">
          <ShieldCheck className="h-3 w-3" />
          <span className="text-[8px] font-black uppercase tracking-[0.3em]">
            Institutional_Sync_v4.2 // Hot_Reload_Ready
          </span>
        </div>
      </div>
    </div>
  );
}
