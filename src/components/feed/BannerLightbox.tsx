import { X } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface BannerLightboxProps {
  open: boolean;
  onClose: () => void;
  mediaType: "image" | "gif" | "video";
  mediaUrl: string;
  posterUrl?: string | null;
}

/**
 * Full-bleed lightbox that plays the banner at its native aspect ratio.
 * Tap outside or press the close button to dismiss.
 */
export function BannerLightbox({ open, onClose, mediaType, mediaUrl, posterUrl }: BannerLightboxProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl p-0 bg-black border-none overflow-hidden">
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 z-10 h-9 w-9 rounded-full bg-white/10 backdrop-blur text-white flex items-center justify-center hover:bg-white/20"
        >
          <X className="h-5 w-5" />
        </button>
        {mediaType === "video" ? (
          <video
            src={mediaUrl}
            poster={posterUrl || undefined}
            controls
            autoPlay
            playsInline
            className="w-full h-auto max-h-[85vh] object-contain bg-black"
          />
        ) : (
          <img
            src={mediaUrl}
            alt=""
            className="w-full h-auto max-h-[85vh] object-contain bg-black"
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
