import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Building2,
  Laptop,
  Rocket,
  Megaphone,
  GraduationCap,
  ChevronRight,
  Sparkles,
  Zap,
  Target,
  ShieldCheck,
  Search,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { getIcon } from "@/lib/iconMap";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Career Trajectory Hub (TracksTab)
 * CTO Reference: Unified ingress node for talent development and academy silos.
 */

type Category = "my-program" | "executive" | "freelancing" | "entrepreneurship" | "influencing";

const CATEGORY_CONFIG: { key: Category; icon: any; label: string }[] = [
  { key: "my-program", icon: Target, label: "MY_TRAJECTORY" },
  { key: "executive", icon: Building2, label: "EXECUTIVE" },
  { key: "freelancing", icon: Laptop, label: "FREELANCE" },
  { key: "entrepreneurship", icon: Rocket, label: "STARTUP" },
  { key: "influencing", icon: Megaphone, label: "INFLUENCE" },
];

const ACADEMY_THEMES: Record<Category, { bg: string; icon: string; border: string; accent: string }> = {
  "my-program": {
    bg: "bg-primary/10",
    icon: "text-primary",
    border: "group-hover:border-primary/40",
    accent: "bg-primary",
  },
  executive: {
    bg: "bg-blue-500/10",
    icon: "text-blue-500",
    border: "group-hover:border-blue-500/40",
    accent: "bg-blue-500",
  },
  freelancing: {
    bg: "bg-emerald-500/10",
    icon: "text-emerald-500",
    border: "group-hover:border-emerald-500/40",
    accent: "bg-emerald-500",
  },
  entrepreneurship: {
    bg: "bg-orange-500/10",
    icon: "text-orange-500",
    border: "group-hover:border-orange-500/40",
    accent: "bg-orange-500",
  },
  influencing: {
    bg: "bg-pink-500/10",
    icon: "text-pink-500",
    border: "group-hover:border-pink-500/40",
    accent: "bg-pink-500",
  },
};

interface SchoolReadiness {
  school_id: string;
  total_courses: number;
  ready_courses: number;
  pct_ready: number;
  is_ready: boolean;
}

