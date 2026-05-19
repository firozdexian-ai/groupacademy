import { useEffect, useState } from "react";
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
import { toast } from "sonner";

// Production Type Definitions[cite: 8]
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

  // Digital Workforce Anomaly Reporting[cite: 6]
  const reportAnomaly = async (event: string, context: any) => {
    console.error(`[Digital Workforce Anomaly] ${event}`, context);
    await supabase.functions.invoke("admin-support-assistant", {
      body: { type: "saved_items_sync_error", event, context },
    });
  };

  useEffect(() => {
    async function fetchDetails() {
      if (savedItems.length === 0) {
        setItemDetails(new Map());
        setLoadingDetails(false);
        return;
      }
      setLoadingDetails(true);
      const details = new Map<string, SavedItemDetails>();

      try {
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
          if (saved)
            details.set(`${saved.item_type}-${job.id}`, {
              ...saved,
              title: job.title,
              company: job.company_name,
              location: job.location || undefined,
            });
        });

        coursesResult.data?.forEach((c: any) => {
          const saved = savedItems.find((i) => i.item_id === c.id);
          if (saved)
            details.set(`${saved.item_type}-${c.id}`, {
              ...saved,
              title: c.title,
              slug: c.slug,
              thumbnail: c.thumbnail_url || undefined,
            });
        });

        blogsResult.data?.forEach((b: any) => {
          const saved = savedItems.find((i) => i.item_id === b.id);
          if (saved)
            details.set(`${saved.item_type}-${b.id}`, {
              ...saved,
              title: b.title,
              slug: b.slug,
              thumbnail: b.featured_image || undefined,
            });
        });
      } catch (e) {
        await reportAnomaly("SavedItemSyncFailure", { error: e });
      } finally {
        setLoadingDetails(false);
      }
    }
    fetchDetails();
  }, [savedItems]);

  const getItemsByType = (type: SavedItemType | "all") => {
    const all = Array.from(itemDetails.values());
    return type === "all" ? all : all.filter((item) => item.item_type === type);
  };

  const handleRemove = async (item: SavedItemDetails, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await toggleSave(item.item_id, item.item_type);
    } catch (e) {
      await reportAnomaly("SavedItemToggleFailure", { id: item.item_id, error: e });
      toast.error("Sync failed.");
    }
  };

  const renderItem = (item: SavedItemDetails) => {
    const Icon = TYPE_ICONS[item.item_type] ?? Bookmark;
    const colorClass = TYPE_COLORS[item.item_type] ?? "bg-muted text-foreground";

    return (
      <Card
        key={`${item.item_type}-${item.item_id}`}
        className="cursor-pointer hover:border-primary/40 transition-all rounded-[28px] border-2 border-border/40"
        onClick={() => {
          const paths: Record<string, string> = {
            job: `/app/jobs/${item.item_id}`,
            course: `/app/learning/courses/${item.slug || item.item_id}`,
            blog: `/app/learning/blog/${item.slug || item.item_id}`,
          };
          if (paths[item.item_type]) navigate(paths[item.item_type]);
        }}
      >
        <CardContent className="p-4 flex gap-4 items-center">
          <div
            className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-inner", colorClass)}
          >
            <Icon className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-black text-sm uppercase italic tracking-tighter truncate">
              {item.title || "Processing..."}
            </h3>
            <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">
              {item.company && (
                <span className="flex items-center gap-1">
                  <Building2 className="h-3 w-3" /> {item.company}
                </span>
              )}
              {item.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {item.location}
                </span>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 text-muted-foreground hover:text-destructive"
            onClick={(e) => handleRemove(item, e)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-10 pb-40 space-y-8 animate-in fade-in duration-700">
      <header className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="h-11 w-11 rounded-xl" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter italic">Signal Registry</h1>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            {savedItems.length} {savedItems.length === 1 ? "node" : "nodes"} anchored
          </p>
        </div>
      </header>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-4 h-14 bg-muted/30 rounded-2xl p-1.5">
          <TabsTrigger value="all" className="font-black uppercase text-[9px] tracking-widest rounded-xl">
            All
          </TabsTrigger>
          <TabsTrigger value="job" className="font-black uppercase text-[9px] tracking-widest rounded-xl">
            Jobs
          </TabsTrigger>
          <TabsTrigger value="course" className="font-black uppercase text-[9px] tracking-widest rounded-xl">
            Courses
          </TabsTrigger>
          <TabsTrigger value="blog" className="font-black uppercase text-[9px] tracking-widest rounded-xl">
            Articles
          </TabsTrigger>
        </TabsList>

        {(["all", "job", "course", "blog"] as const).map((tab) => (
          <TabsContent key={tab} value={tab} className="mt-6 space-y-4">
            {isLoading || loadingDetails ? (
              [1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full rounded-[28px]" />)
            ) : getItemsByType(tab as SavedItemType | "all").length === 0 ? (
              <Card className="py-20 text-center border-dashed border-2 rounded-[32px]">
                <Bookmark className="h-12 w-12 text-muted-foreground/20 mx-auto mb-6" />
                <h3 className="font-black uppercase italic tracking-tighter text-lg">Registry Empty</h3>
                <p className="text-xs text-muted-foreground mt-2 italic">No logic nodes anchored.</p>
                <Button className="mt-6 rounded-xl" onClick={() => navigate("/app/feed")}>
                  Sync Feed
                </Button>
              </Card>
            ) : (
              <div className="space-y-4">{getItemsByType(tab as SavedItemType | "all").map(renderItem)}</div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
