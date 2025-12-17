import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { VideoPlayer } from "@/components/player/VideoPlayer";
import { ModuleList } from "@/components/player/ModuleList";
import { ArrowLeft, BookOpen, RefreshCw, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { withTimeout } from "@/hooks/useQueryWithTimeout";
import { TIMEOUTS } from "@/lib/timeoutConfig";

interface Module {
  id: string;
  title: string;
  description: string | null;
  video_url: string | null;
  duration_minutes: number | null;
  display_order: number;
  is_preview: boolean;
}

interface Progress {
  module_id: string;
  completed_at: string | null;
  last_watched_position: number;
}

export default function CoursePlayer() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [course, setCourse] = useState<any>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [currentModule, setCurrentModule] = useState<Module | null>(null);
  const [studentId, setStudentId] = useState<string | null>(null);

  useEffect(() => {
    checkAccessAndLoadContent();
  }, [slug]);

  const checkAccessAndLoadContent = async () => {
    setLoading(true);
    setLoadingError(null);
    
    try {
      // Get user with timeout
      const { data: { user } } = await withTimeout(
        supabase.auth.getUser(),
        TIMEOUTS.AUTH,
        "Authentication check timed out"
      );
      
      if (!user) {
        navigate("/auth");
        return;
      }

      // Get student profile with timeout
      const { data: student } = await withTimeout(
        Promise.resolve(supabase
          .from("students")
          .select("id")
          .eq("user_id", user.id)
          .single()),
        TIMEOUTS.DEFAULT,
        "Loading profile timed out"
      );

      if (!student) {
        toast.error("Student profile not found");
        navigate("/my-learning");
        return;
      }

      setStudentId(student.id);

      // Get course details with timeout
      const { data: courseData, error: courseError } = await withTimeout(
        Promise.resolve(supabase
          .from("content")
          .select("*")
          .eq("slug", slug)
          .single()),
        TIMEOUTS.DEFAULT,
        "Loading course timed out"
      );

      if (courseError || !courseData) {
        toast.error("Course not found");
        navigate("/courses");
        return;
      }

      // Check enrollment with timeout
      const { data: enrollment } = await withTimeout(
        Promise.resolve(supabase
          .from("enrollments")
          .select("status")
          .eq("student_id", student.id)
          .eq("content_id", courseData.id)
          .single()),
        TIMEOUTS.DEFAULT,
        "Checking enrollment timed out"
      );

      if (!enrollment || !["active", "completed"].includes(enrollment.status)) {
        toast.error("You must be enrolled to access this course");
        navigate(`/courses/${slug}`);
        return;
      }

      setCourse(courseData);

      // Load modules with timeout
      const { data: modulesData, error: modulesError } = await withTimeout(
        Promise.resolve(supabase
          .from("course_modules")
          .select("*")
          .eq("content_id", courseData.id)
          .order("display_order")),
        TIMEOUTS.DEFAULT,
        "Loading modules timed out"
      );

      if (modulesError) throw modulesError;

      setModules(modulesData || []);
      if (modulesData && modulesData.length > 0) {
        setCurrentModule(modulesData[0]);
      }

      // Load progress with timeout
      const { data: progressData } = await withTimeout(
        Promise.resolve(supabase
          .from("student_progress")
          .select("*")
          .eq("student_id", student.id)),
        TIMEOUTS.DEFAULT,
        "Loading progress timed out"
      );

      setProgress(progressData || []);
    } catch (error: any) {
      console.error("Error loading course:", error);
      const isTimeout = error.message?.includes("timed out");
      setLoadingError(
        isTimeout 
          ? "Loading took too long. Please check your connection and try again."
          : "Failed to load course content. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleModuleComplete = async (moduleId: string) => {
    if (!studentId) return;

    try {
      const { error } = await withTimeout(
        Promise.resolve(supabase
          .from("student_progress")
          .upsert({
            student_id: studentId,
            module_id: moduleId,
            completed_at: new Date().toISOString(),
          }, {
            onConflict: "student_id,module_id"
          })),
        TIMEOUTS.DEFAULT,
        "Updating progress timed out"
      );

      if (error) throw error;

      // Refresh progress with timeout
      const { data: progressData } = await withTimeout(
        Promise.resolve(supabase
          .from("student_progress")
          .select("*")
          .eq("student_id", studentId)),
        TIMEOUTS.DEFAULT,
        "Loading progress timed out"
      );

      setProgress(progressData || []);
      toast.success("Module marked as complete!");
    } catch (error: any) {
      console.error("Error updating progress:", error);
      const isTimeout = error.message?.includes("timed out");
      toast.error(isTimeout ? "Update timed out. Please try again." : "Failed to update progress");
    }
  };

  const calculateProgress = () => {
    if (modules.length === 0) return 0;
    const completed = progress.filter(p => p.completed_at).length;
    return Math.round((completed / modules.length) * 100);
  };

  const allModulesCompleted = () => {
    return modules.length > 0 && progress.filter(p => p.completed_at).length === modules.length;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b bg-card">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-9 w-36" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
            <Skeleton className="h-2 w-full mt-4" />
          </div>
        </div>
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Skeleton className="aspect-video w-full rounded-lg" />
            </div>
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loadingError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Failed to Load Course</h2>
            <p className="text-muted-foreground mb-4">{loadingError}</p>
            <div className="flex gap-2 justify-center">
              <Button onClick={checkAccessAndLoadContent}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              <Button variant="outline" asChild>
                <Link to="/my-learning">Back to My Learning</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!course) {
    return null;
  }

  const progressPercentage = calculateProgress();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate("/my-learning")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to My Learning
              </Button>
              <div>
                <h1 className="text-xl font-bold">{course.title}</h1>
                <p className="text-sm text-muted-foreground">
                  {progress.filter(p => p.completed_at).length} of {modules.length} modules completed
                </p>
              </div>
            </div>
            {course.quiz_enabled && allModulesCompleted() && (
              <Button asChild>
                <Link to={`/quiz/${slug}`}>
                  <BookOpen className="h-4 w-4 mr-2" />
                  Take Quiz
                </Link>
              </Button>
            )}
          </div>
          <div className="mt-4">
            <Progress value={progressPercentage} className="h-2" />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video Player */}
          <div className="lg:col-span-2">
            {currentModule ? (
              <VideoPlayer
                module={currentModule}
                onComplete={() => handleModuleComplete(currentModule.id)}
                isCompleted={progress.some(p => p.module_id === currentModule.id && p.completed_at)}
              />
            ) : (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">No modules available yet</p>
              </Card>
            )}
          </div>

          {/* Module List */}
          <div className="lg:col-span-1">
            <ModuleList
              modules={modules}
              progress={progress}
              currentModuleId={currentModule?.id}
              onModuleSelect={(module) => setCurrentModule(module)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}