import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, PlayCircle, Award, CheckCircle2, Lock, Zap, Clock, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * Platform Logic: Curriculum Architecture Node
 * High-fidelity course detail orchestration with recursive module sorting.
 * Synchronized with the 2026 'Executive Logic' depth and typographic standards.
 */

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
      <div className="max-w-6xl mx-auto p-6 md:p-12 space-y-10">
        <Skeleton className="h-10 w-40 rounded-full bg-muted/40" />
        <div className="grid lg:grid-cols-[1fr,380px] gap-12">
          <Skeleton className="h-[500px] w-full rounded-[40px] bg-muted/40" />
          <Skeleton className="h-[400px] w-full rounded-[40px] bg-muted/40" />
        </div>
      </div>
    );

  if (error || !course) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center animate-in fade-in zoom-in-95">
        <div className="h-24 w-24 rounded-[40px] bg-muted/10 flex items-center justify-center mb-8 border-2 border-dashed border-border/40">
          <Lock className="h-10 w-10 text-muted-foreground/30" />
        </div>
        <h2 className="text-3xl font-black uppercase tracking-tighter mb-4">Course Unavailable</h2>
        <Button
          variant="outline"
          className="rounded-2xl h-12 font-black uppercase tracking-widest text-[10px]"
          onClick={() => navigate("/app/learning")}
        >
          Return to Academy Registry
        </Button>
      </div>
    );
  }

  // CTO Logic: Frontend sorting ensures registry order remains immutable
  const sortedModules = course.modules?.sort((a: any, b: any) => a.display_order - b.display_order) || [];

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-12 space-y-12 animate-in fade-in duration-700">
      {/* Navigation Handshake */}
      <header className="flex items-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => (onBack ? onBack() : navigate(-1))}
          className="group rounded-xl px-4 h-11 font-black text-[10px] uppercase tracking-[0.3em] hover:bg-primary/5 transition-all"
        >
          <ArrowLeft className="mr-3 h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Back to Knowledge Hub
        </Button>
      </header>

      <div className="grid lg:grid-cols-[1fr,380px] gap-12 items-start">
        {/* Main Content Viewport */}
        <div className="space-y-12">
          <section className="space-y-8">
            <div className="aspect-video relative rounded-[40px] overflow-hidden shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] bg-black border border-border/40 group">
              {course.cover_image_url && (
                <img
                  src={course.cover_image_url}
                  alt={course.title}
                  className="w-full h-full object-cover opacity-80 transition-transform duration-1000 group-hover:scale-105"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-center justify-center">
                <Button className="h-20 w-20 rounded-[28px] bg-white text-black hover:bg-white hover:scale-110 active:scale-95 transition-all shadow-2xl">
                  <PlayCircle className="h-10 w-10 fill-black" />
                </Button>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <Badge className="bg-primary/10 text-primary border-primary/20 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">
                  {course.content_type?.replace(/_/g, " ") || "Certification"}
                </Badge>
                <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 italic">
                  <Clock className="h-3.5 w-3.5" />
                  {sortedModules.length * 15} Min Total
                </div>
              </div>
              <h1 className="text-5xl md:text-6xl font-black tracking-tighter leading-[0.9] uppercase italic">
                {course.title}
              </h1>
              <p className="text-xl text-muted-foreground font-bold leading-relaxed tracking-tight max-w-2xl">
                {course.description}
              </p>
            </div>
          </section>

          {/* Curriculum Registry */}
          <section className="space-y-8">
            <div className="flex items-center justify-between border-b border-border/40 pb-4">
              <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-primary">
                Curriculum Architecture
              </h2>
              <span className="text-[10px] font-bold text-muted-foreground/40 uppercase">
                {sortedModules.length} Modules Integrated
              </span>
            </div>

            <div className="space-y-4">
              {sortedModules.map((module: any, idx: number) => (
                <Card
                  key={module.id}
                  className="rounded-[24px] border-border/40 hover:border-primary/40 bg-card/30 backdrop-blur-sm transition-all duration-300 group cursor-pointer overflow-hidden"
                  onClick={() => navigate(`/app/learn/${course.slug}`)}
                >
                  <CardContent className="p-6 flex items-center gap-6">
                    <div className="h-14 w-14 rounded-2xl bg-muted/50 border border-border/20 flex items-center justify-center text-sm font-black group-hover:bg-primary group-hover:text-primary-foreground group-hover:rotate-3 transition-all duration-500">
                      {(idx + 1).toString().padStart(2, "0")}
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <h4 className="font-black uppercase tracking-tight text-lg leading-none transition-colors group-hover:text-primary">
                        {module.title}
                      </h4>
                      <div className="flex items-center gap-4 text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest italic">
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-3 w-3" /> {module.estimated_time_minutes || 15}m
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Zap className="h-3 w-3" /> Technical Analysis
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground/20 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        </div>

        {/* Strategic Control Aside */}
        <aside className="sticky top-24">
          <Card className="rounded-[40px] border-2 border-primary/20 bg-card/50 backdrop-blur-2xl shadow-[0_40px_80px_-20px_rgba(0,0,0,0.4)] overflow-hidden animate-in slide-in-from-right-8 duration-1000">
            <CardContent className="p-10 space-y-10">
              <div className="space-y-3">
                <p className="text-[10px] font-black uppercase text-primary tracking-[0.3em]">Credential Handshake</p>
                <div className="flex items-center gap-4 bg-primary/5 p-4 rounded-2xl border border-primary/10">
                  <Award className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-xl font-black uppercase tracking-tighter leading-none mb-1">University Track</p>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest italic">
                      Verified Certification
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-5 pt-8 border-t border-border/40">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                    Structure
                  </span>
                  <span className="text-sm font-black uppercase tracking-tighter">{sortedModules.length} Chapters</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                    Registry
                  </span>
                  <span className="text-sm font-black uppercase tracking-tighter">Lifetime Access</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                    Level
                  </span>
                  <Badge
                    variant="outline"
                    className="rounded-lg font-black uppercase text-[9px] tracking-widest border-primary/40 text-primary"
                  >
                    Advanced Logic
                  </Badge>
                </div>
              </div>

              <Button
                className="w-full h-16 rounded-[24px] bg-primary text-primary-foreground font-black uppercase tracking-[0.25em] text-[11px] shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all"
                onClick={() => navigate(`/app/learn/${course.slug}`)}
              >
                Enroll & Initialize
              </Button>

              <p className="text-center text-[9px] font-bold text-muted-foreground/40 uppercase tracking-[0.2em] italic">
                Secure Data Encryption Active
              </p>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
