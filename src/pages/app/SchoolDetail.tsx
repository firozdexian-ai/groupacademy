import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getIcon } from "@/lib/iconMap";
import { ArrowLeft, ArrowRight, Bot, RefreshCw, AlertCircle } from "lucide-react";

interface School {
  id: string;
  name: string;
  slug: string;
  description: string;
  academies: { name: string; slug: string } | null;
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

export default function SchoolDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [school, setSchool] = useState<School | null>(null);
  const [professions, setProfessions] = useState<ProfessionLine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingError, setLoadingError] = useState<string | null>(null);

  useEffect(() => {
    if (slug) loadSchoolData();
  }, [slug]);

  const loadSchoolData = async () => {
    setLoadingError(null);
    setIsLoading(true);
    try {
      const { data: schoolData, error: schoolError } = await supabase
        .from("schools")
        .select("*, academies(name, slug)")
        .eq("slug", slug)
        .single();

      if (schoolError) throw schoolError;
      setSchool(schoolData as School);

      const { data: professionData, error: profError } = await supabase
        .from("profession_categories")
        .select("*, ai_instructors(name)")
        .eq("school_id", schoolData.id)
        .eq("is_active", true)
        .order("display_order");

      if (profError) throw profError;
      setProfessions((professionData as ProfessionLine[]) || []);
    } catch (error: any) {
      console.error("Error loading school data:", error);
      setLoadingError("Failed to load school data.");
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
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-36 rounded-lg" />)}
        </div>
      </div>
    );
  }

  if (loadingError || !school) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-4 text-center">
        <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
        <h1 className="text-xl font-bold mb-2">Failed to Load</h1>
        <p className="text-muted-foreground mb-4">{loadingError || "School not found"}</p>
        <div className="flex gap-2 justify-center">
          <Button onClick={loadSchoolData}>
            <RefreshCw className="h-4 w-4 mr-2" /> Try Again
          </Button>
          <Button variant="outline" onClick={() => navigate("/app/learning/tracks")}>
            Browse Tracks
          </Button>
        </div>
      </div>
    );
  }

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
        {school.academies && (
          <Badge variant="outline" className="mb-2">{school.academies.name}</Badge>
        )}
        <h1 className="text-2xl font-bold mb-2">{school.name}</h1>
        <p className="text-muted-foreground">{school.description}</p>
      </div>

      {/* Programs Grid */}
      <h2 className="text-lg font-semibold mb-4">Programs</h2>
      {professions.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {professions.map((profession) => {
            const IconComponent = getIcon(profession.icon);
            const aiInstructors = profession.ai_instructors;
            const hasAIInstructor = aiInstructors && (Array.isArray(aiInstructors) ? aiInstructors.length > 0 : true);
            return (
              <Card
                key={profession.id}
                className="cursor-pointer hover:shadow-md hover:border-primary/50 transition-all"
                onClick={() => navigate(`/app/learning/tracks/${profession.slug}`)}
              >
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <IconComponent className="h-5 w-5 text-primary" />
                    </div>
                    {hasAIInstructor && (
                      <Badge variant="secondary" className="gap-1 text-xs">
                        <Bot className="h-3 w-3" /> AI
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-base mb-1">{profession.name}</CardTitle>
                  <CardDescription className="line-clamp-2 text-sm">{profession.description}</CardDescription>
                  <Button variant="ghost" size="sm" className="mt-3 -ml-2 text-xs">
                    Explore <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center text-muted-foreground">
            Programs coming soon
          </CardContent>
        </Card>
      )}
    </div>
  );
}
