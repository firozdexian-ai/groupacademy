import { useEffect, useState } from "react";
import { Download, Share, Plus, X } from "lucide-react";
import { toast } from "sonner";

/**
 * Install-as-PWA button for the Gro10x landing page.
 * - Hidden if the app is already running standalone.
 * - Uses `beforeinstallprompt` on Chromium browsers.
 * - Falls back to an instructional sheet on iOS Safari and other browsers
 *   that don't expose a programmatic install prompt.
 */

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function detectStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const mq = window.matchMedia?.("(display-mode: standalone)").matches;
  const iosStandalone = (window.navigator as any).standalone === true;
  return Boolean(mq || iosStandalone);
}

function detectIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as any).MSStream;
}

export function Gro10xInstallButton() {
  const [installed, setInstalled] = useState<boolean>(detectStandalone());
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [showSheet, setShowSheet] = useState(false);
  const isIOS = detectIOS();

  useEffect(() => {
    if (installed) return;

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
      toast.success("Gro10x installed on your device");
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, [installed]);

  if (installed) return null;

  const handleClick = async () => {
    if (deferred) {
      try {
        await deferred.prompt();
        const choice = await deferred.userChoice;
        if (choice.outcome === "accepted") {
          toast.success("Installing Gro10x…");
        }
        setDeferred(null);
      } catch {
        setShowSheet(true);
      }
      return;
    }
    // No native prompt available — show instructions.
    setShowSheet(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className="mt-2 inline-flex items-center justify-center gap-2 w-full rounded-full border border-[#33E1E4]/40 bg-[#33E1E4]/10 text-[#33E1E4] font-medium py-3 text-sm"
      >
        <Download className="h-4 w-4" />
        Install Gro10x app
      </button>

      {showSheet && (
        <div
          className="fixed inset-0 z-[60] bg-black/60 flex items-end sm:items-center justify-center"
          onClick={() => setShowSheet(false)}
        >
          <div
            className="w-full max-w-md bg-[#0F172A] text-slate-100 rounded-t-3xl sm:rounded-3xl border border-white/10 p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <img src="/gro10x/icon-192.png" alt="" className="h-9 w-9 rounded-lg" />
                <div>
                  <p className="font-semibold">Install Gro10x</p>
                  <p className="text-xs text-slate-400">Add to your Home Screen</p>
                </div>
              </div>
              <button
                onClick={() => setShowSheet(false)}
                className="p-1 rounded-full hover:bg-white/10"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {isIOS ? (
              <ol className="space-y-3 text-sm text-slate-300">
                <li className="flex items-start gap-3">
                  <span className="rounded-full bg-white/10 h-6 w-6 inline-flex items-center justify-center text-xs">1</span>
                  <span className="flex-1 inline-flex items-center gap-2">
                    Tap the <Share className="h-4 w-4 text-[#33E1E4] inline" /> Share icon in Safari's bottom bar.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="rounded-full bg-white/10 h-6 w-6 inline-flex items-center justify-center text-xs">2</span>
                  <span className="flex-1 inline-flex items-center gap-2">
                    Choose <Plus className="h-4 w-4 text-[#33E1E4] inline" /> <b>Add to Home Screen</b>.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="rounded-full bg-white/10 h-6 w-6 inline-flex items-center justify-center text-xs">3</span>
                  <span className="flex-1">Tap <b>Add</b> — Gro10x will appear on your Home Screen.</span>
                </li>
              </ol>
            ) : (
              <ol className="space-y-3 text-sm text-slate-300">
                <li className="flex items-start gap-3">
                  <span className="rounded-full bg-white/10 h-6 w-6 inline-flex items-center justify-center text-xs">1</span>
                  <span className="flex-1">Open your browser menu (the ⋮ or ⋯ icon).</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="rounded-full bg-white/10 h-6 w-6 inline-flex items-center justify-center text-xs">2</span>
                  <span className="flex-1">Choose <b>Install app</b> or <b>Add to Home Screen</b>.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="rounded-full bg-white/10 h-6 w-6 inline-flex items-center justify-center text-xs">3</span>
                  <span className="flex-1">Confirm — Gro10x will open like a native app.</span>
                </li>
              </ol>
            )}

            <button
              onClick={() => setShowSheet(false)}
              className="mt-5 w-full rounded-full bg-[#33E1E4] text-[#06121A] font-semibold py-2.5 text-sm"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default Gro10xInstallButton;
