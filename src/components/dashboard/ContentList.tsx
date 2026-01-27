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
  Edit,
  Trash2,
  Video,
  BookOpen,
  Presentation,
  Users,
  MapPin,
  RefreshCw,
  AlertCircle,
  Search,
  ChevronLeft,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { withTimeout } from "@/hooks/useQueryWithTimeout";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import { CardGridSkeleton } from "@/components/ui/page-loading-skeleton";
import { useNavigate } from "react-router-dom";

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

const ITEMS_PER_PAGE = 9; // Grid layout usually looks better with 9 or 12

const ContentList = ({ filter }: ContentListProps) => {
  const navigate = useNavigate();

  // Data State
  const [content, setContent] = useState<Content[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Pagination & Search
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 500);

  // Delete Dialog State
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Fetch Data (Paginated)
  const loadContent = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      let query = supabase.from("content").select("*", { count: "exact" }).order("created_at", { ascending: false });

      // Apply Type Filter
      if (filter) {
        query = query.eq("content_type", filter);
      }

      // Apply Search
      if (debouncedSearch) {
        query = query.or(
          `title.ilike.%${debouncedSearch}%,description.ilike.%${debouncedSearch}%,instructor_name.ilike.%${debouncedSearch}%`,
        );
      }

      // Apply Pagination
      const from = (page - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      query = query.range(from, to);

      const result = await withTimeout(Promise.resolve(query), TIMEOUTS.DEFAULT, "Loading content timed out");

      if (result.error) throw result.error;
      setContent(result.data || []);
      setTotalCount(result.count || 0);
    } catch (error: any) {
      console.error("Error loading content:", error);
      setLoadError(error.message || "Failed to load content. Please try again.");
      toast.error("Failed to load content");
    } finally {
      setIsLoading(false);
    }
  }, [page, filter, debouncedSearch]);

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  // Reset page on filter/search change
  useEffect(() => {
    setPage(1);
  }, [filter, debouncedSearch]);

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      const { error } = await withTimeout(
        Promise.resolve(supabase.from("content").delete().eq("id", deleteId)),
        TIMEOUTS.DEFAULT,
        "Delete timed out",
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
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="flex justify-between items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <p className="text-sm text-muted-foreground hidden sm:block">Total: {totalCount}</p>
      </div>

      {content.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No content found. Create your first content to get started!</p>
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
                  <CardContent className="space-y-4 flex-1 flex flex-col justify-end">
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
                        <span className="font-medium">
                          {item.current_enrollment}/{item.max_capacity}
                        </span>
                      </div>
                    )}

                    {item.event_date && (
                      <div className="text-sm text-muted-foreground">
                        {new Date(item.event_date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    )}

                    <div className="flex gap-2 pt-2 mt-auto">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => navigate(`/content/${item.id}/edit`)}
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
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

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-end space-x-2 py-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-2" /> Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
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
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ContentList;
