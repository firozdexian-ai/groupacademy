import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getIcon } from "@/lib/iconMap";
import { BookOpen, Building2, Laptop, Rocket, ArrowRight, Bot, RefreshCw, AlertCircle, GraduationCap } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface Academy { id: string; name: string; slug: string; academy_type: string; description: string; }
interface School { id: string; name: string; slug: string; description: string; academy_id: string; }
interface ProfessionLine { id: string; name: string; slug: string; description: string; icon: string; career_outcome: string; school_id: string; ai_instructors: { name: string }[] | { name: string } | null; }
interface Enrollment { id: string; progress: number; status: string; content: { title: string; profession_line_id: string | null } | null; }

type Category = "my-program" | "executive" | "freelancing" | "entrepreneurship";

const categories: { key: Category; icon: typeof BookOpen; label: string }[] = [
  { key: "my-program", icon: BookOpen, label: "My Program" },
  { key: "executive", icon: Building2, label: "Executive" },
  { key: "freelancing", icon: Laptop, label: "Freelancing" },
  { key: "entrepreneurship", icon: Rocket, label: "Entrepreneurship" },
];

const academyTypeMap: Record<string, Category> = {
  executive: "executive",
  freelancing: "freelancing",
  entrepreneurship: "entrepreneurship",
};

