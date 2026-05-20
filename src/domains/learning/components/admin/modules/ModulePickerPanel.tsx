import { useEffect, useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Layers, Search, ChevronRight, BookOpen } from "lucide-react";
import ModuleManagement from "@/pages/ModuleManagement";

/**
 * Dashboard "Modules" tab.
 * If a contentId is in the URL (?id=…), embed the existing ModuleManagement.
 * Otherwise show a course picker so admins can pick which course's modules to manage.
 */
interface CourseRow {
  id: string;
  title: string;
  content_type: string;
  thumbnail_url: string | null;
  is_published: boolean | null;
}

interface ModulePickerPanelProps {
  contentId?: string | null;
  onClose?: () => void;
}

export default function ModulePickerPanel({ contentId: contentIdProp, onClose }: ModulePickerPanelProps = {}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const contentId = contentIdProp ?? searchParams.get("id");

  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (contentId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("content")
        .select("id, title, content_type, thumbnail_url, is_published")
        .in("content_type", ["recorded_course", "live_webinar"])
        .order("created_at", { ascending: false })
        .limit(200);
      if (!cancelled) {
        if (!error) setCourses((data as any) ?? []);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [contentId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return courses;
    return courses.filter((c) => c.title?.toLowerCase().includes(q));
  }, [courses, search]);

  if (contentId) {
    return (
      <ModuleManagement
        contentId={contentId}
        onBack={() => {
          if (onClose) {
            onClose();
            return;
          }
          const next = new URLSearchParams(searchParams);
          next.delete("id");
          setSearchParams(next, { replace: true });
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Layers className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-black tracking-tight">Course Modules</h2>
          <p className="text-xs text-muted-foreground">
            Pick a course to manage its module curriculum and learning resources.
          </p>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search courses by title…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-10 rounded-xl"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <BookOpen className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">
            {courses.length === 0
              ? "No courses found. Create a course first."
              : "No courses match your search."}
          </p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => navigate("/content/new")}>
            Create a course
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                const next = new URLSearchParams(searchParams);
                next.set("id", c.id);
                setSearchParams(next, { replace: false });
              }}
              className="group text-left flex items-center gap-3 p-4 rounded-2xl border bg-card hover:border-primary/40 hover:shadow-md transition-all"
            >
              {c.thumbnail_url ? (
                <img src={c.thumbnail_url} alt="" className="h-14 w-14 rounded-xl object-cover" />
              ) : (
                <div className="h-14 w-14 rounded-xl bg-muted flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate">{c.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-[9px]">
                    {c.content_type === "recorded_course" ? "Course" : "Webinar"}
                  </Badge>
                  {c.is_published ? (
                    <Badge className="text-[9px] bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                      Published
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[9px]">Draft</Badge>
                  )}
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
