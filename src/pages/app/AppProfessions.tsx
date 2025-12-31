import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { getIcon } from "@/lib/iconMap";
import { 
  GraduationCap, 
  Building2, 
  ArrowRight,
  Bot,
  ArrowLeft,
  RefreshCw,
  AlertCircle
} from "lucide-react";

interface Academy {
  id: string;
  name: string;
  slug: string;
  academy_type: string;
  description: string;
}

interface School {
  id: string;
  name: string;
  slug: string;
  description: string;
  academy_id: string;
}

interface ProfessionLine {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  career_outcome: string;
  school_id: string;
  ai_instructors: { name: string }[] | { name: string } | null;
}

export default function AppProfessions() {
  const navigate = useNavigate();
  const [academies, setAcademies] = useState<Academy[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [professionLines, setProfessionLines] = useState<ProfessionLine[]>([]);
  const [selectedAcademy, setSelectedAcademy] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [loadingError, setLoadingError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoadingError(null);
    setIsLoading(true);
    
    try {
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
      
      if (academiesResult.data && academiesResult.data.length > 0) {
        setSelectedAcademy(academiesResult.data[0].slug);
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

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-5 w-64 mb-6" />
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-40 rounded-lg" />)}
        </div>
      </div>
    );
  }

  if (loadingError) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6 text-center">
        <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
        <h1 className="text-xl font-bold mb-2">Failed to Load</h1>
        <p className="text-muted-foreground mb-4">{loadingError}</p>
        <Button onClick={loadData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => navigate("/app/learning")}
        className="mb-4 -ml-2"
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> Back
      </Button>

      <div className="mb-6">
        <h1 className="text-2xl font-bold">Career Tracks</h1>
        <p className="text-muted-foreground">Explore structured learning paths for your profession</p>
      </div>

      <Tabs value={selectedAcademy} onValueChange={setSelectedAcademy}>
        <TabsList className="mb-6 w-full justify-start">
          {academies.map((academy) => (
            <TabsTrigger key={academy.slug} value={academy.slug} className="gap-2">
              {academy.academy_type === "executive" ? (
                <Building2 className="h-4 w-4" />
              ) : (
                <GraduationCap className="h-4 w-4" />
              )}
              {academy.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {academies.map((academy) => (
          <TabsContent key={academy.slug} value={academy.slug} className="space-y-8">
            {getSchoolsForAcademy(academy.id).map((school) => (
              <div key={school.id}>
                <h3 className="text-lg font-semibold mb-3">{school.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">{school.description}</p>

                <div className="grid gap-4 md:grid-cols-2">
                  {getProfessionLinesForSchool(school.id).map((profession) => {
                    const IconComponent = getIcon(profession.icon);
                    const aiInstructors = profession.ai_instructors;
                    const hasAIInstructor = aiInstructors && (Array.isArray(aiInstructors) ? aiInstructors.length > 0 : true);

                    return (
                      <Card
                        key={profession.id}
                        className="cursor-pointer hover:shadow-md hover:border-primary/50 transition-all"
                        onClick={() => navigate(`/app/learning/tracks/${profession.slug}`)}
                      >
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                              <IconComponent className="h-5 w-5 text-primary" />
                            </div>
                            {hasAIInstructor && (
                              <Badge variant="secondary" className="gap-1 text-xs">
                                <Bot className="h-3 w-3" />
                                AI
                              </Badge>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent>
                          <CardTitle className="text-base mb-1">{profession.name}</CardTitle>
                          <CardDescription className="line-clamp-2 text-sm">
                            {profession.description}
                          </CardDescription>
                          <Button variant="ghost" size="sm" className="mt-3 -ml-2 text-xs">
                            Explore <ArrowRight className="h-3 w-3 ml-1" />
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}

                  {getProfessionLinesForSchool(school.id).length === 0 && (
                    <Card className="col-span-full border-dashed">
                      <CardContent className="py-8 text-center text-muted-foreground">
                        Coming soon
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            ))}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
