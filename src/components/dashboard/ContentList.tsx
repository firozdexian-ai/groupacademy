import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Edit, Trash2, Video, BookOpen, Presentation, Users, MapPin,
  RefreshCw, AlertCircle, Search, ChevronLeft, ChevronRight, Plus,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { withTimeout } from "@/hooks/useQueryWithTimeout";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import { CardGridSkeleton } from "@/components/ui/page-loading-skeleton";
import { useNavigate } from "react-router-dom";
import ContentFilters, { type ContentFilterValues } from "./ContentFilters";
import ContentReadinessBadge, { type ModuleStats } from "./ContentReadinessBadge";

// --- Internal Hook for Debounce ---
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

interface Content {
  id: string;
  title: string;
  content_type: string;
  description: string | null;
  price: number;
  is_published: boolean;
  instructor_name: string | null;
  event_date: string | null;
  max_capacity: number | null;
  current_enrollment: number;
  profession_line_id: string | null;
  profession_level_id: string | null;
}

type ContentType = "batch_class" | "free_video" | "live_webinar" | "offline_seminar" | "recorded_course";

interface ContentListProps {
  filter?: ContentType;
}

const contentTypeConfig: Record<string, { icon: LucideIcon; label: string; color: string }> = {
  free_video: { icon: Video, label: "Free Video", color: "bg-blue-500" },
  recorded_course: { icon: BookOpen, label: "Recorded Course", color: "bg-purple-500" },
  live_webinar: { icon: Presentation, label: "Live Webinar", color: "bg-teal-500" },
  batch_class: { icon: Users, label: "Batch Class", color: "bg-emerald-500" },
  offline_seminar: { icon: MapPin, label: "Offline Seminar", color: "bg-orange-500" },
};

const ITEMS_PER_PAGE = 9;

