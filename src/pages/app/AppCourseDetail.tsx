import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Clock, BookOpen, PlayCircle, Award, CheckCircle2, Lock, Share2, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
// FIX: Added missing UI imports
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// FIX: Added interface to accept props from LearningHub
interface AppCourseDetailProps {
  inlineSlug?: string;
  onBack?: () => void;
}

export default function AppCourseDetail({ inlineSlug, onBack }: AppCourseDetailProps) {
  const { slug: urlSlug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  // Use the prop slug if provided (for inline view), otherwise use URL param
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
      <div className="p-8">
        <Skeleton className="h-[400px] w-full rounded-[32px]" />
      </div>
    );

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-700">
      <header className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => (onBack ? onBack() : navigate(-1))}
          className="rounded-full font-bold text-xs uppercase tracking-widest"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
      </header>

      <div className="grid lg:grid-cols-[1fr,350px] gap-8">
        <div className="space-y-8">
          <section className="space-y-6">
            <div className="aspect-video relative rounded-[32px] overflow-hidden shadow-2xl bg-muted">
              {course?.cover_image_url && <img src={course.cover_image_url} className="w-full h-full object-cover" />}
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                <Button className="h-16 w-16 rounded-full">
                  <PlayCircle className="h-8 w-8" />
                </Button>
              </div>
            </div>
            <h1 className="text-3xl font-black tracking-tighter">{course?.title}</h1>
            <p className="text-muted-foreground">{course?.description}</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-sm font-black uppercase tracking-widest">Curriculum</h2>
            {course?.modules?.map((module: any, idx: number) => (
              <Card key={module.id} className="rounded-2xl border-border/40 hover:border-primary/20 transition-all">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-xs font-bold">
                    {idx + 1}
                  </div>
                  <div className="flex-1 font-bold text-sm">{module.title}</div>
                  <CheckCircle2 className="h-5 w-5 text-muted-foreground/20" />
                </CardContent>
              </Card>
            ))}
          </section>
        </div>

        <aside>
          <Card className="rounded-[32px] sticky top-24">
            <CardContent className="p-6 space-y-6">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Certification</p>
                <p className="text-xl font-black tracking-tight">Professional Track</p>
              </div>
              <Button
                className="w-full h-12 rounded-2xl font-black uppercase tracking-widest"
                onClick={() => navigate(`/app/learn/${course?.slug}`)}
              >
                Enroll Now
              </Button>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
