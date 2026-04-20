import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getIcon } from "@/lib/iconMap";
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  RefreshCw,
  AlertCircle,
  GraduationCap,
  Briefcase,
  Sparkles,
  ShieldCheck,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Platform Logic: Faculty Knowledge Node
 * High-fidelity orchestrator for department-specific career pathways.
 * 2026 Standard: Executive Logic geometry with reinforced join telemetry.
 */

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
      if (!schoolData) throw new Error("School registry node not found");

      setSchool(schoolData as School);

      const { data: professionData, error: profError } = await supabase
        .from("profession_categories")
        .select("*, ai_instructors(name)")
        .eq("school_id", schoolData.id)
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (profError) throw profError;

      // Logic Synchronization: Ensure array integrity for the view layer
      setProfessions((professionData as unknown as ProfessionLine[]) || []);
    } catch (error: any) {
      console.error("Critical School Load Error:", error);
      setLoadingError(error.message || "Uplink timed out.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading)
    return (
      <div className="max-w-5xl mx-auto px-6 py-10 space-y-12 animate-pulse">
        <Skeleton className="h-10 w-48 rounded-xl bg-muted/40" />
        <Skeleton className="h-[240px] w-full rounded-[40px] bg-muted/40" />
        <div className="grid gap-6 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-64 rounded-[32px] bg-muted/40" />
          ))}
        </div>
      </div>
    );

  if (loadingError || !school)
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center animate-in fade-in zoom-in-95 duration-700">
        <div className="p-6 rounded-[32px] bg-destructive/5 mb-8 border-2 border-destructive/10">
          <AlertCircle className="h-12 w-12 text-destructive opacity-40" />
        </div>
        <h1 className="text-3xl font-black uppercase tracking-tighter">Faculty Registry Offline</h1>
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mt-3 italic">
          Curriculum parameters undergoing recalibration.
        </p>
        <div className="flex gap-4 mt-10">
          <Button
            onClick={loadSchoolData}
            className="rounded-xl h-12 px-10 font-black uppercase text-[10px] tracking-widest shadow-2xl shadow-primary/20"
          >
            <RefreshCw className="mr-3 h-4 w-4" /> Re-Sync
          </Button>
          <Button
            variant="ghost"
            onClick={() => navigate("/app/learning/tracks")}
            className="rounded-xl h-12 px-10 font-black uppercase text-[10px] tracking-widest"
          >
            Return to Hub
          </Button>
        </div>
      </div>
    );

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 pb-40 space-y-12 animate-in fade-in duration-1000">
      {/* Immersive Header Handshake */}
      <header className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/app/learning/tracks")}
          className="group rounded-xl h-11 pl-3 pr-6 font-black text-[10px] uppercase tracking-[0.3em] hover:bg-primary/5 -ml-3 transition-all"
        >
          <ArrowLeft className="mr-3 h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Back to Hub
        </Button>
        <div className="flex items-center gap-3">
          <Badge
            variant="outline"
            className="border-primary/20 text-primary font-black uppercase text-[9px] tracking-widest italic px-3 py-1"
          >
            Faculty Verified Node
          </Badge>
          <ShieldCheck className="h-5 w-5 text-emerald-500 opacity-40" />
        </div>
      </header>

      {/* Hero Module: Knowledge Context */}
      <section className="relative overflow-hidden rounded-[48px] border-2 border-border/40 bg-card/30 backdrop-blur-xl p-10 md:p-16 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.2)]">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] -mr-64 -mt-64" />
        <div className="relative space-y-8 max-w-3xl">
          {school.academies && (
            <div className="flex items-center gap-4">
              <Badge className="px-5 py-2 bg-primary text-primary-foreground border-none text-[9px] font-black uppercase tracking-widest rounded-xl shadow-xl shadow-primary/20">
                <GraduationCap className="w-4 h-4 mr-2.5 fill-current" />
                {school.academies.name}
              </Badge>
              <div className="h-[1px] w-8 bg-muted-foreground/20" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 italic">
                Primary Department
              </span>
            </div>
          )}
          <div className="space-y-4">
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase italic leading-[0.85] selection:bg-primary/20">
              {school.name}
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground/80 leading-relaxed font-medium max-w-2xl italic">
              {school.description}
            </p>
          </div>
        </div>
      </section>

      {/* Registry Grid: Specialized Tracks */}
      <div className="space-y-10">
        <div className="flex items-center justify-between px-2 border-b border-border/10 pb-6">
          <div className="space-y-1">
            <h2 className="text-3xl font-black uppercase tracking-tighter italic flex items-center gap-3">
              Specialized Tracks <Sparkles className="h-6 w-6 text-amber-500 fill-amber-500/20" />
            </h2>
            <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.4em] italic">
              Industry-Ready Certification Registry
            </p>
          </div>
        </div>

        {professions.length > 0 ? (
          <div className="grid gap-8 md:grid-cols-2 pb-20">
            {professions.map((profession) => {
              const IconComponent = getIcon(profession.icon) || Briefcase;
              const hasAIInstructor = !!profession.ai_instructors;

              return (
                <Card
                  key={profession.id}
                  className="group cursor-pointer rounded-[40px] border-2 border-border/40 bg-card/30 backdrop-blur-sm transition-all duration-500 hover:border-primary/40 hover:shadow-2xl overflow-hidden flex flex-col hover:-translate-y-1"
                  onClick={() => navigate(`/app/learning/tracks/${profession.slug}`)}
                >
                  <CardHeader className="p-10 pb-4">
                    <div className="flex items-center justify-between mb-8">
                      <div className="h-16 w-16 rounded-[24px] bg-primary/5 border border-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all duration-700 shadow-inner group-hover:rotate-3 group-hover:shadow-primary/30">
                        <IconComponent className="h-8 w-8" />
                      </div>
                      {hasAIInstructor && (
                        <Badge className="bg-emerald-500/10 text-emerald-500 border-none px-4 py-1.5 text-[8px] font-black uppercase tracking-widest rounded-lg shadow-sm italic">
                          <Bot className="h-3 w-3 mr-2 fill-current" /> Neural Sync Active
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-3xl font-black tracking-tighter uppercase italic leading-none group-hover:text-primary transition-colors">
                      {profession.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-10 pb-10 flex-1 flex flex-col space-y-8">
                    <CardDescription className="line-clamp-3 text-sm font-medium leading-relaxed text-muted-foreground/70 italic">
                      {profession.description}
                    </CardDescription>

                    <div className="pt-8 mt-auto border-t border-border/10 flex items-end justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Target className="h-3 w-3 text-primary opacity-40" />
                          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 italic">
                            Career Outcome Protocol
                          </p>
                        </div>
                        <p className="text-sm font-black uppercase tracking-tight text-foreground selection:bg-primary/20">
                          {profession.career_outcome || "Full Professional Integration"}
                        </p>
                      </div>
                      <div className="h-14 w-14 rounded-2xl bg-muted/50 border border-border/20 flex items-center justify-center transition-all group-hover:bg-primary/10 group-hover:text-primary group-hover:scale-110">
                        <ArrowRight className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="py-32 text-center border-2 border-dashed rounded-[48px] border-border/40 bg-muted/5 animate-in zoom-in-95 duration-700">
            <h3 className="text-3xl font-black uppercase tracking-tighter italic">Logic Synthesis in Progress</h3>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 mt-4 max-w-xs mx-auto italic leading-relaxed">
              New career artifacts and certification logic paths are being designed for this faculty node.
            </p>
          </div>
        )}
      </div>

      {/* Operational Trace Footer */}
      <footer className="mt-20 pt-10 border-t border-border/40 flex items-center justify-between opacity-30">
        <div className="space-y-1">
          <p className="text-[9px] font-black uppercase tracking-[0.4em] italic">
            Faculty Registry: Encrypted Synchronization Active
          </p>
          <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Logic Path v2.6.4</p>
        </div>
        <div className="flex gap-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-1 w-8 rounded-full bg-primary/20" />
          ))}
        </div>
      </footer>
    </div>
  );
}
