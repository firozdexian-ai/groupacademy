import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ThumbsUp, ThumbsDown, Briefcase, Play, BookOpen, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useTalent } from '@/hooks/useTalent';

interface FeedItem {
  id: string;
  type: 'job' | 'course' | 'video';
  title: string;
  description: string;
  company?: string;
  thumbnail?: string;
  createdAt: string;
  slug?: string;
}

export default function Feed() {
  const navigate = useNavigate();
  const { talent } = useTalent();
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchFeed();
  }, []);

  async function fetchFeed() {
    setLoading(true);
    try {
      // Fetch jobs, courses in parallel
      const [jobsResult, coursesResult] = await Promise.all([
        supabase
          .from('jobs')
          .select('id, title, description, company_name, created_at')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(10),
        supabase
          .from('content')
          .select('id, title, description, thumbnail_url, created_at, slug, content_type')
          .eq('is_published', true)
          .order('created_at', { ascending: false })
          .limit(10)
      ]);

      const items: FeedItem[] = [];

      // Add jobs
      if (jobsResult.data) {
        jobsResult.data.forEach(job => {
          items.push({
            id: job.id,
            type: 'job',
            title: job.title,
            description: job.description?.substring(0, 150) + '...' || '',
            company: job.company_name,
            createdAt: job.created_at || ''
          });
        });
      }

      // Add courses
      if (coursesResult.data) {
        coursesResult.data.forEach(course => {
          items.push({
            id: course.id,
            type: course.content_type === 'free_video' ? 'video' : 'course',
            title: course.title,
            description: course.description?.substring(0, 150) + '...' || '',
            thumbnail: course.thumbnail_url || undefined,
            createdAt: course.created_at || '',
            slug: course.slug
          });
        });
      }

      // Sort by date and interleave
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setFeedItems(items);
    } catch (error) {
      console.error('Error fetching feed:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleInterested(item: FeedItem) {
    if (item.type === 'job') {
      navigate(`/jobs/${item.id}`);
    } else if (item.slug) {
      navigate(`/courses/${item.slug}`);
    }
  }

  function handleNotInterested(itemId: string) {
    setDismissedIds(prev => new Set([...prev, itemId]));
    // TODO: Save to feed_interactions table
  }

  const getTypeIcon = (type: FeedItem['type']) => {
    switch (type) {
      case 'job':
        return <Briefcase className="h-4 w-4" />;
      case 'video':
        return <Play className="h-4 w-4" />;
      case 'course':
        return <BookOpen className="h-4 w-4" />;
    }
  };

  const getTypeBadgeColor = (type: FeedItem['type']) => {
    switch (type) {
      case 'job':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'video':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'course':
        return 'bg-accent/10 text-accent-foreground border-accent/20';
    }
  };

  const visibleItems = feedItems.filter(item => !dismissedIds.has(item.id));

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <h1 className="text-2xl font-bold">Your Feed</h1>
        {[1, 2, 3].map(i => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-full mb-1" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Welcome back, {talent?.fullName?.split(' ')[0] || 'there'}!</h1>
        <p className="text-muted-foreground">Here's what's new for you</p>
      </div>

      {visibleItems.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">No new items in your feed.</p>
            <Button className="mt-4" onClick={fetchFeed}>
              Refresh Feed
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {visibleItems.map(item => (
            <Card key={item.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {item.thumbnail && (
                    <img 
                      src={item.thumbnail} 
                      alt={item.title}
                      className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className={cn('text-xs', getTypeBadgeColor(item.type))}>
                        {getTypeIcon(item.type)}
                        <span className="ml-1 capitalize">{item.type}</span>
                      </Badge>
                      {item.company && (
                        <span className="text-xs text-muted-foreground">{item.company}</span>
                      )}
                    </div>
                    <h3 className="font-semibold text-foreground line-clamp-2">{item.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                      {item.description}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border">
                  <Button 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleInterested(item)}
                  >
                    <ThumbsUp className="h-4 w-4 mr-2" />
                    Interested
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="flex-1"
                    onClick={() => handleNotInterested(item.id)}
                  >
                    <ThumbsDown className="h-4 w-4 mr-2" />
                    Not for me
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
