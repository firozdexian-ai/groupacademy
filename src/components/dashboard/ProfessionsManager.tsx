import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  Building2,
  GraduationCap,
  Briefcase,
  ChevronRight,
  Bot,
  User,
  Search,
  AlertTriangle,
  MessageSquare,
  Coins,
  Globe,
  ShieldCheck,
} from "lucide-react";
import { getIcon } from "@/lib/iconMap";
import { withTimeout } from "@/hooks/useQueryWithTimeout";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import { DashboardCardSkeleton, DashboardErrorState } from "./DashboardSkeleton";

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

const ICON_OPTIONS = [
  "briefcase",
  "landmark",
  "laptop",
  "megaphone",
  "truck",
  "heart-pulse",
  "calculator",
  "trending-up",
  "users",
  "code",
  "palette",
  "building-2",
  "graduation-cap",
  "book-open",
  "target",
  "store",
  "factory",
  "stethoscope",
  "wrench",
  "lightbulb",
  "globe",
  "shield",
  "award",
  "rocket",
];

function autoSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function ProfessionsManager() {
  const [academies, setAcademies] = useState<Academy[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [professionLines, setProfessionLines] = useState<ProfessionLine[]>([]);
  const [aiInstructors, setAiInstructors] = useState<AIInstructor[]>([]);
  const [conversationCounts, setConversationCounts] = useState<Record<string, number>>({});
  const [contentCounts, setContentCounts] = useState<Record<string, { count: number; totalCredits: number }>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [selectedAcademyFilter, setSelectedAcademyFilter] = useState<string>("all");
  const [selectedSchoolFilter, setSelectedSchoolFilter] = useState<string>("all");
  const [instrAcademyFilter, setInstrAcademyFilter] = useState<string>("all");
  const [instrSchoolFilter, setInstrSchoolFilter] = useState<string>("all");
  const [instrProfessionFilter, setInstrProfessionFilter] = useState<string>("all");

  const [academyDialog, setAcademyDialog] = useState(false);
  const [schoolDialog, setSchoolDialog] = useState(false);
  const [professionDialog, setProfessionDialog] = useState(false);
  const [instructorDialog, setInstructorDialog] = useState(false);

  const [editingAcademy, setEditingAcademy] = useState<Academy | null>(null);
  const [editingSchool, setEditingSchool] = useState<School | null>(null);
  const [editingProfession, setEditingProfession] = useState<ProfessionLine | null>(null);
  const [editingInstructor, setEditingInstructor] = useState<AIInstructor | null>(null);

  const [autoSlugValue, setAutoSlugValue] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const results = await withTimeout(
        Promise.all([
          supabase.from("academies").select("*").order("display_order"),
          supabase.from("schools").select("*").order("display_order"),
          supabase.from("profession_categories").select("*").order("display_order"),
          supabase.from("ai_instructors").select("*").order("name"),
          supabase.from("agent_chat_sessions").select("agent_key"), // Matches ai_agents logic
          supabase.from("content").select("id, profession_line_id, credit_cost").eq("is_published", true),
        ]),
        TIMEOUTS.DEFAULT,
        "Loading structural metadata timed out",
      );

      const [academiesRes, schoolsRes, professionsRes, instructorsRes, chatSessionsRes, contentRes] = results as any;
      if (academiesRes.data) setAcademies(academiesRes.data);
      if (schoolsRes.data) setSchools(schoolsRes.data);
      if (professionsRes.data) setProfessionLines(professionsRes.data);
      if (instructorsRes.data) setAiInstructors(instructorsRes.data);

      if (contentRes.data) {
        const cc: Record<string, { count: number; totalCredits: number }> = {};
        contentRes.data.forEach((c: any) => {
          if (c.profession_line_id) {
            if (!cc[c.profession_line_id]) cc[c.profession_line_id] = { count: 0, totalCredits: 0 };
            cc[c.profession_line_id].count += 1;
            cc[c.profession_line_id].totalCredits += c.credit_cost || 0;
          }
        });
        setContentCounts(cc);
      }
    } catch (error: any) {
      setLoadError(error.message);
      toast.error("Structural sync failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAcademy = async (formData: FormData) => {
    const data = {
      name: formData.get("name") as string,
      slug: formData.get("slug") as string,
      description: (formData.get("description") as string) || null,
      academy_type: formData.get("academy_type") as Academy["academy_type"],
      icon: (formData.get("icon") as string) || "graduation-cap",
      primary_language: formData.get("primary_language") as string,
      is_active: formData.get("is_active") === "true",
      display_order: parseInt(formData.get("display_order") as string) || 0,
    };
    try {
      const query = editingAcademy
        ? supabase.from("academies").update(data).eq("id", editingAcademy.id)
        : supabase.from("academies").insert(data);
      const { error } = await withTimeout(query, TIMEOUTS.DEFAULT, "Database timeout");
      if (error) throw error;
      toast.success(editingAcademy ? "Academy updated" : "Academy deployed");
      setAcademyDialog(false);
      setEditingAcademy(null);
      loadData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleSaveSchool = async (formData: FormData) => {
    const data = {
      name: formData.get("name") as string,
      slug: formData.get("slug") as string,
      description: (formData.get("description") as string) || null,
      academy_id: formData.get("academy_id") as string,
      icon: (formData.get("icon") as string) || "book-open",
      executive_capability_goal: (formData.get("executive_capability_goal") as string) || null,
      is_active: formData.get("is_active") === "true",
      display_order: parseInt(formData.get("display_order") as string) || 0,
    };
    try {
      const query = editingSchool
        ? supabase.from("schools").update(data).eq("id", editingSchool.id)
        : supabase.from("schools").insert(data);
      const { error } = await withTimeout(query, TIMEOUTS.DEFAULT, "Database timeout");
      if (error) throw error;
      toast.success("School configuration saved");
      setSchoolDialog(false);
      setEditingSchool(null);
      loadData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleSaveProfession = async (formData: FormData) => {
    const schoolId = formData.get("school_id") as string;
    const data = {
      name: formData.get("name") as string,
      slug: formData.get("slug") as string,
      description: (formData.get("description") as string) || null,
      school_id: schoolId === "none" ? null : schoolId,
      icon: (formData.get("icon") as string) || "briefcase",
      career_outcome: (formData.get("career_outcome") as string) || null,
      target_audience: (formData.get("target_audience") as string) || null,
      credit_cost: parseInt(formData.get("credit_cost") as string) || 0,
      is_active: formData.get("is_active") === "true",
      display_order: parseInt(formData.get("display_order") as string) || 0,
    };
    try {
      const query = editingProfession
        ? supabase.from("profession_categories").update(data).eq("id", editingProfession.id)
        : supabase.from("profession_categories").insert(data);
      const { error } = await withTimeout(query, TIMEOUTS.DEFAULT, "Database timeout");
      if (error) throw error;
      toast.success("Profession line synchronized");
      setProfessionDialog(false);
      setEditingProfession(null);
      loadData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleSaveInstructor = async (formData: FormData) => {
    const expertiseRaw = formData.get("expertise_areas") as string;
    const expertise = expertiseRaw
      ? expertiseRaw
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : null;
    const data = {
      name: formData.get("name") as string,
      persona: formData.get("persona") as string,
      system_prompt: formData.get("system_prompt") as string,
      avatar_url: (formData.get("avatar_url") as string) || null,
      expertise_areas: expertise,
      profession_line_id: formData.get("profession_line_id") as string,
      is_active: formData.get("is_active") === "true",
    };
    try {
      const query = editingInstructor
        ? supabase.from("ai_instructors").update(data).eq("id", editingInstructor.id)
        : supabase.from("ai_instructors").insert(data);
      const { error } = await withTimeout(query, TIMEOUTS.DEFAULT, "Database timeout");
      if (error) throw error;
      toast.success("AI Instructor persona updated");
      setInstructorDialog(false);
      setEditingInstructor(null);
      loadData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const professionLinesWithInstructor = useMemo(
    () => new Set(aiInstructors.map((i) => i.profession_line_id)),
    [aiInstructors],
  );
  const noInstructorCount = professionLines.filter((p) => !professionLinesWithInstructor.has(p.id)).length;

  const filterBySearch = <T extends { name: string }>(items: T[]) =>
    searchQuery ? items.filter((i) => i.name.toLowerCase().includes(searchQuery.toLowerCase())) : items;

  const filteredSchools = filterBySearch(
    selectedAcademyFilter === "all" ? schools : schools.filter((s) => s.academy_id === selectedAcademyFilter),
  );

  const filteredProfessions = filterBySearch(
    selectedSchoolFilter === "all"
      ? professionLines
      : professionLines.filter((p) => p.school_id === selectedSchoolFilter),
  );

  const instrSchoolOptions = useMemo(
    () => (instrAcademyFilter === "all" ? schools : schools.filter((s) => s.academy_id === instrAcademyFilter)),
    [instrAcademyFilter, schools],
  );
  const instrProfessionOptions = useMemo(() => {
    if (instrSchoolFilter === "all") {
      if (instrAcademyFilter === "all") return professionLines;
      const schoolIds = new Set(instrSchoolOptions.map((s) => s.id));
      return professionLines.filter((p) => p.school_id && schoolIds.has(p.school_id));
    }
    return professionLines.filter((p) => p.school_id === instrSchoolFilter);
  }, [instrSchoolFilter, instrAcademyFilter, instrSchoolOptions, professionLines]);

  const filteredInstructors = useMemo(() => {
    let result = aiInstructors;
    if (instrProfessionFilter !== "all") result = result.filter((i) => i.profession_line_id === instrProfessionFilter);
    else if (instrSchoolFilter !== "all" || instrAcademyFilter !== "all") {
      const validProfIds = new Set(instrProfessionOptions.map((p) => p.id));
      result = result.filter((i) => validProfIds.has(i.profession_line_id));
    }
    return filterBySearch(result);
  }, [
    aiInstructors,
    instrProfessionFilter,
    instrSchoolFilter,
    instrAcademyFilter,
    instrProfessionOptions,
    searchQuery,
  ]);

  if (isLoading)
    return (
      <div className="space-y-6">
        <DashboardCardSkeleton />
        <DashboardCardSkeleton />
      </div>
    );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Academic Infrastructure</h2>
          <p className="text-sm text-muted-foreground">
            Define schools, professions, and AI instructors for the global platform.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPIStatCard
          icon={Building2}
          label="Academies"
          value={academies.length}
          subtext={`${academies.filter((a) => a.is_active).length} online`}
        />
        <KPIStatCard
          icon={GraduationCap}
          label="Schools"
          value={schools.length}
          subtext={`${schools.filter((s) => s.is_active).length} online`}
        />
        <KPIStatCard
          icon={Briefcase}
          label="Professions"
          value={professionLines.length}
          subtext={`${professionLines.filter((p) => p.is_active).length} online`}
          alertCount={noInstructorCount}
        />
        <KPIStatCard
          icon={Bot}
          label="AI Instructors"
          value={aiInstructors.length}
          subtext={`${aiInstructors.filter((i) => i.is_active).length} online`}
        />
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search hierarchy by name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      <Tabs defaultValue="academies" className="w-full">
        <TabsList className="bg-muted/50 p-1 mb-4 h-auto flex-wrap">
          <TabsTrigger value="academies" className="font-bold">
            Academies ({academies.length})
          </TabsTrigger>
          <TabsTrigger value="schools" className="font-bold">
            Schools ({schools.length})
          </TabsTrigger>
          <TabsTrigger value="professions" className="font-bold">
            Profession Lines ({professionLines.length})
          </TabsTrigger>
          <TabsTrigger value="instructors" className="font-bold">
            AI Personas ({aiInstructors.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="academies" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Global Academies</p>
            <Button onClick={() => setAcademyDialog(true)} className="shadow-md">
              <Plus className="h-4 w-4 mr-2" />
              Add Academy
            </Button>
          </div>
          <div className="grid gap-3">
            {academies.map((a) => (
              <AcademyItem
                key={a.id}
                academy={a}
                schoolCount={schools.filter((s) => s.academy_id === a.id).length}
                onEdit={(a) => {
                  setEditingAcademy(a);
                  setAcademyDialog(true);
                }}
              />
            ))}
          </div>
        </TabsContent>

        {/* Schools, Professions, and Instructors content similar structure but optimized icons/badges */}
        <TabsContent value="professions" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Career Tracks</p>
            <Button onClick={() => setProfessionDialog(true)} className="shadow-md">
              <Plus className="h-4 w-4 mr-2" />
              Add Profession
            </Button>
          </div>
          <div className="grid gap-3">
            {filteredProfessions.map((p) => {
              const instructor = aiInstructors.find((i) => i.profession_line_id === p.id);
              return (
                <ProfessionItem
                  key={p.id}
                  profession={p}
                  hasAI={!!instructor}
                  schoolName={schools.find((s) => s.id === p.school_id)?.name}
                  stats={contentCounts[p.id]}
                  onEdit={(p) => {
                    setEditingProfession(p);
                    setProfessionDialog(true);
                  }}
                />
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function KPIStatCard({ icon: Icon, label, value, subtext, alertCount }: any) {
  return (
    <Card className="shadow-sm">
      <CardContent className="p-4 text-center">
        <Icon className="h-5 w-5 mx-auto mb-1 text-primary" />
        <p className="text-2xl font-black">{value}</p>
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{label}</p>
        {alertCount ? (
          <p className="text-[10px] text-destructive font-bold mt-1 flex items-center justify-center gap-1">
            <AlertTriangle className="h-3 w-3" /> {alertCount} MISSING AI
          </p>
        ) : (
          <p className="text-[10px] text-muted-foreground mt-1">{subtext}</p>
        )}
      </CardContent>
    </Card>
  );
}

function AcademyItem({ academy, schoolCount, onEdit }: any) {
  const Icon = getIcon(academy.icon);
  return (
    <Card className={`border-l-4 ${academy.is_active ? "border-l-primary" : "border-l-muted opacity-60"}`}>
      <CardContent className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h4 className="font-bold flex items-center gap-2">
              {academy.name}{" "}
              <Badge variant="secondary" className="text-[10px] uppercase">
                {academy.academy_type}
              </Badge>
            </h4>
            <p className="text-xs text-muted-foreground">
              {schoolCount} Schools • {academy.primary_language === "english" ? "English" : "Bangla"}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={() => onEdit(academy)}>
          <Pencil className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}

function ProfessionItem({ profession, hasAI, schoolName, stats, onEdit }: any) {
  const Icon = getIcon(profession.icon);
  return (
    <Card className={`border-l-4 ${profession.is_active ? "border-l-accent" : "border-l-muted opacity-60"}`}>
      <CardContent className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded bg-accent/10 flex items-center justify-center">
            <Icon className="h-5 w-5 text-accent-foreground" />
          </div>
          <div>
            <h4 className="font-bold flex items-center gap-2">
              {profession.name}{" "}
              {!hasAI && (
                <Badge variant="destructive" className="text-[10px]">
                  MISSING AI
                </Badge>
              )}
            </h4>
            <p className="text-xs text-muted-foreground">
              {schoolName || "Unassigned"} • {stats?.count || 0} Courses • {profession.credit_cost || 0} credits
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {profession.career_outcome && (
            <Badge variant="outline" className="hidden md:flex text-[10px] items-center gap-1">
              <ShieldCheck className="h-3 w-3" /> {profession.career_outcome}
            </Badge>
          )}
          <Button variant="ghost" size="icon" onClick={() => onEdit(profession)}>
            <Pencil className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
