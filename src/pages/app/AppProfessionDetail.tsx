import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AIChatPanel } from "@/components/ai-instructor/AIChatPanel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Bot, 
  BookOpen, 
  Target, 
  Clock, 
  Users, 
  ArrowRight,
  ArrowLeft,
  GraduationCap,
  Briefcase,
  MessageSquare,
  Play,
  RefreshCw,
  AlertCircle,
  ClipboardCheck
} from "lucide-react";

interface ProfessionLine {
  id: string;
  name: string;
  slug: string;
  description: string;
  target_audience: string;
  career_outcome: string;
  schools: { name: string; academies: { name: string } };
}

interface AIInstructor {
  id: string;
  name: string;
  persona: string;
  expertise_areas: string[];
}

interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  estimated_hours: number;
  modules_count: number;
  profession_levels: { name: string; slug: string };
}

export default function AppProfessionDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [profession, setProfession] = useState<ProfessionLine | null>(null);
  const [aiInstructor, setAIInstructor] = useState<AIInstructor | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);

  useEffect(() => {
    if (slug) loadProfessionData();
  }, [slug]);

  const loadProfessionData = async () => {
    setLoadingError(null);
    try {
      const { data: professionData, error } = await supabase
        .from("profession_categories")
        .select(`*, schools(name, academies(name))`)
        .eq("slug", slug)
        .single();

      if (error) throw error;

      if (professionData) {
        setProfession(professionData);

        const { data: instructorData } = await supabase
          .from("ai_instructors")
          .select("*")
          .eq("profession_line_id", professionData.id)
          .eq("is_active", true)
          .maybeSingle();

        setAIInstructor(instructorData);

        const { data: coursesData } = await supabase
          .from("content")
          .select(`id, title, slug, description, estimated_hours, modules_count, profession_levels(name, slug)`)
          .eq("profession_line_id", professionData.id)
          .eq("is_published", true)
          .order("display_order");

        setCourses(coursesData || []);
      }
    } catch (error: any) {
      console.error("Error loading profession data:", error);
      setLoadingError("Failed to load profession data.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-4">
        <Skeleton className="h-8 w-24 mb-4" />
        <Skeleton className="h-10 w-3/4 mb-2" />
        <Skeleton className="h-5 w-full mb-6" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  if (loadingError || !profession) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-4 text-center">
        <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
        <h1 className="text-xl font-bold mb-2">Failed to Load</h1>
        <p className="text-muted-foreground mb-4">{loadingError || "Profession not found"}</p>
        <div className="flex gap-2 justify-center">
          <Button onClick={loadProfessionData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
          <Button variant="outline" onClick={() => navigate("/app/learning/tracks")}>
            Browse Tracks
          </Button>
        </div>
      </div>
    );
  }

  const coursesByLevel = courses.reduce((acc, course) => {
    const level = course.profession_levels?.slug || "foundation";
    if (!acc[level]) acc[level] = [];
    acc[level].push(course);
    return acc;
  }, {} as Record<string, Course[]>);

  return (
    <div className="max-w-4xl mx-auto px-4 py-4">
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => navigate("/app/learning/tracks")}
        className="mb-4 -ml-2"
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> Back
      </Button>

      {/* Header */}
      <div className="mb-6">
        <Badge variant="outline" className="mb-2">{profession.schools?.name}</Badge>
        <h1 className="text-2xl font-bold mb-2">{profession.name}</h1>
        <p className="text-muted-foreground">{profession.description}</p>
      </div>

      {/* Quick Stats */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Badge variant="secondary" className="gap-1">
          <BookOpen className="h-3 w-3" />
          {courses.length} Courses
        </Badge>
        {aiInstructor && (
          <Badge variant="secondary" className="gap-1">
            <Bot className="h-3 w-3" />
            AI: {aiInstructor.name}
          </Badge>
        )}
      </div>

      {/* Career Assessment CTA */}
      <Card className="mb-6 bg-primary/5 border-primary/20">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <ClipboardCheck className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-sm">Check Your Readiness</h4>
            <p className="text-xs text-muted-foreground">Take our free assessment</p>
          </div>
          <Button 
            size="sm"
            onClick={() => navigate(`/career-assessment?profession=${profession.id}`)}
          >
            Start
          </Button>
        </CardContent>
      </Card>

      {/* AI Instructor */}
      {aiInstructor && (
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">Meet {aiInstructor.name}</CardTitle>
                <CardDescription>Your AI Instructor</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{aiInstructor.persona}</p>
            <Button 
              variant="outline"
              size="sm"
              onClick={() => setShowChat(!showChat)}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              {showChat ? "Hide Chat" : "Chat Now"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* AI Chat */}
      {showChat && aiInstructor && (
        <Card className="mb-6 overflow-hidden">
          <div className="h-[300px]">
            <AIChatPanel
              professionLineId={profession.id}
              instructorName={aiInstructor.name}
              placeholder={`Ask ${aiInstructor.name} about ${profession.name}...`}
              className="h-full border-0"
            />
          </div>
        </Card>
      )}

      {/* Courses */}
      <h2 className="text-lg font-semibold mb-4">Learning Path</h2>
      
      <Tabs defaultValue="foundation" className="space-y-4">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="foundation" className="gap-1 text-sm">
            <GraduationCap className="h-3 w-3" /> Level 1
          </TabsTrigger>
          <TabsTrigger value="intermediate" className="gap-1 text-sm" disabled={!coursesByLevel.intermediate?.length}>
            <Briefcase className="h-3 w-3" /> Level 2
          </TabsTrigger>
          <TabsTrigger value="executive" className="gap-1 text-sm" disabled={!coursesByLevel.executive?.length}>
            <Target className="h-3 w-3" /> Level 3
          </TabsTrigger>
        </TabsList>

        {["foundation", "intermediate", "executive"].map((level) => (
          <TabsContent key={level} value={level}>
            {coursesByLevel[level]?.length ? (
              <div className="grid gap-4 md:grid-cols-2">
                {coursesByLevel[level].map((course, index) => (
                  <Card 
                    key={course.id}
                    className="cursor-pointer hover:shadow-md hover:border-primary/50 transition-all"
                    onClick={() => navigate(`/app/learning/courses/${course.slug}`)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between mb-1">
                        <Badge variant="outline" className="text-xs">Course {index + 1}</Badge>
                        {course.estimated_hours && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {course.estimated_hours}h
                          </span>
                        )}
                      </div>
                      <CardTitle className="text-base line-clamp-1">{course.title}</CardTitle>
                      <CardDescription className="line-clamp-2 text-sm">{course.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">{course.modules_count || 4} Modules</span>
                        <Button variant="ghost" size="sm" className="gap-1 text-xs">
                          <Play className="h-3 w-3" /> Start
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-dashed">
                <CardContent className="py-8 text-center text-muted-foreground">
                  {level === 'foundation' ? 'Level 1' : level === 'intermediate' ? 'Level 2' : 'Level 3'} courses coming soon
                </CardContent>
              </Card>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
