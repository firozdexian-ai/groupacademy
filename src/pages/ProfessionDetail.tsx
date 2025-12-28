import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AIChatPanel } from "@/components/ai-instructor/AIChatPanel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { withTimeout } from "@/hooks/useQueryWithTimeout";
import { 
  Bot, 
  BookOpen, 
  Target, 
  Clock, 
  Users, 
  ArrowRight,
  GraduationCap,
  Briefcase,
  ChevronRight,
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
  icon: string;
  target_audience: string;
  career_outcome: string;
  schools: {
    name: string;
    academies: {
      name: string;
    };
  };
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
  profession_levels: {
    name: string;
    slug: string;
  };
}

export default function ProfessionDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [profession, setProfession] = useState<ProfessionLine | null>(null);
  const [aiInstructor, setAIInstructor] = useState<AIInstructor | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);

  useEffect(() => {
    if (slug) {
      loadProfessionData();
    }
  }, [slug]);

  const loadProfessionData = async () => {
    setLoadingError(null);
    try {
      // Load profession line with timeout
      const { data: professionData, error } = await withTimeout(
        Promise.resolve(
          supabase
            .from("profession_categories")
            .select(`
              *,
              schools(
                name,
                academies(name)
              )
            `)
            .eq("slug", slug)
            .single()
        ),
        30000,
        "Loading timed out"
      );

      if (error) throw error;

      if (professionData) {
        setProfession(professionData);

        // Load AI instructor
        const { data: instructorData } = await supabase
          .from("ai_instructors")
          .select("*")
          .eq("profession_line_id", professionData.id)
          .eq("is_active", true)
          .maybeSingle();

        setAIInstructor(instructorData);

        // Load courses
        const { data: coursesData } = await supabase
          .from("content")
          .select(`
            id,
            title,
            slug,
            description,
            estimated_hours,
            modules_count,
            profession_levels(name, slug)
          `)
          .eq("profession_line_id", professionData.id)
          .eq("is_published", true)
          .order("display_order");

        setCourses(coursesData || []);
      }
    } catch (error: any) {
      console.error("Error loading profession data:", error);
      setLoadingError(error.message?.includes("timed out") 
        ? "Loading took too long. Please try again."
        : "Failed to load profession data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-12">
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-12 w-96 mb-4" />
          <Skeleton className="h-6 w-full max-w-2xl mb-8" />
          <div className="grid gap-6 md:grid-cols-2">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (loadingError) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-12 text-center">
          <AlertCircle className="h-16 w-16 mx-auto text-destructive mb-4" />
          <h1 className="text-2xl font-bold mb-2">Failed to Load</h1>
          <p className="text-muted-foreground mb-4">{loadingError}</p>
          <div className="flex gap-2 justify-center">
            <Button onClick={() => { setIsLoading(true); loadProfessionData(); }}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            <Button variant="outline" onClick={() => navigate("/professions")}>
              Browse Professions
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!profession) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-12 text-center">
          <GraduationCap className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
          <h1 className="text-2xl font-bold mb-2">Profession Not Found</h1>
          <p className="text-muted-foreground mb-4">
            The profession line you're looking for doesn't exist.
          </p>
          <Button onClick={() => navigate("/professions")}>
            Browse All Professions
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  // Group courses by level
  const coursesByLevel = courses.reduce((acc, course) => {
    const level = course.profession_levels?.slug || "foundation";
    if (!acc[level]) acc[level] = [];
    acc[level].push(course);
    return acc;
  }, {} as Record<string, Course[]>);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Breadcrumb */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span 
            className="hover:text-foreground cursor-pointer"
            onClick={() => navigate("/professions")}
          >
            Professions
          </span>
          <ChevronRight className="h-4 w-4" />
          <span>{profession.schools?.academies?.name}</span>
          <ChevronRight className="h-4 w-4" />
          <span>{profession.schools?.name}</span>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">{profession.name}</span>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative py-12 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 lg:grid-cols-2">
            <div>
              <Badge variant="outline" className="mb-4">
                {profession.schools?.name}
              </Badge>
              <h1 className="text-3xl md:text-4xl font-bold mb-4">
                {profession.name}
              </h1>
              <p className="text-lg text-muted-foreground mb-6">
                {profession.description}
              </p>
              
              <div className="space-y-3 mb-6">
                {profession.target_audience && (
                  <div className="flex items-start gap-3">
                    <Users className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Target Audience</p>
                      <p className="text-sm text-muted-foreground">{profession.target_audience}</p>
                    </div>
                  </div>
                )}
                {profession.career_outcome && (
                  <div className="flex items-start gap-3">
                    <Target className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Career Outcome</p>
                      <p className="text-sm text-muted-foreground">{profession.career_outcome}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-3">
                <Badge variant="secondary" className="gap-1">
                  <BookOpen className="h-3 w-3" />
                  {courses.length} Courses
                </Badge>
                {aiInstructor && (
                  <Badge variant="secondary" className="gap-1">
                    <Bot className="h-3 w-3" />
                    AI Instructor: {aiInstructor.name}
                  </Badge>
                )}
              </div>
              
              {/* Career Assessment CTA */}
              <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/20">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <ClipboardCheck className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm">Check Your Readiness</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Take our free AI-powered assessment to see how ready you are for a career in {profession.name}.
                    </p>
                    <Button 
                      size="sm" 
                      className="mt-3 gap-2"
                      onClick={() => navigate(`/career-assessment?profession=${profession.id}`)}
                    >
                      <ClipboardCheck className="h-4 w-4" />
                      Take Free Assessment
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Instructor Card */}
            {aiInstructor && (
              <Card className="border-primary/20">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Bot className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Meet {aiInstructor.name}</CardTitle>
                      <CardDescription>Your AI Instructor</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                    {aiInstructor.persona}
                  </p>
                  {aiInstructor.expertise_areas && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {aiInstructor.expertise_areas.slice(0, 4).map((area) => (
                        <Badge key={area} variant="outline" className="text-xs">
                          {area}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <Button 
                    className="w-full gap-2"
                    onClick={() => setShowChat(!showChat)}
                  >
                    <MessageSquare className="h-4 w-4" />
                    {showChat ? "Hide Chat" : "Chat with " + aiInstructor.name}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </section>

      {/* AI Chat Panel (Expandable) */}
      {showChat && aiInstructor && (
        <div className="container mx-auto px-4 py-6">
          <Card className="overflow-hidden">
            <div className="h-[400px]">
              <AIChatPanel
                professionLineId={profession.id}
                instructorName={aiInstructor.name}
                placeholder={`Ask ${aiInstructor.name} about career advice, learning tips, or anything about ${profession.name}...`}
                className="h-full border-0"
              />
            </div>
          </Card>
        </div>
      )}

      {/* Courses Section */}
      <main className="container mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold mb-6">Learning Path</h2>
        
        <Tabs defaultValue="foundation" className="space-y-6">
          <TabsList>
            <TabsTrigger value="foundation" className="gap-2">
              <GraduationCap className="h-4 w-4" />
              Foundation
            </TabsTrigger>
            <TabsTrigger value="intermediate" className="gap-2" disabled={!coursesByLevel.intermediate?.length}>
              <Briefcase className="h-4 w-4" />
              Intermediate
            </TabsTrigger>
            <TabsTrigger value="executive" className="gap-2" disabled={!coursesByLevel.executive?.length}>
              <Target className="h-4 w-4" />
              Executive
            </TabsTrigger>
          </TabsList>

          {["foundation", "intermediate", "executive"].map((level) => (
            <TabsContent key={level} value={level}>
              {coursesByLevel[level]?.length ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {coursesByLevel[level].map((course, index) => (
                    <Card 
                      key={course.id}
                      className="group hover:shadow-lg transition-all duration-300 hover:border-primary/50 cursor-pointer"
                      onClick={() => navigate(`/courses/${course.slug}`)}
                    >
                      <CardHeader>
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline" className="text-xs">
                            Course {index + 1}
                          </Badge>
                          {course.estimated_hours && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {course.estimated_hours}h
                            </span>
                          )}
                        </div>
                        <CardTitle className="text-lg group-hover:text-primary transition-colors line-clamp-2">
                          {course.title}
                        </CardTitle>
                        <CardDescription className="line-clamp-2">
                          {course.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">
                            {course.modules_count || 4} Modules
                          </span>
                          <Button variant="ghost" size="sm" className="gap-1">
                            <Play className="h-4 w-4" />
                            Start
                            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <BookOpen className="h-12 w-12 text-muted-foreground/30 mb-4" />
                    <p className="text-muted-foreground">
                      {level.charAt(0).toUpperCase() + level.slice(1)} level courses coming soon
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </main>

      <Footer />
    </div>
  );
}
