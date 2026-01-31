import { useState } from 'react';
import { Share2, Copy, Check, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useToast } from '@/hooks/use-toast';

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
  const fullUrl = url.startsWith('http') ? url : `${window.location.origin}${url}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      toast({ title: 'Link copied!' });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: 'Failed to copy link', variant: 'destructive' });
    }
  };

  const handleWhatsAppShare = () => {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText}\n\n${fullUrl}`)}`;
    window.open(whatsappUrl, '_blank');
    setOpen(false);
  };

  const handleLinkedInShare = () => {
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(fullUrl)}`;
    window.open(linkedInUrl, '_blank');
    setOpen(false);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: description,
          url: fullUrl,
        });
        setOpen(false);
      } catch (err) {
        // User cancelled
      }
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="h-9 text-xs gap-1.5 flex-1">
          <Share2 className="h-4 w-4" />
          <span className="hidden sm:inline">Share</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader className="text-left">
          <SheetTitle className="text-base">Share this post</SheetTitle>
        </SheetHeader>

        <div className="grid grid-cols-3 gap-3 py-6">
          {/* WhatsApp */}
          <button
            onClick={handleWhatsAppShare}
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
          >
            <div className="h-12 w-12 rounded-full bg-green-500 flex items-center justify-center">
              <MessageCircle className="h-6 w-6 text-white" />
            </div>
            <span className="text-xs font-medium">WhatsApp</span>
          </button>

          {/* LinkedIn */}
          <button
            onClick={handleLinkedInShare}
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
          >
            <div className="h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center">
              <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
            </div>
            <span className="text-xs font-medium">LinkedIn</span>
          </button>

          {/* Copy Link */}
          <button
            onClick={handleCopyLink}
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
          >
            <div className="h-12 w-12 rounded-full bg-muted-foreground/20 flex items-center justify-center">
              {copied ? (
                <Check className="h-6 w-6 text-green-500" />
              ) : (
                <Copy className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
            <span className="text-xs font-medium">{copied ? 'Copied!' : 'Copy Link'}</span>
          </button>
        </div>

        {/* Native Share (mobile) */}
        {navigator.share && (
          <Button onClick={handleNativeShare} variant="outline" className="w-full">
            More options...
          </Button>
        )}
      </SheetContent>
    </Sheet>
  );
}
