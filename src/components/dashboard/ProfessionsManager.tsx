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
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Building2, GraduationCap, Briefcase, ChevronRight, Bot, User, Search, AlertTriangle, MessageSquare, Coins } from "lucide-react";
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
  "briefcase", "landmark", "laptop", "megaphone", "truck", "heart-pulse",
  "calculator", "trending-up", "users", "code", "palette", "building-2",
  "graduation-cap", "book-open", "target", "store", "factory", "stethoscope",
  "wrench", "lightbulb", "globe", "shield", "award", "rocket"
];

function autoSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
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

  // Filters
  const [selectedAcademyFilter, setSelectedAcademyFilter] = useState<string>("all");
  const [selectedSchoolFilter, setSelectedSchoolFilter] = useState<string>("all");
  // Cascading filters for instructors
  const [instrAcademyFilter, setInstrAcademyFilter] = useState<string>("all");
  const [instrSchoolFilter, setInstrSchoolFilter] = useState<string>("all");
  const [instrProfessionFilter, setInstrProfessionFilter] = useState<string>("all");

  // Dialog states
  const [academyDialog, setAcademyDialog] = useState(false);
  const [schoolDialog, setSchoolDialog] = useState(false);
  const [professionDialog, setProfessionDialog] = useState(false);
  const [instructorDialog, setInstructorDialog] = useState(false);

  // Edit states
  const [editingAcademy, setEditingAcademy] = useState<Academy | null>(null);
  const [editingSchool, setEditingSchool] = useState<School | null>(null);
  const [editingProfession, setEditingProfession] = useState<ProfessionLine | null>(null);
  const [editingInstructor, setEditingInstructor] = useState<AIInstructor | null>(null);

  // Auto-slug tracking
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
          Promise.resolve(supabase.from("academies").select("*").order("display_order")),
          Promise.resolve(supabase.from("schools").select("*").order("display_order")),
          Promise.resolve(supabase.from("profession_categories").select("*").order("display_order")),
          Promise.resolve(supabase.from("ai_instructors").select("*").order("name")),
          Promise.resolve(supabase.from("ai_chat_sessions").select("ai_instructor_id")),
          Promise.resolve(supabase.from("content").select("id, profession_line_id, credit_cost").eq("is_published", true))
        ]),
        TIMEOUTS.DEFAULT,
        "Loading professions data timed out"
      );
      const [academiesRes, schoolsRes, professionsRes, instructorsRes, chatSessionsRes, contentRes] = results;
      if (academiesRes.data) setAcademies(academiesRes.data);
      if (schoolsRes.data) setSchools(schoolsRes.data);
      if (professionsRes.data) setProfessionLines(professionsRes.data);
      if (instructorsRes.data) setAiInstructors(instructorsRes.data);

      // Compute conversation counts
      if (chatSessionsRes.data) {
        const counts: Record<string, number> = {};
        chatSessionsRes.data.forEach((s: any) => {
          counts[s.ai_instructor_id] = (counts[s.ai_instructor_id] || 0) + 1;
        });
        setConversationCounts(counts);
      }

      // Compute content counts per profession line
      if (contentRes.data) {
        const cc: Record<string, { count: number; totalCredits: number }> = {};
        contentRes.data.forEach((c: any) => {
          if (c.profession_line_id) {
            if (!cc[c.profession_line_id]) cc[c.profession_line_id] = { count: 0, totalCredits: 0 };
            cc[c.profession_line_id].count += 1;
            cc[c.profession_line_id].totalCredits += (c.credit_cost || 0);
          }
        });
        setContentCounts(cc);
      }
    } catch (error: any) {
      console.error("Error loading data:", error);
      setLoadError(error.message || "Failed to load data");
      toast.error("Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  // Academy CRUD
  const handleSaveAcademy = async (formData: FormData) => {
    const data = {
      name: formData.get("name") as string,
      slug: formData.get("slug") as string,
      description: formData.get("description") as string || null,
      academy_type: formData.get("academy_type") as Academy["academy_type"],
      icon: formData.get("icon") as string || "graduation-cap",
      primary_language: formData.get("primary_language") as string,
      is_active: formData.get("is_active") === "true",
      display_order: parseInt(formData.get("display_order") as string) || 0
    };
    try {
      if (editingAcademy) {
        const { error } = await withTimeout(Promise.resolve(supabase.from("academies").update(data).eq("id", editingAcademy.id)), TIMEOUTS.DEFAULT, "Update timed out");
        if (error) throw error;
        toast.success("Academy updated");
      } else {
        const { error } = await withTimeout(Promise.resolve(supabase.from("academies").insert(data)), TIMEOUTS.DEFAULT, "Insert timed out");
        if (error) throw error;
        toast.success("Academy created");
      }
      setAcademyDialog(false);
      setEditingAcademy(null);
      loadData();
    } catch (error: any) {
      toast.error(error.message || "Operation failed");
    }
  };

  const handleDeleteAcademy = async (id: string) => {
    try {
      const { error } = await withTimeout(Promise.resolve(supabase.from("academies").delete().eq("id", id)), TIMEOUTS.DEFAULT, "Delete timed out");
      if (error) throw error;
      toast.success("Academy deleted");
      loadData();
    } catch (error: any) {
      toast.error(error.message || "Delete failed");
    }
  };

  // School CRUD
  const handleSaveSchool = async (formData: FormData) => {
    const data = {
      name: formData.get("name") as string,
      slug: formData.get("slug") as string,
      description: formData.get("description") as string || null,
      academy_id: formData.get("academy_id") as string,
      icon: formData.get("icon") as string || "book-open",
      executive_capability_goal: formData.get("executive_capability_goal") as string || null,
      is_active: formData.get("is_active") === "true",
      display_order: parseInt(formData.get("display_order") as string) || 0
    };
    try {
      if (editingSchool) {
        const { error } = await withTimeout(Promise.resolve(supabase.from("schools").update(data).eq("id", editingSchool.id)), TIMEOUTS.DEFAULT, "Update timed out");
        if (error) throw error;
        toast.success("School updated");
      } else {
        const { error } = await withTimeout(Promise.resolve(supabase.from("schools").insert(data)), TIMEOUTS.DEFAULT, "Insert timed out");
        if (error) throw error;
        toast.success("School created");
      }
      setSchoolDialog(false);
      setEditingSchool(null);
      loadData();
    } catch (error: any) {
      toast.error(error.message || "Operation failed");
    }
  };

  const handleDeleteSchool = async (id: string) => {
    try {
      const { error } = await withTimeout(Promise.resolve(supabase.from("schools").delete().eq("id", id)), TIMEOUTS.DEFAULT, "Delete timed out");
      if (error) throw error;
      toast.success("School deleted");
      loadData();
    } catch (error: any) {
      toast.error(error.message || "Delete failed");
    }
  };

  // Profession Line CRUD
  const handleSaveProfession = async (formData: FormData) => {
    const schoolId = formData.get("school_id") as string;
    const data = {
      name: formData.get("name") as string,
      slug: formData.get("slug") as string,
      description: formData.get("description") as string || null,
      school_id: schoolId === "none" ? null : schoolId,
      icon: formData.get("icon") as string || "briefcase",
      career_outcome: formData.get("career_outcome") as string || null,
      target_audience: formData.get("target_audience") as string || null,
      credit_cost: parseInt(formData.get("credit_cost") as string) || 0,
      is_active: formData.get("is_active") === "true",
      display_order: parseInt(formData.get("display_order") as string) || 0
    };
    try {
      if (editingProfession) {
        const { error } = await withTimeout(Promise.resolve(supabase.from("profession_categories").update(data).eq("id", editingProfession.id)), TIMEOUTS.DEFAULT, "Update timed out");
        if (error) throw error;
        toast.success("Profession line updated");
      } else {
        const { error } = await withTimeout(Promise.resolve(supabase.from("profession_categories").insert(data)), TIMEOUTS.DEFAULT, "Insert timed out");
        if (error) throw error;
        toast.success("Profession line created");
      }
      setProfessionDialog(false);
      setEditingProfession(null);
      loadData();
    } catch (error: any) {
      toast.error(error.message || "Operation failed");
    }
  };

  const handleDeleteProfession = async (id: string) => {
    try {
      const { error } = await withTimeout(Promise.resolve(supabase.from("profession_categories").delete().eq("id", id)), TIMEOUTS.DEFAULT, "Delete timed out");
      if (error) throw error;
      toast.success("Profession line deleted");
      loadData();
    } catch (error: any) {
      toast.error(error.message || "Delete failed");
    }
  };

  // AI Instructor CRUD
  const handleSaveInstructor = async (formData: FormData) => {
    const expertiseRaw = formData.get("expertise_areas") as string;
    const expertise = expertiseRaw ? expertiseRaw.split(",").map(s => s.trim()).filter(Boolean) : null;
    const data = {
      name: formData.get("name") as string,
      persona: formData.get("persona") as string,
      system_prompt: formData.get("system_prompt") as string,
      avatar_url: formData.get("avatar_url") as string || null,
      expertise_areas: expertise,
      profession_line_id: formData.get("profession_line_id") as string,
      is_active: formData.get("is_active") === "true"
    };
    try {
      if (editingInstructor) {
        const { error } = await withTimeout(Promise.resolve(supabase.from("ai_instructors").update(data).eq("id", editingInstructor.id)), TIMEOUTS.DEFAULT, "Update timed out");
        if (error) throw error;
        toast.success("AI Instructor updated");
      } else {
        const { error } = await withTimeout(Promise.resolve(supabase.from("ai_instructors").insert(data)), TIMEOUTS.DEFAULT, "Insert timed out");
        if (error) throw error;
        toast.success("AI Instructor created");
      }
      setInstructorDialog(false);
      setEditingInstructor(null);
      loadData();
    } catch (error: any) {
      toast.error(error.message || "Operation failed");
    }
  };

  const handleDeleteInstructor = async (id: string) => {
    try {
      const { error } = await withTimeout(Promise.resolve(supabase.from("ai_instructors").delete().eq("id", id)), TIMEOUTS.DEFAULT, "Delete timed out");
      if (error) throw error;
      toast.success("AI Instructor deleted");
      loadData();
    } catch (error: any) {
      toast.error(error.message || "Delete failed");
    }
  };

  // Derived data
  const professionLinesWithInstructor = useMemo(() => {
    const set = new Set(aiInstructors.map(i => i.profession_line_id));
    return set;
  }, [aiInstructors]);

  const noInstructorCount = professionLines.filter(p => !professionLinesWithInstructor.has(p.id)).length;

  // Filtered data with search
  const filterBySearch = <T extends { name: string }>(items: T[]) =>
    searchQuery ? items.filter(i => i.name.toLowerCase().includes(searchQuery.toLowerCase())) : items;

  const filteredSchools = filterBySearch(
    selectedAcademyFilter === "all" ? schools : schools.filter(s => s.academy_id === selectedAcademyFilter)
  );

  const filteredProfessions = filterBySearch(
    selectedSchoolFilter === "all" ? professionLines : professionLines.filter(p => p.school_id === selectedSchoolFilter)
  );

  // Cascading instructor filters
  const instrSchoolOptions = useMemo(() => {
    if (instrAcademyFilter === "all") return schools;
    return schools.filter(s => s.academy_id === instrAcademyFilter);
  }, [instrAcademyFilter, schools]);

  const instrProfessionOptions = useMemo(() => {
    if (instrSchoolFilter === "all") {
      if (instrAcademyFilter === "all") return professionLines;
      const schoolIds = new Set(instrSchoolOptions.map(s => s.id));
      return professionLines.filter(p => p.school_id && schoolIds.has(p.school_id));
    }
    return professionLines.filter(p => p.school_id === instrSchoolFilter);
  }, [instrSchoolFilter, instrAcademyFilter, instrSchoolOptions, professionLines]);

  const filteredInstructors = useMemo(() => {
    let result = aiInstructors;
    if (instrProfessionFilter !== "all") {
      result = result.filter(i => i.profession_line_id === instrProfessionFilter);
    } else if (instrSchoolFilter !== "all" || instrAcademyFilter !== "all") {
      const validProfIds = new Set(instrProfessionOptions.map(p => p.id));
      result = result.filter(i => validProfIds.has(i.profession_line_id));
    }
    return filterBySearch(result);
  }, [aiInstructors, instrProfessionFilter, instrSchoolFilter, instrAcademyFilter, instrProfessionOptions, searchQuery]);

  // Reset cascading filters
  useEffect(() => { setInstrSchoolFilter("all"); setInstrProfessionFilter("all"); }, [instrAcademyFilter]);
  useEffect(() => { setInstrProfessionFilter("all"); }, [instrSchoolFilter]);

  const getAcademyName = (id: string) => academies.find(a => a.id === id)?.name || "Unknown";
  const getSchoolName = (id: string | null) => id ? schools.find(s => s.id === id)?.name || "Unknown" : "Unassigned";
  const getProfessionName = (id: string) => professionLines.find(p => p.id === id)?.name || "Unknown";

  if (isLoading) {
    return (
      <div className="space-y-6">
        <DashboardCardSkeleton />
        <DashboardCardSkeleton />
        <DashboardCardSkeleton />
      </div>
    );
  }

  if (loadError) {
    return (
      <DashboardErrorState
        title="Failed to load professions"
        message={loadError}
        onRetry={loadData}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Building2 className="h-5 w-5 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-bold">{academies.length}</p>
            <p className="text-xs text-muted-foreground">Academies · {academies.filter(a => a.is_active).length} active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <GraduationCap className="h-5 w-5 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-bold">{schools.length}</p>
            <p className="text-xs text-muted-foreground">Schools · {schools.filter(s => s.is_active).length} active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Briefcase className="h-5 w-5 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-bold">{professionLines.length}</p>
            <p className="text-xs text-muted-foreground">Profession Lines · {professionLines.filter(p => p.is_active).length} active</p>
            {noInstructorCount > 0 && (
              <p className="text-xs text-destructive mt-1 flex items-center justify-center gap-1">
                <AlertTriangle className="h-3 w-3" /> {noInstructorCount} without AI
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Bot className="h-5 w-5 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-bold">{aiInstructors.length}</p>
            <p className="text-xs text-muted-foreground">AI Instructors · {aiInstructors.filter(i => i.is_active).length} active</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      <Tabs defaultValue="academies">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="academies" className="gap-2">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">Academies</span> ({academies.length})
          </TabsTrigger>
          <TabsTrigger value="schools" className="gap-2">
            <GraduationCap className="h-4 w-4" />
            <span className="hidden sm:inline">Schools</span> ({schools.length})
          </TabsTrigger>
          <TabsTrigger value="professions" className="gap-2">
            <Briefcase className="h-4 w-4" />
            <span className="hidden sm:inline">Professions</span> ({professionLines.length})
          </TabsTrigger>
          <TabsTrigger value="instructors" className="gap-2">
            <Bot className="h-4 w-4" />
            <span className="hidden sm:inline">AI Instructors</span> ({aiInstructors.length})
          </TabsTrigger>
        </TabsList>

        {/* Academies Tab */}
        <TabsContent value="academies" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Manage top-level academies
            </p>
            <Dialog open={academyDialog} onOpenChange={(open) => { setAcademyDialog(open); if (!open) { setEditingAcademy(null); setAutoSlugValue(""); } }}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 mr-2" />Add Academy</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingAcademy ? "Edit Academy" : "Add Academy"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={(e) => { e.preventDefault(); handleSaveAcademy(new FormData(e.currentTarget)); }} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name *</Label>
                      <Input id="name" name="name" defaultValue={editingAcademy?.name} required onChange={(e) => {
                        const slug = autoSlug(e.target.value);
                        setAutoSlugValue(slug);
                        const slugInput = e.target.form?.querySelector<HTMLInputElement>('[name="slug"]');
                        if (slugInput && (!slugInput.value || slugInput.value === autoSlugValue)) slugInput.value = slug;
                      }} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="slug">Slug *</Label>
                      <Input id="slug" name="slug" defaultValue={editingAcademy?.slug} required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" name="description" defaultValue={editingAcademy?.description || ""} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="academy_type">Type *</Label>
                      <Select name="academy_type" defaultValue={editingAcademy?.academy_type || "executive"}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="executive">Executive</SelectItem>
                          <SelectItem value="technical">Technical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="primary_language">Primary Language *</Label>
                      <Select name="primary_language" defaultValue={editingAcademy?.primary_language || "english"}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="english">English</SelectItem>
                          <SelectItem value="bangla">বাংলা (Bangla)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="icon">Icon</Label>
                      <Select name="icon" defaultValue={editingAcademy?.icon || "graduation-cap"}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {ICON_OPTIONS.map(icon => {
                            const IconComp = getIcon(icon);
                            return (
                              <SelectItem key={icon} value={icon}>
                                <div className="flex items-center gap-2">
                                  <IconComp className="h-4 w-4" />
                                  {icon}
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="display_order">Display Order</Label>
                      <Input id="display_order" name="display_order" type="number" defaultValue={editingAcademy?.display_order || 0} />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch id="is_active" name="is_active" defaultChecked={editingAcademy?.is_active !== false} value="true" />
                    <Label htmlFor="is_active">Active</Label>
                  </div>
                  <Button type="submit" className="w-full">Save Academy</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {filterBySearch(academies).map((academy) => {
              const IconComp = getIcon(academy.icon);
              const schoolCount = schools.filter(s => s.academy_id === academy.id).length;
              return (
                <Card key={academy.id} className={!academy.is_active ? "opacity-60" : ""}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <IconComp className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold">{academy.name}</h3>
                          <Badge variant={academy.academy_type === "executive" ? "default" : "secondary"}>
                            {academy.academy_type}
                          </Badge>
                          {!academy.is_active && <Badge variant="outline">Inactive</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground">{academy.description}</p>
                        <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                          <span>{academy.primary_language === "english" ? "English" : "বাংলা"}</span>
                          <span>•</span>
                          <span>{schoolCount} schools</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => { setEditingAcademy(academy); setAcademyDialog(true); }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Academy?</AlertDialogTitle>
                            <AlertDialogDescription>This will orphan all related schools. This action cannot be undone.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteAcademy(academy.id)}>Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {filterBySearch(academies).length === 0 && (
              <Card className="border-dashed">
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No academies found.</p>
                  <p className="text-sm">Add an academy to get started.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Schools Tab */}
        <TabsContent value="schools" className="space-y-4">
          <div className="flex flex-wrap justify-between items-center gap-2">
            <div className="flex items-center gap-4">
              <Select value={selectedAcademyFilter} onValueChange={setSelectedAcademyFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by Academy" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Academies</SelectItem>
                  {academies.map(a => (
                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                {filteredSchools.length} schools
              </p>
            </div>
            <Dialog open={schoolDialog} onOpenChange={(open) => { setSchoolDialog(open); if (!open) { setEditingSchool(null); setAutoSlugValue(""); } }}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 mr-2" />Add School</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingSchool ? "Edit School" : "Add School"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={(e) => { e.preventDefault(); handleSaveSchool(new FormData(e.currentTarget)); }} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name *</Label>
                      <Input id="name" name="name" defaultValue={editingSchool?.name} required onChange={(e) => {
                        const slug = autoSlug(e.target.value);
                        setAutoSlugValue(slug);
                        const slugInput = e.target.form?.querySelector<HTMLInputElement>('[name="slug"]');
                        if (slugInput && (!slugInput.value || slugInput.value === autoSlugValue)) slugInput.value = slug;
                      }} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="slug">Slug *</Label>
                      <Input id="slug" name="slug" defaultValue={editingSchool?.slug} required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="academy_id">Academy *</Label>
                    <Select name="academy_id" defaultValue={editingSchool?.academy_id}>
                      <SelectTrigger><SelectValue placeholder="Select Academy" /></SelectTrigger>
                      <SelectContent>
                        {academies.map(a => (
                          <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" name="description" defaultValue={editingSchool?.description || ""} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="executive_capability_goal">Executive Capability Goal</Label>
                    <Input id="executive_capability_goal" name="executive_capability_goal" defaultValue={editingSchool?.executive_capability_goal || ""} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="icon">Icon</Label>
                      <Select name="icon" defaultValue={editingSchool?.icon || "book-open"}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {ICON_OPTIONS.map(icon => {
                            const IconComp = getIcon(icon);
                            return (
                              <SelectItem key={icon} value={icon}>
                                <div className="flex items-center gap-2">
                                  <IconComp className="h-4 w-4" />
                                  {icon}
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="display_order">Display Order</Label>
                      <Input id="display_order" name="display_order" type="number" defaultValue={editingSchool?.display_order || 0} />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch id="is_active" name="is_active" defaultChecked={editingSchool?.is_active !== false} value="true" />
                    <Label htmlFor="is_active">Active</Label>
                  </div>
                  <Button type="submit" className="w-full">Save School</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {filteredSchools.map((school) => {
              const IconComp = getIcon(school.icon);
              const professionCount = professionLines.filter(p => p.school_id === school.id).length;
              return (
                <Card key={school.id} className={!school.is_active ? "opacity-60" : ""}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-lg bg-secondary/50 flex items-center justify-center">
                        <IconComp className="h-6 w-6 text-secondary-foreground" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold">{school.name}</h3>
                          {!school.is_active && <Badge variant="outline">Inactive</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground">{school.description}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <Badge variant="outline" className="text-xs">{getAcademyName(school.academy_id)}</Badge>
                          <ChevronRight className="h-3 w-3" />
                          <span>{professionCount} profession lines</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => { setEditingSchool(school); setSchoolDialog(true); }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete School?</AlertDialogTitle>
                            <AlertDialogDescription>This will orphan all related profession lines. This action cannot be undone.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteSchool(school.id)}>Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {filteredSchools.length === 0 && (
              <Card className="border-dashed">
                <CardContent className="py-12 text-center text-muted-foreground">
                  <GraduationCap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No schools found.</p>
                  <p className="text-sm">Add a school to organize profession lines.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Profession Lines Tab */}
        <TabsContent value="professions" className="space-y-4">
          <div className="flex flex-wrap justify-between items-center gap-2">
            <div className="flex items-center gap-4">
              <Select value={selectedSchoolFilter} onValueChange={setSelectedSchoolFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by School" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Schools</SelectItem>
                  {schools.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                {filteredProfessions.length} profession lines
              </p>
            </div>
            <Dialog open={professionDialog} onOpenChange={(open) => { setProfessionDialog(open); if (!open) { setEditingProfession(null); setAutoSlugValue(""); } }}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 mr-2" />Add Profession Line</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>{editingProfession ? "Edit Profession Line" : "Add Profession Line"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={(e) => { e.preventDefault(); handleSaveProfession(new FormData(e.currentTarget)); }} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name *</Label>
                      <Input id="name" name="name" defaultValue={editingProfession?.name} required onChange={(e) => {
                        const slug = autoSlug(e.target.value);
                        setAutoSlugValue(slug);
                        const slugInput = e.target.form?.querySelector<HTMLInputElement>('[name="slug"]');
                        if (slugInput && (!slugInput.value || slugInput.value === autoSlugValue)) slugInput.value = slug;
                      }} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="slug">Slug *</Label>
                      <Input id="slug" name="slug" defaultValue={editingProfession?.slug} required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="school_id">School</Label>
                    <Select name="school_id" defaultValue={editingProfession?.school_id || "none"}>
                      <SelectTrigger><SelectValue placeholder="Select School" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">-- Unassigned --</SelectItem>
                        {schools.map(s => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name} ({getAcademyName(s.academy_id)})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" name="description" defaultValue={editingProfession?.description || ""} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="career_outcome">Career Outcome</Label>
                      <Input id="career_outcome" name="career_outcome" defaultValue={editingProfession?.career_outcome || ""} placeholder="e.g., Sales Executive" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="target_audience">Target Audience</Label>
                      <Input id="target_audience" name="target_audience" defaultValue={editingProfession?.target_audience || ""} placeholder="e.g., Fresh graduates" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="credit_cost">Entry Credit Cost</Label>
                      <Input id="credit_cost" name="credit_cost" type="number" defaultValue={editingProfession?.credit_cost || 0} min={0} placeholder="e.g., 200" />
                      <p className="text-xs text-muted-foreground">Credits to unlock this career track</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="icon">Icon</Label>
                      <Select name="icon" defaultValue={editingProfession?.icon || "briefcase"}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {ICON_OPTIONS.map(icon => {
                            const IconComp = getIcon(icon);
                            return (
                              <SelectItem key={icon} value={icon}>
                                <div className="flex items-center gap-2">
                                  <IconComp className="h-4 w-4" />
                                  {icon}
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="display_order">Display Order</Label>
                      <Input id="display_order" name="display_order" type="number" defaultValue={editingProfession?.display_order || 0} />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch id="is_active" name="is_active" defaultChecked={editingProfession?.is_active !== false} value="true" />
                    <Label htmlFor="is_active">Active</Label>
                  </div>
                  <Button type="submit" className="w-full">Save Profession Line</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {filteredProfessions.map((profession) => {
              const IconComp = getIcon(profession.icon);
              const instructorCount = aiInstructors.filter(i => i.profession_line_id === profession.id).length;
              const cc = contentCounts[profession.id];
              const totalCredits = (profession.credit_cost || 0) + (cc?.totalCredits || 0);
              return (
                <Card key={profession.id} className={!profession.is_active ? "opacity-60" : ""}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-lg bg-accent/50 flex items-center justify-center">
                        <IconComp className="h-6 w-6 text-accent-foreground" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold">{profession.name}</h3>
                          {!profession.is_active && <Badge variant="outline">Inactive</Badge>}
                          {!profession.school_id && <Badge variant="destructive">Unassigned</Badge>}
                          {instructorCount > 0 ? (
                            <Badge variant="secondary" className="gap-1">
                              <Bot className="h-3 w-3" />
                              {instructorCount}
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              No AI
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-1">{profession.description}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground flex-wrap">
                          <Badge variant="outline" className="text-xs">{getSchoolName(profession.school_id)}</Badge>
                          {cc && (
                            <Badge variant="secondary" className="text-xs gap-1">
                              <Briefcase className="h-3 w-3" />
                              {cc.count} courses
                            </Badge>
                          )}
                          {totalCredits > 0 && (
                            <Badge variant="secondary" className="text-xs gap-1">
                              <Coins className="h-3 w-3" />
                              {totalCredits} credits total
                            </Badge>
                          )}
                          {profession.career_outcome && (
                            <>
                              <ChevronRight className="h-3 w-3" />
                              <span>{profession.career_outcome}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => { setEditingProfession(profession); setProfessionDialog(true); }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Profession Line?</AlertDialogTitle>
                            <AlertDialogDescription>This will remove the profession line and may affect linked courses and instructors.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteProfession(profession.id)}>Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {filteredProfessions.length === 0 && (
              <Card className="border-dashed">
                <CardContent className="py-12 text-center text-muted-foreground">
                  No profession lines found. Add one to get started.
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* AI Instructors Tab */}
        <TabsContent value="instructors" className="space-y-4">
          <div className="flex flex-wrap justify-between items-center gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Select value={instrAcademyFilter} onValueChange={setInstrAcademyFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Academy" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Academies</SelectItem>
                  {academies.map(a => (
                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={instrSchoolFilter} onValueChange={setInstrSchoolFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="School" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Schools</SelectItem>
                  {instrSchoolOptions.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={instrProfessionFilter} onValueChange={setInstrProfessionFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Profession" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Professions</SelectItem>
                  {instrProfessionOptions.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                {filteredInstructors.length} instructors
              </p>
            </div>
            <Dialog open={instructorDialog} onOpenChange={(open) => { setInstructorDialog(open); if (!open) setEditingInstructor(null); }}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 mr-2" />Add AI Instructor</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingInstructor ? "Edit AI Instructor" : "Add AI Instructor"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={(e) => { e.preventDefault(); handleSaveInstructor(new FormData(e.currentTarget)); }} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name *</Label>
                      <Input id="name" name="name" defaultValue={editingInstructor?.name} placeholder="e.g., Sarah Rahman" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="profession_line_id">Profession Line *</Label>
                      <Select name="profession_line_id" defaultValue={editingInstructor?.profession_line_id}>
                        <SelectTrigger><SelectValue placeholder="Select Profession Line" /></SelectTrigger>
                        <SelectContent>
                          {professionLines.map(p => (
                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="persona">Persona *</Label>
                    <Textarea
                      id="persona"
                      name="persona"
                      defaultValue={editingInstructor?.persona}
                      placeholder="Brief description of the AI instructor's personality and teaching style..."
                      rows={2}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="system_prompt">System Prompt *</Label>
                    <Textarea
                      id="system_prompt"
                      name="system_prompt"
                      defaultValue={editingInstructor?.system_prompt}
                      placeholder="You are Sarah Rahman, an experienced career consultant specializing in..."
                      rows={6}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="avatar_url">Avatar URL</Label>
                      <Input id="avatar_url" name="avatar_url" defaultValue={editingInstructor?.avatar_url || ""} placeholder="https://..." />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="expertise_areas">Expertise Areas</Label>
                      <Input
                        id="expertise_areas"
                        name="expertise_areas"
                        defaultValue={editingInstructor?.expertise_areas?.join(", ") || ""}
                        placeholder="Sales, Marketing, Negotiation"
                      />
                      <p className="text-xs text-muted-foreground">Comma-separated list</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch id="is_active" name="is_active" defaultChecked={editingInstructor?.is_active !== false} value="true" />
                    <Label htmlFor="is_active">Active</Label>
                  </div>
                  <Button type="submit" className="w-full">Save AI Instructor</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {filteredInstructors.map((instructor) => {
              const convCount = conversationCounts[instructor.id] || 0;
              return (
                <Card key={instructor.id} className={!instructor.is_active ? "opacity-60" : ""}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center overflow-hidden">
                        {instructor.avatar_url ? (
                          <img src={instructor.avatar_url} alt={instructor.name} className="h-full w-full object-cover" />
                        ) : (
                          <User className="h-6 w-6 text-primary" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold">{instructor.name}</h3>
                          {!instructor.is_active && <Badge variant="outline">Inactive</Badge>}
                          <Badge variant="secondary" className="gap-1">
                            <MessageSquare className="h-3 w-3" />
                            {convCount} chats
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-1">{instructor.persona}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <Badge variant="outline" className="text-xs">{getProfessionName(instructor.profession_line_id)}</Badge>
                          {instructor.expertise_areas?.slice(0, 3).map((area, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">{area}</Badge>
                          ))}
                          {instructor.expertise_areas && instructor.expertise_areas.length > 3 && (
                            <span className="text-xs text-muted-foreground">+{instructor.expertise_areas.length - 3} more</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => { setEditingInstructor(instructor); setInstructorDialog(true); }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete AI Instructor?</AlertDialogTitle>
                            <AlertDialogDescription>This instructor and their chat history will be removed.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteInstructor(instructor.id)}>Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {filteredInstructors.length === 0 && (
              <Card className="border-dashed">
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No AI instructors found.</p>
                  <p className="text-sm">Add an AI instructor to enable career guidance for this profession line.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
