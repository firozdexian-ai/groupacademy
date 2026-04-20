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
  Video,
  Building2,
  MapPin,
  ArrowRight,
  Trash2,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Platform Logic: Resource Archive Registry
 * High-fidelity orchestrator for saved career artifacts and academic nodes.
 * 2026 Standard: Executive Logic geometry with reinforced data sync telemetry.
 */

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
  event: Zap,
};

const TYPE_COLORS: Record<SavedItemType, string> = {
  job: "bg-primary/10 text-primary border-primary/20",
  course: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  blog: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  video: "bg-rose-500/10 text-rose-500 border-rose-500/20",
  event: "bg-amber-500/10 text-amber-500 border-amber-500/20",
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

      const jobIds = savedItems.filter((i) => i.item_type === "job").map((i) => i.item_id);
      const courseIds = savedItems.filter((i) => i.item_type === "course").map((i) => i.item_id);
      const blogIds = savedItems.filter((i) => i.item_type === "blog").map((i) => i.item_id);

      const [jobsResult, coursesResult, blogsResult] = await Promise.all([
        jobIds.length > 0
          ? supabase.from("jobs").select("id, title, company_name, location").in("id", jobIds)
          : Promise.resolve({ data: [] }),
        courseIds.length > 0
          ? supabase.from("content").select("id, title, slug, thumbnail_url").in("id", courseIds)
          : Promise.resolve({ data: [] }),
        blogIds.length > 0
          ? supabase.from("blog_posts").select("id, title, slug, featured_image").in("id", blogIds)
          : Promise.resolve({ data: [] }),
      ]);

      jobsResult.data?.forEach((job) => {
        const saved = savedItems.find((i) => i.item_id === job.id);
        if (saved)
          details.set(`${saved.item_type}-${job.id}`, {
            ...saved,
            title: job.title,
            company: job.company_name,
            location: job.location || undefined,
          });
      });

      coursesResult.data?.forEach((course) => {
        const saved = savedItems.find((i) => i.item_id === course.id);
        if (saved)
          details.set(`${saved.item_type}-${course.id}`, {
            ...saved,
            title: course.title,
            slug: course.slug,
            thumbnail: course.thumbnail_url || undefined,
          });
      });

      blogsResult.data?.forEach((blog) => {
        const saved = savedItems.find((i) => i.item_id === blog.id);
        if (saved)
          details.set(`${saved.item_type}-${blog.id}`, {
            ...saved,
            title: blog.title,
            slug: blog.slug,
            thumbnail: blog.featured_image || undefined,
          });
      });

      savedItems.forEach((item) => {
        const key = `${item.item_type}-${item.item_id}`;
        if (!details.has(key)) details.set(key, { ...item, title: "Syncing Artifact..." });
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
    const Icon = TYPE_ICONS[item.item_type];
    const colorClass = TYPE_COLORS[item.item_type];

    return (
      <Card
        key={`${item.item_type}-${item.item_id}`}
        className="group cursor-pointer rounded-[24px] border-2 border-border/40 bg-card/30 backdrop-blur-sm transition-all duration-500 hover:border-primary/40 hover:shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4"
        onClick={() => handleItemClick(item)}
      >
        <CardContent className="p-5">
          <div className="flex gap-5 items-center">
            <div
              className={cn(
                "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border-2 transition-transform duration-500 group-hover:rotate-6 shadow-inner",
                colorClass,
              )}
            >
              <Icon className="w-7 h-7" />
            </div>

            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center justify-between gap-4">
                <h3 className="font-black uppercase tracking-tight text-base italic leading-none group-hover:text-primary transition-colors truncate">
                  {item.title}
                </h3>
                <Badge
                  variant="outline"
                  className="rounded-lg border-primary/20 text-primary font-black uppercase text-[8px] tracking-widest px-2 h-5"
                >
                  {item.item_type}
                </Badge>
              </div>

              <div className="flex items-center gap-4 text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest italic">
                {item.company && (
                  <span className="flex items-center gap-1.5 truncate">
                    <Building2 className="h-3 w-3" /> {item.company}
                  </span>
                )}
                {item.location && (
                  <span className="flex items-center gap-1.5 truncate">
                    <MapPin className="h-3 w-3" /> {item.location}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-xl text-muted-foreground/40 hover:text-destructive hover:bg-destructive/5 transition-all"
                onClick={(e) => handleRemove(item, e)}
              >
                <Trash2 className="h-5 w-5" />
              </Button>
              <div className="h-10 w-10 rounded-full bg-muted/50 flex items-center justify-center transition-all group-hover:bg-primary group-hover:text-white">
                <ArrowRight className="h-5 w-5" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 pb-40 space-y-10 animate-in fade-in duration-1000">
      {/* Executive Header: Archive Handshake */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex items-center gap-5">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl h-12 w-12 hover:bg-primary/10 transition-all active:scale-90"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-6 w-6 text-primary" />
          </Button>
          <div className="space-y-1">
            <h1 className="text-4xl font-black uppercase tracking-tighter italic leading-none">Archive Registry</h1>
            <div className="flex items-center gap-3">
              <Badge className="bg-primary/5 text-primary border-primary/20 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest italic">
                Saved Telemetry Node
              </Badge>
              <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 italic">
                {savedItems.length} ARTIFACTS SYNC'D
              </p>
            </div>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-4 bg-primary/5 px-6 py-3 rounded-2xl border border-primary/10">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <div className="space-y-0.5">
            <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Registry Status</p>
            <p className="text-xs font-black uppercase text-primary tracking-tighter">Verified & Secure</p>
          </div>
        </div>
      </header>

      {/* Logic Filter HUD */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-4 p-1.5 h-16 bg-muted/30 backdrop-blur-md rounded-[32px] border border-border/40 max-w-2xl">
          {[
            { id: "all", label: "Global" },
            { id: "job", label: "Jobs" },
            { id: "course", label: "Academy" },
            { id: "blog", label: "Intel" },
          ].map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="rounded-[24px] font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-lg transition-all"
            >
              {tab.label} ({getSavedCount(tab.id === "all" ? undefined : (tab.id as SavedItemType))})
            </TabsTrigger>
          ))}
        </TabsList>

        {["all", "job", "course", "blog"].map((tab) => (
          <TabsContent
            key={tab}
            value={tab}
            className="mt-10 outline-none animate-in slide-in-from-bottom-4 duration-700"
          >
            {isLoading || loadingDetails ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-24 w-full rounded-[32px] bg-muted/40" />
                ))}
              </div>
            ) : getItemsByType(tab as SavedItemType | "all").length === 0 ? (
              <Card className="rounded-[48px] border-2 border-dashed border-border/40 bg-muted/5 py-32 text-center">
                <CardContent className="space-y-8">
                  <div className="h-24 w-24 rounded-[40px] bg-muted/10 flex items-center justify-center rotate-6 border-2 border-dashed border-border/60 mx-auto">
                    <Bookmark className="h-12 w-12 text-muted-foreground/20" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-3xl font-black uppercase tracking-tighter italic">Archive Node Empty</h3>
                    <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-[0.3em] max-w-xs mx-auto leading-relaxed">
                      No tactical career artifacts found in this logic path. Bookmark items to initialize sync.
                    </p>
                  </div>
                  <Button
                    onClick={() => navigate("/app/feed")}
                    className="rounded-xl h-12 px-10 font-black uppercase text-[10px] tracking-widest shadow-2xl shadow-primary/30 transition-transform hover:scale-105"
                  >
                    Initialize Discovery Phase
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">{getItemsByType(tab as SavedItemType | "all").map(renderItem)}</div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Operational Trace Footer */}
      <footer className="mt-20 pt-10 border-t border-border/40 flex items-center justify-between opacity-30">
        <div className="space-y-1">
          <p className="text-[9px] font-black uppercase tracking-[0.4em] italic">
            Archive Registry: Verified Synchronization Active
          </p>
          <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest italic">
            Node: Global Saved Items v2.6.4
          </p>
        </div>
        <div className="flex gap-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-1 w-8 rounded-full bg-primary/20" />
          ))}
        </div>
      </footer>
    </div>
  );
}
