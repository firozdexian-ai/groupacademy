import { Share2, Facebook, Linkedin, MessageCircle, Link as LinkIcon, Zap, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Social Amplification Node
 * CTO Reference: Authoritative engine for external curriculum distribution.
 */

interface CourseShareButtonsProps {
  title: string;
  url: string;
  className?: string;
}

export const CourseShareButtons = ({ title, url, className }: CourseShareButtonsProps) => {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(`Mastering ${title} @ GroUp Academy:`);

  const executeClipboardHandshake = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("SYNC_SUCCESS: Link committed to clipboard");
    } catch (error) {
      toast.error("SYNC_FAULT: Clipboard ingress failed");
    }
  };

  const initializeNeuralShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `GroUp Academy: ${title}`,
          text: `Check out this curriculum on GroUp Academy: ${title}`,
          url: url,
        });
      } catch (err) {
        // Native abort handled quietly
      }
    } else {
      executeClipboardHandshake();
    }
  };

  return (
    <div className={cn("space-y-4 animate-in fade-in duration-700", className)}>
      {/* HUD: HEADER_SYNC */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20">
            <Share2 className="h-3.5 w-3.5 text-primary animate-pulse" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground italic">
            Amplify_Trajectory
          </span>
        </div>
        <div className="flex items-center gap-1 opacity-20">
          <ShieldCheck className="h-3 w-3" />
          <span className="text-[8px] font-bold uppercase tracking-widest">v4.2_Secure</span>
        </div>
      </div>

      {/* HUD: COMMAND_RIBBON */}
      <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2.5">
        {/* Core: Native/Copy Sync */}
        <Button
          variant="outline"
          size="sm"
          onClick={initializeNeuralShare}
          className="h-10 rounded-xl border-2 font-black uppercase italic text-[10px] tracking-widest transition-all hover:bg-primary hover:text-white active:scale-95 group flex-1 sm:flex-none"
        >
          <LinkIcon className="h-3.5 w-3.5 mr-2 group-hover:rotate-45 transition-transform" />
          {navigator.share ? "Initialize_Share" : "Copy_Sync_Link"}
        </Button>

        {/* Egress: Facebook */}
        <Button
          variant="outline"
          size="sm"
          asChild
          className="h-10 rounded-xl border-2 font-black uppercase italic text-[10px] tracking-widest hover:border-[#1877F2] hover:bg-[#1877F2]/5 hover:text-[#1877F2] flex-1 sm:flex-none"
        >
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Facebook className="h-3.5 w-3.5 mr-2" />
            Meta
          </a>
        </Button>

        {/* Egress: LinkedIn */}
        <Button
          variant="outline"
          size="sm"
          asChild
          className="h-10 rounded-xl border-2 font-black uppercase italic text-[10px] tracking-widest hover:border-[#0A66C2] hover:bg-[#0A66C2]/5 hover:text-[#0A66C2] flex-1 sm:flex-none"
        >
          <a
            href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Linkedin className="h-3.5 w-3.5 mr-2" />
            LinkedIn
          </a>
        </Button>

        {/* Egress: WhatsApp */}
        <Button
          variant="outline"
          size="sm"
          asChild
          className="h-10 rounded-xl border-2 font-black uppercase italic text-[10px] tracking-widest hover:border-[#25D366] hover:bg-[#25D366]/5 hover:text-[#25D366] flex-1 sm:flex-none"
        >
          <a href={`https://wa.me/?text=${encodedTitle}%20${encodedUrl}`} target="_blank" rel="noopener noreferrer">
            <MessageCircle className="h-3.5 w-3.5 mr-2" />
            WhatsApp
          </a>
        </Button>
      </div>

      <p className="text-[8px] font-medium text-muted-foreground/40 italic text-center uppercase tracking-[0.3em]">
        Neural_Egress_Active // External_Registry_Handshake
      </p>
    </div>
  );
};