const ContentList = ({ filter }: ContentListProps) => {
  const navigate = useNavigate();

  const [content, setContent] = useState<Content[]>([]);
  const [moduleStatsMap, setModuleStatsMap] = useState<Record<string, ModuleStats>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 500);

  const [filters, setFilters] = useState<ContentFilterValues>({
    programId: "all",
    levelId: "all",
    readiness: "all",
    sortBy: "newest",
  });

  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Fetch module stats for a set of content IDs
  const fetchModuleStats = useCallback(async (contentIds: string[]) => {
    if (contentIds.length === 0) { setModuleStatsMap({}); return; }

    const { data } = await supabase
      .from("course_modules")
      .select("content_id, description, video_url")
      .in("content_id", contentIds);

    if (!data) return;

    const map: Record<string, ModuleStats> = {};
    for (const row of data) {
      if (!map[row.content_id]) {
        map[row.content_id] = { module_count: 0, modules_with_desc: 0, modules_with_video: 0 };
      }
      map[row.content_id].module_count++;
      if (row.description && row.description.trim().length > 200) map[row.content_id].modules_with_desc++;
      if (row.video_url && row.video_url.trim().length > 0) map[row.content_id].modules_with_video++;
    }
    setModuleStatsMap(map);
  }, []);

  // Main data fetch
  const loadContent = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      // Build sort
      const sortCol = filters.sortBy === "title_asc" || filters.sortBy === "title_desc" ? "title" : "created_at";
      const sortAsc = filters.sortBy === "oldest" || filters.sortBy === "title_asc";

      let query = supabase
        .from("content")
        .select("id, title, content_type, description, price, is_published, instructor_name, event_date, max_capacity, current_enrollment, profession_line_id, profession_level_id", { count: "exact" })
        .order(sortCol, { ascending: sortAsc });

      if (filter) query = query.eq("content_type", filter);
      if (filters.programId !== "all") query = query.eq("profession_line_id", filters.programId);
      if (filters.levelId !== "all") query = query.eq("profession_level_id", filters.levelId);

      if (debouncedSearch) {
        query = query.or(
          `title.ilike.%${debouncedSearch}%,description.ilike.%${debouncedSearch}%,instructor_name.ilike.%${debouncedSearch}%`,
        );
      }

      // For readiness filter we need to fetch all matching IDs first, then filter client-side
      // But for performance, only do client-side filtering when readiness filter is active
      if (filters.readiness !== "all") {
        // Fetch all matching content IDs (no pagination yet)
        const allResult = await withTimeout(Promise.resolve(query), TIMEOUTS.DEFAULT, "Loading content timed out");
        if (allResult.error) throw allResult.error;
        const allContent = (allResult.data || []) as Content[];
        const allIds = allContent.map((c) => c.id);

        // Fetch module stats for all
        const { data: moduleData } = await supabase
          .from("course_modules")
          .select("content_id, description, video_url")
          .in("content_id", allIds.length > 0 ? allIds : ["__none__"]);

        const statsMap: Record<string, ModuleStats> = {};
        for (const row of (moduleData || [])) {
          if (!statsMap[row.content_id]) statsMap[row.content_id] = { module_count: 0, modules_with_desc: 0, modules_with_video: 0 };
          statsMap[row.content_id].module_count++;
          if (row.description?.trim() && row.description.trim().length > 200) statsMap[row.content_id].modules_with_desc++;
          if (row.video_url?.trim()) statsMap[row.content_id].modules_with_video++;
        }

        // Apply readiness filter
        const filtered = allContent.filter((c) => {
          const s = statsMap[c.id];
          switch (filters.readiness) {
            case "no_modules": return !s || s.module_count === 0;
            case "has_modules": return s && s.module_count > 0;
            case "has_descriptions": return s && s.modules_with_desc > 0;
            case "has_videos": return s && s.modules_with_video > 0;
            case "complete": return s && s.module_count > 0 && s.modules_with_desc === s.module_count && s.modules_with_video === s.module_count;
            default: return true;
          }
        });

        setTotalCount(filtered.length);
        const from = (page - 1) * ITEMS_PER_PAGE;
        const paged = filtered.slice(from, from + ITEMS_PER_PAGE);
        setContent(paged);
        // Build stats map for displayed items
        const displayMap: Record<string, ModuleStats> = {};
        for (const c of paged) { if (statsMap[c.id]) displayMap[c.id] = statsMap[c.id]; }
        setModuleStatsMap(displayMap);
      } else {
        // Normal paginated fetch
        const from = (page - 1) * ITEMS_PER_PAGE;
        query = query.range(from, from + ITEMS_PER_PAGE - 1);
        const result = await withTimeout(Promise.resolve(query), TIMEOUTS.DEFAULT, "Loading content timed out");
        if (result.error) throw result.error;
        const data = (result.data || []) as Content[];
        setContent(data);
        setTotalCount(result.count || 0);
        await fetchModuleStats(data.map((c) => c.id));
      }
    } catch (error: any) {
      console.error("Error loading content:", error);
      setLoadError(error.message || "Failed to load content. Please try again.");
      toast.error("Failed to load content");
    } finally {
      setIsLoading(false);
    }
  }, [page, filter, debouncedSearch, filters, fetchModuleStats]);

  useEffect(() => { loadContent(); }, [loadContent]);

  // Reset page on filter/search change
  useEffect(() => { setPage(1); }, [filter, debouncedSearch, filters]);

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      const { error } = await withTimeout(
        Promise.resolve(supabase.from("content").delete().eq("id", deleteId)),
        TIMEOUTS.DEFAULT, "Delete timed out",
      );
      if (error) throw error;
      toast.success("Content deleted successfully");
      loadContent();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete content");
    } finally {
      setDeleteId(null);
    }
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  if (isLoading && content.length === 0) {
    return <CardGridSkeleton count={6} columns={3} />;
  }

  if (loadError) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">{loadError}</p>
          <Button onClick={loadContent} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" /> Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search + Add */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative flex-1 max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search content..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
        </div>
        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
          <p className="text-sm text-muted-foreground">Total: {totalCount}</p>
          <Button onClick={() => navigate("/content/new")} className="gap-2">
            <Plus className="h-4 w-4" /> Add Content
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <ContentFilters values={filters} onChange={setFilters} />

      {content.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">No content found. Create your first content to get started!</p>
            <Button onClick={() => navigate("/content/new")}>
              <Plus className="mr-2 h-4 w-4" /> Create Content
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {content.map((item) => {
              const typeConfig = contentTypeConfig[item.content_type] || contentTypeConfig.free_video;
              const Icon = typeConfig.icon;

              return (
                <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow flex flex-col">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-lg ${typeConfig.color} text-white`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <Badge variant={item.is_published ? "default" : "secondary"}>
                          {item.is_published ? "Published" : "Draft"}
                        </Badge>
                      </div>
                    </div>
                    <CardTitle className="mt-2 line-clamp-2 text-lg">{item.title}</CardTitle>
                    <CardDescription className="line-clamp-2 min-h-[40px]">{item.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 flex-1 flex flex-col justify-end">
                    {/* Readiness Meter */}
                    <ContentReadinessBadge stats={moduleStatsMap[item.id]} />

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{typeConfig.label}</span>
                      {item.price > 0 && <span className="font-semibold text-primary">BDT {item.price}</span>}
                    </div>

                    {item.instructor_name && (
                      <div className="text-sm text-muted-foreground">
                        Instructor: <span className="text-foreground">{item.instructor_name}</span>
                      </div>
                    )}

                    {item.max_capacity && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Capacity: </span>
                        <span className="font-medium">{item.current_enrollment}/{item.max_capacity}</span>
                      </div>
                    )}

                    {item.event_date && (
                      <div className="text-sm text-muted-foreground">
                        {new Date(item.event_date).toLocaleDateString("en-US", {
                          month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit",
                        })}
                      </div>
                    )}

                    <div className="flex gap-2 pt-2 mt-auto">
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => navigate(`/content/${item.id}/edit`)}>
                        <Edit className="w-3 h-3 mr-1" /> Edit
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setDeleteId(item.id)}>
                        <Trash2 className="w-3 h-3 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-end space-x-2 py-4">
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                <ChevronLeft className="h-4 w-4 mr-2" /> Previous
              </Button>
              <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                Next <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the content and remove it from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ContentList;
