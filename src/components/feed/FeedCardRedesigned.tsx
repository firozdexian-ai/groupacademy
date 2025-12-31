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
        return <Briefcase className="h-3.5 w-3.5" />;
      case 'video':
        return <Play className="h-3.5 w-3.5" />;
      case 'course':
        return <BookOpen className="h-3.5 w-3.5" />;
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

  // Get gradient background based on type for fallback
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

  // Company logo - smaller, for the info section
  const companyLogo = item.type === 'job' 
    ? item.companyLogo || null
    : item.thumbnail;

  // Determine if we have media to show
  const hasMedia = !!item.mediaUrl;
  const isVideo = item.mediaType === 'youtube';

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/30 relative rounded-2xl animate-bounce-in">
      {/* Media Section - 16:9 aspect ratio */}
      <div className="relative aspect-video overflow-hidden bg-muted">
        {hasMedia ? (
          <>
            <img
              src={item.mediaUrl}
              alt={item.title}
              className="w-full h-full object-cover"
            />
            {/* Video Play Overlay */}
            {isVideo && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                  <Play className="h-8 w-8 text-destructive fill-destructive ml-1" />
                </div>
              </div>
            )}
          </>
        ) : (
          // Gradient fallback with icon
          <div className={cn(
            'w-full h-full flex items-center justify-center bg-gradient-to-br',
            getGradientBackground()
          )}>
            <div className="w-20 h-20 rounded-full bg-background/80 flex items-center justify-center shadow-md">
              {item.type === 'job' && <Briefcase className="h-10 w-10 text-primary" />}
              {item.type === 'video' && <Play className="h-10 w-10 text-destructive" />}
              {item.type === 'course' && <BookOpen className="h-10 w-10 text-accent-foreground" />}
            </div>
          </div>
        )}

        {/* Match Score Badge - Top Right Overlay */}
        {item.matchScore !== undefined && (
          <div className="absolute top-3 right-3 z-10">
            <CircularMatchBadge score={item.matchScore} size="md" />
          </div>
        )}

        {/* Type Badge - Top Left Overlay */}
        <div className="absolute top-3 left-3 z-10">
          <Badge variant="outline" className={cn(
            'text-[10px] gap-1 rounded-lg backdrop-blur-sm bg-background/80 border-background/50',
            getTypeBadgeStyles()
          )}>
            {getTypeIcon()}
            <span className="capitalize font-semibold">{item.type}</span>
          </Badge>
        </div>
      </div>

      <CardContent className="p-4">
        {/* Company/Source Info */}
        <div className="flex items-center gap-3 mb-3">
          {/* Company Logo / Thumbnail (smaller) */}
          <div className="flex-shrink-0">
            {companyLogo ? (
              <img
                src={companyLogo}
                alt={item.company || item.title}
                className="w-10 h-10 rounded-xl object-cover ring-1 ring-border bg-muted"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
                <Building2 className="h-5 w-5 text-primary-foreground" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            {/* Company Name */}
            {item.company && (
              <p className="text-sm text-foreground font-medium truncate">{item.company}</p>
            )}
            {/* Location */}
            {item.location && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span className="truncate">{item.location}</span>
              </div>
            )}
          </div>
        </div>

        {/* Title */}
        <h3 className="font-bold text-foreground line-clamp-2 mb-2 text-base leading-tight">{item.title}</h3>

        {/* Skills */}
        {item.skills && item.skills.length > 0 && (
          <SkillTagBadge skills={item.skills} maxVisible={3} className="mb-2" />
        )}

        {/* Match Reason */}
        {item.matchReason && (
          <p className="text-xs text-muted-foreground italic line-clamp-1">
            "{item.matchReason}"
          </p>
        )}

        {/* Tinder-style Action Buttons */}
        <div className="flex items-center justify-center gap-8 mt-4 pt-4 border-t border-border/50">
          {/* Dismiss Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNotInterested();
            }}
            className="w-14 h-14 rounded-full bg-card border-2 border-destructive/30 
                       flex items-center justify-center shadow-lg 
                       hover:scale-110 hover:border-destructive/60 hover:bg-destructive/5
                       active:scale-95 transition-all duration-200 press-scale"
            aria-label="Not interested"
          >
            <X className="h-6 w-6 text-destructive" />
          </button>

          {/* Interested Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onInterested();
            }}
            className="w-14 h-14 rounded-full bg-card border-2 border-success/30 
                       flex items-center justify-center shadow-lg 
                       hover:scale-110 hover:border-success/60 hover:bg-success/5
                       active:scale-95 transition-all duration-200 press-scale"
            aria-label="Interested"
          >
            <Heart className="h-6 w-6 text-success" />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
