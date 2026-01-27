import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQueryWithTimeout } from "@/hooks/useQueryWithTimeout";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ArrowLeft, Loader2, AlertCircle, RefreshCw, Menu } from "lucide-react";
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

  // 1. Fetch Content
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

  // 2. Fetch Modules
  const {
    data: modules = [],
    isLoading: modulesLoading,
    error: modulesError,
    refetch: refetchModules,
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

  // 3. Fetch Student Profile
  const {
    data: student,
    error: studentError,
    refetch: refetchStudent,
  } = useQueryWithTimeout({
    queryKey: ["student-profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("students").select("*").eq("user_id", user!.id).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
    timeout: TIMEOUTS.DEFAULT,
  });

  // 4. Fetch Enrollment & AI Instructor
  const {
    data: enrollment,
    isLoading: enrollmentLoading,
    error: enrollmentError,
    refetch: refetchEnrollment,
  } = useQueryWithTimeout({
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
      const { data, error } = await supabase
        .from("ai_instructors")
        .select("*")
        .eq("profession_line_id", content!.profession_line_id!)
        .eq("is_active", true)
        .single();
      if (error) return null;
      return data;
    },
    enabled: !!content?.profession_line_id,
    timeout: TIMEOUTS.DEFAULT,
  });

  // 5. Fetch ALL module progress from database for accurate progress bar
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

  // Initialize Module
  useEffect(() => {
    if (modules.length > 0 && !currentModuleId) {
      setCurrentModuleId(modules[0].id);
    }
  }, [modules, currentModuleId]);

  // Fetch Resources
  const { data: stageResources = [] } = useModuleResourcesByStage(currentModuleId);

  // Use persistent stage progress hook
  const { 
    completedStages, 
    setCompletedStages, 
    currentStage, 
    setCurrentStage, 
    markStageComplete, 
    goToStage,
    isLoading: progressLoading,
    resetForModule 
  } = useStageProgress({
      enrollmentId: enrollment?.id,
      moduleId: currentModuleId,
    });

  const currentModule = modules.find((m) => m.id === currentModuleId);
  const currentModuleIndex = modules.findIndex((m) => m.id === currentModuleId);
  const hasNextModule = currentModuleIndex < modules.length - 1;

  const handleStageComplete = async (stageNumber: number) => {
    // 1. Update Persistent State
    await markStageComplete(stageNumber);

    // 2. Update Local Module Progress
    if (currentModuleId) {
      setModuleProgress((prev) => ({
        ...prev,
        [currentModuleId]: {
          completedStages: [...(prev[currentModuleId]?.completedStages || []), stageNumber],
          isComplete: stageNumber === 5 || stageNumber === 6,
        },
      }));
    }

    // 3. Auto-advance if not last stage
    if (stageNumber < 6) {
      setCurrentStage(stageNumber + 1);
    }

    toast.success(`Stage ${stageNumber} completed!`);
  };

  const handleNextModule = async () => {
    if (hasNextModule) {
      const nextModule = modules[currentModuleIndex + 1];
      setCurrentModuleId(nextModule.id);
      setCurrentStage(1);
      setCompletedStages([]); // Reset stage progress for new module
    } else {
      // Mark enrollment as completed
      if (enrollment?.id) {
        try {
          await supabase
            .from("enrollments")
            .update({
              status: "completed",
              completed_at: new Date().toISOString(),
              progress: 100,
            })
            .eq("id", enrollment.id);
        } catch (err) {
          console.error("Error marking course complete:", err);
        }
      }
      toast.success("Congratulations! You've completed the course!");
      navigate("/app/learning/my-courses");
    }
  };

  const handleModuleSelect = (moduleId: string) => {
    // Reset for new module - progress will be loaded automatically by the hook
    resetForModule(moduleId);
    setCurrentModuleId(moduleId);
  };

  const handleQuizComplete = (passed: boolean, score: number) => {
    if (passed) {
      handleStageComplete(5);
    }
  };

  // Progress Calculation - use persisted data from database for accuracy
  const totalStages = modules.length * 6;
  
  // Calculate from persisted database progress
  const persistedCompletedStages = allModuleProgress.reduce((sum, mp) => {
    const stages = mp.completed_stages as number[] | null;
    return sum + (stages?.length || 0);
  }, 0);
  
  // Use the higher of persisted or session progress (in case of optimistic updates)
  const sessionCompletedStages = Object.values(moduleProgress).reduce(
    (sum, mp) => sum + mp.completedStages.length, 0
  ) + completedStages.length;
  
  const completedTotal = Math.max(persistedCompletedStages, sessionCompletedStages);

  // Safe progress calculation
  const overallProgress = totalStages > 0 ? Math.min((completedTotal / totalStages) * 100, 100) : 0;

  // Loading & Error States
  const isLoading = contentLoading || modulesLoading || enrollmentLoading;
  const hasError = contentError || modulesError || studentError;

  const handleRetry = () => {
    if (contentError) refetchContent();
    if (modulesError) refetchModules();
    if (studentError) refetchStudent();
    if (enrollmentError) refetchEnrollment();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading your learning experience...</p>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Connection Error</h2>
            <p className="text-muted-foreground mb-4">
              We couldn't load the course content. Please check your internet connection.
            </p>
            <div className="flex gap-2 justify-center">
              <Button onClick={handleRetry}>
                <RefreshCw className="h-4 w-4 mr-2" /> Try Again
              </Button>
              <Button variant="outline" asChild>
                <Link to="/app/learning/my-courses">Go Back</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!content || !enrollment) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-4">You must be enrolled in this course to view it.</p>
            <Button asChild>
              <Link to="/app/learning/courses">Browse Courses</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentResources = stageResources.find((s) => s.stage === currentStage)?.resources || [];
  const hasAnyResources = stageResources.some((s) => s.resources.length > 0);
  const fallbackVideoUrl = currentModule?.video_url;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b px-4 py-3">
        <div className="flex items-center justify-between max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-4 min-w-0">
            <Button variant="ghost" size="sm" asChild className="shrink-0">
              <Link to="/app/learning/my-courses">
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Link>
            </Button>
            <div className="min-w-0">
              <h1 className="font-semibold text-sm sm:text-base truncate">{content.title}</h1>
              <p className="text-xs text-muted-foreground truncate">
                Module {currentModuleIndex + 1}: {currentModule?.title}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <div className="hidden sm:block w-32 md:w-48">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Progress</span>
                <span>{Math.round(overallProgress)}%</span>
              </div>
              <Progress value={overallProgress} className="h-2" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar (Desktop) */}
        <aside className="hidden lg:block w-80 border-r bg-muted/10 overflow-y-auto">
          <div className="p-4">
            <h3 className="font-semibold mb-4 px-2">Course Modules</h3>
            <ImmersiveModuleList
              modules={modules}
              currentModuleId={currentModuleId}
              moduleProgress={moduleProgress}
              onModuleSelect={handleModuleSelect}
            />
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto bg-background">
          <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
            {/* Mobile Module Nav */}
            <div className="lg:hidden mb-4">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                    <Menu className="h-4 w-4" />
                    <span className="truncate">Module {currentModuleIndex + 1}: {currentModule?.title}</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80 p-0">
                  <SheetHeader className="p-4 border-b">
                    <SheetTitle>Course Modules</SheetTitle>
                  </SheetHeader>
                  <div className="p-4 overflow-y-auto max-h-[calc(100vh-80px)]">
                    <ImmersiveModuleList
                      modules={modules}
                      currentModuleId={currentModuleId}
                      moduleProgress={moduleProgress}
                      onModuleSelect={(moduleId) => {
                        handleModuleSelect(moduleId);
                      }}
                    />
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            <StageNavigation
              currentStage={currentStage}
              completedStages={completedStages}
              onStageSelect={goToStage}
              className="mb-8"
            />

            {/* Stage Content */}
            <div className="min-h-[400px]">
              {/* Content Placeholder */}
              {!hasAnyResources && !fallbackVideoUrl && (
                <Card className="mb-6 border-dashed border-2 bg-muted/50">
                  <CardContent className="p-12 text-center">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                      <RefreshCw className="h-8 w-8 text-muted-foreground animate-spin-slow" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">Preparing Content</h3>
                    <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                      We are generating the immersive materials for this stage. Please check back shortly.
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Dynamic Stages */}
              {currentStage === 1 && (
                <OrientationStage
                  resources={currentResources}
                  onComplete={() => handleStageComplete(1)}
                  isCompleted={completedStages.includes(1)}
                  fallbackVideoUrl={fallbackVideoUrl}
                />
              )}

              {currentStage === 2 && (
                <LearnStage
                  resources={currentResources}
                  onComplete={() => handleStageComplete(2)}
                  isCompleted={completedStages.includes(2)}
                />
              )}

              {currentStage === 3 && (
                <DiscussStage
                  resources={currentResources}
                  onComplete={() => handleStageComplete(3)}
                  isCompleted={completedStages.includes(3)}
                  professionLineId={content.profession_line_id || ""}
                  moduleId={currentModuleId || ""}
                  instructorName={aiInstructor?.name}
                />
              )}

              {currentStage === 4 && (
                <PracticeStage
                  resources={currentResources}
                  onComplete={() => handleStageComplete(4)}
                  isCompleted={completedStages.includes(4)}
                  professionLineId={content.profession_line_id || ""}
                />
              )}

              {currentStage === 5 && (
                <AssessStage
                  contentId={content.id}
                  moduleId={currentModuleId || ""}
                  studentId={student?.id}
                  enrollmentId={enrollment.id}
                  passThreshold={content.pass_threshold || 70}
                  onComplete={handleQuizComplete}
                  isCompleted={completedStages.includes(5)}
                />
              )}

              {currentStage === 6 && (
                <ProgressStage
                  moduleName={currentModule?.title || ""}
                  moduleIndex={currentModuleIndex}
                  totalModules={modules.length}
                  completedStages={completedStages}
                  onNextModule={handleNextModule}
                  onComplete={() => handleStageComplete(6)}
                  isCompleted={completedStages.includes(6)}
                  hasNextModule={hasNextModule}
                />
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
