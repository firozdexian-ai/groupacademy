import { X, Heart, Briefcase, Play, BookOpen, MapPin, Building2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CircularMatchBadge } from './CircularMatchBadge';
import { SkillTagBadge } from './SkillTagBadge';
import { cn } from '@/lib/utils';
import type { FeedItem } from '@/hooks/useFeedRecommendations';

interface FeedCardRedesignedProps {
  item: FeedItem;
  onInterested: () => void;
  onNotInterested: () => void;
}

export function FeedCardRedesigned({ item, onInterested, onNotInterested }: FeedCardRedesignedProps) {
  const getTypeIcon = () => {
    switch (item.type) {
      case 'job':
        return <Briefcase className="h-3 w-3" />;
      case 'video':
        return <Play className="h-3 w-3" />;
      case 'course':
        return <BookOpen className="h-3 w-3" />;
    }
  };

  const getTypeBadgeStyles = () => {
    switch (item.type) {
      case 'job':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'video':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'course':
        return 'bg-accent/20 text-accent-foreground border-accent/30';
    }
  };

  const getGradientBackground = () => {
    switch (item.type) {
      case 'job':
        return 'from-primary/20 via-primary/10 to-background';
      case 'video':
        return 'from-destructive/20 via-destructive/10 to-background';
      case 'course':
        return 'from-accent/20 via-accent/10 to-background';
    }
  };

  const companyLogo = item.type === 'job' 
    ? item.companyLogo || null
    : item.thumbnail;

  const hasMedia = !!item.mediaUrl;
  const isVideo = item.mediaType === 'youtube';

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/30 relative rounded-xl animate-bounce-in">
      {/* Conditional Media/Header Section */}
      {hasMedia ? (
        // Actual media - show shorter aspect ratio
        <div className="relative aspect-[2/1] overflow-hidden bg-muted">
          <img
            src={item.mediaUrl}
            alt={item.title}
            className="w-full h-full object-cover"
          />
          {/* Video Play Overlay */}
          {isVideo && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                <Play className="h-4 w-4 text-destructive fill-destructive ml-0.5" />
              </div>
            </div>
          )}

          {/* Match Score Badge - Top Right */}
          {item.matchScore !== undefined && (
            <div className="absolute top-2 right-2 z-10">
              <CircularMatchBadge score={item.matchScore} size="sm" />
            </div>
          )}

          {/* Type Badge - Top Left */}
          <div className="absolute top-2 left-2 z-10">
            <Badge variant="outline" className={cn(
              'text-[10px] gap-1 rounded-md backdrop-blur-sm bg-background/80 border-background/50 px-1.5 py-0.5',
              getTypeBadgeStyles()
            )}>
              {getTypeIcon()}
              <span className="capitalize font-medium">{item.type}</span>
            </Badge>
          </div>
        </div>
      ) : (
        // No media - compact header row with badges inline
        <div className={cn(
          'flex items-center justify-between p-2.5 bg-gradient-to-r border-b border-border/30',
          getGradientBackground()
        )}>
          <Badge variant="outline" className={cn(
            'text-[10px] gap-1 rounded-md px-1.5 py-0.5',
            getTypeBadgeStyles()
          )}>
            {getTypeIcon()}
            <span className="capitalize font-medium">{item.type}</span>
          </Badge>
          
          {item.matchScore !== undefined && (
            <CircularMatchBadge score={item.matchScore} size="sm" />
          )}
        </div>
      )}

      <CardContent className="p-3">
        {/* Company/Source Info */}
        <div className="flex items-center gap-2 mb-2">
          {/* Company Logo - Compact */}
          <div className="flex-shrink-0">
            {companyLogo ? (
              <img
                src={companyLogo}
                alt={item.company || item.title}
                className="w-8 h-8 rounded-lg object-cover ring-1 ring-border bg-muted"
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                <Building2 className="h-4 w-4 text-primary-foreground" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            {item.company && (
              <p className="text-xs text-foreground font-medium truncate">{item.company}</p>
            )}
            {item.location && (
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <MapPin className="h-2.5 w-2.5" />
                <span className="truncate">{item.location}</span>
              </div>
            )}
          </div>
        </div>

        {/* Title - Compact */}
        <h3 className="font-semibold text-foreground line-clamp-2 mb-1.5 text-sm leading-snug">{item.title}</h3>

        {/* Skills */}
        {item.skills && item.skills.length > 0 && (
          <SkillTagBadge skills={item.skills} maxVisible={3} className="mb-1.5" />
        )}

        {/* Match Reason */}
        {item.matchReason && (
          <p className="text-[10px] text-muted-foreground italic line-clamp-1">
            "{item.matchReason}"
          </p>
        )}

        {/* Compact Action Buttons */}
        <div className="flex items-center justify-center gap-4 mt-2 pt-2 border-t border-border/50">
          {/* Dismiss Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNotInterested();
            }}
            className="w-11 h-11 rounded-full bg-card border-2 border-destructive/30 
                       flex items-center justify-center shadow-md 
                       hover:scale-110 hover:border-destructive/60 hover:bg-destructive/5
                       active:scale-95 transition-all duration-200 press-scale"
            aria-label="Not interested"
          >
            <X className="h-5 w-5 text-destructive" />
          </button>

          {/* Interested Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onInterested();
            }}
            className="w-11 h-11 rounded-full bg-card border-2 border-success/30 
                       flex items-center justify-center shadow-md 
                       hover:scale-110 hover:border-success/60 hover:bg-success/5
                       active:scale-95 transition-all duration-200 press-scale"
            aria-label="Interested"
          >
            <Heart className="h-5 w-5 text-success" />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
