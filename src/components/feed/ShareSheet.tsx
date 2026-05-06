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
        title: "LINK_SYNC_SUCCESS",
        description: "Node URL recorded to clipboard.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "SYNC_FAULT",
        description: "Manual URL extraction required.",
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
          className="h-10 text-[10px] font-black uppercase italic tracking-[0.2em] gap-2 flex-1 hover:bg-primary/10 hover:text-primary transition-all active:scale-95 group"
        >
          <Share2 className="h-4 w-4 transition-transform group-hover:rotate-12" />
          <span>Sync_Network</span>
        </Button>
      </SheetTrigger>

      <SheetContent
        side="bottom"
        className="rounded-t-[40px] p-8 pb-12 border-t-4 border-primary/20 bg-background/95 backdrop-blur-xl"
      >
        <SheetHeader className="text-center mb-8">
          <div className="mx-auto w-16 h-1.5 bg-muted/40 rounded-full mb-6" />
          <SheetTitle className="text-2xl font-black uppercase italic tracking-tighter flex items-center justify-center gap-3">
            <Zap className="h-6 w-6 text-primary fill-current" /> Initialize_Broadcast
          </SheetTitle>
          <SheetDescription className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground opacity-60">
            Select expansion node for broadcast synchronization
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
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">
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
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">
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
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">
              {copied ? "Sync_OK" : "Extract_URL"}
            </span>
          </button>
        </div>

        {/* SYSTEM OVERRIDE: Native Share */}
        {navigator.share && (
          <div className="mt-10 pt-8 border-t-2 border-border/10">
            <Button
              onClick={handleExecutiveShare}
              variant="outline"
              className="w-full h-14 rounded-2xl border-2 font-black text-[11px] uppercase tracking-[0.2em] gap-3 shadow-sm hover:bg-primary/5 hover:border-primary/20 transition-all active:scale-[0.98] italic"
            >
              <Globe className="h-4 w-4" />
              Institutional_Sharing_Protocol
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
