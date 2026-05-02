import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Building2,
  GraduationCap,
  Briefcase,
  Bot,
  Search,
  AlertTriangle,
  Coins,
  ShieldCheck,
  Globe,
  Zap,
  Activity,
} from "lucide-react";
import { getIcon } from "@/lib/iconMap";
import { withTimeout } from "@/hooks/useQueryWithTimeout";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import { DashboardCardSkeleton } from "./DashboardSkeleton";
import { cn } from "@/lib/utils";
import { ProfessionalRolesPanel } from "@/components/dashboard/talent/ProfessionalRolesPanel";

/**
 * GroUp Academy: Academic Infrastructure Orchestrator
 * CTO Reference: Manages the 3-tier hierarchy: Academy > School > Program.
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

export function ProfessionsManager() {
  const [academies, setAcademies] = useState<Academy[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [professionLines, setProfessionLines] = useState<ProfessionLine[]>([]);
  const [aiInstructors, setAiInstructors] = useState<AIInstructor[]>([]);
  const [contentCounts, setContentCounts] = useState<Record<string, { count: number; totalCredits: number }>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

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

  if (isLoading)
    return (
      <div className="p-8 space-y-6">
        <DashboardCardSkeleton />
        <DashboardCardSkeleton />
      </div>
    );

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-muted/20 p-8 rounded-[40px] border-2 border-border/40 backdrop-blur-md">
        <div className="space-y-1 text-left">
          <div className="flex items-center gap-3 text-primary">
            <Activity className="h-8 w-8" />
            <h2 className="text-4xl font-black uppercase tracking-tighter italic leading-none">Academic Ops</h2>
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
            className="h-14 px-8 rounded-2xl border-2 font-black uppercase text-[10px] tracking-widest gap-3 shadow-lg"
          >
            <Plus className="h-4 w-4" /> New Academy
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <KPIStatCard icon={Building2} label="Academies" value={academies.length} color="blue" />
        <KPIStatCard icon={GraduationCap} label="Schools" value={schools.length} color="green" />
        <KPIStatCard
          icon={Briefcase}
          label="Programs"
          value={professionLines.length}
          alert={noInstructorCount > 0}
          color="orange"
        />
        <KPIStatCard icon={Bot} label="AI Instructors" value={aiInstructors.length} color="purple" />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-muted/30 backdrop-blur-md rounded-[24px] border-2 border-border/40 p-1.5 mb-8 w-full max-w-2xl">
          <TabsTrigger
            value="academies"
            className="flex-1 rounded-xl font-black uppercase text-[10px] tracking-widest py-3"
          >
            Academies
          </TabsTrigger>
          <TabsTrigger
            value="professions"
            className="flex-1 rounded-xl font-black uppercase text-[10px] tracking-widest py-3"
          >
            Professions
          </TabsTrigger>
          <TabsTrigger
            value="roles"
            className="flex-1 rounded-xl font-black uppercase text-[10px] tracking-widest py-3"
          >
            Roles
          </TabsTrigger>
        </TabsList>

        <TabsContent value="academies" className="grid gap-6">
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

        <TabsContent value="professions" className="grid gap-6">
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

        <TabsContent value="roles">
          <ProfessionalRolesPanel />
        </TabsContent>
      </Tabs>

      {/* Academy Dialog */}
      <Dialog open={academyDialog} onOpenChange={setAcademyDialog}>
        <DialogContent className="max-w-xl rounded-[40px] border-4">
          <form onSubmit={handleSaveAcademy} className="p-6 space-y-6">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter">
                Academy Configuration
              </DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label className="font-black uppercase text-[10px] tracking-widest">Academy Name</Label>
                <Input name="name" defaultValue={editingAcademy?.name} className="h-12 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label className="font-black uppercase text-[10px] tracking-widest">Type</Label>
                <Select name="academy_type" defaultValue={editingAcademy?.academy_type || "executive"}>
                  <SelectTrigger className="h-12 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="executive">Executive</SelectItem>
                    <SelectItem value="technical">Technical</SelectItem>
                    <SelectItem value="freelancing">Freelancing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="font-black uppercase text-[10px] tracking-widest">Slug</Label>
                <Input name="slug" defaultValue={editingAcademy?.slug} className="h-12 rounded-xl font-mono" />
              </div>
            </div>
            <Button type="submit" className="w-full h-14 rounded-2xl font-black uppercase italic">
              Deploy Academy Node
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function KPIStatCard({ icon: Icon, label, value, alert, color }: any) {
  return (
    <Card className="rounded-[32px] border-2 border-border/40 bg-card/30 shadow-xl overflow-hidden group">
      <CardContent className="p-6 flex items-center gap-5">
        <div
          className={cn(
            "p-4 rounded-2xl border-2 group-hover:scale-110 transition-transform",
            alert ? "bg-red-500/10 border-red-500/20" : "bg-primary/10 border-primary/20",
          )}
        >
          <Icon className={cn("h-6 w-6", alert ? "text-red-500" : "text-primary")} />
        </div>
        <div className="text-left">
          <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground italic">{label}</p>
          <p className="text-3xl font-black italic tracking-tighter leading-none">{value}</p>
          {alert && <p className="text-[8px] font-bold text-red-500 uppercase mt-1">Gaps Detected</p>}
        </div>
      </CardContent>
    </Card>
  );
}

function AcademyCard({ academy, schoolCount, onEdit }: any) {
  const Icon = getIcon(academy.icon || "graduation-cap");
  return (
    <Card className="rounded-[32px] border-2 border-border/40 overflow-hidden group hover:border-primary/40 transition-all">
      <CardContent className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center">
            <Icon className="h-8 w-8 text-primary" />
          </div>
          <div className="text-left">
            <h4 className="text-xl font-black uppercase italic tracking-tight">{academy.name}</h4>
            <div className="flex gap-2 mt-1">
              <Badge variant="outline" className="text-[9px] font-black uppercase italic">
                {academy.academy_type}
              </Badge>
              <Badge variant="outline" className="text-[9px] font-black uppercase italic">
                {schoolCount} Schools
              </Badge>
            </div>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onEdit} className="rounded-xl h-12 w-12 hover:bg-primary/10">
          <Pencil className="h-5 w-5" />
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
        "rounded-[32px] border-2 border-border/40 overflow-hidden",
        !hasAI && "border-red-500/20 bg-red-500/5",
      )}
    >
      <CardContent className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center">
            <Icon className="h-8 w-8 text-accent-foreground" />
          </div>
          <div className="text-left">
            <h4 className="text-xl font-black uppercase italic tracking-tight flex items-center gap-3">
              {profession.name}
              {!hasAI && (
                <Badge variant="destructive" className="text-[8px] animate-pulse">
                  MISSING PERSONA
                </Badge>
              )}
            </h4>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
              {stats?.count || 0} Courses • {profession.credit_cost || 0} Credits
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onEdit} className="rounded-xl h-12 w-12">
          <Pencil className="h-5 w-5" />
        </Button>
      </CardContent>
    </Card>
  );
}
