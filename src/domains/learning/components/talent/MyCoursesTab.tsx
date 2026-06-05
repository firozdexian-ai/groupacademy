import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { listTalentEnrollmentsFull } from "@/domains/learning/repo/learningRepo";
import { useTalent } from "@/hooks/useTalent";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { trackError, trackEvent } from "@/lib/errorTracking";
import { BookOpen, MessageCircle, Award, PlayCircle, Compass, RefreshCw, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { AdaptiveSnapshotCard } from "./AdaptiveSnapshotCard";
import { NextActionsCard } from "./NextActionsCard";
import { SkillCredentialsPanel } from "./SkillCredentialsPanel";

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

/**
 * GroUp Academy: Interactive Curriculum Matrix Item Card (LearningCard)
 * Sub-component visualizing active enrollment states, progress tracking thresholds, and certificate linkages.
 */
const LearningCard = ({ enrollment }: { enrollment: Enrollment }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { content, status, progress } = enrollment;

  const imageSrc = content.thumbnail_url || content.cover_image_url;
  const currentProgressPercent = Math.round(Number(progress || 0));

  const handleCardNavigationTrigger = () => {
    if (!content.slug) return;
    trackEvent("academy_enrollment_card_clicked", { enrollmentId: enrollment.id, slug: content.slug, status });

    // Synchronize cache layers globally to avoid state drift across shared dashboards
    queryClient.invalidateQueries({ queryKey: ["feed-posts"] });
    navigate(`/app/learn/${content.slug}`);
  };

  const handleWhatsAppRedirectHandshake = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation(); // Shield parent container navigation routing pathways defensively

    if (!content.whatsapp_group_link) return;
    trackEvent("academy_enrollment_whatsapp_sync_launched", { enrollmentId: enrollment.id, slug: content.slug });
    window.open(content.whatsapp_group_link, "_blank", "noopener,noreferrer");
  };

  const handleCertificateViewTrigger = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    trackEvent("academy_enrollment_certificate_viewed", { enrollmentId: enrollment.id, slug: content.slug });
    queryClient.invalidateQueries({ queryKey: ["feed-posts"] });
    navigate(`/app/report-card/${enrollment.id}`);
  };

  return (
    <Card
      className="group relative cursor-pointer rounded-2xl border border-border/40 bg-card/40 backdrop-blur-md shadow-sm text-left select-none sm:select-text w-full min-w-0 flex flex-col overflow-hidden transition-all duration-300 transform-gpu hover:border-primary/30 hover:bg-card/60 hover:shadow-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
      onClick={handleCardNavigationTrigger}
    >
      {/* Course Thumbnail Image Box */}
      <div className="h-24 w-full bg-muted border-b border-border/10 relative overflow-hidden select-none shrink-0">
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={content.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-102 border-none"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-primary/5">
            <BookOpen className="h-5 w-5 text-primary/30 stroke-[2.2]" />
          </div>
        )}
        <div className="absolute inset-0 bg-foreground/40 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none z-10">
          <PlayCircle className="text-primary-foreground h-7 w-7 stroke-[2.2] drop-shadow-md transform-gpu scale-95 group-hover:scale-100 transition-transform duration-300" />
        </div>
      </div>

      <CardContent className="p-3.5 space-y-2.5 w-full min-w-0 flex-1 flex flex-col justify-between">
        <div className="space-y-1.5 w-full min-w-0">
          {/* Classification Tags Row */}
          <div className="flex items-center justify-between gap-3 select-none leading-none w-full">
            <Badge
              variant="outline"
              className="text-[9px] font-extrabold px-1.5 h-4.5 rounded uppercase tracking-wide border-border/40 text-muted-foreground/80 bg-background/50 max-w-[60%] truncate"
            >
              {content.content_type ? content.content_type.replace(/_/g, " ") : "Career Track"}
            </Badge>
            <Badge
              className={cn(
                "text-[9px] font-extrabold px-1.5 h-4.5 rounded uppercase tracking-wide border-none select-none tabular-nums shadow-sm shrink-0",
                status === "active"
                  ? "bg-success/10 text-success"
                  : status === "completed"
                    ? "bg-primary/10 text-primary"
                    : "bg-warning/10 text-warning",
              )}
            >
              {status === "pending_payment" ? "Awaiting Payment" : status || "Enrolled"}
            </Badge>
          </div>

          <h3 className="font-bold text-xs sm:text-sm text-foreground/90 tracking-tight leading-tight line-clamp-1 truncate w-full group-hover:text-primary transition-colors pr-1 select-text">
            {content.title}
          </h3>

          {content.instructor_name && (
            <p className="text-[11px] font-semibold text-muted-foreground/70 truncate w-full italic pl-0.5 leading-none">
              {content.instructor_name.trim()}
            </p>
          )}
        </div>

        {/* Dynamic Learning Progress Section */}
        <div className="space-y-2 w-full pt-1 mt-auto">
          {status === "active" && (
            <div className="space-y-1 w-full select-none leading-none tabular-nums">
              <div className="flex items-center justify-between text-[10px] font-bold tracking-tight text-muted-foreground/80 pl-0.5 mb-1">
                <span>Your Progress</span>
                <span className="font-extrabold text-primary">{currentProgressPercent}% completed</span>
              </div>
              <Progress value={currentProgressPercent} className="h-1.5 rounded-full bg-primary/10 shadow-inner" />
            </div>
          )}

          {/* Contextual User Actions Strip */}
          <div className="flex gap-2 w-full select-none pt-0.5 font-bold text-xs leading-none">
            {content.whatsapp_group_link && status === "active" && (
              <Button
                variant="outline"
                size="sm"
                type="button"
                className="flex-1 h-7 rounded-xl text-[10px] font-bold border-success/20 text-success hover:bg-success/5 shadow-sm transition-colors cursor-pointer"
                onClick={handleWhatsAppRedirectHandshake}
                aria-label="Join class cohort WhatsApp group"
              >
                <MessageCircle className="w-3.5 h-3.5 mr-1 text-success shrink-0 stroke-[2.2]" />
                <span>Join WhatsApp Group</span>
              </Button>
            )}

            {status === "completed" && (
              <Button
                size="sm"
                type="button"
                className="flex-1 h-7 rounded-xl text-[10px] font-extrabold uppercase tracking-wide shadow-sm transition-transform active:scale-[0.99] cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={handleCertificateViewTrigger}
                aria-label="View verified completion certificate"
              >
                <Award className="w-3.5 h-3.5 mr-1 text-primary-foreground shrink-0 stroke-[2.5]" />
                <span>View Certificate</span>
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

  // Monitor total curriculum aggregate directory views
  useEffect(() => {
    if (talent?.id) {
      trackEvent("talent_learning_tab_directory_mounted", { talentId: talent.id });
    }
  }, [talent?.id]);

  // Core Server State Hook Ingress to load personal active enrollments
  const {
    data: enrollments = [],
    isLoading,
    error: queryFetchError,
    refetch,
  } = useQuery({
    queryKey: ["talent-enrollments", talent?.id],
    enabled: !!talent?.id,
    refetchOnWindowFocus: false, // Drop redundant window re-focus polling layers
    queryFn: async () => {
      const data = await listTalentEnrollmentsFull(talent!.id);
      return (data as any[]).filter((e) => e.content?.content_type !== "free_video") as Enrollment[];
    },
  });

  // Track operational sync exceptions over telemetry logs safely
  useEffect(() => {
    if (queryFetchError) {
      trackError(queryFetchError, {
        component: "MyCoursesTab",
        action: "fetch_talent_enrollments_registry_api",
        talentId: talent?.id,
      });
    }
  }, [queryFetchError, talent?.id]);

  const active = useMemo(
    () => enrollments.filter((e) => e.status === "active" || e.status === "pending_payment"),
    [enrollments],
  );
  const completed = useMemo(() => enrollments.filter((e) => e.status === "completed"), [enrollments]);

  const handleBrowseCatalogFallbackClick = () => {
    trackEvent("talent_learning_directory_browse_fallback_triggered");
    if (onBrowseCatalog) onBrowseCatalog();
    else navigate("/app/learning?tab=courses");
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 select-none w-full animate-pulse">
        {[1, 2, 3, 4].map((skeletonIndex) => (
          <Skeleton key={skeletonIndex} className="h-40 w-full rounded-2xl opacity-60" />
        ))}
      </div>
    );
  }

  if (queryFetchError) {
    return (
      <Card className="border border-dashed border-destructive/20 bg-destructive/5 rounded-2xl text-left w-full max-w-full">
        <CardContent className="p-5 text-center space-y-3.5 select-none">
          <p className="text-xs font-bold uppercase tracking-wider text-destructive dark:text-destructive leading-none">
            Unable to load your courses
          </p>
          <p className="text-xs font-semibold italic text-muted-foreground/80 max-w-xs mx-auto leading-normal">
            Something went wrong. Please check your connection and try again.
          </p>
          <Button
            onClick={() => refetch()}
            variant="outline"
            size="sm"
            type="button"
            className="h-8 rounded-xl border-border/60 hover:bg-accent font-bold uppercase text-[10px] tracking-wide gap-1.5 shrink-0 shadow-sm cursor-pointer transition-transform active:scale-95"
          >
            <RefreshCw className="h-3 w-3 text-primary stroke-[2.2]" />
            <span>Retry Connection</span>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const isDirectoryEmpty = active.length === 0 && completed.length === 0;

  return (
    <div className="space-y-5 text-left antialiased max-w-full w-full">
      {isDirectoryEmpty ? (
        /* Empty State Classroom Fallback Card View */
        <Card className="border border-dashed border-border/60 bg-card/40 backdrop-blur-md rounded-2xl p-6 text-center select-none w-full max-w-md mx-auto flex flex-col justify-center items-center animate-in fade-in duration-300 py-8">
          <div className="h-11 w-11 rounded-xl bg-primary/5 flex items-center justify-center mb-3.5 border border-primary/5 shadow-inner">
            <BookOpen className="w-5 h-5 text-primary/40 stroke-[2.2]" />
          </div>
          <h3 className="text-sm font-bold text-foreground/90 uppercase tracking-wide leading-none">
            No Enrollments Found
          </h3>
          <p className="text-[11px] font-medium text-muted-foreground/70 leading-normal max-w-xs mx-auto mt-1.5 mb-4">
            You haven't enrolled in any educational programs or live cohorts yet.
          </p>
          <Button
            onClick={handleBrowseCatalogFallbackClick}
            size="sm"
            type="button"
            className="h-8 rounded-xl text-[10px] font-extrabold uppercase tracking-wide px-4 shadow-sm active:scale-[0.99] transition-transform cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-1"
          >
            <Compass className="h-3.5 w-3.5 text-primary-foreground shrink-0 stroke-[2.2]" />
            <span>Browse Catalog</span>
          </Button>
        </Card>
      ) : (
        /* Hydrated Active Classroom Track Collections Stack */
        <div className="space-y-5 w-full min-w-0 animate-in fade-in duration-300">
          <NextActionsCard />
          <SkillCredentialsPanel compact limit={3} />
          <AdaptiveSnapshotCard />

          <div className="pt-0.5 select-none w-full text-left">
            <Button
              variant="link"
              type="button"
              onClick={() => {
                trackEvent("talent_mirror_shortcut_clicked");
                navigate("/app/talent-mirror");
              }}
              className="h-auto p-0 px-0.5 text-[11px] font-bold uppercase tracking-wider text-primary hover:text-primary hover:underline transition-colors flex items-center gap-1 leading-none mt-0.5"
            >
              <span>View your skill profile</span>
              <ArrowRight className="h-3 w-3 stroke-[2.5]" />
            </Button>
          </div>

          {/* Active In-Progress Courses Section */}
          {active.length > 0 && (
            <section className="space-y-2.5 w-full text-left min-w-0">
              <h2 className="text-xs font-bold text-foreground/80 uppercase tracking-wider pl-0.5 select-none leading-none">
                In Progress
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full min-w-0">
                {active.map((enrollmentItem) => (
                  <LearningCard key={enrollmentItem.id} enrollment={enrollmentItem} />
                ))}
              </div>
            </section>
          )}

          {/* Completed Courses Section */}
          {completed.length > 0 && (
            <section className="space-y-2.5 w-full text-left min-w-0">
              <h2 className="text-xs font-bold text-foreground/80 uppercase tracking-wider pl-0.5 select-none leading-none">
                Completed Courses
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full min-w-0">
                {completed.map((enrollmentItem) => (
                  <LearningCard key={enrollmentItem.id} enrollment={enrollmentItem} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
