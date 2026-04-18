import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getIcon } from "@/lib/iconMap";
import { ArrowLeft, ArrowRight, Bot, RefreshCw, AlertCircle, GraduationCap, Briefcase, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

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
  // CTO FIX: Updated to handle both single object and array responses from Supabase joins
  ai_instructors: { name: string } | { name: string }[] | null;
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
        .maybeSingle();

      if (schoolError) throw schoolError;
      if (!schoolData) throw new Error("School not found");

      setSchool(schoolData as School);

      const { data: professionData, error: profError } = await supabase
        .from("profession_categories")
        .select("*, ai_instructors(name)")
        .eq("school_id", schoolData.id)
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (profError) throw profError;

      // CTO FIX: Double-casting via 'unknown' to satisfy TS2352 overlap requirements
      setProfessions((professionData as unknown as ProfessionLine[]) || []);
    } catch (error: any) {
      console.error("Critical School Load Error:", error);
      setLoadingError(error.message || "Connection timed out.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-10">
        <Skeleton className="h-8 w-40 rounded-full" />
        <div className="space-y-4">
          <Skeleton className="h-[200px] w-full rounded-[32px]" />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-[24px]" />
          ))}
        </div>
      </div>
    );
  }

  if (loadingError || !school) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
        <div className="p-4 rounded-3xl bg-destructive/5 mb-6">
          <AlertCircle className="h-10 w-10 text-destructive" />
        </div>
        <h1 className="text-2xl font-black tracking-tight">Faculty Offline</h1>
        <p className="text-muted-foreground mt-2 max-w-sm">This school is currently undergoing curriculum updates.</p>
        <div className="flex flex-col sm:flex-row gap-3 mt-8">
          <Button onClick={loadSchoolData} className="rounded-xl h-11 px-8 font-bold">
            <RefreshCw className="mr-2 h-4 w-4" /> Reconnect
          </Button>
          <Button variant="ghost" onClick={() => navigate("/app/learning/tracks")} className="font-bold">
            Learning Hub
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-10 animate-in fade-in duration-700">
      <header className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/app/learning/tracks")}
          className="rounded-full h-10 pl-2 pr-5 font-bold text-xs uppercase tracking-widest hover:bg-primary/5 transition-all"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Hub
        </Button>
        <Badge
          variant="outline"
          className="border-primary/20 text-primary font-black uppercase text-[10px] tracking-tighter"
        >
          Faculty Verified
        </Badge>
      </header>

      <section className="relative overflow-hidden rounded-[40px] border border-border/50 bg-card p-8 md:p-12 shadow-2xl">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] -mr-48 -mt-48" />
        <div className="relative space-y-6 max-w-3xl">
          {school.academies && (
            <div className="flex items-center gap-2">
              <Badge className="px-4 py-1.5 bg-primary/10 text-primary border-none text-[10px] font-black uppercase tracking-widest rounded-full">
                <GraduationCap className="w-3.5 h-3.5 mr-2" />
                {school.academies.name}
              </Badge>
              <div className="h-1 w-1 rounded-full bg-muted-foreground/30" />
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                Department
              </span>
            </div>
          )}
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter leading-none">{school.name}</h1>
          <p className="text-lg text-muted-foreground leading-relaxed font-medium max-w-2xl">{school.description}</p>
        </div>
      </section>

      <div className="space-y-8">
        <div className="flex items-center justify-between px-2">
          <div className="space-y-1">
            <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
              Specialized Tracks <Sparkles className="h-5 w-5 text-amber-500" />
            </h2>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
              Industry-Ready Certification Pathways
            </p>
          </div>
        </div>

        {professions.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 pb-20">
            {professions.map((profession) => {
              const IconComponent = getIcon(profession.icon) || Briefcase;

              // CTO FIX: Defensive check for instructor existence
              const hasAIInstructor = !!profession.ai_instructors;

              return (
                <Card
                  key={profession.id}
                  className="group cursor-pointer hover:shadow-2xl transition-all duration-500 rounded-[32px] border-border/40 bg-card/50 backdrop-blur-sm overflow-hidden flex flex-col hover:border-primary/30"
                  onClick={() => navigate(`/app/learning/tracks/${profession.slug}`)}
                >
                  <CardHeader className="p-8 pb-4">
                    <div className="flex items-center justify-between mb-6">
                      <div className="h-14 w-14 rounded-2xl bg-primary/5 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all duration-500 shadow-inner">
                        <IconComponent className="h-7 w-7" />
                      </div>
                      {hasAIInstructor && (
                        <Badge className="bg-emerald-500/10 text-emerald-600 border-none px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg">
                          <Bot className="h-3 w-3 mr-1.5" /> AI Synced
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-xl font-black tracking-tight leading-tight group-hover:text-primary transition-colors">
                      {profession.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-8 pb-8 flex-1 flex flex-col">
                    <CardDescription className="line-clamp-3 text-[13px] font-medium leading-relaxed text-muted-foreground/80">
                      {profession.description}
                    </CardDescription>

                    <div className="pt-8 mt-auto border-t border-border/40 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">
                          Career Outcome
                        </p>
                        <p className="text-[11px] font-bold text-foreground line-clamp-1">
                          {profession.career_outcome || "Professional Placement"}
                        </p>
                      </div>
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-all">
                        <ArrowRight className="h-5 w-5 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="py-24 text-center border-2 border-dashed rounded-[40px] border-border/40 bg-muted/10">
            <h3 className="text-xl font-black tracking-tight">Curriculum Syncing</h3>
            <p className="text-sm text-muted-foreground mt-2 font-medium">
              New career tracks are being designed for this department.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
