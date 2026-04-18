import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Clock, BookOpen, PlayCircle, Award, CheckCircle2, Lock, Share2, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface AppCourseDetailProps {
  inlineSlug?: string;
  onBack?: () => void;
}

export default function AppCourseDetail({ inlineSlug, onBack }: AppCourseDetailProps) {
  const { slug: urlSlug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const activeSlug = inlineSlug || urlSlug;

  const {
    data: course,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["app-course-detail", activeSlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("content")
        .select(
          `
          *,
          profession_track:profession_line_id (id, name, slug),
          modules:course_modules (id, title, description, display_order, estimated_time_minutes)
        `,
        )
        .eq("slug", activeSlug)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error("Course not found");
      return data;
    },
    enabled: !!activeSlug,
  });

  if (isLoading)
    return (
      <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-8">
        <Skeleton className="h-10 w-32 rounded-full" />
        <Skeleton className="h-[400px] w-full rounded-[32px]" />
      </div>
    );

  if (error || !course) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Lock className="h-12 w-12 text-muted-foreground/20 mb-4" />
        <h2 className="text-xl font-black">Course Unavailable</h2>
        <Button variant="link" onClick={() => navigate("/app/learning")}>
          Return to Academy
        </Button>
      </div>
    );
  }

  // CTO TIP: Always sort your curriculum items in the frontend to prevent DB indexing surprises
  const sortedModules = course.modules?.sort((a: any, b: any) => a.display_order - b.display_order) || [];

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-700">
      <header className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => (onBack ? onBack() : navigate(-1))}
          className="rounded-full font-black text-[10px] uppercase tracking-[0.2em] hover:bg-primary/5"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Hub
        </Button>
      </header>

      <div className="grid lg:grid-cols-[1fr,350px] gap-8">
        <div className="space-y-10">
          <section className="space-y-6">
            <div className="aspect-video relative rounded-[32px] overflow-hidden shadow-2xl bg-muted border border-border/40">
              {course.cover_image_url && (
                <img src={course.cover_image_url} alt={course.title} className="w-full h-full object-cover" />
              )}
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                <Button className="h-16 w-16 rounded-full shadow-2xl hover:scale-110 transition-transform">
                  <PlayCircle className="h-8 w-8" />
                </Button>
              </div>
            </div>
            <div className="space-y-3">
              <Badge className="bg-primary/10 text-primary border-none text-[9px] font-black uppercase tracking-widest">
                {course.content_type?.replace(/_/g, " ") || "Certification"}
              </Badge>
              <h1 className="text-4xl font-black tracking-tighter leading-tight">{course.title}</h1>
              <p className="text-lg text-muted-foreground font-medium leading-relaxed">{course.description}</p>
            </div>
          </section>

          <section className="space-y-6">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
              Curriculum Architecture
            </h2>
            <div className="space-y-3">
              {sortedModules.map((module: any, idx: number) => (
                <Card
                  key={module.id}
                  className="rounded-2xl border-border/40 hover:border-primary/20 bg-card/50 transition-all group"
                >
                  <CardContent className="p-5 flex items-center gap-5">
                    <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center text-xs font-black group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                      {idx + 1}
                    </div>
                    <div className="flex-1 space-y-1">
                      <h4 className="font-bold text-sm leading-tight">{module.title}</h4>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">
                        Estimated: {module.estimated_time_minutes || 15} mins
                      </p>
                    </div>
                    <CheckCircle2 className="h-5 w-5 text-muted-foreground/10 group-hover:text-emerald-500 transition-colors" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <Card className="rounded-[32px] sticky top-24 border-primary/10 shadow-xl overflow-hidden">
            <CardContent className="p-8 space-y-8">
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em]">
                  Credential status
                </p>
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" />
                  <p className="text-xl font-black tracking-tight">University Track</p>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-border/40">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-muted-foreground">Modules</span>
                  <span>{sortedModules.length} Chapters</span>
                </div>
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-muted-foreground">Access</span>
                  <span>Lifetime</span>
                </div>
              </div>

              <Button
                className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                onClick={() => navigate(`/app/learn/${course.slug}`)}
              >
                Enroll & Start Now
              </Button>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
