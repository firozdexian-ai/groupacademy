import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Clock, BookOpen, PlayCircle, Award, CheckCircle2, Lock, Share2, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// FIX: Exporting as a default function to resolve TS1192 and TS2322
export default function AppCourseDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const {
    data: course,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["app-course-detail", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("content")
        .select(
          `
          *,
          profession_track:profession_line_id (
            id,
            name,
            slug
          ),
          modules:course_modules (
            id,
            title,
            description,
            display_order,
            estimated_time_minutes
          )
        `,
        )
        .eq("slug", slug)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error("Course not found");
      return data;
    },
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        <Skeleton className="h-10 w-1/4 rounded-xl" />
        <Skeleton className="h-[300px] w-full rounded-[32px]" />
        <div className="space-y-4">
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="flex flex-col items-center justify-center h-[60dvh] text-center p-6">
        <div className="h-16 w-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
          <Lock className="h-8 w-8 text-destructive" />
        </div>
        <h2 className="text-xl font-black tracking-tight">Access Restricted</h2>
        <p className="text-sm text-muted-foreground mt-2 max-w-xs">
          This course module is currently unavailable or has been moved.
        </p>
        <Button
          variant="outline"
          className="mt-6 rounded-xl font-black uppercase tracking-widest"
          onClick={() => navigate("/app/learning")}
        >
          Return to Hub
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-700">
      {/* Navigation Header */}
      <header className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="rounded-full h-10 pl-2 pr-4 font-bold text-xs uppercase tracking-widest hover:bg-primary/5"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" className="rounded-full h-10 w-10">
            <Bookmark className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full h-10 w-10">
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <div className="grid lg:grid-cols-[1fr,350px] gap-8">
        {/* Primary Content */}
        <div className="space-y-8">
          {/* Hero Section */}
          <section className="space-y-6">
            <div className="aspect-video relative rounded-[32px] overflow-hidden shadow-2xl border border-border/40 bg-muted">
              {course.cover_image_url ? (
                <img src={course.cover_image_url} alt={course.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-transparent">
                  <PlayCircle className="h-20 w-20 text-primary/20" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-all flex items-center justify-center">
                <Button className="h-16 w-16 rounded-full shadow-2xl shadow-primary/40 hover:scale-110 transition-transform">
                  <PlayCircle className="h-8 w-8" />
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-primary/10 text-primary border-none text-[9px] font-black uppercase tracking-widest">
                  {course.content_type?.replace(/_/g, " ") || "Certification"}
                </Badge>
                {course.profession_track && (
                  <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest border-border/60">
                    <BookOpen className="h-3 w-3 mr-1.5" /> {course.profession_track.name}
                  </Badge>
                )}
              </div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tighter leading-tight">{course.title}</h1>
              <p className="text-muted-foreground leading-relaxed font-medium">{course.description}</p>
            </div>
          </section>

          {/* Curriculum Section */}
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center">
                <BookOpen className="h-4 w-4 text-primary" />
              </div>
              <h2 className="text-lg font-black uppercase tracking-widest">Course Curriculum</h2>
            </div>

            <div className="space-y-3">
              {course.modules
                ?.sort((a: any, b: any) => a.display_order - b.display_order)
                .map((module: any, idx: number) => (
                  <div
                    key={module.id}
                    className="group flex items-center gap-4 p-4 rounded-2xl border border-border/40 bg-card/50 hover:bg-primary/[0.02] hover:border-primary/20 transition-all cursor-pointer"
                  >
                    <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center text-xs font-black text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold truncate">{module.title}</h4>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight mt-0.5">
                        {module.estimated_time_minutes || 15} Minutes • Video Lecture
                      </p>
                    </div>
                    <CheckCircle2 className="h-5 w-5 text-muted-foreground/20 group-hover:text-emerald-500 transition-colors" />
                  </div>
                ))}
            </div>
          </section>
        </div>

        {/* Sidebar Actions */}
        <aside className="space-y-6">
          <Card className="rounded-[32px] border-primary/10 shadow-xl overflow-hidden sticky top-24">
            <CardContent className="p-6 space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                  <span>Platform Rank</span>
                  <span className="text-primary">Advanced</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black tracking-tighter">Professional</span>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center gap-3 text-xs font-bold">
                  <Clock className="h-4 w-4 text-primary" />
                  <span>~12 Hours Total Duration</span>
                </div>
                <div className="flex items-center gap-3 text-xs font-bold">
                  <Award className="h-4 w-4 text-primary" />
                  <span>Verified Digital Certificate</span>
                </div>
                <div className="flex items-center gap-3 text-xs font-bold">
                  <BookOpen className="h-4 w-4 text-primary" />
                  <span>{course.modules?.length || 0} Learning Modules</span>
                </div>
              </div>

              <Button
                className="w-full h-14 rounded-2xl font-black uppercase tracking-[0.15em] shadow-lg shadow-primary/20 text-sm"
                onClick={() => navigate(`/app/learn/${course.slug}`)}
              >
                Enroll Now
              </Button>

              <p className="text-[10px] text-center font-bold text-muted-foreground uppercase tracking-widest">
                Start learning in 30 seconds
              </p>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
