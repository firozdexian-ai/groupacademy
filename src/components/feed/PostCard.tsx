import { useState } from 'react';
import { Pin, ExternalLink, Play } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { PostAuthor } from './PostAuthor';
import { ReactionBar, ReactionType } from './ReactionBar';
import { PollWidget } from './PollWidget';
import { ShareSheet } from './ShareSheet';
import { usePostReactions } from '@/hooks/usePostReactions';
import { usePollVoting } from '@/hooks/usePollVoting';
import { cn } from '@/lib/utils';

interface PollOption {
  id: string;
  text: string;
}

export interface FeedPost {
  id: string;
  authorName: string;
  authorAvatar?: string;
  authorTitle?: string;
  contentType: 'text' | 'poll' | 'tip' | 'news' | 'announcement' | 'media';
  textContent: string;
  mediaUrl?: string;
  pollOptions?: PollOption[];
  pollEndsAt?: string;
  linkUrl?: string;
  linkPreview?: { title: string; description?: string; image?: string };
  tags?: string[];
  isPinned?: boolean;
  createdAt: string;
}

interface PostCardProps {
  post: FeedPost;
}

export function PostCard({ post }: PostCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { reactions, userReaction, toggleReaction, isLoading: reactionsLoading } = usePostReactions(post.id);
  
  const pollOptions = post.pollOptions || [];
  const { hasVoted, userVote, results, totalVotes, castVote, isLoading: pollLoading } = usePollVoting(
    post.id,
    pollOptions
  );

  const isLongText = post.textContent.length > 280;
  const displayText = isLongText && !isExpanded 
    ? post.textContent.slice(0, 280) + '...' 
    : post.textContent;

  const totalReactions = Object.values(reactions).reduce((sum, count) => sum + count, 0);

  const getContentTypeBadge = () => {
    switch (post.contentType) {
      case 'tip':
        return { label: '💡 Tip', className: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' };
      case 'news':
        return { label: '📰 News', className: 'bg-blue-500/10 text-blue-600 border-blue-500/20' };
      case 'announcement':
        return { label: '📢 Announcement', className: 'bg-primary/10 text-primary border-primary/20' };
      case 'poll':
        return { label: '📊 Poll', className: 'bg-purple-500/10 text-purple-600 border-purple-500/20' };
      default:
        return null;
    }
  };

  const typeBadge = getContentTypeBadge();

  const handleReact = async (type: ReactionType) => {
    await toggleReaction(type);
  };

  const isVideo = post.mediaUrl?.includes('youtube') || post.mediaUrl?.includes('youtu.be');

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 border-border/50 rounded-xl">
      {/* Pinned Indicator */}
      {post.isPinned && (
        <div className="bg-primary/5 px-4 py-1.5 flex items-center gap-1.5 text-xs text-primary border-b border-primary/20">
          <Pin className="h-3 w-3" />
          <span className="font-medium">Pinned Post</span>
        </div>
      )}

      <CardContent className="p-3">
        {/* Author Section -- reaction count moved to top-right (replaces 3-dot menu) */}
        <div className="flex items-start justify-between mb-2">
          <PostAuthor
            name={post.authorName}
            title={post.authorTitle}
            avatar={post.authorAvatar}
            createdAt={post.createdAt}
          />
          {totalReactions > 0 && (
            <span className="text-[11px] text-muted-foreground whitespace-nowrap mt-1">
              {totalReactions} reaction{totalReactions !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Type Badge */}
        {typeBadge && (
          <Badge variant="outline" className={cn('text-[10px] mb-2', typeBadge.className)}>
            {typeBadge.label}
          </Badge>
        )}

        {/* Text Content */}
        <div className="mb-2">
          <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
            {displayText}
          </p>
          {isLongText && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs text-primary font-medium mt-1 hover:underline"
            >
              {isExpanded ? 'See less' : 'See more'}
            </button>
          )}
        </div>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {post.tags.map((tag) => (
              <span key={tag} className="text-xs text-primary hover:underline cursor-pointer">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Media */}
        {post.mediaUrl && post.contentType !== 'poll' && (
          <div className="mb-2 -mx-3">
            <AspectRatio ratio={16 / 9} className="bg-muted overflow-hidden">
              <img src={post.mediaUrl} alt="" className="w-full h-full object-cover" />
              {isVideo && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                    <Play className="h-6 w-6 text-destructive fill-destructive ml-1" />
                  </div>
                </div>
              )}
            </AspectRatio>
          </div>
        )}

        {/* Poll */}
        {post.contentType === 'poll' && pollOptions.length > 0 && (
          <div className="mb-2">
            <PollWidget
              options={pollOptions}
              results={results}
              totalVotes={totalVotes}
              hasVoted={hasVoted}
              userVote={userVote}
              pollEndsAt={post.pollEndsAt}
              onVote={castVote}
              disabled={pollLoading}
            />
          </div>
        )}

        {/* Link Preview */}
        {post.linkUrl && post.linkPreview && (
          <a
            href={post.linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block mb-2 border rounded-lg overflow-hidden hover:bg-muted/50 transition-colors"
          >
            {post.linkPreview.image && (
              <img src={post.linkPreview.image} alt="" className="w-full h-32 object-cover" />
            )}
            <div className="p-3">
              <h4 className="text-sm font-medium line-clamp-2">{post.linkPreview.title}</h4>
              {post.linkPreview.description && (
                <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{post.linkPreview.description}</p>
              )}
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                <ExternalLink className="h-3 w-3" />
                <span className="truncate">{new URL(post.linkUrl).hostname}</span>
              </div>
            </div>
          </a>
        )}

        {/* Reactions + Share -- ALL IN ONE ROW */}
        <div className="flex items-center gap-1 border-t border-border/50 pt-2">
          <ReactionBar
            reactions={reactions}
            userReaction={userReaction}
            onReact={handleReact}
            disabled={reactionsLoading}
            inline
          />
          <ShareSheet
            title={post.textContent.slice(0, 100)}
            url={`/app/feed?post=${post.id}`}
            description={post.textContent.slice(0, 200)}
          />
        </div>
      </CardContent>
    </Card>
  );
}
