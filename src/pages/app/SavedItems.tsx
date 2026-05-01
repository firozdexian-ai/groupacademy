import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSavedItems, SavedItemType } from "@/hooks/useSavedItems";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Bookmark,
  Briefcase,
  BookOpen,
  Newspaper,
  Building2,
  MapPin,
  ArrowRight,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

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

const TYPE_ICONS: Partial<Record<SavedItemType, React.ElementType>> = {
  job: Briefcase,
  course: BookOpen,
  blog: Newspaper,
};

const TYPE_COLORS: Partial<Record<SavedItemType, string>> = {
  job: "bg-primary/10 text-primary",
  course: "bg-blue-500/10 text-blue-600",
  blog: "bg-emerald-500/10 text-emerald-600",
};

export default function SavedItems() {
  const navigate = useNavigate();
  const { savedItems, isLoading, toggleSave, getSavedCount } = useSavedItems();
  const [itemDetails, setItemDetails] = useState<Map<string, SavedItemDetails>>(new Map());
  const [loadingDetails, setLoadingDetails] = useState(true);

  useEffect(() => {
    async function fetchDetails() {
      if (savedItems.length === 0) {
        setItemDetails(new Map());
        setLoadingDetails(false);
        return;
      }
      setLoadingDetails(true);
      const details = new Map<string, SavedItemDetails>();

      const jobIds = savedItems.filter((i) => i.item_type === "job").map((i) => i.item_id);
      const courseIds = savedItems.filter((i) => i.item_type === "course").map((i) => i.item_id);
      const blogIds = savedItems.filter((i) => i.item_type === "blog").map((i) => i.item_id);

      const [jobsResult, coursesResult, blogsResult] = await Promise.all([
        jobIds.length
          ? supabase.from("jobs").select("id, title, company_name, location").in("id", jobIds)
          : Promise.resolve({ data: [] }),
        courseIds.length
          ? supabase.from("content").select("id, title, slug, thumbnail_url").in("id", courseIds)
          : Promise.resolve({ data: [] }),
        blogIds.length
          ? supabase.from("blog_posts").select("id, title, slug, featured_image").in("id", blogIds)
          : Promise.resolve({ data: [] }),
      ]);

      jobsResult.data?.forEach((job: any) => {
        const saved = savedItems.find((i) => i.item_id === job.id);
        if (saved) details.set(`${saved.item_type}-${job.id}`, {
          ...saved, title: job.title, company: job.company_name, location: job.location || undefined,
        });
      });
      coursesResult.data?.forEach((c: any) => {
        const saved = savedItems.find((i) => i.item_id === c.id);
        if (saved) details.set(`${saved.item_type}-${c.id}`, {
          ...saved, title: c.title, slug: c.slug, thumbnail: c.thumbnail_url || undefined,
        });
      });
      blogsResult.data?.forEach((b: any) => {
        const saved = savedItems.find((i) => i.item_id === b.id);
        if (saved) details.set(`${saved.item_type}-${b.id}`, {
          ...saved, title: b.title, slug: b.slug, thumbnail: b.featured_image || undefined,
        });
      });
      savedItems.forEach((item) => {
        const key = `${item.item_type}-${item.item_id}`;
        if (!details.has(key)) details.set(key, { ...item, title: "Loading..." });
      });

      setItemDetails(details);
      setLoadingDetails(false);
    }
    fetchDetails();
  }, [savedItems]);

  const getItemsByType = (type: SavedItemType | "all") => {
    const all = Array.from(itemDetails.values());
    return type === "all" ? all : all.filter((item) => item.item_type === type);
  };

  const handleItemClick = (item: SavedItemDetails) => {
    const paths: Record<string, string> = {
      job: `/app/jobs/${item.item_id}`,
      course: `/app/learning/courses/${item.slug || item.item_id}`,
      blog: `/app/learning/blog/${item.slug || item.item_id}`,
    };
    if (paths[item.item_type]) navigate(paths[item.item_type]);
  };

  const handleRemove = async (item: SavedItemDetails, e: React.MouseEvent) => {
    e.stopPropagation();
    await toggleSave(item.item_id, item.item_type);
  };

  const renderItem = (item: SavedItemDetails) => {
    const Icon = TYPE_ICONS[item.item_type] ?? Bookmark;
    const colorClass = TYPE_COLORS[item.item_type] ?? "bg-muted text-foreground";

    return (
      <Card
        key={`${item.item_type}-${item.item_id}`}
        className="cursor-pointer hover:border-primary/40 transition-all"
        onClick={() => handleItemClick(item)}
      >
        <CardContent className="p-3 flex gap-3 items-center">
          <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0", colorClass)}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-semibold text-sm truncate">{item.title}</h3>
              <Badge variant="outline" className="text-[10px] capitalize">{item.item_type}</Badge>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
              {item.company && (
                <span className="flex items-center gap-1 truncate">
                  <Building2 className="h-3 w-3" /> {item.company}
                </span>
              )}
              {item.location && (
                <span className="flex items-center gap-1 truncate">
                  <MapPin className="h-3 w-3" /> {item.location}
                </span>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={(e) => handleRemove(item, e)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-4 pb-28 space-y-4">
      <header className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">Saved</h1>
          <p className="text-sm text-muted-foreground">{savedItems.length} {savedItems.length === 1 ? "item" : "items"} saved</p>
        </div>
      </header>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-4 h-10">
          <TabsTrigger value="all" className="text-xs">All ({getSavedCount()})</TabsTrigger>
          <TabsTrigger value="job" className="text-xs">Jobs ({getSavedCount("job")})</TabsTrigger>
          <TabsTrigger value="course" className="text-xs">Courses ({getSavedCount("course")})</TabsTrigger>
          <TabsTrigger value="blog" className="text-xs">Articles ({getSavedCount("blog")})</TabsTrigger>
        </TabsList>

        {(["all", "job", "course", "blog"] as const).map((tab) => (
          <TabsContent key={tab} value={tab} className="mt-4">
            {isLoading || loadingDetails ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
              </div>
            ) : getItemsByType(tab as SavedItemType | "all").length === 0 ? (
              <Card className="py-12 text-center border-dashed">
                <CardContent className="space-y-3">
                  <Bookmark className="h-10 w-10 text-muted-foreground/30 mx-auto" />
                  <div>
                    <h3 className="font-semibold">Nothing saved yet</h3>
                    <p className="text-sm text-muted-foreground mt-1">Bookmark jobs, courses or articles to find them here.</p>
                  </div>
                  <Button onClick={() => navigate("/app/feed")} size="sm">Browse the feed</Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">{getItemsByType(tab as SavedItemType | "all").map(renderItem)}</div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
