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
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/30 relative">
      {/* Match Score Badge - Top Right */}
      {item.matchScore !== undefined && (
        <div className="absolute top-3 right-3 z-10">
          <CircularMatchBadge score={item.matchScore} size="md" />
        </div>
      )}

      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Company Logo / Thumbnail */}
          <div className="flex-shrink-0">
            {companyLogo ? (
              <img
                src={companyLogo}
                alt={item.company || item.title}
                className="w-14 h-14 rounded-xl object-cover ring-1 ring-border bg-muted"
              />
            ) : (
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center ring-1 ring-primary/20">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 pr-12">
            {/* Type Badge */}
            <Badge variant="outline" className={cn('text-[10px] gap-1 mb-2', getTypeBadgeStyles())}>
              {getTypeIcon()}
              <span className="capitalize">{item.type}</span>
            </Badge>

            {/* Title */}
            <h3 className="font-semibold text-foreground line-clamp-2 mb-1">{item.title}</h3>

            {/* Company Name */}
            {item.company && (
              <p className="text-sm text-muted-foreground mb-1">{item.company}</p>
            )}

            {/* Location */}
            {item.location && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                <MapPin className="h-3 w-3" />
                <span>{item.location}</span>
              </div>
            )}

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
          </div>
        </div>

        {/* Tinder-style Action Buttons */}
        <div className="flex items-center justify-center gap-6 mt-5 pt-4 border-t border-border/50">
          {/* Dismiss Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNotInterested();
            }}
            className="w-14 h-14 rounded-full bg-card border-2 border-destructive/30 
                       flex items-center justify-center shadow-lg 
                       hover:scale-110 hover:border-destructive/60 hover:bg-destructive/5
                       active:scale-95 transition-all duration-200"
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
                       active:scale-95 transition-all duration-200"
            aria-label="Interested"
          >
            <Heart className="h-6 w-6 text-success" />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
