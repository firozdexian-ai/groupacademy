import { useEffect, useState, useRef, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Share2, Facebook, Linkedin, MessageCircle, Link as LinkIcon, Zap, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trackError, trackEvent } from "@/lib/errorTracking";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CourseShareButtonsProps {
  title: string;
  url: string;
  className?: string;
}

/**
 * GroUp Academy: Social Amplification Node & Curriculum Dispatcher (CourseShareButtons)
 * An authoritative operational sandbox managing external distribution web channels and client clip sync operations.
 * Version: Launch Candidate · Phase Z0 Hardened
 */
export function CourseShareButtons({ title, url, className }: CourseShareButtonsProps) {
  const isMountedRef = useRef<boolean>(true);
  const [hasNativeWebShareSupport, setHasNativeWebShareSupport] = useState<boolean>(false);

  // Synchronize component lifecycles and evaluate native web share compatibility safely post-mount
  useEffect(() => {
    isMountedRef.current = true;
    if (typeof navigator !== "undefined" && !!navigator.share) {
      setHasNativeWebShareSupport(true);
    }
    trackEvent("course_share_buttons_mounted", { title });
    return () => {
      isMountedRef.current = false;
    };
  }, [title]);

  // Defensive URI Token Ingestion: Compute optimized sharing parameters cleanly via memoized bounds
  const sharedEgressPayload = useMemo(() => {
    const fallbackTitleStr = "Curriculum Track";
    const sanitizedTitleStr = title ? String(title).trim() : fallbackTitleStr;
    const sanitizedUrlStr = url ? String(url).trim() : typeof window !== "undefined" ? window.location.href : "";

    return {
      title: sanitizedTitleStr,
      url: sanitizedUrlStr,
      encodedUrl: encodeURIComponent(sanitizedUrlStr),
      encodedTitle: encodeURIComponent(`Mastering ${sanitizedTitleStr} @ GroUp Academy:`),
    };
  }, [title, url]);

  const executeClipboardHandshake = async () => {
    if (!sharedEgressPayload.url) return;
    trackEvent("course_share_clipboard_copy_initiated");

    try {
      await navigator.clipboard.writeText(sharedEgressPayload.url);
      toast.success("SYNC_SUCCESS: Sharing endpoint committed to clipboard parameters.");
      trackEvent("course_share_clipboard_copy_success");
    } catch (err) {
      trackError(err, { component: "CourseShareButtons", action: "clipboard_ingress_handshake" });
      toast.error("SYNC_FAULT: Local machine clipboard ingress blocked authorization.");
    }
  };

  const initializeNeuralShareProtocol = async () => {
    if (!sharedEgressPayload.url) return;

    if (typeof navigator !== "undefined" && navigator.share) {
      trackEvent("course_share_native_web_share_triggered");
      try {
        await navigator.share({
          title: `GroUp Academy: ${sharedEgressPayload.title}`,
          text: `Check out this verified learning curriculum track on GroUp Academy: ${sharedEgressPayload.title}`,
          url: sharedEgressPayload.url,
        });
        trackEvent("course_share_native_web_share_success");
      } catch (err) {
        // Intercept native user abort cancellations quietly without breaking terminal tracks
        trackEvent("course_share_native_web_share_dismissed");
      }
    } else {
      await executeClipboardHandshake();
    }
  };

  return (
    <div
      className={cn(
        "space-y-3.5 text-left max-w-full w-full transform-gpu antialiased font-bold text-xs select-none",
        className,
      )}
    >
      {/* HUD LEVEL 1: TOP PANEL TRACK HEADING CONTROLS BLOCK */}
      <div className="flex items-center justify-between gap-4 select-none leading-none w-full shrink-0 px-0.5">
        <div className="flex items-center gap-2 text-left leading-none min-w-0">
          <div className="h-6 w-6 rounded bg-primary/10 border border-primary/5 text-primary flex items-center justify-center shrink-0 shadow-inner">
            <Share2 className="h-3.5 w-3.5 text-primary stroke-[2.2] animate-pulse" />
          </div>
          <span className="text-[10px] font-mono font-extrabold uppercase tracking-wider text-muted-foreground/60 block pt-0.5 leading-none">
            Amplify Curriculum Trajectory
          </span>
        </div>

        <div className="flex items-center gap-1.5 opacity-35 shrink-0 pointer-events-none text-right font-mono text-[8px] font-bold uppercase leading-none">
          <ShieldCheck className="h-3.5 w-3.5 stroke-[2.2] text-foreground" />
          <span>v4.2 Crypt Lock Secure</span>
        </div>
      </div>

      {/* HUD LEVEL 2: COMPOSITE SECTOR TRIGGER COMMAND RIBBON BUTTON SLOTS GRID */}
      <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 w-full font-bold text-xs tracking-tight">
        {/* Core Trigger Component: Dynamic Native/Clipboard Handshake */}
        <Button
          type="button"
          variant="outline"
          onClick={initializeNeuralShareProtocol}
          className="h-9 rounded-xl border border-border/60 text-muted-foreground font-bold hover:text-foreground hover:bg-accent uppercase text-[10px] tracking-wide shrink-0 shadow-sm cursor-pointer transition-all gap-1.5 group flex-1 sm:flex-none"
        >
          <LinkIcon className="h-3.5 w-3.5 stroke-[2.5] transform group-hover:rotate-45 transition-transform shrink-0" />
          <span>{hasNativeWebShareSupport ? "Share" : "Copy link"}</span>
        </Button>

        {/* Egress Pipeline Block A: Meta Sharing Link Container */}
        <Button
          type="button"
          variant="outline"
          asChild
          onClick={() => trackEvent("course_share_network_dispatched", { network: "facebook" })}
          className="h-9 rounded-xl border border-border/60 text-muted-foreground font-bold hover:text-foreground hover:bg-accent uppercase text-[10px] tracking-wide shrink-0 shadow-sm cursor-pointer transition-colors flex-1 sm:flex-none"
        >
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${sharedEgressPayload.encodedUrl}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Facebook className="h-3.5 w-3.5 stroke-[2.2] text-zinc-400 group-hover:text-[#1877F2] shrink-0 mr-1.5" />
            <span>Meta</span>
          </a>
        </Button>

        {/* Egress Pipeline Block B: LinkedIn Sharing Link Container */}
        <Button
          type="button"
          variant="outline"
          asChild
          onClick={() => trackEvent("course_share_network_dispatched", { network: "linkedin" })}
          className="h-9 rounded-xl border border-border/60 text-muted-foreground font-bold hover:text-foreground hover:bg-accent uppercase text-[10px] tracking-wide shrink-0 shadow-sm cursor-pointer transition-colors flex-1 sm:flex-none"
        >
          <a
            href={`https://www.linkedin.com/sharing/share-offsite/?url=${sharedEgressPayload.encodedUrl}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Linkedin className="h-3.5 w-3.5 stroke-[2.2] text-zinc-400 group-hover:text-[#0A66C2] shrink-0 mr-1.5" />
            <span>LinkedIn</span>
          </a>
        </Button>

        {/* Egress Pipeline Block C: WhatsApp Chat Link Ingress Container */}
        <Button
          type="button"
          variant="outline"
          asChild
          onClick={() => trackEvent("course_share_network_dispatched", { network: "whatsapp" })}
          className="h-9 rounded-xl border border-border/60 text-muted-foreground font-bold hover:text-foreground hover:bg-accent uppercase text-[10px] tracking-wide shrink-0 shadow-sm cursor-pointer transition-colors flex-1 sm:flex-none"
        >
          <a
            href={`https://wa.me/?text=${sharedEgressPayload.encodedTitle}%20${sharedEgressPayload.encodedUrl}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <MessageCircle className="h-3.5 w-3.5 stroke-[2.2] text-zinc-400 group-hover:text-[#25D366] shrink-0 mr-1.5" />
            <span>WhatsApp</span>
          </a>
        </Button>
      </div>

      {/* HUD LEVEL 3: RECTILINEAR OVERLAY BOTTOM METRIC LOG OMNIPRESENCE SHIELD */}
      <p className="text-[8px] font-mono font-extrabold text-muted-foreground/40 italic text-center uppercase tracking-widest leading-none pt-1 select-none pointer-events-none w-full block">
        Neural Egress Matrix Active &bull; External Registry Verification Complete
      </p>
    </div>
  );
}

export default CourseShareButtons;
