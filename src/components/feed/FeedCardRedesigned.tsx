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

  // Determine company logo - use thumbnail for courses/videos, placeholder for jobs
  const companyLogo = item.type === 'job' 
    ? item.companyLogo || null
    : item.thumbnail;

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/30 relative rounded-2xl animate-bounce-in">
      {/* Match Score Badge - Top Right */}
      {item.matchScore !== undefined && (
        <div className="absolute top-4 right-4 z-10">
          <CircularMatchBadge score={item.matchScore} size="md" />
        </div>
      )}

      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          {/* Company Logo / Thumbnail */}
          <div className="flex-shrink-0">
            {companyLogo ? (
              <img
                src={companyLogo}
                alt={item.company || item.title}
                className="w-16 h-16 rounded-2xl object-cover ring-1 ring-border bg-muted shadow-sm"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-md">
                <Building2 className="h-7 w-7 text-primary-foreground" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 pr-14">
            {/* Type Badge */}
            <Badge variant="outline" className={cn('text-[10px] gap-1 mb-2.5 rounded-lg', getTypeBadgeStyles())}>
              {getTypeIcon()}
              <span className="capitalize font-semibold">{item.type}</span>
            </Badge>

            {/* Title */}
            <h3 className="font-bold text-foreground line-clamp-2 mb-1.5 text-base">{item.title}</h3>

            {/* Company Name */}
            {item.company && (
              <p className="text-sm text-muted-foreground mb-1.5 font-medium">{item.company}</p>
            )}

            {/* Location */}
            {item.location && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
                <MapPin className="h-3.5 w-3.5" />
                <span>{item.location}</span>
              </div>
            )}

            {/* Skills */}
            {item.skills && item.skills.length > 0 && (
              <SkillTagBadge skills={item.skills} maxVisible={3} className="mb-2.5" />
            )}

            {/* Match Reason */}
            {item.matchReason && (
              <p className="text-xs text-muted-foreground italic line-clamp-1">
                "{item.matchReason}"
              </p>
            )}
          </div>
        </div>

        {/* Tinder-style Action Buttons - Larger */}
        <div className="flex items-center justify-center gap-8 mt-6 pt-5 border-t border-border/50">
          {/* Dismiss Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNotInterested();
            }}
            className="w-16 h-16 rounded-full bg-card border-2 border-destructive/30 
                       flex items-center justify-center shadow-lg 
                       hover:scale-110 hover:border-destructive/60 hover:bg-destructive/5
                       active:scale-95 transition-all duration-200 press-scale"
            aria-label="Not interested"
          >
            <X className="h-7 w-7 text-destructive" />
          </button>

          {/* Interested Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onInterested();
            }}
            className="w-16 h-16 rounded-full bg-card border-2 border-success/30 
                       flex items-center justify-center shadow-lg 
                       hover:scale-110 hover:border-success/60 hover:bg-success/5
                       active:scale-95 transition-all duration-200 press-scale"
            aria-label="Interested"
          >
            <Heart className="h-7 w-7 text-success" />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
