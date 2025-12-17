import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Video, BookOpen, Presentation, Users, MapPin, RefreshCw, AlertCircle, type LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { withTimeout } from "@/hooks/useQueryWithTimeout";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import { CardGridSkeleton } from "@/components/ui/page-loading-skeleton";

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

interface ContentListProps {
  filter?: string;
}

const contentTypeConfig: Record<string, { icon: LucideIcon; label: string; color: string }> = {
  free_video: { icon: Video, label: "Free Video", color: "bg-blue-500" },
  recorded_course: { icon: BookOpen, label: "Recorded Course", color: "bg-purple-500" },
  live_webinar: { icon: Presentation, label: "Live Webinar", color: "bg-teal-500" },
  batch_class: { icon: Users, label: "Batch Class", color: "bg-emerald-500" },
  offline_seminar: { icon: MapPin, label: "Offline Seminar", color: "bg-orange-500" },
};

const ContentList = ({ filter }: ContentListProps) => {
  const [content, setContent] = useState<Content[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    loadContent();
  }, [filter]);

  const loadContent = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      let query = supabase.from("content").select("*").order("created_at", { ascending: false });

      if (filter) {
        query = query.eq("content_type", filter as any);
      }

      const result = await withTimeout(
        Promise.resolve(query),
        TIMEOUTS.DEFAULT,
        "Loading content timed out"
      );
      if (result.error) throw result.error;
      setContent(result.data || []);
    } catch (error: any) {
      console.error("Error loading content:", error);
      setLoadError(error.message || "Failed to load content. Please try again.");
      toast.error("Failed to load content");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this content?")) return;

    try {
      const { error } = await withTimeout(
        Promise.resolve(supabase.from("content").delete().eq("id", id)),
        TIMEOUTS.DEFAULT,
        "Delete timed out"
      );

      if (error) throw error;
      toast.success("Content deleted successfully");
      loadContent();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete content");
    }
  };

  if (isLoading) {
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

  if (content.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No content found. Create your first content to get started!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {content.map((item) => {
        const typeConfig = contentTypeConfig[item.content_type] || contentTypeConfig.free_video;
        const Icon = typeConfig.icon;

        return (
          <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
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
              <CardTitle className="mt-2 line-clamp-2">{item.title}</CardTitle>
              <CardDescription className="line-clamp-2">{item.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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

              <div className="flex gap-2 pt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => window.location.href = `/content/${item.id}/edit`}
                >
                  <Edit className="w-3 h-3 mr-1" />
                  Edit
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleDelete(item.id)}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default ContentList;
