import { useState } from 'react';
import { Play, BookOpen, Newspaper, FileText, ArrowRight, Bookmark, Share2, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CircularMatchBadge } from './CircularMatchBadge';
import { SkillTagBadge } from './SkillTagBadge';
import { ShareSheet } from './ShareSheet';
import { cn } from '@/lib/utils';
import { useSavedItems, SavedItemType } from '@/hooks/useSavedItems';
import type { FeedItem } from '@/hooks/useFeedRecommendations';

interface FeedCardRedesignedProps {
  item: FeedItem;
  onInterested: () => void;
  onNotInterested: () => void;
}

function extractYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
  return match ? match[1] : null;
}

export function FeedCardRedesigned({ item, onInterested, onNotInterested }: FeedCardRedesignedProps) {
  const { isSaved, toggleSave } = useSavedItems();

  const getSavedItemType = (): SavedItemType => {
    if (item.type === 'post') return 'blog';
    return item.type as SavedItemType;
  };

  const itemType = getSavedItemType();
  const isBookmarked = isSaved(item.id, itemType);

  const handleToggleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await toggleSave(item.id, itemType);
  };

  const getTypeIcon = () => {
    switch (item.type) {
      case 'video': return <Play className="h-3 w-3" />;
      case 'course': return <BookOpen className="h-3 w-3" />;
      case 'blog': return <Newspaper className="h-3 w-3" />;
      case 'post': return <FileText className="h-3 w-3" />;
    }
  };

  const getTypeBadgeStyles = () => {
    switch (item.type) {
      case 'video': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'course': return 'bg-accent/20 text-accent-foreground border-accent/30';
      case 'blog': return 'bg-secondary/20 text-secondary-foreground border-secondary/30';
      case 'post': return 'bg-primary/10 text-primary border-primary/20';
    }
  };

  const getGradientBackground = () => {
    switch (item.type) {
      case 'video': return 'from-destructive/20 via-destructive/10 to-background';
      case 'course': return 'from-accent/20 via-accent/10 to-background';
      case 'blog': return 'from-secondary/20 via-secondary/10 to-background';
      case 'post': return 'from-primary/20 via-primary/10 to-background';
    }
  };

  const getActionLabel = () => {
    switch (item.type) {
      case 'video': return 'Watch on YouTube';
      case 'course': return 'Learn More';
      case 'blog': return 'Read';
      case 'post': return 'View';
    }
  };

  const getShareUrl = () => {
    if (item.type === 'course') return `/app/courses/${item.id}`;
    if (item.type === 'blog') return `/app/blog/${item.id}`;
    return `/app/feed`;
  };

  const hasYouTubeEmbed = !!item.youtubeUrl;
  const youtubeId = item.youtubeUrl ? extractYouTubeId(item.youtubeUrl) : null;
  const hasMedia = !!item.mediaUrl && !hasYouTubeEmbed;
  const isVideo = item.mediaType === 'youtube' && !hasYouTubeEmbed;

  const handlePrimaryAction = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (item.type === 'video' && item.youtubeUrl) {
      window.open(item.youtubeUrl, '_blank');
    } else {
      onInterested();
    }
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/30 relative rounded-xl animate-bounce-in">
      {/* YouTube Embed */}
      {hasYouTubeEmbed && youtubeId ? (
        <div className="relative aspect-video overflow-hidden bg-muted">
          <iframe
            src={`https://www.youtube.com/embed/${youtubeId}`}
            title={item.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          />
          <div className="absolute top-2 right-2 z-10 flex items-center gap-1.5">
            <Button variant="ghost" size="icon" className={cn("h-7 w-7 rounded-full backdrop-blur-sm", isBookmarked ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-background/80 hover:bg-background")} onClick={handleToggleSave}>
              <Bookmark className={cn("h-3.5 w-3.5", isBookmarked && "fill-current")} />
            </Button>
            {item.matchScore !== undefined && <CircularMatchBadge score={item.matchScore} size="sm" />}
          </div>
          <div className="absolute top-2 left-2 z-10">
            <Badge variant="outline" className={cn('text-[10px] gap-1 rounded-md backdrop-blur-sm bg-background/80 border-background/50 px-1.5 py-0.5', getTypeBadgeStyles())}>
              {getTypeIcon()}
              <span className="capitalize font-medium">{item.type}</span>
            </Badge>
          </div>
        </div>
      ) : hasMedia ? (
        <div className="relative aspect-[2/1] overflow-hidden bg-muted">
          <img src={item.mediaUrl} alt={item.title} className="w-full h-full object-cover" />
          {isVideo && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                <Play className="h-4 w-4 text-destructive fill-destructive ml-0.5" />
              </div>
            </div>
          )}
          <div className="absolute top-2 right-2 z-10 flex items-center gap-1.5">
            <Button variant="ghost" size="icon" className={cn("h-7 w-7 rounded-full backdrop-blur-sm", isBookmarked ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-background/80 hover:bg-background")} onClick={handleToggleSave}>
              <Bookmark className={cn("h-3.5 w-3.5", isBookmarked && "fill-current")} />
            </Button>
            {item.matchScore !== undefined && <CircularMatchBadge score={item.matchScore} size="sm" />}
          </div>
          <div className="absolute top-2 left-2 z-10">
            <Badge variant="outline" className={cn('text-[10px] gap-1 rounded-md backdrop-blur-sm bg-background/80 border-background/50 px-1.5 py-0.5', getTypeBadgeStyles())}>
              {getTypeIcon()}
              <span className="capitalize font-medium">{item.type}</span>
            </Badge>
          </div>
        </div>
      ) : (
        <div className={cn('flex items-center justify-between p-2.5 bg-gradient-to-r border-b border-border/30', getGradientBackground())}>
          <Badge variant="outline" className={cn('text-[10px] gap-1 rounded-md px-1.5 py-0.5', getTypeBadgeStyles())}>
            {getTypeIcon()}
            <span className="capitalize font-medium">{item.type}</span>
          </Badge>
          <div className="flex items-center gap-1.5">
            <Button variant="ghost" size="icon" className={cn("h-6 w-6 rounded-full", isBookmarked ? "bg-primary text-primary-foreground hover:bg-primary/90" : "hover:bg-background")} onClick={handleToggleSave}>
              <Bookmark className={cn("h-3 w-3", isBookmarked && "fill-current")} />
            </Button>
            {item.matchScore !== undefined && <CircularMatchBadge score={item.matchScore} size="sm" />}
          </div>
        </div>
      )}

      <CardContent className="p-4">
        <h3 className="font-semibold text-foreground line-clamp-2 mb-1.5 text-[15px] leading-snug">{item.title}</h3>

        {item.skills && item.skills.length > 0 && (
          <SkillTagBadge skills={item.skills} maxVisible={3} className="mb-1.5" />
        )}

        {item.matchReason && (
          <p className="text-[10px] text-muted-foreground italic line-clamp-1">
            "{item.matchReason}"
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2 mt-2.5 pt-2.5 border-t border-border/50">
          <Button size="sm" onClick={handlePrimaryAction} className="flex-1 h-10 text-xs gap-1">
            {item.type === 'video' && item.youtubeUrl ? (
              <>
                <ExternalLink className="h-3.5 w-3.5" />
                {getActionLabel()}
              </>
            ) : (
              <>
                {getActionLabel()}
                <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </Button>

          <ShareSheet
            title={item.title}
            url={getShareUrl()}
            description={item.matchReason}
          />
        </div>
      </CardContent>
    </Card>
  );
}
