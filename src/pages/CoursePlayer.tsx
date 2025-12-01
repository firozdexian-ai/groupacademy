import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { VideoPlayer } from "@/components/player/VideoPlayer";
import { ModuleList } from "@/components/player/ModuleList";
import { ArrowLeft, BookOpen } from "lucide-react";
import { toast } from "sonner";

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
  const [course, setCourse] = useState<any>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [currentModule, setCurrentModule] = useState<Module | null>(null);
  const [studentId, setStudentId] = useState<string | null>(null);

  useEffect(() => {
    checkAccessAndLoadContent();
  }, [slug]);

  const checkAccessAndLoadContent = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Get student profile
      const { data: student } = await supabase
        .from("students")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!student) {
        toast.error("Student profile not found");
        navigate("/my-learning");
        return;
      }

      setStudentId(student.id);

      // Get course details
      const { data: courseData, error: courseError } = await supabase
        .from("content")
        .select("*")
        .eq("slug", slug)
        .single();

      if (courseError || !courseData) {
        toast.error("Course not found");
        navigate("/courses");
        return;
      }

      // Check enrollment
      const { data: enrollment } = await supabase
        .from("enrollments")
        .select("status")
        .eq("student_id", student.id)
        .eq("content_id", courseData.id)
        .single();

      if (!enrollment || !["active", "completed"].includes(enrollment.status)) {
        toast.error("You must be enrolled to access this course");
        navigate(`/courses/${slug}`);
        return;
      }

      setCourse(courseData);

      // Load modules
      const { data: modulesData, error: modulesError } = await supabase
        .from("course_modules")
        .select("*")
        .eq("content_id", courseData.id)
        .order("display_order");

      if (modulesError) throw modulesError;

      setModules(modulesData || []);
      if (modulesData && modulesData.length > 0) {
        setCurrentModule(modulesData[0]);
      }

      // Load progress
      const { data: progressData } = await supabase
        .from("student_progress")
        .select("*")
        .eq("student_id", student.id);

      setProgress(progressData || []);
    } catch (error: any) {
      console.error("Error loading course:", error);
      toast.error("Failed to load course content");
    } finally {
      setLoading(false);
    }
  };

  const handleModuleComplete = async (moduleId: string) => {
    if (!studentId) return;

    try {
      const { error } = await supabase
        .from("student_progress")
        .upsert({
          student_id: studentId,
          module_id: moduleId,
          completed_at: new Date().toISOString(),
        }, {
          onConflict: "student_id,module_id"
        });

      if (error) throw error;

      // Refresh progress
      const { data: progressData } = await supabase
        .from("student_progress")
        .select("*")
        .eq("student_id", studentId);

      setProgress(progressData || []);
      toast.success("Module marked as complete!");
    } catch (error: any) {
      console.error("Error updating progress:", error);
      toast.error("Failed to update progress");
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
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
