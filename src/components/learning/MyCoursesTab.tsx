import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { BookOpen, CheckCircle, Clock, MessageCircle, Award, PlayCircle } from "lucide-react";
import { cn } from "@/lib/utils";

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
      className="group cursor-pointer hover:shadow-2xl transition-all duration-500 overflow-hidden border-border/40 bg-card/50 backdrop-blur-sm h-full flex flex-col rounded-[24px]"
      onClick={() => navigate(`/app/learn/${content.slug}`)}
    >
      {/* Visual Header */}
      <div className="h-28 bg-muted relative overflow-hidden shrink-0">
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={content.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-primary/5">
            <BookOpen className="h-10 w-10 text-primary/20" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <PlayCircle className="text-white h-10 w-10 shadow-2xl" />
        </div>
      </div>

      <CardContent className="p-4 flex flex-col flex-1">
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Badge
              variant="outline"
              className="text-[9px] font-black uppercase tracking-widest border-primary/20 text-primary"
            >
              {content.content_type.replace(/_/g, " ")}
            </Badge>
            <Badge
              className={cn(
                "text-[9px] font-black uppercase tracking-widest border-none",
                status === "active" ? "bg-emerald-500/10 text-emerald-600" : "bg-primary/10 text-primary",
              )}
            >
              {status === "pending_payment" ? "Pending" : status}
            </Badge>
          </div>

          <h3 className="font-black text-sm tracking-tight leading-tight line-clamp-2 group-hover:text-primary transition-colors">
            {content.title}
          </h3>

          {content.instructor_name && (
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Faculty: {content.instructor_name}
            </p>
          )}
        </div>

        {/* Action & Progress Layer */}
        <div className="space-y-3 mt-4">
          {status === "active" && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                <span>Completion</span>
                <span className="text-primary">{progress || 0}%</span>
              </div>
              <Progress value={progress || 0} className="h-1.5" />
            </div>
          )}

          <div className="flex gap-2">
            {content.whatsapp_group_link && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-9 text-[10px] font-black uppercase tracking-widest rounded-xl bg-emerald-500/5 border-emerald-500/20 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(content.whatsapp_group_link!, "_blank");
                }}
              >
                <MessageCircle className="w-3.5 h-3.5 mr-2" /> Cohort
              </Button>
            )}
            {status === "completed" && (
              <Button
                variant="default"
                size="sm"
                className="flex-1 h-9 text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/app/report-card/${enrollment.id}`);
                }}
              >
                <Award className="w-3.5 h-3.5 mr-2" /> Certificate
              </Button>
            )}
          </div>
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
      // Filter out utility content
      return (data as any[]).filter((e) => e.content.content_type !== "free_video") as Enrollment[];
    },
    enabled: !!talent?.id,
  });

  const activeEnrollments = enrollments.filter((e) => e.status === "active");
  const completedEnrollments = enrollments.filter((e) => e.status === "completed");

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-[300px] w-full rounded-[32px]" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Stats Quick-View */}
      <div className="flex items-center gap-3">
        <Badge className="bg-primary/10 text-primary border-none rounded-full px-4 py-1.5 text-[10px] font-black uppercase tracking-widest">
          <Clock className="h-3 w-3 mr-2" /> {activeEnrollments.length} Ongoing Tracks
        </Badge>
        <Badge className="bg-emerald-500/10 text-emerald-600 border-none rounded-full px-4 py-1.5 text-[10px] font-black uppercase tracking-widest">
          <CheckCircle className="h-3 w-3 mr-2" /> {completedEnrollments.length} Graduated
        </Badge>
      </div>

      <Tabs defaultValue="active" className="space-y-6">
        <TabsList className="bg-muted/50 p-1 rounded-2xl w-full lg:w-[480px]">
          <TabsTrigger value="active" className="rounded-xl font-bold text-xs">
            Current Learning
          </TabsTrigger>
          <TabsTrigger value="completed" className="rounded-xl font-bold text-xs">
            Achievement Archive
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-0">
          {activeEnrollments.length === 0 ? (
            <Card className="border-dashed bg-muted/10 rounded-[32px] p-20 text-center">
              <BookOpen className="w-16 h-16 text-muted-foreground/20 mx-auto mb-6" />
              <h3 className="font-black text-xl tracking-tight mb-2">No Active Curriculum</h3>
              <p className="text-sm text-muted-foreground mb-8 max-w-xs mx-auto">
                Your enrolled professional courses will appear here once started.
              </p>
              <Button
                onClick={() => (onBrowseCatalog ? onBrowseCatalog() : navigate("/app/learning/courses"))}
                className="rounded-2xl font-black uppercase tracking-widest px-8"
              >
                Browse Academy
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeEnrollments.map((enr) => (
                <LearningCard key={enr.id} enrollment={enr} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="mt-0">
          {completedEnrollments.length === 0 ? (
            <div className="py-20 text-center border-2 border-dashed rounded-[32px] border-border/40">
              <CheckCircle className="w-12 h-12 text-muted-foreground/10 mx-auto mb-4" />
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground/40">
                No completed certifications found
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {completedEnrollments.map((enr) => (
                <LearningCard key={enr.id} enrollment={enr} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