export function TracksTab() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<Category>("my-program");
  const [academies, setAcademies] = useState<Academy[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [professionLines, setProfessionLines] = useState<ProfessionLine[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingError, setLoadingError] = useState<string | null>(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoadingError(null);
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const [academiesResult, schoolsResult, professionsResult] = await Promise.all([
        supabase.from("academies").select("*").eq("is_active", true).order("display_order"),
        supabase.from("schools").select("*").eq("is_active", true).order("display_order"),
        supabase.from("profession_categories").select(`*, ai_instructors(name)`).eq("is_active", true).not("school_id", "is", null).order("display_order"),
      ]);

      if (academiesResult.error) throw academiesResult.error;
      if (schoolsResult.error) throw schoolsResult.error;
      if (professionsResult.error) throw professionsResult.error;

      setAcademies(academiesResult.data || []);
      setSchools(schoolsResult.data || []);
      setProfessionLines((professionsResult.data as ProfessionLine[]) || []);

      // Load enrollments for My Program
      if (user) {
        const { data: talent } = await supabase
          .from("talents")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (talent) {
          const { data: enrollmentData } = await supabase
            .from("enrollments")
            .select("id, progress, status, content(title, profession_line_id)")
            .eq("talent_id", talent.id)
            .order("created_at", { ascending: false });

          setEnrollments((enrollmentData as unknown as Enrollment[]) || []);
        }
      }
    } catch (error: any) {
      console.error("Error loading data:", error);
      setLoadingError("Failed to load career tracks.");
    } finally {
      setIsLoading(false);
    }
  };

  const getSchoolsForAcademy = (academyId: string) => schools.filter((s) => s.academy_id === academyId);
  const getProfessionLinesForSchool = (schoolId: string) => professionLines.filter((p) => p.school_id === schoolId);
  const getAcademyForCategory = (cat: Category) => academies.find((a) => academyTypeMap[a.academy_type] === cat);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-4 gap-2">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20 rounded-lg" />)}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-40 rounded-lg" />)}
        </div>
      </div>
    );
  }

  if (loadingError) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
        <p className="text-muted-foreground mb-4">{loadingError}</p>
        <Button onClick={loadData}><RefreshCw className="h-4 w-4 mr-2" /> Try Again</Button>
      </div>
    );
  }

  const activeEnrollments = enrollments.filter(e => e.status !== "completed");
  const completedEnrollments = enrollments.filter(e => e.status === "completed");

  const renderMyProgram = () => (
    <div className="space-y-6">
      {activeEnrollments.length > 0 && (
        <div>
          <h3 className="text-base font-semibold mb-3">Active Tracks</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {activeEnrollments.map((enrollment) => (
              <Card key={enrollment.id} className="hover:shadow-md transition-all">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <GraduationCap className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base mb-1">{enrollment.content?.title || "Career Track"}</CardTitle>
                      <div className="flex items-center gap-2 mb-2">
                        <Progress value={enrollment.progress || 0} className="h-2 flex-1" />
                        <span className="text-xs text-muted-foreground shrink-0">{enrollment.progress || 0}%</span>
                      </div>
                      <Badge variant="secondary" className="text-xs">In Progress</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {completedEnrollments.length > 0 && (
        <div>
          <h3 className="text-base font-semibold mb-3">Completed Tracks</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {completedEnrollments.map((enrollment) => (
              <Card key={enrollment.id} className="border-green-200 dark:border-green-800">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                      <GraduationCap className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base mb-1">{enrollment.content?.title || "Career Track"}</CardTitle>
                      <Badge variant="outline" className="text-xs text-green-600 border-green-300">✓ Completed</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {enrollments.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-10 text-center">
            <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground mb-3">You haven't enrolled in any career track yet.</p>
            <Button variant="outline" size="sm" onClick={() => setSelectedCategory("executive")}>
              Browse Academies <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderAcademy = (category: Category) => {
    const academy = getAcademyForCategory(category);
    if (!academy) {
      return (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center text-muted-foreground">Coming soon</CardContent>
        </Card>
      );
    }

    const academySchools = getSchoolsForAcademy(academy.id);

    return (
      <div className="space-y-8">
        {academySchools.map((school) => (
          <div key={school.id}>
            <h3 className="text-lg font-semibold mb-3">{school.name}</h3>
            <p className="text-sm text-muted-foreground mb-4">{school.description}</p>
            <div className="grid gap-4 md:grid-cols-2">
              {getProfessionLinesForSchool(school.id).map((profession) => {
                const IconComponent = getIcon(profession.icon);
                const aiInstructors = profession.ai_instructors;
                const hasAIInstructor = aiInstructors && (Array.isArray(aiInstructors) ? aiInstructors.length > 0 : true);
                return (
                  <Card key={profession.id} className="cursor-pointer hover:shadow-md hover:border-primary/50 transition-all" onClick={() => navigate(`/app/learning/tracks/${profession.slug}`)}>
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <IconComponent className="h-5 w-5 text-primary" />
                        </div>
                        {hasAIInstructor && <Badge variant="secondary" className="gap-1 text-xs"><Bot className="h-3 w-3" /> AI</Badge>}
                      </div>
                      <CardTitle className="text-base mb-1">{profession.name}</CardTitle>
                      <CardDescription className="line-clamp-2 text-sm">{profession.description}</CardDescription>
                      <Button variant="ghost" size="sm" className="mt-3 -ml-2 text-xs">Explore <ArrowRight className="h-3 w-3 ml-1" /></Button>
                    </CardContent>
                  </Card>
                );
              })}
              {getProfessionLinesForSchool(school.id).length === 0 && (
                <Card className="col-span-full border-dashed"><CardContent className="py-8 text-center text-muted-foreground">Coming soon</CardContent></Card>
              )}
            </div>
          </div>
        ))}
        {academySchools.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="py-8 text-center text-muted-foreground">Schools coming soon</CardContent>
          </Card>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Icon strip navigation */}
      <div className="grid grid-cols-4 gap-2">
        {categories.map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            onClick={() => setSelectedCategory(key)}
            className={`flex flex-col items-center gap-1.5 rounded-xl p-3 text-xs font-medium transition-colors ${
              selectedCategory === key
                ? "bg-primary/10 text-primary"
                : "bg-muted/50 text-muted-foreground hover:bg-muted"
            }`}
          >
            <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
              selectedCategory === key ? "bg-primary/20" : "bg-background"
            }`}>
              <Icon className="h-5 w-5" />
            </div>
            <span className="text-center leading-tight">{label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      {selectedCategory === "my-program" && renderMyProgram()}
      {selectedCategory !== "my-program" && renderAcademy(selectedCategory)}
    </div>
  );
}
