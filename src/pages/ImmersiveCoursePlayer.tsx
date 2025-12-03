import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Loader2 } from "lucide-react";
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

interface ModuleProgressState {
  completedStages: number[];
  isComplete: boolean;
}
import { toast } from "sonner";

export default function ImmersiveCoursePlayer() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentModuleId, setCurrentModuleId] = useState<string | undefined>();
  const [moduleProgress, setModuleProgress] = useState<Record<string, ModuleProgressState>>({});

  // Fetch course content
  const { data: content, isLoading: contentLoading } = useQuery({
    queryKey: ["course-content", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("content")
        .select("*, profession_categories:profession_line_id(*)")
        .eq("slug", slug)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  // Fetch course modules
  const { data: modules = [], isLoading: modulesLoading } = useQuery({
    queryKey: ["course-modules", content?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("course_modules")
        .select("*")
        .eq("content_id", content!.id)
        .order("display_order");
      if (error) throw error;
      return data;
    },
    enabled: !!content?.id,
  });

  // Fetch student profile
  const { data: student } = useQuery({
    queryKey: ["student-profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select("*")
        .eq("user_id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch enrollment
  const { data: enrollment } = useQuery({
    queryKey: ["enrollment", student?.id, content?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("enrollments")
        .select("*")
        .eq("student_id", student!.id)
        .eq("content_id", content!.id)
        .in("status", ["active", "completed"])
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!student?.id && !!content?.id,
  });

  // Fetch AI instructor for profession line
  const { data: aiInstructor } = useQuery({
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
  });

  // Set initial module
  useEffect(() => {
    if (modules.length > 0 && !currentModuleId) {
      setCurrentModuleId(modules[0].id);
    }
  }, [modules, currentModuleId]);

  // Fetch resources for current module
  const { data: stageResources = [] } = useModuleResourcesByStage(currentModuleId);

  // Stage progress management
  const {
    completedStages,
    setCompletedStages,
    currentStage,
    setCurrentStage,
    markStageComplete,
    goToStage,
  } = useStageProgress({
    studentId: student?.id,
  });

  const currentModule = modules.find(m => m.id === currentModuleId);
  const currentModuleIndex = modules.findIndex(m => m.id === currentModuleId);
  const hasNextModule = currentModuleIndex < modules.length - 1;

  const handleStageComplete = (stageNumber: number) => {
    markStageComplete(stageNumber);
    
    // Update module progress
    if (currentModuleId) {
      setModuleProgress(prev => ({
        ...prev,
        [currentModuleId]: {
          completedStages: [...(prev[currentModuleId]?.completedStages || []), stageNumber],
          isComplete: stageNumber === 5 || stageNumber === 6,
        }
      }));
    }

    // Auto-advance
    if (stageNumber < 6) {
      setCurrentStage(stageNumber + 1);
    }
    
    toast.success(`Stage ${stageNumber} completed!`);
  };

  const handleNextModule = () => {
    if (hasNextModule) {
      const nextModule = modules[currentModuleIndex + 1];
      setCurrentModuleId(nextModule.id);
      setCurrentStage(1);
      setCompletedStages([]);
    }
  };

  const handleModuleSelect = (moduleId: string) => {
    setCurrentModuleId(moduleId);
    setCurrentStage(1);
    setCompletedStages(moduleProgress[moduleId]?.completedStages || []);
  };

  const handleQuizComplete = (passed: boolean, score: number) => {
    if (passed) {
      handleStageComplete(5);
    }
  };

  // Calculate overall progress
  const totalStages = modules.length * 6;
  const completedTotal = Object.values(moduleProgress).reduce(
    (sum, mp) => sum + mp.completedStages.length, 0
  ) + completedStages.length;
  const overallProgress = totalStages > 0 ? (completedTotal / totalStages) * 100 : 0;

  if (contentLoading || modulesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!content) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Course not found</p>
      </div>
    );
  }

  if (!enrollment) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-4">
        <p className="text-muted-foreground">You are not enrolled in this course</p>
        <Button asChild>
          <Link to={`/courses/${slug}`}>View Course Details</Link>
        </Button>
      </div>
    );
  }

  const currentResources = stageResources.find(s => s.stage === currentStage)?.resources || [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background border-b px-4 py-3">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/my-learning">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Link>
            </Button>
            <div>
              <h1 className="font-semibold truncate max-w-md">{content.title}</h1>
              <p className="text-xs text-muted-foreground">
                Module {currentModuleIndex + 1} of {modules.length}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden sm:block w-48">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Progress</span>
                <span>{Math.round(overallProgress)}%</span>
              </div>
              <Progress value={overallProgress} className="h-2" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-65px)]">
        {/* Module Sidebar */}
        <aside className="hidden lg:block w-80 border-r p-4 overflow-hidden">
          <ImmersiveModuleList
            modules={modules}
            currentModuleId={currentModuleId}
            moduleProgress={moduleProgress}
            onModuleSelect={handleModuleSelect}
          />
        </aside>

        {/* Stage Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto p-6">
            {/* Stage Navigation */}
            <StageNavigation
              currentStage={currentStage}
              completedStages={completedStages}
              onStageSelect={goToStage}
              className="mb-6"
            />

            {/* Current Module Title */}
            {currentModule && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold">{currentModule.title}</h2>
                {currentModule.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {currentModule.description}
                  </p>
                )}
              </div>
            )}

            {/* Stage Content */}
            {currentStage === 1 && (
              <OrientationStage
                resources={currentResources}
                onComplete={() => handleStageComplete(1)}
                isCompleted={completedStages.includes(1)}
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
                enrollmentId={enrollment?.id}
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
        </main>
      </div>
    </div>
  );
}
