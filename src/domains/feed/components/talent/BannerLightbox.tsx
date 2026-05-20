import { useEffect } from "react";
import { X } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { trackError, trackEvent } from "@/lib/errorTracking";
import { cn } from "@/lib/utils";

interface BannerLightboxProps {
  open: boolean;
  onClose: () => void;
  mediaType: "image" | "gif" | "video";
  mediaUrl: string;
  posterUrl?: string | null;
}

/**
 * Full-bleed lightbox that plays marketing banners at their native aspect ratio.
 * Hardened strictly for Phase Z0 mobile PWA safe-areas and centralized error boundaries.
 */
export function BannerLightbox({ open, onClose, mediaType, mediaUrl, posterUrl }: BannerLightboxProps) {
  // Asynchronously record rendering impression parameters safely via telemetry
  useEffect(() => {
    if (open && mediaUrl) {
      trackEvent("banner_lightbox_viewed", {
        mediaType,
        urlSnippet: mediaUrl.slice(-40),
      });
    }
  }, [open, mediaType, mediaUrl]);

  if (!mediaUrl) return null;

  const handleMediaError = () => {
    // Gracefully handle bucket breaks or connection timeouts through trackError
    trackError(`Banner asset stream failed to load inside lightbox view container`, {
      component: "BannerLightbox",
      action: "load_media_resource",
      mediaType,
      mediaUrl: mediaUrl,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(visible) => !visible && onClose()}>
      <DialogContent
        className="max-w-3xl w-[94vw] sm:w-full p-0 bg-background/95 dark:bg-background/90 backdrop-blur-xl border border-border/40 overflow-hidden rounded-2xl shadow-2xl transition-all duration-300 gap-0 select-none"
        style={{ contentVisibility: "auto" }}
      >
        {/* Safe-area-aware dismissal control bar */}
        <button
          onClick={onClose}
          type="button"
          aria-label="Close Lightbox"
          className="absolute z-50 h-9 w-9 rounded-full bg-foreground/10 backdrop-blur-md text-foreground flex items-center justify-center border border-foreground/5 hover:bg-foreground/20 active:scale-90 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          style={{
            top: "calc(env(safe-area-inset-top, 0px) + 0.75rem)",
            right: "0.75rem",
          }}
        >
          <X className="h-4 w-4 stroke-[2.5]" />
        </button>

        {/* Viewport Frame Container */}
        <div className="relative w-full flex items-center justify-center bg-black/30 dark:bg-black/50 max-h-[85vh] max-h-[85svh] overflow-hidden">
          {mediaType === "video" ? (
            <video
              src={mediaUrl}
              poster={posterUrl || undefined}
              controls
              autoPlay
              playsInline
              onError={handleMediaError}
              className="w-full h-auto max-h-[85vh] max-h-[85svh] object-contain transform-gpu select-none"
              style={{ willChange: "transform" }}
            />
          ) : (
            <img
              src={mediaUrl}
              alt="Promotional Spotlight Media Panel"
              onError={handleMediaError}
              loading="eager"
              decoding="async"
              className="w-full h-auto max-h-[85vh] max-h-[85svh] object-contain transform-gpu select-none transition-opacity duration-300 animate-in fade-in-40"
              style={{ willChange: "transform" }}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
