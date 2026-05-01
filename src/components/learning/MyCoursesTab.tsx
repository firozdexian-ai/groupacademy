import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { BookOpen, MessageCircle, Award, PlayCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface MyCoursesTabProps {
  onBrowseCatalog?: () => void;
}

interface EnrollmentContent {
  id: string;
  title: string;
  slug: string;
  content_type: string;
  thumbnail_url: string | null;
  cover_image_url: string | null;
  instructor_name: string | null;
  whatsapp_group_link: string | null;
}

interface Enrollment {
  id: string;
  status: "active" | "completed" | "pending_payment" | string;
  enrolled_at: string;
  progress: number;
  content: EnrollmentContent;
}

const LearningCard = ({ enrollment }: { enrollment: Enrollment }) => {
  const navigate = useNavigate();
  const { content, status, progress } = enrollment;
  const imageSrc = content.thumbnail_url || content.cover_image_url;

  return (
    <Card
      className="group cursor-pointer hover:border-primary/40 transition-all overflow-hidden border border-border/40 rounded-2xl"
      onClick={() => navigate(`/app/learn/${content.slug}`)}
    >
      <div className="h-24 bg-muted relative overflow-hidden">
        {imageSrc ? (
          <img src={imageSrc} alt={content.title} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-primary/5">
            <BookOpen className="h-8 w-8 text-primary/20" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <PlayCircle className="text-white h-8 w-8" />
        </div>
      </div>

      <CardContent className="p-3 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <Badge variant="outline" className="text-[9px] px-1.5 py-0 capitalize">
            {content.content_type?.replace(/_/g, " ") || "Course"}
          </Badge>
          <Badge
            className={cn(
              "text-[9px] px-1.5 py-0 border-none capitalize",
              status === "active"
                ? "bg-emerald-500/10 text-emerald-600"
                : status === "completed"
                  ? "bg-primary/10 text-primary"
                  : "bg-amber-500/10 text-amber-600",
            )}
          >
            {status === "pending_payment" ? "Pending" : status}
          </Badge>
        </div>

        <h3 className="font-semibold text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">
          {content.title}
        </h3>

        {content.instructor_name && (
          <p className="text-[11px] text-muted-foreground line-clamp-1">{content.instructor_name}</p>
        )}

        {status === "active" && (
          <div className="space-y-1 pt-1">
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span>Progress</span>
              <span className="font-medium text-primary">{progress || 0}%</span>
            </div>
            <Progress value={progress || 0} className="h-1.5" />
          </div>
        )}

        <div className="flex gap-2 pt-1">
          {content.whatsapp_group_link && status === "active" && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-8 text-[10px] border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10"
              onClick={(e) => {
                e.stopPropagation();
                window.open(content.whatsapp_group_link!, "_blank");
              }}
            >
              <MessageCircle className="w-3 h-3 mr-1" /> WhatsApp group
            </Button>
          )}
          {status === "completed" && (
            <Button
              size="sm"
              className="flex-1 h-8 text-[10px]"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/app/report-card/${enrollment.id}`);
              }}
            >
              <Award className="w-3 h-3 mr-1" /> View certificate
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export function MyCoursesTab({ onBrowseCatalog }: MyCoursesTabProps) {
  const navigate = useNavigate();
  const { talent } = useTalent();

  const {
    data: enrollments = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["talent-enrollments", talent?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("enrollments")
        .select(
          `
          id, status, enrolled_at, completed_at, progress,
          content:content_id (
            id, title, slug, content_type, thumbnail_url, cover_image_url,
            instructor_name, whatsapp_group_link
          )
        `,
        )
        .eq("talent_id", talent!.id)
        .order("last_accessed_at", { ascending: false });

      if (error) throw error;
      return (data as any[]).filter((e) => e.content?.content_type !== "free_video") as Enrollment[];
    },
    enabled: !!talent?.id,
  });

  const active = enrollments.filter((e) => e.status === "active" || e.status === "pending_payment");
  const completed = enrollments.filter((e) => e.status === "completed");

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-44 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center bg-destructive/5 rounded-2xl border border-dashed border-destructive/20">
        <p className="text-sm text-destructive mb-3">Couldn't load your courses.</p>
        <Button onClick={() => refetch()} variant="outline" size="sm">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {active.length === 0 && completed.length === 0 ? (
        <Card className="border border-dashed rounded-2xl p-8 text-center">
          <BookOpen className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <h3 className="font-semibold text-base mb-1">Nothing here yet</h3>
          <p className="text-xs text-muted-foreground mb-4 max-w-xs mx-auto">
            Browse the academy to start your first program.
          </p>
          <Button onClick={() => (onBrowseCatalog ? onBrowseCatalog() : navigate("/app/learning?tab=courses"))} size="sm">
            Browse academy
          </Button>
        </Card>
      ) : (
        <>
          {active.length > 0 && (
            <section className="space-y-2">
              <h2 className="text-sm font-semibold px-1">In progress</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {active.map((enr) => (
                  <LearningCard key={enr.id} enrollment={enr} />
                ))}
              </div>
            </section>
          )}

          {completed.length > 0 && (
            <section className="space-y-2">
              <h2 className="text-sm font-semibold px-1">Completed</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {completed.map((enr) => (
                  <LearningCard key={enr.id} enrollment={enr} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
