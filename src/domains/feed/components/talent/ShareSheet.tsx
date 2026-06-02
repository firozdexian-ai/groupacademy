import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Share2, Copy, Check, MessageCircle, Linkedin, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { recordShare } from "@/hooks/useCreatorAnalytics";
import { trackError, trackEvent } from "@/lib/errorTracking";
import { cn } from "@/lib/utils";

interface ShareSheetProps {
  title: string;
  url: string;
  description?: string;
  postId?: string;
}

/**
 * Premium sharing sheet component that exposes social redirect options
 * and clipboard shortcuts optimized for cross-browser native Web Share APIs.
 */
export function ShareSheet({ title, url, description, postId }: ShareSheetProps) {
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  // Log sharing layout interactions cleanly in the background
  useEffect(() => {
    if (open && postId) {
      trackEvent("share_sheet_drawer_opened", { postId: postId, assetTitle: title?.slice(0, 40) });
    }
  }, [open, postId, title]);

  if (!url) {
    trackError("ShareSheet component mounted without a valid URL parameter anchor.", {
      component: "ShareSheet",
      action: "validation_assertion_failure",
    });
    return null;
  }

  const shareText = description ? `${title}\n\n${description}` : title;

  const getAbsoluteUrlSafe = (targetUrl: string): string => {
    if (targetUrl.startsWith("http")) return targetUrl;
    try {
      const originContext = typeof window !== "undefined" && window.location?.origin ? window.location.origin : "";
      return `${originContext}${targetUrl.startsWith("/") ? "" : "/"}${targetUrl}`;
    } catch (err) {
      return targetUrl;
    }
  };

  const fullUrl = getAbsoluteUrlSafe(url);

  const handleCopyProtocol = async () => {
    trackEvent("share_link_copy_clicked", { postId: postId, fullUrlSnippet: fullUrl.slice(-40) });

    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);

      if (postId) {
        await recordShare(postId, "copy_link");
        queryClient.invalidateQueries({ queryKey: ["feed-posts"] });
      }

      toast({
        title: "Link copied",
        description: "The link has been copied to your clipboard.",
      });

      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      trackError(err instanceof Error ? err : String(err), {
        component: "ShareSheet",
        action: "execute_clipboard_write",
        postId: postId,
      });

      toast({
        title: "Clipboard error",
        description: "Could not copy link automatically. Please copy the URL directly from the address bar.",
        variant: "destructive",
      });
    }
  };

  const handleSocialHandshake = async (platform: "whatsapp" | "linkedin") => {
    trackEvent("share_social_redirect_triggered", { platform: platform, postId: postId });

    const socialDestinations = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(`${shareText}\n\n${fullUrl}`)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(fullUrl)}`,
    };

    try {
      if (postId) {
        await recordShare(postId, platform);
        queryClient.invalidateQueries({ queryKey: ["feed-posts"] });
      }

      window.open(socialDestinations[platform], "_blank", "noopener,noreferrer");
      setOpen(false);
    } catch (err) {
      trackError(err instanceof Error ? err : String(err), {
        component: "ShareSheet",
        action: "execute_social_handshake",
        platform: platform,
        postId: postId,
      });
    }
  };

  const handleExecutiveShare = async () => {
    if (!navigator.share) return;

    trackEvent("share_native_web_api_invoked", { postId: postId });

    try {
      await navigator.share({
        title: title,
        text: description,
        url: fullUrl,
      });

      if (postId) {
        await recordShare(postId, "native");
        queryClient.invalidateQueries({ queryKey: ["feed-posts"] });
      }
      setOpen(false);
    } catch (err: any) {
      trackEvent("share_native_web_api_aborted", { postId: postId, exceptionMessage: String(err) });
    }
  };

  const hasNativeShareSupport = typeof navigator !== "undefined" && !!navigator.share;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          type="button"
          className="h-9 text-xs font-bold gap-1.5 flex-1 hover:bg-primary/10 hover:text-primary active:scale-95 transition-all rounded-xl select-none cursor-pointer"
        >
          <Share2 className="h-4 w-4 stroke-[2.2]" />
          <span>Share</span>
        </Button>
      </SheetTrigger>

      <SheetContent
        side="bottom"
        className="rounded-t-3xl p-6 border-t border-border/40 bg-background/98 backdrop-blur-xl max-h-[85vh] max-h-[85svh] overflow-y-auto pb-safe-bottom select-none shadow-2xl transition-all duration-300"
        style={{ contentVisibility: "auto" }}
      >
        <div className="max-w-md mx-auto">
          {/* Header Title Section */}
          <SheetHeader className="text-center mb-6">
            <div className="mx-auto w-12 h-1 bg-muted/60 rounded-full mb-2" />
            <SheetTitle className="text-sm font-bold flex items-center justify-center gap-2 text-foreground tracking-tight uppercase select-none">
              <Share2 className="h-4 w-4 text-primary shrink-0 animate-pulse" />
              <span>Share Content</span>
            </SheetTitle>
            <SheetDescription className="text-xs text-muted-foreground leading-normal">
              Choose how you want to share this content with your network.
            </SheetDescription>
          </SheetHeader>

          {/* Platform Share Grid Selection */}
          <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto items-start pt-1">
            {/* Share Option: WhatsApp */}
            <button
              type="button"
              onClick={() => handleSocialHandshake("whatsapp")}
              className="group flex flex-col items-center gap-2.5 outline-none cursor-pointer transform-gpu focus-visible:ring-2 focus-visible:ring-ring rounded-xl py-1"
              aria-label="Share via WhatsApp"
            >
              <div className="h-14 w-14 rounded-2xl bg-[#25D366] flex items-center justify-center shadow-md shadow-[#25D366]/20 group-hover:scale-105 group-hover:rotate-2 transition-all duration-300 active:scale-95 border border-white/10 shrink-0">
                <MessageCircle className="h-6 w-6 text-white fill-current" />
              </div>
              <span className="text-[11px] font-bold text-foreground/90 tracking-tight transition-colors group-hover:text-primary">
                WhatsApp
              </span>
            </button>

            {/* Share Option: LinkedIn */}
            <button
              type="button"
              onClick={() => handleSocialHandshake("linkedin")}
              className="group flex flex-col items-center gap-2.5 outline-none cursor-pointer transform-gpu focus-visible:ring-2 focus-visible:ring-ring rounded-xl py-1"
              aria-label="Share via LinkedIn"
            >
              <div className="h-14 w-14 rounded-2xl bg-[#0077b5] flex items-center justify-center shadow-md shadow-[#0077b5]/20 group-hover:scale-105 group-hover:-rotate-2 transition-all duration-300 active:scale-95 border border-white/10 shrink-0">
                <Linkedin className="h-6 w-6 text-white fill-current" />
              </div>
              <span className="text-[11px] font-bold text-foreground/90 tracking-tight transition-colors group-hover:text-primary">
                LinkedIn
              </span>
            </button>

            {/* Share Option: Copy Link */}
            <button
              type="button"
              onClick={handleCopyProtocol}
              className="group flex flex-col items-center gap-2.5 outline-none cursor-pointer transform-gpu focus-visible:ring-2 focus-visible:ring-ring rounded-xl py-1"
              aria-label="Copy link to clipboard"
            >
              <div
                className={cn(
                  "h-14 w-14 rounded-2xl flex items-center justify-center shadow-sm transition-all duration-300 active:scale-95 group-hover:scale-105 border shrink-0",
                  copied
                    ? "bg-emerald-500 border-emerald-400/20 text-white shadow-emerald-500/10"
                    : "bg-muted/30 border-border/40 text-muted-foreground group-hover:border-primary/40 group-hover:bg-primary/5 group-hover:text-primary",
                )}
              >
                {copied ? (
                  <Check className="h-6 w-6 text-white animate-in zoom-in duration-300 stroke-[2.5]" />
                ) : (
                  <Copy className="h-5 w-5 transition-transform group-hover:scale-105" />
                )}
              </div>
              <span className="text-[11px] font-bold text-foreground/90 tracking-tight transition-colors group-hover:text-primary">
                {copied ? "Copied" : "Copy Link"}
              </span>
            </button>
          </div>

          {/* Browser Native Device Share Shortcut Option Button */}
          {hasNativeShareSupport && (
            <div className="mt-6 pt-5 border-t border-border/30 w-full animate-in fade-in zoom-in-95 duration-200">
              <Button
                onClick={handleExecutiveShare}
                variant="outline"
                type="button"
                className="w-full h-10 rounded-xl font-bold text-xs gap-2 tracking-wide border-border/40 hover:bg-accent active:scale-[0.99] transition-transform shadow-sm cursor-pointer"
              >
                <Globe className="h-3.5 w-3.5 text-primary stroke-[2.2]" />
                <span>More sharing options</span>
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}