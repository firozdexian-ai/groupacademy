import { useState } from "react";
import { Share2, Copy, Check, MessageCircle, Linkedin, Globe, Zap, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { recordShare } from "@/hooks/useCreatorAnalytics";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Network Expansion Terminal (ShareSheet)
 * CTO Reference: High-fidelity sharing node for viral content distribution.
 */

interface ShareSheetProps {
  title: string;
  url: string;
  description?: string;
  postId?: string;
}

export function ShareSheet({ title, url, description, postId }: ShareSheetProps) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const shareText = description ? `${title}\n\n${description}` : title;
  const fullUrl = url.startsWith("http") ? url : `${window.location.origin}${url}`;

  const handleCopyProtocol = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      if (postId) recordShare(postId, "copy_link");
      toast({
        title: "Link copied",
        description: "The link is on your clipboard.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Couldn't copy link",
        description: "Please copy the URL manually.",
        variant: "destructive",
      });
    }
  };

  const handleSocialHandshake = (platform: "whatsapp" | "linkedin") => {
    const urls = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(`${shareText}\n\n${fullUrl}`)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(fullUrl)}`,
    };

    if (postId) recordShare(postId, platform);
    window.open(urls[platform], "_blank", "noopener,noreferrer");
    setOpen(false);
  };

  const handleExecutiveShare = async () => {
    if (!navigator.share) return;
    try {
      await navigator.share({
        title,
        text: description,
        url: fullUrl,
      });
      if (postId) recordShare(postId, "native");
      setOpen(false);
    } catch (err) {
      // Logic: User aborted transmission
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-9 text-xs font-medium gap-2 flex-1 hover:bg-primary/10 hover:text-primary transition-colors rounded-lg"
        >
          <Share2 className="h-4 w-4" />
          <span>Share</span>
        </Button>
      </SheetTrigger>

      <SheetContent
        side="bottom"
        className="rounded-t-3xl p-6 pb-10 border-t border-border/40 bg-background"
      >
        <SheetHeader className="text-center mb-6">
          <div className="mx-auto w-12 h-1 bg-muted rounded-full mb-4" />
          <SheetTitle className="text-lg font-semibold flex items-center justify-center gap-2">
            <Share2 className="h-5 w-5 text-primary" /> Share
          </SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground">
            Pick where you want to share this.
          </SheetDescription>
        </SheetHeader>

        <div className="grid grid-cols-3 gap-6 max-w-sm mx-auto">
          {/* HANDSHAKE: WhatsApp */}
          <button
            onClick={() => handleSocialHandshake("whatsapp")}
            className="group flex flex-col items-center gap-4 outline-none"
          >
            <div className="h-16 w-16 rounded-[24px] bg-[#25D366] flex items-center justify-center shadow-[0_10px_30px_rgba(37,211,102,0.3)] group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 active:scale-90 border-4 border-white/10">
              <MessageCircle className="h-8 w-8 text-white fill-current" />
            </div>
            <span className="text-xs font-medium text-foreground">
              WhatsApp
            </span>
          </button>

          {/* HANDSHAKE: LinkedIn */}
          <button
            onClick={() => handleSocialHandshake("linkedin")}
            className="group flex flex-col items-center gap-4 outline-none"
          >
            <div className="h-16 w-16 rounded-[24px] bg-[#0077b5] flex items-center justify-center shadow-[0_10px_30px_rgba(0,119,181,0.3)] group-hover:scale-110 group-hover:-rotate-3 transition-all duration-500 active:scale-90 border-4 border-white/10">
              <Linkedin className="h-8 w-8 text-white fill-current" />
            </div>
            <span className="text-xs font-medium text-foreground">
              LinkedIn
            </span>
          </button>

          {/* HANDSHAKE: Copy Link */}
          <button onClick={handleCopyProtocol} className="group flex flex-col items-center gap-4 outline-none">
            <div
              className={cn(
                "h-16 w-16 rounded-[24px] flex items-center justify-center shadow-2xl transition-all duration-500 active:scale-90 group-hover:scale-110 border-4",
                copied ? "bg-emerald-500 border-emerald-400/20" : "bg-muted border-border/20",
              )}
            >
              {copied ? (
                <Check className="h-8 w-8 text-white animate-in zoom-in duration-300" />
              ) : (
                <Copy className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
            <span className="text-xs font-medium text-foreground">
              {copied ? "Copied" : "Copy link"}
            </span>
          </button>
        </div>

        {/* SYSTEM OVERRIDE: Native Share */}
        {navigator.share && (
          <div className="mt-8 pt-6 border-t border-border/30">
            <Button
              onClick={handleExecutiveShare}
              variant="outline"
              className="w-full h-11 rounded-xl font-medium text-sm gap-2"
            >
              <Globe className="h-4 w-4" />
              More sharing options
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
