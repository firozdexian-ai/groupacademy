import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, Building2, GraduationCap, Briefcase, Bot, Activity, DatabaseZap } from "lucide-react";
import { getIcon } from "@/lib/iconMap";
import { withTimeout } from "@/hooks/useQueryWithTimeout";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import { DashboardCardSkeleton } from "../DashboardSkeleton";
import { cn } from "@/lib/utils";
import { ProfessionalRolesPanel } from "@/components/dashboard/talent/ProfessionalRolesPanel";

/**
 * Platform Logic: Academic Infrastructure Orchestrator
 * 2026 Standard: Blended Phase 6 UI (Global Hierarchy Governance)
 */

interface Academy {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  academy_type: "executive" | "technical" | "freelancing" | "entrepreneurship" | "influencing";
  icon: string | null;
  primary_language: string;
  is_active: boolean | null;
  display_order: number | null;
}

interface School {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  academy_id: string;
  icon: string | null;
  executive_capability_goal: string | null;
  is_active: boolean | null;
  display_order: number | null;
}

interface ProfessionLine {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  school_id: string | null;
  icon: string | null;
  career_outcome: string | null;
  target_audience: string | null;
  is_active: boolean | null;
  display_order: number | null;
  credit_cost: number | null;
}

interface AIInstructor {
  id: string;
  name: string;
  persona: string;
  system_prompt: string;
  avatar_url: string | null;
  expertise_areas: string[] | null;
  profession_line_id: string;
  is_active: boolean | null;
}