export function TracksTab() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<Category>("my-program");
  const [academies, setAcademies] = useState<any[]>([]);
  const [schools, setSchools] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [readiness, setReadiness] = useState<Record<string, SchoolReadiness>>({});
  const [waitlistedSchoolIds, setWaitlistedSchoolIds] = useState<Set<string>>(new Set());
  const [talentId, setTalentId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadRegistryNodes();
  }, []);

  const loadRegistryNodes = async () => {
    setIsLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const [acadResult, schoolResult, readinessResult] = await Promise.all([
        supabase.from("academies").select("*").eq("is_active", true).order("display_order"),
        supabase.from("schools").select("*").eq("is_active", true).order("display_order"),
        supabase.from("school_readiness_v" as any).select("*"),
      ]);

      setAcademies(acadResult.data || []);
      setSchools(schoolResult.data || []);

      const readinessMap: Record<string, SchoolReadiness> = {};
      ((readinessResult.data as any[]) || []).forEach((r: any) => {
        readinessMap[r.school_id] = r;
      });
      setReadiness(readinessMap);

      if (user) {
        const { data: talent } = await supabase.from("talents").select("id").eq("user_id", user.id).maybeSingle();
        if (talent) {
          setTalentId(talent.id);
          const { data: enrData } = await supabase
            .from("enrollments")
            .select("id, progress, status, content:content_id(title)")
            .eq("talent_id", talent.id)
            .order("created_at", { ascending: false });
          setEnrollments(enrData || []);
          const { data: wl } = await supabase
            .from("school_waitlist" as any)
            .select("school_id")
            .eq("talent_id", talent.id);
          setWaitlistedSchoolIds(new Set(((wl as any[]) || []).map((w: any) => w.school_id)));
        }
      }
    } catch (err) {
      console.error("[Registry Fault]:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const joinWaitlist = async (schoolId: string) => {
    if (!talentId) {
      navigate("/auth");
      return;
    }
    const { error } = await supabase
      .from("school_waitlist" as any)
      .insert({ talent_id: talentId, school_id: schoolId } as any);
    if (!error) {
      setWaitlistedSchoolIds((prev) => new Set([...prev, schoolId]));
    }
  };

  const renderMyProgram = () => {
    const active = enrollments.filter((e) => e.status !== "completed");
    const completed = enrollments.filter((e) => e.status === "completed");

    return (
      <div className="space-y-10 animate-in fade-in duration-700 text-left">
        {active.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center gap-3 px-1">
              <Zap className="h-4 w-4 text-primary fill-current" />
              <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-foreground italic">
                Active_Development
              </h3>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              {active.map((enr) => (
                <Card
                  key={enr.id}
                  className="group cursor-pointer hover:border-primary/40 transition-all duration-500 rounded-[32px] bg-card/30 backdrop-blur-md overflow-hidden border-2 border-border/40 shadow-xl"
                  onClick={() => navigate(`/app/learning/tracks`)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-5">
                      <div className="h-14 w-14 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-inner">
                        <GraduationCap className="h-7 w-7 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0 space-y-4">
                        <CardTitle className="text-base font-black tracking-tighter uppercase italic line-clamp-1">
                          {enr.content?.title || "UNNAMED_TRACK"}
                        </CardTitle>
                        <div className="space-y-2">
                          <div className="flex justify-between items-end">
                            <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest italic">
                              Sync_Status
                            </span>
                            <span className="text-xs font-black text-primary tabular-nums">{enr.progress}%</span>
                          </div>
                          <Progress value={enr.progress} className="h-2 rounded-full bg-primary/10 shadow-inner" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {completed.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center gap-3 px-1">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-emerald-600/60 italic">
                Certified_Achievements
              </h3>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              {completed.map((enr) => (
                <Card
                  key={enr.id}
                  className="rounded-[28px] border-2 border-emerald-500/20 bg-emerald-500/5 backdrop-blur-sm overflow-hidden group hover:border-emerald-500/40 transition-all shadow-lg"
                >
                  <CardContent className="p-6 flex items-center gap-5">
                    <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-500/20">
                      <GraduationCap className="h-7 w-7 text-emerald-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-sm font-black tracking-tight uppercase italic">
                        {enr.content?.title}
                      </CardTitle>
                      <Badge className="bg-emerald-500/10 text-emerald-600 border-none text-[8px] font-black uppercase tracking-widest mt-2 px-3 py-1">
                        Verified_Credential
                      </Badge>
                    </div>
                    <ChevronRight className="h-5 w-5 text-emerald-500/20 group-hover:text-emerald-500 transition-all" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {enrollments.length === 0 && (
          <div className="py-24 text-center border-2 border-dashed rounded-[40px] border-border/20 bg-muted/5 flex flex-col items-center">
            <div className="h-20 w-20 bg-muted/10 rounded-full flex items-center justify-center mb-6">
              <GraduationCap className="h-10 w-10 text-muted-foreground/20" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/40 mb-10 italic">
              NO_ACTIVE_TRAJECTORY_NODES
            </p>
            <Button
              onClick={() => setSelectedCategory("executive")}
              className="h-12 px-10 rounded-2xl font-black uppercase italic tracking-[0.2em] shadow-2xl active:scale-95 transition-all gap-3"
            >
              <Search className="h-4 w-4" /> BROWSE_ACADEMY
            </Button>
          </div>
        )}
      </div>
    );
  };

  const renderAcademySilo = (cat: Category) => {
    const academy = academies.find((a) => a.academy_type === cat);
    if (!academy)
      return (
        <div className="py-24 text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground/30 italic">
          ACADEMY_NODE_OFFLINE
        </div>
      );

    const academySchools = schools.filter((s) => s.academy_id === academy.id);
    const theme = ACADEMY_THEMES[cat];

    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 text-left">
        <div className="px-1 space-y-2">
          <h2 className="text-2xl font-black uppercase italic tracking-tighter flex items-center gap-3">
            <div className={cn("h-2 w-2 rounded-full animate-pulse", theme.accent)} />
            {academy.name}
          </h2>
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest leading-relaxed italic opacity-60 max-w-lg">
            {academy.description}
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {academySchools.map((school) => {
            const SchoolIcon = getIcon(school.icon);
            const r = readiness[school.id];
            const total = r?.total_courses ?? 0;
            const ready = r?.ready_courses ?? 0;
            const pct = r?.pct_ready ?? 0;
            const isReady = (r?.is_ready ?? false) && total > 0;
            const isWaitlisted = waitlistedSchoolIds.has(school.id);

            return (
              <Card
                key={school.id}
                className={cn(
                  "group transition-all duration-500 rounded-[32px] border-2 border-border/40 bg-card/30 backdrop-blur-xl overflow-hidden relative",
                  isReady ? "cursor-pointer hover:shadow-2xl hover:-translate-y-1.5" : "opacity-90",
                  isReady && theme.border,
                )}
                onClick={() => isReady && navigate(`/app/learning/tracks/school/${school.slug}`)}
              >
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-5">
                    <div
                      className={cn(
                        "h-16 w-16 rounded-2xl flex items-center justify-center shrink-0 shadow-lg border border-white/5 transition-all duration-700",
                        isReady && "group-hover:rotate-6",
                        theme.bg,
                      )}
                    >
                      <SchoolIcon className={cn("h-8 w-8", theme.icon)} />
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <h4 className="font-black text-base uppercase italic tracking-tighter leading-none">
                        {school.name}
                      </h4>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest line-clamp-1 italic opacity-60">
                        {school.description}
                      </p>
                    </div>
                    {isReady && (
                      <div className="h-10 w-10 rounded-full flex items-center justify-center bg-muted/20 group-hover:bg-primary/10 transition-colors">
                        <ChevronRight className="h-5 w-5 text-muted-foreground/20 group-hover:text-primary transition-all group-hover:translate-x-1" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
                      <span className={cn(isReady ? "text-emerald-600" : "text-muted-foreground")}>
                        {ready} / {total} courses ready
                      </span>
                      <span className="text-muted-foreground tabular-nums">{pct}%</span>
                    </div>
                    <Progress value={pct} className="h-1.5 rounded-full" />
                  </div>

                  {!isReady && (
                    <div className="flex items-center justify-between gap-2 pt-1">
                      <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest border-amber-500/30 text-amber-600">
                        Coming soon
                      </Badge>
                      <Button
                        size="sm"
                        variant={isWaitlisted ? "secondary" : "outline"}
                        className="h-8 rounded-xl text-[10px] font-bold uppercase tracking-widest"
                        disabled={isWaitlisted}
                        onClick={(e) => {
                          e.stopPropagation();
                          joinWaitlist(school.id);
                        }}
                      >
                        {isWaitlisted ? "On waitlist" : "Notify me"}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-10">
        <div className="grid grid-cols-5 gap-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-[22px] opacity-40" />
          ))}
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-[32px] opacity-20" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* HUD: CATEGORY NAVIGATION */}
      <div className="grid grid-cols-5 gap-3 p-2 bg-muted/20 backdrop-blur-md rounded-[28px] border-2 border-border/40 shadow-inner">
        {CATEGORY_CONFIG.map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            onClick={() => setSelectedCategory(key)}
            className={cn(
              "flex flex-col items-center gap-3 p-4 rounded-[20px] transition-all duration-500 group outline-none relative overflow-hidden",
              selectedCategory === key
                ? "bg-primary text-white shadow-2xl scale-105"
                : "bg-background/50 text-muted-foreground/60 hover:bg-muted",
            )}
          >
            {selectedCategory === key && (
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
            )}
            <Icon
              className={cn(
                "h-6 w-6 transition-all duration-700 group-hover:rotate-6",
                selectedCategory === key ? "text-white scale-110" : "text-primary/40",
              )}
            />
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-center leading-none italic">
              {label}
            </span>
          </button>
        ))}
      </div>

      <div className="relative min-h-[400px]">
        {selectedCategory === "my-program" ? renderMyProgram() : renderAcademySilo(selectedCategory)}
      </div>
    </div>
  );
}
