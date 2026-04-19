import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQueryWithTimeout } from "@/hooks/useQueryWithTimeout";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge"; // FIX: Added missing import
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  RefreshCw,
  ChevronDown,
  ShieldCheck,
  Sparkles,
  GraduationCap,
} from "lucide-react";
import { StageNavigation } from "@/components/player/StageNavigation";
import { ImmersiveModuleList } from "@/components/player/ImmersiveModuleList";
import { OrientationStage } from "@/components/player/stages/OrientationStage";
import { LearnStage } from "@/components/player/stages/LearnStage";
import { DiscussStage } from "@/components/player/stages/DiscussStage";
import { PracticeStage } from "@/components/player/stages/PracticeStage";
import { AssessStage } from "@/components/player/stages/AssessStage";
import { ProgressStage } from "@/components/player/stages/ProgressStage";
import { useModuleResourcesByStage } from "@/hooks/useModuleResources";
import { useStageProgress } from "@/hooks/useStageProgress";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ModuleProgressState {
  completedStages: number[];
  isComplete: boolean;
}

export default function ImmersiveCoursePlayer() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentModuleId, setCurrentModuleId] = useState<string | undefined>();
  const [moduleProgress, setModuleProgress] = useState<Record<string, ModuleProgressState>>({});

  // 1. Data Ingestion
  const {
    data: content,
    isLoading: contentLoading,
    error: contentError,
    refetch: refetchContent,
  } = useQueryWithTimeout({
    queryKey: ["course-content", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("content")
        .select("*, profession_categories:profession_line_id(*)")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
    timeout: TIMEOUTS.DEFAULT,
  });

  const {
    data: modules = [],
    isLoading: modulesLoading,
    error: modulesError,
  } = useQueryWithTimeout({
    queryKey: ["course-modules", content?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("course_modules")
        .select("*")
        .eq("content_id", content!.id)
        .order("display_order");
      if (error) throw error;
      return data || [];
    },
    enabled: !!content?.id,
    timeout: TIMEOUTS.DEFAULT,
  });

  const { data: student } = useQueryWithTimeout({
    queryKey: ["student-profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("students").select("*").eq("user_id", user!.id).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
    timeout: TIMEOUTS.DEFAULT,
  });

  const { data: enrollment, isLoading: enrollmentLoading } = useQueryWithTimeout({
    queryKey: ["enrollment", student?.id, content?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("enrollments")
        .select("*")
        .eq("student_id", student!.id)
        .eq("content_id", content!.id)
        .in("status", ["active", "completed"])
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!student?.id && !!content?.id,
    timeout: TIMEOUTS.DEFAULT,
  });

  const { data: aiInstructor } = useQueryWithTimeout({
    queryKey: ["ai-instructor", content?.profession_line_id],
    queryFn: async () => {
      const { data } = await supabase
        .from("ai_instructors")
        .select("*")
        .eq("profession_line_id", content!.profession_line_id!)
        .eq("is_active", true)
        .maybeSingle();
      return data;
    },
    enabled: !!content?.profession_line_id,
    timeout: TIMEOUTS.DEFAULT,
  });

  const { data: allModuleProgress = [] } = useQueryWithTimeout({
    queryKey: ["all-module-progress", enrollment?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("enrollment_stage_progress")
        .select("module_id, completed_stages")
        .eq("enrollment_id", enrollment!.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!enrollment?.id,
    timeout: TIMEOUTS.DEFAULT,
  });

  // Lifecycle Sync
  useEffect(() => {
    if (modules.length > 0 && !currentModuleId) setCurrentModuleId(modules[0].id);
  }, [modules, currentModuleId]);

  const { data: stageResources = [] } = useModuleResourcesByStage(currentModuleId);

  const { completedStages, currentStage, setCurrentStage, markStageComplete, goToStage, resetForModule } =
    useStageProgress({
      enrollmentId: enrollment?.id,
      moduleId: currentModuleId,
    });

  const currentModule = modules.find((m) => m.id === currentModuleId);
  const currentModuleIndex = modules.findIndex((m) => m.id === currentModuleId);
  const hasNextModule = currentModuleIndex < modules.length - 1;

  // Handlers
  const handleStageComplete = async (stageNumber: number) => {
    await markStageComplete(stageNumber);
    if (currentModuleId) {
      setModuleProgress((prev) => ({
        ...prev,
        [currentModuleId]: {
          completedStages: Array.from(new Set([...(prev[currentModuleId]?.completedStages || []), stageNumber])),
          isComplete: stageNumber >= 5,
        },
      }));
    }
    if (stageNumber < 6) setCurrentStage(stageNumber + 1);
    toast.success(`Milestone ${stageNumber} Synchronized`);
  };

  const handleQuizComplete = (passed: boolean) => {
    if (passed) handleStageComplete(5);
    else toast.error("Performance threshold not met. Review material.");
  };

  const handleNextModule = async () => {
    if (hasNextModule) {
      const nextModule = modules[currentModuleIndex + 1];
      resetForModule(nextModule.id);
      setCurrentModuleId(nextModule.id);
      setCurrentStage(1);
    } else {
      if (enrollment?.id) {
        await supabase
          .from("enrollments")
          .update({ status: "completed", completed_at: new Date().toISOString(), progress: 100 })
          .eq("id", enrollment.id);
      }
      toast.success("Academy Curriculum Mastered!");
      navigate("/app/learning/my-courses");
    }
  };

  const totalStages = modules.length * 6;
  const persistedTotal = allModuleProgress.reduce(
    (sum, mp) => sum + ((mp.completed_stages as number[])?.length || 0),
    0,
  );
  const overallProgress = totalStages > 0 ? Math.min((persistedTotal / totalStages) * 100, 100) : 0;

  if (contentLoading || modulesLoading || enrollmentLoading)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
          Booting Learning Environment
        </p>
      </div>
    );

  if (contentError || !enrollment)
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <Card className="max-w-md w-full rounded-[32px] border-border/40 shadow-2xl">
          <CardContent className="pt-10 text-center space-y-6">
            <AlertCircle className="h-16 w-16 text-rose-500 mx-auto" />
            <h2 className="text-xl font-black uppercase">Sync Terminated</h2>
            <div className="flex flex-col gap-2">
              <Button className="rounded-2xl h-12 font-black uppercase" onClick={() => refetchContent()}>
                Retry Connection
              </Button>
              <Button variant="ghost" asChild className="text-[10px] font-black uppercase tracking-widest">
                <Link to="/app/learning/courses">Catalog Hub</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );

  return (
    <div className="min-h-screen bg-background flex flex-col selection:bg-primary/10">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/40 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-6">
          <div className="flex items-center gap-4 min-w-0">
            <Button variant="ghost" size="icon" asChild className="rounded-full shrink-0">
              <Link to="/app/learning/my-courses">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge className="bg-primary/10 text-primary border-none text-[8px] font-black uppercase h-5">
                  Verified Track
                </Badge>
                <span className="text-[10px] font-bold text-muted-foreground uppercase">
                  {Math.round(overallProgress)}% Complete
                </span>
              </div>
              <h1 className="font-black text-sm md:text-base truncate">{content.title}</h1>
            </div>
          </div>
          <div className="hidden sm:block w-32 shrink-0">
            <Progress value={overallProgress} className="h-1.5 bg-primary/10" />
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-6 space-y-8 animate-in fade-in duration-700">
          <Collapsible className="group">
            <CollapsibleTrigger asChild>
              <Button
                variant="outline"
                className="w-full h-14 rounded-2xl justify-between px-6 border-border/40 bg-card/50"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-[10px] font-black text-primary">
                    {currentModuleIndex + 1}
                  </div>
                  <span className="font-black text-xs uppercase tracking-widest truncate max-w-[200px]">
                    {currentModule?.title}
                  </span>
                </div>
                <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-300 group-data-[state=open]:rotate-180" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3">
              <div className="rounded-[28px] border border-border/40 bg-card p-4 shadow-xl overflow-hidden">
                <ImmersiveModuleList
                  modules={modules}
                  currentModuleId={currentModuleId}
                  moduleProgress={moduleProgress}
                  onModuleSelect={(id) => {
                    resetForModule(id);
                    setCurrentModuleId(id);
                  }}
                />
              </div>
            </CollapsibleContent>
          </Collapsible>

          <StageNavigation
            currentStage={currentStage}
            completedStages={completedStages}
            onStageSelect={goToStage}
            className="mb-10"
          />

          <div className="min-h-[500px] relative">
            <StageContentRouter
              stage={currentStage}
              content={content}
              currentModule={currentModule}
              resources={stageResources.find((s) => s.stage === currentStage)?.resources || []}
              completedStages={completedStages}
              onComplete={handleStageComplete}
              onQuizComplete={handleQuizComplete}
              onNextModule={handleNextModule}
              aiInstructor={aiInstructor}
              studentId={student?.id}
              enrollmentId={enrollment.id}
              hasNextModule={hasNextModule}
              moduleIndex={currentModuleIndex}
              totalModules={modules.length}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

function StageContentRouter({
  stage,
  content,
  currentModule,
  resources,
  completedStages,
  onComplete,
  onQuizComplete,
  onNextModule,
  aiInstructor,
  studentId,
  enrollmentId,
  hasNextModule,
  moduleIndex,
  totalModules,
}: any) {
  const isComp = completedStages.includes(stage);
  const fallbackVideo = currentModule?.video_url;

  switch (stage) {
    case 1:
      return (
        <OrientationStage
          resources={resources}
          onComplete={() => onComplete(1)}
          isCompleted={isComp}
          fallbackVideoUrl={fallbackVideo}
        />
      );
    case 2:
      return <LearnStage resources={resources} onComplete={() => onComplete(2)} isCompleted={isComp} />;
    case 3:
      return (
        <DiscussStage
          resources={resources}
          onComplete={() => onComplete(3)}
          isCompleted={isComp}
          professionLineId={content.profession_line_id}
          moduleId={currentModule?.id}
          instructorName={aiInstructor?.name}
        />
      );
    case 4:
      return (
        <PracticeStage
          resources={resources}
          onComplete={() => onComplete(4)}
          isCompleted={isComp}
          professionLineId={content.profession_line_id}
        />
      );
    case 5:
      return (
        <AssessStage
          contentId={content.id}
          moduleId={currentModule?.id}
          studentId={studentId}
          enrollmentId={enrollmentId}
          passThreshold={content.pass_threshold || 70}
          onComplete={onQuizComplete}
          isCompleted={isComp}
        />
      );
    case 6:
      return (
        <ProgressStage
          moduleName={currentModule?.title}
          moduleIndex={moduleIndex}
          totalModules={totalModules}
          completedStages={completedStages}
          onNextModule={onNextModule}
          onComplete={() => onComplete(6)}
          isCompleted={isComp}
          hasNextModule={hasNextModule}
        />
      );
    default:
      return null;
  }
}
