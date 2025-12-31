import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { withTimeout } from "@/hooks/useQueryWithTimeout";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import { DashboardTableSkeleton, DashboardErrorState } from "./DashboardSkeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Search, Edit, Trash2, GraduationCap, MapPin, Calendar, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface StudyAbroadProgram {
  id: string;
  country_code: string;
  country_name: string;
  university_name: string;
  program_name: string;
  degree_type: string | null;
  field_of_study: string | null;
  duration: string | null;
  tuition_range: string | null;
  requirements: any;
  intake_months: string[] | null;
  application_deadline: string | null;
  scholarship_available: boolean;
  featured: boolean;
  is_active: boolean;
  url: string | null;
  created_at: string;
}

const COUNTRIES = [
  { code: "UK", name: "United Kingdom", flag: "🇬🇧" },
  { code: "US", name: "United States", flag: "🇺🇸" },
  { code: "CA", name: "Canada", flag: "🇨🇦" },
  { code: "AU", name: "Australia", flag: "🇦🇺" },
  { code: "DE", name: "Germany", flag: "🇩🇪" },
  { code: "SG", name: "Singapore", flag: "🇸🇬" },
];

const DEGREE_TYPES = ["Bachelor's", "Master's", "PhD", "Diploma", "Certificate"];

const emptyProgram = {
  country_code: "",
  country_name: "",
  university_name: "",
  program_name: "",
  degree_type: "",
  field_of_study: "",
  duration: "",
  tuition_range: "",
  requirements: [] as string[],
  intake_months: [] as string[],
  application_deadline: "",
  scholarship_available: false,
  featured: false,
  is_active: true,
  url: "",
};

