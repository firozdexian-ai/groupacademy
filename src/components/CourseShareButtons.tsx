import { Share2, Facebook, Linkedin, MessageCircle, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface CourseShareButtonsProps {
  title: string;
  url: string;
}

export const CourseShareButtons = ({ title, url }: CourseShareButtonsProps) => {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!");
    } catch (error) {
      toast.error("Failed to copy link");
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          url: url,
        });
      } catch (error) {
        // User cancelled or error occurred
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Share2 className="h-4 w-4" />
        <span>Share this course</span>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {/* Native Share (mobile) or Copy Link */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleNativeShare}
          className="flex-1 sm:flex-none"
        >
          <LinkIcon className="h-4 w-4 mr-2" />
          Copy Link
        </Button>

        {/* Facebook */}
        <Button
          variant="outline"
          size="sm"
          asChild
          className="flex-1 sm:flex-none"
        >
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Facebook className="h-4 w-4 mr-2" />
            Facebook
          </a>
        </Button>

        {/* LinkedIn */}
        <Button
          variant="outline"
          size="sm"
          asChild
          className="flex-1 sm:flex-none"
        >
          <a
            href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Linkedin className="h-4 w-4 mr-2" />
            LinkedIn
          </a>
        </Button>

        {/* WhatsApp */}
        <Button
          variant="outline"
          size="sm"
          asChild
          className="flex-1 sm:flex-none"
        >
          <a
            href={`https://wa.me/?text=${encodedTitle}%20${encodedUrl}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            WhatsApp
          </a>
        </Button>
      </div>
    </div>
  );
};
