import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, Laptop, Rocket, Megaphone, GraduationCap, ChevronRight, Target, Search } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { getIcon } from "@/lib/iconMap";
import { cn } from "@/lib/utils";

type Category = "my-program" | "executive" | "freelancing" | "entrepreneurship" | "influencing";

const CATEGORY_CONFIG: { key: Category; icon: any; label: string }[] = [
  { key: "my-program", icon: Target, label: "Mine" },
  { key: "executive", icon: Building2, label: "Executive" },
  { key: "freelancing", icon: Laptop, label: "Freelance" },
  { key: "entrepreneurship", icon: Rocket, label: "Startup" },
  { key: "influencing", icon: Megaphone, label: "Influence" },
];

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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
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
          const { data: enrData } = await supabase
            .from("enrollments")
            .select("id, progress, status, content:content_id(title)")
            .eq("talent_id", talent.id)
            .order("created_at", { ascending: false });
          setEnrollments(enrData || []);
        }
      }
    } catch (err) {
      console.error("[TracksTab] load error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMyProgram = () => {
    const active = enrollments.filter((e) => e.status !== "completed");
    const completed = enrollments.filter((e) => e.status === "completed");

    return (
      <div className="space-y-5">
        {active.length > 0 && (
          <section className="space-y-2">
            <h3 className="text-sm font-semibold px-1">In progress</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {active.map((enr) => (
                <Card
                  key={enr.id}
                  className="cursor-pointer rounded-2xl border border-border/40 hover:border-primary/40 transition-all"
                  onClick={() => navigate(`/app/learning?tab=my-courses`)}
                >
                  <CardContent className="p-3 flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <GraduationCap className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <p className="text-sm font-semibold line-clamp-1">{enr.content?.title || "Program"}</p>
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                        <span>Progress</span>
                        <span className="font-medium text-primary">{enr.progress}%</span>
                      </div>
                      <Progress value={enr.progress} className="h-1.5" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {completed.length > 0 && (
          <section className="space-y-2">
            <h3 className="text-sm font-semibold px-1">Completed</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {completed.map((enr) => (
                <Card key={enr.id} className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5">
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                      <GraduationCap className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold line-clamp-1">{enr.content?.title}</p>
                      <Badge className="bg-emerald-500/10 text-emerald-600 border-0 text-[10px] mt-1">Verified</Badge>
                    </div>
                    <ChevronRight className="h-4 w-4 text-emerald-600/40" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {enrollments.length === 0 && (
          <div className="py-12 text-center border border-dashed rounded-2xl">
            <GraduationCap className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm font-medium text-foreground mb-1">No active programs yet</p>
            <p className="text-xs text-muted-foreground mb-4">Browse an academy to get started.</p>
            <Button onClick={() => setSelectedCategory("executive")} size="sm">
              <Search className="h-3.5 w-3.5 mr-1.5" /> Browse academy
            </Button>
          </div>
        )}
      </div>
    );
  };

  const renderAcademy = (cat: Category) => {
    const academy = academies.find((a) => a.academy_type === cat);
    if (!academy) {
      return (
        <div className="py-12 text-center border border-dashed rounded-2xl">
          <p className="text-sm text-muted-foreground">Academy coming soon.</p>
        </div>
      );
    }

    const academySchools = schools.filter((s) => s.academy_id === academy.id);

    return (
      <div className="space-y-3">
        <div className="px-1">
          <h2 className="text-base font-semibold">{academy.name}</h2>
          {academy.description && <p className="text-xs text-muted-foreground">{academy.description}</p>}
        </div>

        {academySchools.length === 0 ? (
          <div className="py-12 text-center border border-dashed rounded-2xl">
            <p className="text-sm text-muted-foreground">No schools yet.</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {academySchools.map((school) => {
              const SchoolIcon = getIcon(school.icon);
              const r = readiness[school.id];
              const total = r?.total_courses ?? 0;
              const ready = r?.ready_courses ?? 0;
              const pct = r?.pct_ready ?? 0;

              return (
                <Card
                  key={school.id}
                  className="group cursor-pointer rounded-2xl border border-border/40 hover:border-primary/40 transition-all"
                  onClick={() => navigate(`/app/learning/tracks/school/${school.slug}`)}
                >
                  <CardContent className="p-3 space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <SchoolIcon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold line-clamp-1">{school.name}</p>
                        <p className="text-[11px] text-muted-foreground line-clamp-1">{school.description}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary transition-colors" />
                    </div>

                    {total > 0 && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                          <span>{ready} / {total} courses ready</span>
                          <span className="tabular-nums">{pct}%</span>
                        </div>
                        <Progress value={pct} className="h-1" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 rounded-xl" />
        <div className="grid gap-3 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Compact pill row — wraps on narrow screens, no horizontal scroll */}
      <nav className="flex flex-wrap gap-1.5 p-1 bg-muted/50 rounded-xl border border-border/50">
        {CATEGORY_CONFIG.map(({ key, icon: Icon, label }) => {
          const isActive = selectedCategory === key;
          return (
            <button
              key={key}
              onClick={() => setSelectedCategory(key)}
              className={cn(
                "flex-1 min-w-[60px] flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-medium transition-all",
                isActive
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{label}</span>
            </button>
          );
        })}
      </nav>

      {selectedCategory === "my-program" ? renderMyProgram() : renderAcademy(selectedCategory)}
    </div>
  );
}
