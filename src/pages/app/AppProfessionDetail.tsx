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
  ArrowLeft,
  GraduationCap,
  Briefcase,
  MessageSquare,
  Play,
  RefreshCw,
  AlertCircle,
  ClipboardCheck,
  Coins,
  Zap,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Platform Logic: Career Track Blueprint
 * Orchestrates profession-specific curricula with real-time credit telemetry.
 * 2026 Standard: Executive Logic geometry and high-fidelity AI-instructor handshakes.
 */

interface ProfessionLine {
  id: string;
  name: string;
  slug: string;
  description: string;
  target_audience: string;
  career_outcome: string;
  credit_cost: number | null;
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
  credit_cost: number | null;
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
        .maybeSingle();

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
          .select(
            `id, title, slug, description, estimated_hours, modules_count, credit_cost, profession_levels(name, slug)`,
          )
          .eq("profession_line_id", professionData.id)
          .eq("is_published", true)
          .order("display_order");
        setCourses(coursesData || []);
      }
    } catch (error: any) {
      setLoadingError("Track Synchronization Failed.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading)
    return (
      <div className="max-w-5xl mx-auto px-6 py-10 space-y-8 animate-pulse">
        <Skeleton className="h-10 w-32 rounded-xl bg-muted/40" />
        <Skeleton className="h-[400px] w-full rounded-[40px] bg-muted/40" />
      </div>
    );

  if (loadingError || !profession)
    return (
      <div className="max-w-4xl mx-auto px-6 py-20 text-center animate-in fade-in zoom-in-95">
        <div className="h-20 w-20 rounded-[32px] bg-destructive/10 flex items-center justify-center mx-auto mb-6 border-2 border-dashed border-destructive/40">
          <AlertCircle className="h-10 w-10 text-destructive" />
        </div>
        <h1 className="text-3xl font-black uppercase tracking-tighter mb-4">List Error</h1>
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 mb-8 italic">
          {loadingError || "Blueprint not found"}
        </p>
        <div className="flex gap-4 justify-center">
          <Button
            onClick={loadProfessionData}
            className="rounded-xl h-12 px-8 font-black uppercase text-[10px] tracking-widest border-2"
          >
            <RefreshCw className="h-4 w-4 mr-2" /> Re-sync
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("/app/learning/tracks")}
            className="rounded-xl h-12 px-8 font-black uppercase text-[10px] tracking-widest border-2"
          >
            Return to Catalog
          </Button>
        </div>
      </div>
    );

  const coursesByLevel = courses.reduce(
    (acc, course) => {
      const level = course.profession_levels?.slug || "foundation";
      if (!acc[level]) acc[level] = [];
      acc[level].push(course);
      return acc;
    },
    {} as Record<string, Course[]>,
  );

  const entryCost = profession.credit_cost || 0;
  const courseCreditsTotal = courses.reduce((sum, c) => sum + (c.credit_cost || 0), 0);
  const totalInvestment = entryCost + courseCreditsTotal;

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 pb-40 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Navigation Connection */}
      <header className="flex items-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/app/learning/tracks")}
          className="group rounded-xl px-4 h-11 font-black text-[10px] uppercase tracking-[0.3em] hover:bg-primary/5 transition-all"
        >
          <ArrowLeft className="mr-3 h-4 w-4 transition-transform group-hover:-translate-x-1" /> Revert to Catalog
        </Button>
      </header>

      {/* Hero List Section */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <Badge className="bg-primary/10 text-primary border-primary/20 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest">
            {profession.schools?.name}
          </Badge>
          <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
          <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.2em] italic">
            Track Blueprint v2.6
          </p>
        </div>
        <h1 className="text-6xl font-black tracking-tighter uppercase italic leading-[0.9]">{profession.name}</h1>
        <p className="text-xl text-muted-foreground font-bold leading-relaxed tracking-tight max-w-2xl">
          {profession.description}
        </p>
      </section>

      {/* Strategic Metadata Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Investment HUD */}
        <Card className="md:col-span-2 rounded-[32px] border-2 border-primary/10 bg-primary/5 shadow-2xl overflow-hidden">
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/20 rounded-xl rotate-3">
                  <Coins className="h-5 w-5 text-primary" />
                </div>
                <h4 className="font-black uppercase tracking-[0.3em] text-[11px] text-primary">Resource Commitment</h4>
              </div>
              <Badge
                variant="outline"
                className="font-mono text-primary border-primary/40 text-[10px] tracking-tighter"
              >
                TOTAL_ALLOCATION: {totalInvestment}
              </Badge>
            </div>
            <div className="grid grid-cols-3 gap-8">
              {[
                { val: entryCost, label: "Entry Fee" },
                { val: courseCreditsTotal, label: "Unit Credits" },
                { val: totalInvestment, label: "Net Investment", highlight: true },
              ].map((item, idx) => (
                <div key={idx} className="space-y-1 text-center md:text-left">
                  <p
                    className={cn(
                      "text-3xl font-black italic tracking-tighter",
                      item.highlight ? "text-primary" : "text-foreground",
                    )}
                  >
                    {item.val}
                  </p>
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest italic">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Diagnostic CTA */}
        <Card
          className="rounded-[32px] border-2 border-border/40 bg-card/30 backdrop-blur-xl group cursor-pointer hover:border-primary/40 transition-all shadow-xl"
          onClick={() => navigate(`/career-assessment?profession=${profession.id}`)}
        >
          <CardContent className="p-8 flex flex-col justify-between h-full">
            <div className="space-y-4">
              <div className="p-2.5 bg-muted/50 rounded-xl w-fit group-hover:bg-primary/10 transition-colors">
                <ClipboardCheck className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
              </div>
              <div>
                <h4 className="font-black uppercase tracking-widest text-[11px] leading-tight">
                  Neural Fit Diagnostic
                </h4>
                <p className="text-[9px] font-bold text-muted-foreground/60 uppercase mt-1 italic">
                  Verify track alignment
                </p>
              </div>
            </div>
            <Button
              size="sm"
              className="mt-6 rounded-xl font-black uppercase text-[9px] tracking-[0.2em] shadow-lg group-hover:scale-105 transition-transform"
            >
              Initialize Assessment <Zap className="ml-2 h-3 w-3 fill-current" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* AI Interface & Path Orchestration */}
      <div className="grid grid-cols-1 lg:grid-cols-[380px,1fr] gap-12 items-start">
        {/* Instructor List */}
        <aside className="space-y-8 sticky top-10">
          {aiInstructor && (
            <Card className="rounded-[40px] border-2 border-border/40 overflow-hidden shadow-2xl bg-card/50 backdrop-blur-md">
              <CardHeader className="p-10 border-b border-border/10">
                <div className="flex items-center gap-5">
                  <div className="h-16 w-16 rounded-[24px] bg-primary/10 flex items-center justify-center border-2 border-primary/20 rotate-3 group overflow-hidden">
                    <Bot className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-black uppercase tracking-tighter italic leading-none">
                      {aiInstructor.name}
                    </CardTitle>
                    <CardDescription className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest italic mt-1.5">
                      Lead Instructor Node
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-10 space-y-8">
                <p className="text-sm font-medium leading-relaxed italic text-foreground/80">
                  "{aiInstructor.persona}"
                </p>
                <Button
                  variant="outline"
                  className="w-full h-14 rounded-2xl border-2 font-black uppercase tracking-widest text-[10px] hover:bg-primary/5 transition-all shadow-xl"
                  onClick={() => setShowChat(!showChat)}
                >
                  <MessageSquare className="h-4 w-4 mr-3" />
                  {showChat ? "Terminate Session" : "Establish Link"}
                </Button>
              </CardContent>
            </Card>
          )}

          {showChat && aiInstructor && (
            <div className="animate-in slide-in-from-top-4 duration-500">
              <AIChatPanel
                professionLineId={profession.id}
                instructorName={aiInstructor.name}
                placeholder={`Query ${aiInstructor.name} on logic parameters...`}
                className="rounded-[32px] h-[400px] border-2 border-primary/20 shadow-2xl overflow-hidden"
              />
            </div>
          )}
        </aside>

        {/* Path Orchestration List */}
        <div className="space-y-10">
          <div className="flex items-center justify-between border-b border-border/40 pb-4">
            <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-primary">Curriculum Architecture</h2>
            <Badge className="bg-primary/5 text-primary text-[9px] font-black uppercase tracking-widest">
              {courses.length} Integrated Units
            </Badge>
          </div>

          <Tabs defaultValue="foundation" className="w-full">
            <TabsList className="grid w-full grid-cols-3 p-1.5 h-14 bg-muted/30 rounded-2xl mb-10 border border-border/40">
              {["foundation", "intermediate", "executive"].map((lvl, idx) => (
                <TabsTrigger
                  key={lvl}
                  value={lvl}
                  className="rounded-xl font-black uppercase text-[10px] tracking-widest gap-2"
                >
                  Level {(idx + 1).toString().padStart(2, "0")}
                </TabsTrigger>
              ))}
            </TabsList>

            {["foundation", "intermediate", "executive"].map((level) => (
              <TabsContent key={level} value={level} className="space-y-4 outline-none">
                {coursesByLevel[level]?.length ? (
                  <div className="grid gap-4">
                    {coursesByLevel[level].map((course, index) => (
                      <Card
                        key={course.id}
                        className="group rounded-[28px] border-border/40 hover:border-primary/40 bg-card/30 backdrop-blur-sm transition-all duration-300 cursor-pointer overflow-hidden shadow-sm"
                        onClick={() => navigate(`/app/learning/courses/${course.slug}`)}
                      >
                        <CardContent className="p-6 flex items-center gap-6">
                          <div className="h-14 w-14 rounded-2xl bg-muted/50 border border-border/20 flex items-center justify-center text-sm font-black group-hover:bg-primary group-hover:text-primary-foreground group-hover:rotate-3 transition-all duration-500">
                            {(index + 1).toString().padStart(2, "0")}
                          </div>
                          <div className="flex-1 space-y-1.5">
                            <h4 className="font-black uppercase tracking-tight text-lg transition-colors group-hover:text-primary">
                              {course.title}
                            </h4>
                            <div className="flex items-center gap-4 text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest italic">
                              <span className="flex items-center gap-1.5">
                                <Clock className="h-3 w-3" /> {course.estimated_hours}h
                              </span>
                              <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                              <span className="flex items-center gap-1.5">
                                <Coins className="h-3 w-3" /> {course.credit_cost} Credits
                              </span>
                            </div>
                          </div>
                          <ChevronRight className="h-5 w-5 text-muted-foreground/20 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="p-20 border-2 border-dashed border-border/40 rounded-[32px] text-center bg-muted/5">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/30">
                      Level Protocol Pending Sync
                    </p>
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>
    </div>
  );
}
