import { useState, useEffect } from "react";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Building2, GraduationCap, Briefcase, ChevronRight } from "lucide-react";
import { getIcon } from "@/lib/iconMap";

interface Academy {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  academy_type: "executive" | "technical";
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
}

const ICON_OPTIONS = [
  "briefcase", "landmark", "laptop", "megaphone", "truck", "heart-pulse",
  "calculator", "trending-up", "users", "code", "palette", "building-2",
  "graduation-cap", "book-open", "target", "store", "factory", "stethoscope",
  "wrench", "lightbulb", "globe", "shield", "award", "rocket"
];

export function ProfessionsManager() {
  const [academies, setAcademies] = useState<Academy[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [professionLines, setProfessionLines] = useState<ProfessionLine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters
  const [selectedAcademyFilter, setSelectedAcademyFilter] = useState<string>("all");
  const [selectedSchoolFilter, setSelectedSchoolFilter] = useState<string>("all");
  
  // Dialog states
  const [academyDialog, setAcademyDialog] = useState(false);
  const [schoolDialog, setSchoolDialog] = useState(false);
  const [professionDialog, setProfessionDialog] = useState(false);
  
  // Edit states
  const [editingAcademy, setEditingAcademy] = useState<Academy | null>(null);
  const [editingSchool, setEditingSchool] = useState<School | null>(null);
  const [editingProfession, setEditingProfession] = useState<ProfessionLine | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [academiesRes, schoolsRes, professionsRes] = await Promise.all([
        supabase.from("academies").select("*").order("display_order"),
        supabase.from("schools").select("*").order("display_order"),
        supabase.from("profession_categories").select("*").order("display_order")
      ]);

      if (academiesRes.data) setAcademies(academiesRes.data);
      if (schoolsRes.data) setSchools(schoolsRes.data);
      if (professionsRes.data) setProfessionLines(professionsRes.data);
    } catch (error) {
      console.error("Error loading data:", error);
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
      academy_type: formData.get("academy_type") as "executive" | "technical",
      icon: formData.get("icon") as string || "graduation-cap",
      primary_language: formData.get("primary_language") as string,
      is_active: formData.get("is_active") === "true",
      display_order: parseInt(formData.get("display_order") as string) || 0
    };

    try {
      if (editingAcademy) {
        const { error } = await supabase.from("academies").update(data).eq("id", editingAcademy.id);
        if (error) throw error;
        toast.success("Academy updated");
      } else {
        const { error } = await supabase.from("academies").insert(data);
        if (error) throw error;
        toast.success("Academy created");
      }
      setAcademyDialog(false);
      setEditingAcademy(null);
      loadData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDeleteAcademy = async (id: string) => {
    if (!confirm("Delete this academy? This will orphan all related schools.")) return;
    try {
      const { error } = await supabase.from("academies").delete().eq("id", id);
      if (error) throw error;
      toast.success("Academy deleted");
      loadData();
    } catch (error: any) {
      toast.error(error.message);
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
        const { error } = await supabase.from("schools").update(data).eq("id", editingSchool.id);
        if (error) throw error;
        toast.success("School updated");
      } else {
        const { error } = await supabase.from("schools").insert(data);
        if (error) throw error;
        toast.success("School created");
      }
      setSchoolDialog(false);
      setEditingSchool(null);
      loadData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDeleteSchool = async (id: string) => {
    if (!confirm("Delete this school? This will orphan all related profession lines.")) return;
    try {
      const { error } = await supabase.from("schools").delete().eq("id", id);
      if (error) throw error;
      toast.success("School deleted");
      loadData();
    } catch (error: any) {
      toast.error(error.message);
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
      is_active: formData.get("is_active") === "true",
      display_order: parseInt(formData.get("display_order") as string) || 0
    };

    try {
      if (editingProfession) {
        const { error } = await supabase.from("profession_categories").update(data).eq("id", editingProfession.id);
        if (error) throw error;
        toast.success("Profession line updated");
      } else {
        const { error } = await supabase.from("profession_categories").insert(data);
        if (error) throw error;
        toast.success("Profession line created");
      }
      setProfessionDialog(false);
      setEditingProfession(null);
      loadData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDeleteProfession = async (id: string) => {
    if (!confirm("Delete this profession line?")) return;
    try {
      const { error } = await supabase.from("profession_categories").delete().eq("id", id);
      if (error) throw error;
      toast.success("Profession line deleted");
      loadData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  // Filtered data
  const filteredSchools = selectedAcademyFilter === "all" 
    ? schools 
    : schools.filter(s => s.academy_id === selectedAcademyFilter);

  const filteredProfessions = selectedSchoolFilter === "all"
    ? professionLines
    : professionLines.filter(p => p.school_id === selectedSchoolFilter);

  const getAcademyName = (id: string) => academies.find(a => a.id === id)?.name || "Unknown";
  const getSchoolName = (id: string | null) => id ? schools.find(s => s.id === id)?.name || "Unknown" : "Unassigned";

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="academies">
        <TabsList>
          <TabsTrigger value="academies" className="gap-2">
            <Building2 className="h-4 w-4" />
            Academies ({academies.length})
          </TabsTrigger>
          <TabsTrigger value="schools" className="gap-2">
            <GraduationCap className="h-4 w-4" />
            Schools ({schools.length})
          </TabsTrigger>
          <TabsTrigger value="professions" className="gap-2">
            <Briefcase className="h-4 w-4" />
            Profession Lines ({professionLines.length})
          </TabsTrigger>
        </TabsList>

        {/* Academies Tab */}
        <TabsContent value="academies" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Manage top-level academies (Executive & Technical)
            </p>
            <Dialog open={academyDialog} onOpenChange={(open) => { setAcademyDialog(open); if (!open) setEditingAcademy(null); }}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 mr-2" />Add Academy</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingAcademy ? "Edit Academy" : "Add Academy"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={(e) => { e.preventDefault(); handleSaveAcademy(new FormData(e.currentTarget)); }} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name *</Label>
                      <Input id="name" name="name" defaultValue={editingAcademy?.name} required />
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
                  <div className="grid grid-cols-2 gap-4">
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
                  <div className="grid grid-cols-2 gap-4">
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
            {academies.map((academy) => {
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
                        <div className="flex items-center gap-2">
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
                      <Button variant="outline" size="sm" onClick={() => handleDeleteAcademy(academy.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Schools Tab */}
        <TabsContent value="schools" className="space-y-4">
          <div className="flex justify-between items-center">
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
            <Dialog open={schoolDialog} onOpenChange={(open) => { setSchoolDialog(open); if (!open) setEditingSchool(null); }}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 mr-2" />Add School</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingSchool ? "Edit School" : "Add School"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={(e) => { e.preventDefault(); handleSaveSchool(new FormData(e.currentTarget)); }} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name *</Label>
                      <Input id="name" name="name" defaultValue={editingSchool?.name} required />
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
                  <div className="grid grid-cols-2 gap-4">
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
                        <div className="flex items-center gap-2">
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
                      <Button variant="outline" size="sm" onClick={() => handleDeleteSchool(school.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Profession Lines Tab */}
        <TabsContent value="professions" className="space-y-4">
          <div className="flex justify-between items-center">
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
            <Dialog open={professionDialog} onOpenChange={(open) => { setProfessionDialog(open); if (!open) setEditingProfession(null); }}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 mr-2" />Add Profession Line</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>{editingProfession ? "Edit Profession Line" : "Add Profession Line"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={(e) => { e.preventDefault(); handleSaveProfession(new FormData(e.currentTarget)); }} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name *</Label>
                      <Input id="name" name="name" defaultValue={editingProfession?.name} required />
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
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="career_outcome">Career Outcome</Label>
                      <Input id="career_outcome" name="career_outcome" defaultValue={editingProfession?.career_outcome || ""} placeholder="e.g., Sales Executive" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="target_audience">Target Audience</Label>
                      <Input id="target_audience" name="target_audience" defaultValue={editingProfession?.target_audience || ""} placeholder="e.g., Fresh graduates" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
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
              return (
                <Card key={profession.id} className={!profession.is_active ? "opacity-60" : ""}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-lg bg-accent/50 flex items-center justify-center">
                        <IconComp className="h-6 w-6 text-accent-foreground" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{profession.name}</h3>
                          {!profession.is_active && <Badge variant="outline">Inactive</Badge>}
                          {!profession.school_id && <Badge variant="destructive">Unassigned</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-1">{profession.description}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <Badge variant="outline" className="text-xs">{getSchoolName(profession.school_id)}</Badge>
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
                      <Button variant="outline" size="sm" onClick={() => handleDeleteProfession(profession.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
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
      </Tabs>
    </div>
  );
}