export function StudyAbroadManager() {
  const [programs, setPrograms] = useState<StudyAbroadProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [countryFilter, setCountryFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<StudyAbroadProgram | null>(null);
  const [formData, setFormData] = useState(emptyProgram);
  const [saving, setSaving] = useState(false);
  const [requirementInput, setRequirementInput] = useState("");

  useEffect(() => {
    loadPrograms();
  }, []);

  const loadPrograms = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: queryError } = await withTimeout(
        Promise.resolve(
          supabase
            .from("study_abroad_programs")
            .select("*")
            .order("created_at", { ascending: false })
        ).then(q => q),
        TIMEOUTS.DEFAULT,
        "Loading programs timed out"
      );

      if (queryError) throw queryError;
      setPrograms(data || []);
    } catch (err: any) {
      console.error("Error loading programs:", err);
      setError(err.message || "Failed to load programs");
      toast.error("Failed to load programs");
    } finally {
      setLoading(false);
    }
  };

  const filteredPrograms = programs.filter((program) => {
    const matchesSearch =
      program.university_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      program.program_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      program.country_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCountry = countryFilter === "all" || program.country_code === countryFilter;
    return matchesSearch && matchesCountry;
  });

  const handleOpenDialog = (program?: StudyAbroadProgram) => {
    if (program) {
      setEditingProgram(program);
      setFormData({
        country_code: program.country_code,
        country_name: program.country_name,
        university_name: program.university_name,
        program_name: program.program_name,
        degree_type: program.degree_type || "",
        field_of_study: program.field_of_study || "",
        duration: program.duration || "",
        tuition_range: program.tuition_range || "",
        requirements: Array.isArray(program.requirements) ? program.requirements : [],
        intake_months: program.intake_months || [],
        application_deadline: program.application_deadline || "",
        scholarship_available: program.scholarship_available,
        featured: program.featured,
        is_active: program.is_active,
        url: program.url || "",
      });
    } else {
      setEditingProgram(null);
      setFormData(emptyProgram);
    }
    setIsDialogOpen(true);
  };

  const handleCountryChange = (code: string) => {
    const country = COUNTRIES.find(c => c.code === code);
    setFormData(prev => ({
      ...prev,
      country_code: code,
      country_name: country?.name || ""
    }));
  };

  const handleAddRequirement = () => {
    if (requirementInput.trim()) {
      setFormData(prev => ({
        ...prev,
        requirements: [...prev.requirements, requirementInput.trim()]
      }));
      setRequirementInput("");
    }
  };

  const handleRemoveRequirement = (index: number) => {
    setFormData(prev => ({
      ...prev,
      requirements: prev.requirements.filter((_, i) => i !== index)
    }));
  };

  const handleSave = async () => {
    if (!formData.country_code || !formData.university_name.trim() || !formData.program_name.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSaving(true);
    try {
      const programData = {
        country_code: formData.country_code,
        country_name: formData.country_name,
        university_name: formData.university_name.trim(),
        program_name: formData.program_name.trim(),
        degree_type: formData.degree_type || null,
        field_of_study: formData.field_of_study?.trim() || null,
        duration: formData.duration?.trim() || null,
        tuition_range: formData.tuition_range?.trim() || null,
        requirements: formData.requirements,
        intake_months: formData.intake_months.length > 0 ? formData.intake_months : null,
        application_deadline: formData.application_deadline || null,
        scholarship_available: formData.scholarship_available,
        featured: formData.featured,
        is_active: formData.is_active,
        url: formData.url?.trim() || null,
      };

      if (editingProgram) {
        const { error } = await withTimeout(
          Promise.resolve(supabase
            .from("study_abroad_programs")
            .update(programData)
            .eq("id", editingProgram.id)),
          TIMEOUTS.DEFAULT,
          "Update timed out"
        );
        if (error) throw error;
        toast.success("Program updated successfully");
      } else {
        const { error } = await withTimeout(
          Promise.resolve(supabase.from("study_abroad_programs").insert(programData)),
          TIMEOUTS.DEFAULT,
          "Insert timed out"
        );
        if (error) throw error;
        toast.success("Program created successfully");
      }

      setIsDialogOpen(false);
      loadPrograms();
    } catch (error: any) {
      console.error("Error saving program:", error);
      toast.error("Failed to save program");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this program?")) return;

    try {
      const { error } = await withTimeout(
        Promise.resolve(supabase.from("study_abroad_programs").delete().eq("id", id)),
        TIMEOUTS.DEFAULT,
        "Delete timed out"
      );
      if (error) throw error;
      toast.success("Program deleted successfully");
      loadPrograms();
    } catch (error: any) {
      console.error("Error deleting program:", error);
      toast.error("Failed to delete program");
    }
  };

  const handleToggleActive = async (program: StudyAbroadProgram) => {
    try {
      const { error } = await withTimeout(
        Promise.resolve(supabase
          .from("study_abroad_programs")
          .update({ is_active: !program.is_active })
          .eq("id", program.id)),
        TIMEOUTS.DEFAULT,
        "Update timed out"
      );
      if (error) throw error;
      toast.success(program.is_active ? "Program deactivated" : "Program activated");
      loadPrograms();
    } catch (error: any) {
      console.error("Error toggling program:", error);
      toast.error("Failed to update program");
    }
  };

  const getCountryFlag = (code: string) => {
    return COUNTRIES.find(c => c.code === code)?.flag || "🌍";
  };

  const activeCount = programs.filter(p => p.is_active).length;
  const featuredCount = programs.filter(p => p.featured).length;

  if (loading) {
    return <DashboardTableSkeleton rows={5} columns={6} />;
  }

  if (error) {
    return <DashboardErrorState title="Failed to load programs" message={error} onRetry={loadPrograms} />;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Study Abroad Programs
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {programs.length} programs • {activeCount} active • {featuredCount} featured
            </p>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Add Program
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search programs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={countryFilter} onValueChange={setCountryFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by country" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Countries</SelectItem>
              {COUNTRIES.map(country => (
                <SelectItem key={country.code} value={country.code}>
                  {country.flag} {country.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Program</TableHead>
                <TableHead>University</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Degree</TableHead>
                <TableHead>Tuition</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPrograms.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No programs found
                  </TableCell>
                </TableRow>
              ) : (
                filteredPrograms.map((program) => (
                  <TableRow key={program.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{program.program_name}</p>
                        {program.field_of_study && (
                          <p className="text-sm text-muted-foreground">{program.field_of_study}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{program.university_name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{getCountryFlag(program.country_code)}</span>
                        <span>{program.country_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{program.degree_type || "-"}</TableCell>
                    <TableCell>{program.tuition_range || "-"}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Badge variant={program.is_active ? "default" : "secondary"}>
                          {program.is_active ? "Active" : "Inactive"}
                        </Badge>
                        {program.featured && (
                          <Badge variant="outline" className="text-xs">Featured</Badge>
                        )}
                        {program.scholarship_available && (
                          <Badge variant="outline" className="text-xs text-green-600">Scholarship</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {program.url && (
                          <Button variant="ghost" size="icon" asChild>
                            <a href={program.url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(program)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleToggleActive(program)}>
                          {program.is_active ? "🔴" : "🟢"}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(program.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProgram ? "Edit Program" : "Add New Program"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Country *</Label>
                <Select value={formData.country_code} onValueChange={handleCountryChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map(country => (
                      <SelectItem key={country.code} value={country.code}>
                        {country.flag} {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Degree Type</Label>
                <Select value={formData.degree_type} onValueChange={(v) => setFormData(prev => ({ ...prev, degree_type: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select degree" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEGREE_TYPES.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>University Name *</Label>
              <Input
                value={formData.university_name}
                onChange={(e) => setFormData(prev => ({ ...prev, university_name: e.target.value }))}
                placeholder="e.g., University of Oxford"
              />
            </div>

            <div className="space-y-2">
              <Label>Program Name *</Label>
              <Input
                value={formData.program_name}
                onChange={(e) => setFormData(prev => ({ ...prev, program_name: e.target.value }))}
                placeholder="e.g., MSc Computer Science"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Field of Study</Label>
                <Input
                  value={formData.field_of_study}
                  onChange={(e) => setFormData(prev => ({ ...prev, field_of_study: e.target.value }))}
                  placeholder="e.g., Computer Science"
                />
              </div>
              <div className="space-y-2">
                <Label>Duration</Label>
                <Input
                  value={formData.duration}
                  onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                  placeholder="e.g., 2 years"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tuition Range</Label>
                <Input
                  value={formData.tuition_range}
                  onChange={(e) => setFormData(prev => ({ ...prev, tuition_range: e.target.value }))}
                  placeholder="e.g., $30,000 - $50,000/year"
                />
              </div>
              <div className="space-y-2">
                <Label>Application Deadline</Label>
                <Input
                  type="date"
                  value={formData.application_deadline}
                  onChange={(e) => setFormData(prev => ({ ...prev, application_deadline: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Program URL</Label>
              <Input
                value={formData.url}
                onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                placeholder="https://..."
              />
            </div>

            <div className="space-y-2">
              <Label>Requirements</Label>
              <div className="flex gap-2">
                <Input
                  value={requirementInput}
                  onChange={(e) => setRequirementInput(e.target.value)}
                  placeholder="Add a requirement"
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddRequirement())}
                />
                <Button type="button" variant="outline" onClick={handleAddRequirement}>Add</Button>
              </div>
              {formData.requirements.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.requirements.map((req, i) => (
                    <Badge key={i} variant="secondary" className="cursor-pointer" onClick={() => handleRemoveRequirement(i)}>
                      {req} ✕
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-6">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.scholarship_available}
                  onCheckedChange={(v) => setFormData(prev => ({ ...prev, scholarship_available: v }))}
                />
                <Label>Scholarship Available</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.featured}
                  onCheckedChange={(v) => setFormData(prev => ({ ...prev, featured: v }))}
                />
                <Label>Featured</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(v) => setFormData(prev => ({ ...prev, is_active: v }))}
                />
                <Label>Active</Label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : editingProgram ? "Update Program" : "Create Program"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
