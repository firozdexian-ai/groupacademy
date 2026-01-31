import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useSavedItems, SavedItemType } from '@/hooks/useSavedItems';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, Bookmark, Briefcase, BookOpen, Newspaper, Video, 
  Building2, MapPin, Clock, ArrowRight, Trash2
} from 'lucide-react';

interface SavedItemDetails {
  id: string;
  item_id: string;
  item_type: SavedItemType;
  saved_at: string;
  title?: string;
  company?: string;
  location?: string;
  thumbnail?: string;
  slug?: string;
}

const TYPE_ICONS: Record<SavedItemType, React.ElementType> = {
  job: Briefcase,
  course: BookOpen,
  blog: Newspaper,
  video: Video,
  event: BookOpen,
};

const TYPE_COLORS: Record<SavedItemType, string> = {
  job: 'bg-primary/10 text-primary',
  course: 'bg-accent/10 text-accent',
  blog: 'bg-secondary/10 text-secondary',
  video: 'bg-destructive/10 text-destructive',
  event: 'bg-warning/10 text-warning',
};

export default function SavedItems() {
  const navigate = useNavigate();
  const { savedItems, isLoading, toggleSave, getSavedCount } = useSavedItems();
  const [itemDetails, setItemDetails] = useState<Map<string, SavedItemDetails>>(new Map());
  const [loadingDetails, setLoadingDetails] = useState(true);

  useEffect(() => {
    async function fetchDetails() {
      if (savedItems.length === 0) {
        setLoadingDetails(false);
        return;
      }

      setLoadingDetails(true);
      const details = new Map<string, SavedItemDetails>();

      // Group items by type
      const jobIds = savedItems.filter(i => i.item_type === 'job').map(i => i.item_id);
      const courseIds = savedItems.filter(i => i.item_type === 'course').map(i => i.item_id);
      const blogIds = savedItems.filter(i => i.item_type === 'blog').map(i => i.item_id);

      // Fetch all in parallel
      const [jobsResult, coursesResult, blogsResult] = await Promise.all([
        jobIds.length > 0 
          ? supabase.from('jobs').select('id, title, company_name, location').in('id', jobIds)
          : Promise.resolve({ data: [] }),
        courseIds.length > 0
          ? supabase.from('content').select('id, title, slug, thumbnail_url').in('id', courseIds)
          : Promise.resolve({ data: [] }),
        blogIds.length > 0
          ? supabase.from('blog_posts').select('id, title, slug, featured_image').in('id', blogIds)
          : Promise.resolve({ data: [] }),
      ]);

      // Process jobs
      jobsResult.data?.forEach(job => {
        const saved = savedItems.find(i => i.item_id === job.id);
        if (saved) {
          details.set(`${saved.item_type}-${job.id}`, {
            ...saved,
            title: job.title,
            company: job.company_name,
            location: job.location || undefined,
          });
        }
      });

      // Process courses
      coursesResult.data?.forEach(course => {
        const saved = savedItems.find(i => i.item_id === course.id);
        if (saved) {
          details.set(`${saved.item_type}-${course.id}`, {
            ...saved,
            title: course.title,
            slug: course.slug,
            thumbnail: course.thumbnail_url || undefined,
          });
        }
      });

      // Process blogs
      blogsResult.data?.forEach(blog => {
        const saved = savedItems.find(i => i.item_id === blog.id);
        if (saved) {
          details.set(`${saved.item_type}-${blog.id}`, {
            ...saved,
            title: blog.title,
            slug: blog.slug,
            thumbnail: blog.featured_image || undefined,
          });
        }
      });

      // Add any items without fetched details
      savedItems.forEach(item => {
        const key = `${item.item_type}-${item.item_id}`;
        if (!details.has(key)) {
          details.set(key, {
            ...item,
            title: 'Loading...',
          });
        }
      });

      setItemDetails(details);
      setLoadingDetails(false);
    }

    fetchDetails();
  }, [savedItems]);

  const getItemsByType = (type: SavedItemType | 'all') => {
    if (type === 'all') {
      return Array.from(itemDetails.values());
    }
    return Array.from(itemDetails.values()).filter(item => item.item_type === type);
  };

  const handleItemClick = (item: SavedItemDetails) => {
    switch (item.item_type) {
      case 'job':
        navigate(`/app/jobs/${item.item_id}`);
        break;
      case 'course':
        navigate(`/app/learning/courses/${item.slug || item.item_id}`);
        break;
      case 'blog':
        navigate(`/app/learning/blog/${item.slug || item.item_id}`);
        break;
      default:
        break;
    }
  };

  const handleRemove = async (item: SavedItemDetails, e: React.MouseEvent) => {
    e.stopPropagation();
    await toggleSave(item.item_id, item.item_type);
  };

  const renderItem = (item: SavedItemDetails) => {
    const Icon = TYPE_ICONS[item.item_type];
    const colorClass = TYPE_COLORS[item.item_type];

    return (
      <Card 
        key={`${item.item_type}-${item.item_id}`}
        className="cursor-pointer overflow-hidden animate-bounce-in press-scale"
        onClick={() => handleItemClick(item)}
      >
        <CardContent className="p-3">
          <div className="flex gap-3">
            <div className={`w-11 h-11 rounded-xl ${colorClass} flex items-center justify-center shrink-0`}>
              <Icon className="w-5 h-5" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-0.5">
                <h3 className="font-semibold text-sm line-clamp-1">{item.title}</h3>
                <Badge variant="outline" className="shrink-0 text-[10px] capitalize">
                  {item.item_type}
                </Badge>
              </div>
              
              {item.company && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                  <Building2 className="h-3 w-3" />
                  <span className="truncate">{item.company}</span>
                </div>
              )}
              
              {item.location && (
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <MapPin className="h-2.5 w-2.5" />
                  <span className="truncate">{item.location}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={(e) => handleRemove(item, e)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <ArrowRight className="h-4 w-4 text-primary" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderEmptyState = (type: string) => (
    <Card className="border-dashed">
      <CardContent className="py-12 text-center">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
          <Bookmark className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="font-bold text-base mb-1">No saved {type === 'all' ? 'items' : type + 's'}</h3>
        <p className="text-sm text-muted-foreground mb-4 max-w-xs mx-auto">
          Bookmark jobs, courses, and articles to find them quickly later.
        </p>
        <Button 
          className="rounded-full h-10 px-5 press-scale"
          onClick={() => navigate('/app/feed')}
        >
          Explore Feed
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-10 w-10 rounded-full press-scale"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-lg font-bold">Saved Items</h1>
          <p className="text-xs text-muted-foreground">{savedItems.length} saved</p>
        </div>
      </div>

      <Tabs defaultValue="all">
        <div className="overflow-x-auto -mx-4 px-4 mb-4">
          <TabsList className="w-max">
            <TabsTrigger value="all" className="text-xs h-8">
              All ({getSavedCount()})
            </TabsTrigger>
            <TabsTrigger value="job" className="text-xs h-8">
              Jobs ({getSavedCount('job')})
            </TabsTrigger>
            <TabsTrigger value="course" className="text-xs h-8">
              Courses ({getSavedCount('course')})
            </TabsTrigger>
            <TabsTrigger value="blog" className="text-xs h-8">
              Articles ({getSavedCount('blog')})
            </TabsTrigger>
          </TabsList>
        </div>

        {['all', 'job', 'course', 'blog'].map(tab => (
          <TabsContent key={tab} value={tab}>
            {isLoading || loadingDetails ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-20 w-full rounded-xl" />
                ))}
              </div>
            ) : getItemsByType(tab as SavedItemType | 'all').length === 0 ? (
              renderEmptyState(tab)
            ) : (
              <div className="space-y-3">
                {getItemsByType(tab as SavedItemType | 'all').map(renderItem)}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
