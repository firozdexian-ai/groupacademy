import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { BookOpen, CheckCircle, Clock, MessageCircle, Award, PlayCircle, Zap, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Talent Curriculum Registry
 * CTO Reference: Authoritative node for tracking active and completed learning trajectories.
 */

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
      className="group cursor-pointer hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] transition-all duration-500 overflow-hidden border-2 border-border/40 bg-card/30 backdrop-blur-xl h-full flex flex-col rounded-[32px] hover:border-primary/40"
      onClick={() => navigate(`/app/learn/${content.slug}`)}
    >
      {/* ASSET LAYER */}
      <div className="h-32 bg-muted relative overflow-hidden shrink-0 border-b-2 border-border/10">
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={content.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-primary/5">
            <BookOpen className="h-12 w-12 text-primary/10" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-500 backdrop-blur-sm flex items-center justify-center">
          <div className="p-3 rounded-full bg-white/20 backdrop-blur-md border border-white/30 shadow-2xl">
            <PlayCircle className="text-white h-8 w-8 fill-white/20" />
          </div>
        </div>
      </div>

      <CardContent className="p-6 flex flex-col flex-1 text-left">
        <div className="flex-1 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <Badge
              variant="outline"
              className="text-[9px] font-black uppercase tracking-widest border-2 border-primary/20 text-primary px-2 py-0.5"
            >
              {content.content_type?.replace(/_/g, " ") || "Course"}
            </Badge>
            <Badge
              className={cn(
                "text-[9px] font-black uppercase tracking-widest border-none px-2 py-0.5",
                status === "active" ? "bg-emerald-500/10 text-emerald-600" : "bg-primary/10 text-primary",
              )}
            >
              {status === "pending_payment" ? "AUTHORIZING" : status.toUpperCase()}
            </Badge>
          </div>

          <h3 className="font-black text-base uppercase italic tracking-tighter leading-tight line-clamp-2 group-hover:text-primary transition-colors">
            {content.title}
          </h3>

          {content.instructor_name && (
            <div className="flex items-center gap-2 text-[9px] font-bold text-muted-foreground uppercase tracking-widest italic opacity-60">
              <ShieldCheck className="h-3 w-3" />
              <span>Faculty: {content.instructor_name}</span>
            </div>
          )}
        </div>

        <div className="space-y-4 mt-6">
          {status === "active" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 italic">
                <span>Sync_Progress</span>
                <span className="text-primary">{progress || 0}%</span>
              </div>
              <Progress value={progress || 0} className="h-2 rounded-full bg-primary/10 shadow-inner" />
            </div>
          )}

          <div className="flex gap-2">
            {content.whatsapp_group_link && status === "active" && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-10 text-[9px] font-black uppercase tracking-widest rounded-xl bg-emerald-500/5 border-2 border-emerald-500/20 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(content.whatsapp_group_link!, "_blank");
                }}
              >
                <MessageCircle className="w-3.5 h-3.5 mr-2 fill-current" /> COHORT_SYNC
              </Button>
            )}
            {status === "completed" && (
              <Button
                variant="default"
                size="sm"
                className="flex-1 h-10 text-[9px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20 gap-2"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/app/report-card/${enrollment.id}`);
                }}
              >
                <Award className="w-4 h-4" /> VERIFY_CREDENTIAL
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
      // FILTER: Exclude atomic video nodes from primary curriculum view
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
          <Skeleton key={i} className="h-[350px] w-full rounded-[40px] opacity-40" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-12 text-center bg-destructive/5 rounded-[40px] border-2 border-dashed border-destructive/20 animate-in zoom-in-95">
        <Zap className="h-10 w-10 text-destructive/40 mx-auto mb-4" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-destructive mb-6">
          SYNC_FAULT: REGISTRY_OFFLINE
        </p>
        <Button
          onClick={() => refetch()}
          variant="outline"
          size="sm"
          className="rounded-xl border-2 border-destructive/20 font-black uppercase text-[10px]"
        >
          RE_INITIALIZE_SYNC
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex items-center gap-4 px-1">
        <Badge
          variant="outline"
          className="bg-primary/5 border-2 border-primary/20 rounded-full px-5 py-2 text-[10px] font-black uppercase tracking-widest text-primary italic"
        >
          <Clock className="h-3.5 w-3.5 mr-2" /> {activeEnrollments.length} ACTIVE_TRAJECTORIES
        </Badge>
        <Badge
          variant="outline"
          className="bg-emerald-500/5 border-2 border-emerald-500/20 rounded-full px-5 py-2 text-[10px] font-black uppercase tracking-widest text-emerald-600 italic"
        >
          <CheckCircle className="h-3.5 w-3.5 mr-2" /> {completedEnrollments.length} GRADUATED_NODES
        </Badge>
      </div>

      <Tabs defaultValue="active" className="space-y-8">
        <TabsList className="bg-muted/20 backdrop-blur-md p-1.5 rounded-[22px] border-2 border-border/40 w-full lg:w-[500px]">
          <TabsTrigger
            value="active"
            className="rounded-2xl font-black uppercase italic text-[10px] tracking-[0.2em] py-3 data-[state=active]:bg-background data-[state=active]:shadow-lg"
          >
            CURRENT_LEARNING
          </TabsTrigger>
          <TabsTrigger
            value="completed"
            className="rounded-2xl font-black uppercase italic text-[10px] tracking-[0.2em] py-3 data-[state=active]:bg-background data-[state=active]:shadow-lg"
          >
            ACHIEVEMENT_ARCHIVE
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-0 outline-none">
          {activeEnrollments.length === 0 ? (
            <Card className="border-2 border-dashed border-border/20 bg-muted/5 rounded-[40px] p-24 text-center group hover:border-primary/20 transition-colors">
              <BookOpen className="w-20 h-20 text-muted-foreground/10 mx-auto mb-6 group-hover:rotate-6 transition-transform duration-500" />
              <h3 className="font-black text-2xl uppercase italic tracking-tighter mb-3">CURRICULUM_OFFLINE</h3>
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-10 max-w-sm mx-auto italic opacity-60 leading-relaxed">
                Your professional identity requires skill-node ingestion. Initiate a curriculum trajectory to begin.
              </p>
              <Button
                onClick={() => (onBrowseCatalog ? onBrowseCatalog() : navigate("/app/learning/courses"))}
                className="h-14 rounded-2xl font-black uppercase italic tracking-[0.2em] px-12 shadow-2xl active:scale-95 transition-all gap-3"
              >
                <Zap className="h-5 w-5 fill-current" /> BROWSE_ACADEMY
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {activeEnrollments.map((enr) => (
                <LearningCard key={enr.id} enrollment={enr} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="mt-0 outline-none">
          {completedEnrollments.length === 0 ? (
            <div className="py-24 text-center border-2 border-dashed rounded-[40px] border-border/20 bg-muted/5">
              <CheckCircle className="w-16 h-16 text-muted-foreground/5 mx-auto mb-4" />
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/30 italic">
                NO_CERTIFICATIONS_SYNCED
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
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
