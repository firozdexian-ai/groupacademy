import { useState } from "react";
import { Share2, Copy, Check, MessageCircle, Linkedin, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface ShareSheetProps {
  title: string;
  url: string;
  description?: string;
}

export function ShareSheet({ title, url, description }: ShareSheetProps) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const shareText = description ? `${title}\n\n${description}` : title;
  const fullUrl = url.startsWith("http") ? url : `${window.location.origin}${url}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      toast({
        title: "Link Copied",
        description: "You can now share it anywhere.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Copy Failed",
        description: "Please manually copy the URL.",
        variant: "destructive",
      });
    }
  };

  const handleSocialShare = (platform: "whatsapp" | "linkedin") => {
    const urls = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(`${shareText}\n\n${fullUrl}`)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(fullUrl)}`,
    };

    window.open(urls[platform], "_blank", "noopener,noreferrer");
    setOpen(false);
  };

  const handleNativeShare = async () => {
    if (!navigator.share) return;

    try {
      await navigator.share({
        title,
        text: description,
        url: fullUrl,
      });
      setOpen(false);
    } catch (err) {
      // User likely cancelled or platform denied
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-9 text-[11px] font-bold uppercase tracking-wider gap-1.5 flex-1 hover:bg-primary/5 hover:text-primary transition-colors"
        >
          <Share2 className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Share</span>
        </Button>
      </SheetTrigger>

      <SheetContent side="bottom" className="rounded-t-[32px] p-6 pb-10 border-t-primary/10">
        <SheetHeader className="text-center mb-6">
          <div className="mx-auto w-12 h-1.5 bg-muted rounded-full mb-4" />
          <SheetTitle className="text-xl font-bold tracking-tight">Share Strategy</SheetTitle>
        </SheetHeader>

        <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto">
          {/* WhatsApp */}
          <button
            onClick={() => handleSocialShare("whatsapp")}
            className="group flex flex-col items-center gap-3 outline-none"
          >
            <div className="h-14 w-14 rounded-2xl bg-[#25D366] flex items-center justify-center shadow-lg shadow-green-500/20 group-hover:scale-110 transition-transform active:scale-95">
              <MessageCircle className="h-7 w-7 text-white fill-current" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">WhatsApp</span>
          </button>

          {/* LinkedIn */}
          <button
            onClick={() => handleSocialShare("linkedin")}
            className="group flex flex-col items-center gap-3 outline-none"
          >
            <div className="h-14 w-14 rounded-2xl bg-[#0077b5] flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform active:scale-95">
              <Linkedin className="h-7 w-7 text-white fill-current" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">LinkedIn</span>
          </button>

          {/* Copy Link */}
          <button onClick={handleCopyLink} className="group flex flex-col items-center gap-3 outline-none">
            <div
              className={cn(
                "h-14 w-14 rounded-2xl flex items-center justify-center shadow-lg transition-all active:scale-95 group-hover:scale-110",
                copied ? "bg-emerald-500 shadow-emerald-500/20" : "bg-muted shadow-muted/20",
              )}
            >
              {copied ? (
                <Check className="h-7 w-7 text-white animate-in zoom-in duration-300" />
              ) : (
                <Copy className="h-7 w-7 text-muted-foreground" />
              )}
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              {copied ? "Copied" : "Link"}
            </span>
          </button>
        </div>

        {/* System Native Share */}
        {navigator.share && (
          <div className="mt-8 pt-6 border-t border-border/50">
            <Button
              onClick={handleNativeShare}
              variant="outline"
              className="w-full h-12 rounded-xl font-bold text-xs uppercase tracking-widest gap-2"
            >
              <Globe className="h-4 w-4" />
              More Sharing Options
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
