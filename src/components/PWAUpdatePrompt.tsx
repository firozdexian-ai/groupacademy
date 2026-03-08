import { useRegisterSW } from "virtual:pwa-register/react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export function PWAUpdatePrompt() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, r) {
      // Check for updates every 30 minutes
      if (r) {
        setInterval(() => {
          r.update();
        }, 30 * 60 * 1000);
      }
    },
    onRegisterError(error) {
      console.error("SW registration error:", error);
    },
  });

  if (!needRefresh) return null;

  return (
    <div className="fixed bottom-20 left-3 right-3 z-50 animate-in slide-in-from-bottom-4 duration-500 sm:left-auto sm:right-4 sm:max-w-sm">
      <div className="bg-card border border-border rounded-2xl p-4 shadow-lg flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <RefreshCw className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">New version available</p>
          <p className="text-xs text-muted-foreground">Refresh for the latest features</p>
        </div>
        <Button
          size="sm"
          className="rounded-xl shrink-0"
          onClick={() => updateServiceWorker(true)}
        >
          Update
        </Button>
      </div>
    </div>
  );
}