export function ProfessionsTab() {
  const [academies, setAcademies] = useState<Academy[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [professionLines, setProfessionLines] = useState<ProfessionLine[]>([]);
  const [aiInstructors, setAiInstructors] = useState<AIInstructor[]>([]);
  const [contentCounts, setContentCounts] = useState<Record<string, { count: number; totalCredits: number }>>({});
  const [isLoading, setIsLoading] = useState(true);

  const [activeTab, setActiveTab] = useState("academies");
  const [academyDialog, setAcademyDialog] = useState(false);
  const [professionDialog, setProfessionDialog] = useState(false);
  const [editingAcademy, setEditingAcademy] = useState<Academy | null>(null);
  const [editingProfession, setEditingProfession] = useState<ProfessionLine | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const results = (await withTimeout(
        Promise.all([
          supabase.from("academies").select("*").order("display_order"),
          supabase.from("schools").select("*").order("display_order"),
          supabase.from("profession_categories").select("*").order("display_order"),
          supabase.from("ai_instructors").select("*").order("name"),
          supabase.from("content").select("id, profession_line_id, credit_cost").eq("is_published", true),
        ]),
        TIMEOUTS.DEFAULT,
        "Structural sync timed out",
      )) as any;

      setAcademies(results[0].data || []);
      setSchools(results[1].data || []);
      setProfessionLines(results[2].data || []);
      setAiInstructors(results[3].data || []);

      if (results[4].data) {
        const cc: Record<string, { count: number; totalCredits: number }> = {};
        results[4].data.forEach((c: any) => {
          if (c.profession_line_id) {
            if (!cc[c.profession_line_id]) cc[c.profession_line_id] = { count: 0, totalCredits: 0 };
            cc[c.profession_line_id].count += 1;
            cc[c.profession_line_id].totalCredits += c.credit_cost || 0;
          }
        });
        setContentCounts(cc);
      }
    } catch (error: any) {
      toast.error("Telemetry Fault: Structural sync failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAcademy = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      slug: formData.get("slug") as string,
      academy_type: formData.get("academy_type") as any,
      primary_language: formData.get("primary_language") as string,
      is_active: formData.get("is_active") === "on",
    };

    const query = editingAcademy
      ? supabase.from("academies").update(data).eq("id", editingAcademy.id)
      : supabase.from("academies").insert(data);
    const { error } = await query;

    if (error) toast.error(error.message);
    else {
      toast.success("Academy configuration synchronized");
      setAcademyDialog(false);
      loadData();
    }
  };

  const professionLinesWithInstructor = useMemo(
    () => new Set(aiInstructors.map((i) => i.profession_line_id)),
    [aiInstructors],
  );
  const noInstructorCount = professionLines.filter((p) => !professionLinesWithInstructor.has(p.id)).length;

  return (
    <div className="space-y-10 animate-in fade-in duration-1000 p-4 md:p-6">
      {/* Phase 6 Executive Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-muted/20 p-8 rounded-[40px] border-2 border-border/40 backdrop-blur-md">
        <div className="space-y-1 text-left">
          <div className="flex items-center gap-3 text-fuchsia-500">
            <DatabaseZap className="h-8 w-8 text-fuchsia-500 fill-fuchsia-500/20" />
            <h2 className="text-4xl font-black uppercase tracking-tighter italic leading-none text-foreground">
              Academic Ops
            </h2>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 italic">
            Global Hierarchy & Persona Governance
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => {
              setEditingAcademy(null);
              setAcademyDialog(true);
            }}
            className="h-14 px-8 rounded-2xl border-2 font-black uppercase text-[10px] tracking-widest gap-3 shadow-xl bg-fuchsia-600 hover:bg-fuchsia-700 text-white"
          >
            <Plus className="h-4 w-4" /> New Academy
          </Button>
        </div>
      </header>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <DashboardCardSkeleton />
          <DashboardCardSkeleton />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <KPIStatCard
              icon={Building2}
              label="Academies"
              value={academies.length}
              color="text-blue-500"
              bg="bg-blue-500/10"
            />
            <KPIStatCard
              icon={GraduationCap}
              label="Schools"
              value={schools.length}
              color="text-emerald-500"
              bg="bg-emerald-500/10"
            />
            <KPIStatCard
              icon={Briefcase}
              label="Programs"
              value={professionLines.length}
              alert={noInstructorCount > 0}
              color="text-orange-500"
              bg="bg-orange-500/10"
            />
            <KPIStatCard
              icon={Bot}
              label="AI Instructors"
              value={aiInstructors.length}
              color="text-fuchsia-500"
              bg="bg-fuchsia-500/10"
            />
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="h-14 w-full max-w-2xl mx-auto grid grid-cols-3 bg-muted/20 border-2 border-border/10 p-1.5 rounded-2xl mb-8">
              <TabsTrigger
                value="academies"
                className="rounded-xl font-black uppercase italic text-[10px] tracking-widest py-3 data-[state=active]:bg-background data-[state=active]:shadow-lg transition-all"
              >
                Academies
              </TabsTrigger>
              <TabsTrigger
                value="professions"
                className="rounded-xl font-black uppercase italic text-[10px] tracking-widest py-3 data-[state=active]:bg-background data-[state=active]:shadow-lg transition-all"
              >
                Professions
              </TabsTrigger>
              <TabsTrigger
                value="roles"
                className="rounded-xl font-black uppercase italic text-[10px] tracking-widest py-3 data-[state=active]:bg-background data-[state=active]:shadow-lg transition-all"
              >
                Roles
              </TabsTrigger>
            </TabsList>

            <TabsContent value="academies" className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-0">
              {academies.map((a) => (
                <AcademyCard
                  key={a.id}
                  academy={a}
                  schoolCount={schools.filter((s) => s.academy_id === a.id).length}
                  onEdit={() => {
                    setEditingAcademy(a);
                    setAcademyDialog(true);
                  }}
                />
              ))}
            </TabsContent>

            <TabsContent value="professions" className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-0">
              {professionLines.map((p) => (
                <ProfessionCard
                  key={p.id}
                  profession={p}
                  hasAI={professionLinesWithInstructor.has(p.id)}
                  stats={contentCounts[p.id]}
                  onEdit={() => {
                    setEditingProfession(p);
                    setProfessionDialog(true);
                  }}
                />
              ))}
            </TabsContent>

            <TabsContent value="roles" className="mt-0">
              <ProfessionalRolesPanel />
            </TabsContent>
          </Tabs>
        </>
      )}

      {/* Academy Dialog */}
      <Dialog open={academyDialog} onOpenChange={setAcademyDialog}>
        <DialogContent className="max-w-xl rounded-[40px] border-4 border-border/40 bg-background/95 backdrop-blur-2xl p-0 overflow-hidden shadow-2xl text-left">
          <div className="h-2 w-full bg-gradient-to-r from-fuchsia-400 to-pink-600" />
          <form onSubmit={handleSaveAcademy} className="p-10 space-y-8">
            <DialogHeader>
              <DialogTitle className="text-3xl font-black uppercase italic tracking-tighter text-foreground flex items-center gap-3">
                <Building2 className="h-8 w-8 text-fuchsia-500" /> Academy Node
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="font-black uppercase text-[10px] tracking-widest text-primary ml-1">
                  Academy Name
                </Label>
                <Input
                  name="name"
                  defaultValue={editingAcademy?.name}
                  className="h-14 rounded-2xl border-2 font-bold bg-muted/20"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-black uppercase text-[10px] tracking-widest text-primary ml-1">Type</Label>
                  <Select name="academy_type" defaultValue={editingAcademy?.academy_type || "executive"}>
                    <SelectTrigger className="h-14 rounded-2xl border-2 font-bold bg-muted/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-2">
                      <SelectItem value="executive">Executive</SelectItem>
                      <SelectItem value="technical">Technical</SelectItem>
                      <SelectItem value="freelancing">Freelancing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="font-black uppercase text-[10px] tracking-widest text-primary ml-1">Slug</Label>
                  <Input
                    name="slug"
                    defaultValue={editingAcademy?.slug}
                    className="h-14 rounded-2xl border-2 font-mono text-xs bg-muted/20"
                  />
                </div>
              </div>
            </div>
            <Button
              type="submit"
              className="w-full h-14 rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] shadow-xl bg-fuchsia-600 hover:bg-fuchsia-700 text-white"
            >
              Deploy Academy Node
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function KPIStatCard({ icon: Icon, label, value, alert, color, bg }: any) {
  return (
    <Card
      className={cn(
        "rounded-[32px] border-2 border-border/40 bg-card/30 shadow-xl overflow-hidden group text-left",
        alert && "border-destructive/30 bg-destructive/5",
      )}
    >
      <CardContent className="p-6 flex items-center gap-5">
        <div
          className={cn(
            "h-14 w-14 rounded-2xl flex items-center justify-center border-2 border-white/5 transition-transform group-hover:scale-110 shadow-inner shrink-0",
            alert ? "bg-destructive/10 text-destructive" : `${bg} ${color}`,
          )}
        >
          <Icon className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground italic mb-1 truncate">
            {label}
          </p>
          <p
            className={cn(
              "text-4xl font-black italic tracking-tighter leading-none text-foreground/90",
              alert && "text-destructive",
            )}
          >
            {value}
          </p>
          {alert && (
            <p className="text-[8px] font-bold text-destructive uppercase tracking-widest mt-2 animate-pulse">
              Gaps Detected
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function AcademyCard({ academy, schoolCount, onEdit }: any) {
  const Icon = getIcon(academy.icon || "graduation-cap");
  return (
    <Card className="rounded-[32px] border-2 border-border/40 bg-card/30 backdrop-blur-sm overflow-hidden group hover:border-primary/40 transition-all text-left shadow-lg hover:shadow-xl relative">
      <div className="absolute top-0 left-0 h-full w-1.5 bg-blue-500 opacity-50 group-hover:opacity-100 transition-opacity" />
      <CardContent className="p-6 flex items-center justify-between ml-1">
        <div className="flex items-center gap-5">
          <div className="h-14 w-14 rounded-2xl bg-blue-500/10 flex items-center justify-center border-2 border-blue-500/20 group-hover:scale-105 transition-transform">
            <Icon className="h-6 w-6 text-blue-500" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xl font-black uppercase italic tracking-tight truncate group-hover:text-blue-500 transition-colors">
              {academy.name}
            </h4>
            <div className="flex gap-2 mt-2">
              <Badge
                variant="outline"
                className="text-[9px] font-black uppercase tracking-widest italic border-2 border-border/50"
              >
                {academy.academy_type}
              </Badge>
              <Badge variant="secondary" className="text-[9px] font-black uppercase tracking-widest italic">
                {schoolCount} Schools
              </Badge>
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onEdit}
          className="rounded-xl h-10 w-10 hover:bg-blue-500/10 hover:text-blue-500 opacity-30 group-hover:opacity-100 transition-all border-2 border-transparent hover:border-blue-500/20 shrink-0"
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}

function ProfessionCard({ profession, hasAI, stats, onEdit }: any) {
  const Icon = getIcon(profession.icon || "briefcase");
  return (
    <Card
      className={cn(
        "rounded-[32px] border-2 border-border/40 bg-card/30 backdrop-blur-sm overflow-hidden group transition-all text-left shadow-lg hover:shadow-xl relative",
        !hasAI && "border-destructive/30 bg-destructive/5",
        hasAI && "hover:border-primary/40",
      )}
    >
      <div
        className={cn(
          "absolute top-0 left-0 h-full w-1.5 transition-opacity opacity-50 group-hover:opacity-100",
          hasAI ? "bg-fuchsia-500" : "bg-destructive",
        )}
      />
      <CardContent className="p-6 flex items-center justify-between ml-1">
        <div className="flex items-center gap-5">
          <div
            className={cn(
              "h-14 w-14 rounded-2xl flex items-center justify-center border-2 group-hover:scale-105 transition-transform",
              hasAI
                ? "bg-fuchsia-500/10 border-fuchsia-500/20 text-fuchsia-500"
                : "bg-destructive/10 border-destructive/20 text-destructive",
            )}
          >
            <Icon className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <h4
              className={cn(
                "text-xl font-black uppercase italic tracking-tight truncate flex items-center gap-2",
                hasAI && "group-hover:text-fuchsia-500 transition-colors",
                !hasAI && "text-destructive",
              )}
            >
              {profession.name}
            </h4>
            <div className="flex items-center gap-2 mt-1.5">
              {!hasAI ? (
                <Badge variant="destructive" className="text-[8px] uppercase tracking-widest font-black animate-pulse">
                  MISSING AI PERSONA
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="text-[8px] uppercase tracking-widest font-black border-2 border-fuchsia-500/20 text-fuchsia-500 bg-fuchsia-500/5"
                >
                  <Bot className="h-3 w-3 mr-1" /> AI Assigned
                </Badge>
              )}
            </div>
            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-2 truncate">
              {stats?.count || 0} Courses • {profession.credit_cost || 0} Credits
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onEdit}
          className={cn(
            "rounded-xl h-10 w-10 opacity-30 group-hover:opacity-100 transition-all border-2 border-transparent shrink-0",
            hasAI
              ? "hover:bg-fuchsia-500/10 hover:text-fuchsia-500 hover:border-fuchsia-500/20"
              : "hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20",
          )}
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
