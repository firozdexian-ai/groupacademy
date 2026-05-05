import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, PlayCircle, Award, Lock, Clock, ChevronRight, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/common/EmptyState";
import { PAGE_SHELL, PAGE_TITLE, PAGE_SUBTITLE, SECTION_TITLE, META_TEXT, CARD } from "@/lib/uiTokens";
import { WebinarEnrollPanel } from "@/components/learning/WebinarEnrollPanel";
import { useEnrollment } from "@/hooks/useEnrollment";
import { useTalent } from "@/hooks/useTalent";
import { getCourseCredits } from "@/lib/creditPricing";

interface AppCourseDetailProps {
  inlineSlug?: string;
  onBack?: () => void;
}

export default function AppCourseDetail({ inlineSlug, onBack }: AppCourseDetailProps) {
  const { slug: urlSlug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const activeSlug = inlineSlug || urlSlug;

  const { data: course, isLoading, error } = useQuery({
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
      <div className={PAGE_SHELL}>
        <Skeleton className="h-8 w-32 rounded-xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );

  if (error || !course) {
    return (
      <div className={PAGE_SHELL}>
        <EmptyState
          icon={Lock}
          title="Course unavailable"
          description="This course may be unpublished or you don't have access."
          action={{ label: "Back to Academy", onClick: () => navigate("/app/learning") }}
        />
      </div>
    );
  }

  const sortedModules = course.modules?.sort((a: any, b: any) => a.display_order - b.display_order) || [];

  return (
    <div className={PAGE_SHELL}>
      {/* Header */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => (onBack ? onBack() : navigate(-1))}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <span className={META_TEXT}>Back</span>
      </div>

      {/* Hero */}
      {course.cover_image_url && (
        <div className="aspect-video relative rounded-2xl overflow-hidden bg-muted border border-border/40">
          <img
            src={course.cover_image_url}
            alt={course.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-center justify-center">
            <Button
              size="icon"
              className="h-14 w-14 rounded-full bg-white text-black hover:bg-white/90"
              onClick={() => navigate(`/app/learn/${course.slug}`)}
            >
              <PlayCircle className="h-7 w-7" />
            </Button>
          </div>
        </div>
      )}

      {/* Title block */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="secondary" className="text-[10px] h-5">
            {course.content_type?.replace(/_/g, " ") || "Course"}
          </Badge>
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Clock className="h-3 w-3" />
            {sortedModules.length * 15} min
          </span>
        </div>
        <h1 className={PAGE_TITLE}>{course.title}</h1>
        {course.description && (
          <p className="text-sm text-muted-foreground leading-relaxed">{course.description}</p>
        )}
      </div>

      {/* Live event registration */}
      {(course.content_type === "live_webinar" || course.content_type === "batch_class") && (
        <WebinarEnrollPanel course={course as any} />
      )}

      {/* Credential card */}
      <Card className={`${CARD} bg-primary/5 border-primary/20`}>
        <CardContent className="p-3 space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Award className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold">Verified certificate</p>
              <p className="text-[11px] text-muted-foreground">Lifetime access · {sortedModules.length} chapters</p>
            </div>
          </div>
          {course.content_type !== "live_webinar" && course.content_type !== "batch_class" && (
            <RecordedEnrollCta course={course} />
          )}
        </CardContent>
      </Card>

      {/* Curriculum */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className={SECTION_TITLE}>Curriculum</h3>
          <span className={META_TEXT}>{sortedModules.length} modules</span>
        </div>

        {sortedModules.length === 0 ? (
          <EmptyState icon={BookOpen} title="No modules yet" description="Curriculum is being prepared." />
        ) : (
          <div className="space-y-2">
            {sortedModules.map((module: any, idx: number) => (
              <button
                key={module.id}
                onClick={() => navigate(`/app/learn/${course.slug}`)}
                className="w-full text-left rounded-2xl border border-border/40 bg-card hover:border-primary/40 transition-all p-3 active:scale-[0.99]"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center text-xs font-bold shrink-0">
                    {(idx + 1).toString().padStart(2, "0")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold leading-tight truncate">{module.title}</p>
                    <p className={`${META_TEXT} mt-0.5 flex items-center gap-1`}>
                      <Clock className="h-3 w-3" />
                      {module.estimated_time_minutes || 15} min
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function RecordedEnrollCta({ course }: { course: any }) {
  const navigate = useNavigate();
  const { talent } = useTalent();
  const { enrollment, enroll, isEnrolling } = useEnrollment(course.id);
  const cost = getCourseCredits(Number(course.price ?? 0), course.credit_cost ?? null);

  if (enrollment) {
    return (
      <Button className="w-full h-10 rounded-xl text-sm" onClick={() => navigate(`/app/learn/${course.slug}`)}>
        Continue learning
      </Button>
    );
  }

  const handleEnroll = async () => {
    if (!talent?.id) {
      navigate(`/auth?redirect=/app/learning/courses/${course.slug}`);
      return;
    }
    const result = await enroll();
    if (result.success) navigate(`/app/learn/${course.slug}`);
  };

  return (
    <Button className="w-full h-10 rounded-xl text-sm" onClick={handleEnroll} disabled={isEnrolling}>
      {isEnrolling ? "Enrolling..." : cost > 0 ? `Enroll · ${cost} cr` : "Enroll for free"}
    </Button>
  );
}
