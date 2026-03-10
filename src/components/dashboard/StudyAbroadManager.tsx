import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { withTimeout } from "@/hooks/useQueryWithTimeout";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import { DashboardTableSkeleton, DashboardErrorState } from "./DashboardSkeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  GraduationCap,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { COUNTRIES } from "@/lib/constants/countries";

// --- Internal Hook for Debounce ---
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

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
  requirements: string[];
  intake_months: string[] | null;
  application_deadline: string | null;
  scholarship_available: boolean;
  featured: boolean;
  is_active: boolean;
  url: string | null;
  created_at: string;
}

const DEGREE_TYPES = ["Bachelor", "Master", "PhD", "Diploma", "Certificate"];
const INTAKE_MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

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

const ITEMS_PER_PAGE = 10;

export function StudyAbroadManager() {
  const [programs, setPrograms] = useState<StudyAbroadProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 500);
  const [countryFilter, setCountryFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<StudyAbroadProgram | null>(null);
  const [formData, setFormData] = useState(emptyProgram);
  const [saving, setSaving] = useState(false);
  const [requirementInput, setRequirementInput] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const loadPrograms = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from("study_abroad_programs")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false });

      if (debouncedSearch) {
        query = query.or(
          `university_name.ilike.%${debouncedSearch}%,program_name.ilike.%${debouncedSearch}%,country_name.ilike.%${debouncedSearch}%`,
        );
      }

      if (countryFilter !== "all") {
        query = query.eq("country_code", countryFilter);
      }

      const from = (page - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      query = query.range(from, to);

      const result = await withTimeout(Promise.resolve(query), TIMEOUTS.DEFAULT, "Loading programs timed out");

      if (result.error) throw result.error;
      setPrograms((result.data as unknown as StudyAbroadProgram[]) || []);
      setTotalCount(result.count || 0);
    } catch (err: any) {
      console.error("Error loading programs:", err);
      setError(err.message || "Failed to load programs");
      toast.error("Failed to load programs");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, countryFilter]);

  useEffect(() => {
    loadPrograms();
  }, [loadPrograms]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, countryFilter]);

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
    const country = COUNTRIES.find((c) => c.code === code);
    setFormData((prev) => ({
      ...prev,
      country_code: code,
      country_name: country?.name || "",
    }));
  };

  const handleAddRequirement = () => {
    if (requirementInput.trim()) {
      setFormData((prev) => ({
        ...prev,
        requirements: [...prev.requirements, requirementInput.trim()],
      }));
      setRequirementInput("");
    }
  };

  const handleRemoveRequirement = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      requirements: prev.requirements.filter((_, i) => i !== index),
    }));
  };

  const toggleIntakeMonth = (month: string) => {
    setFormData((prev) => {
      const exists = prev.intake_months.includes(month);
      return {
        ...prev,
        intake_months: exists ? prev.intake_months.filter((m) => m !== month) : [...prev.intake_months, month],
      };
    });
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
        const { error } = await supabase.from("study_abroad_programs").update(programData).eq("id", editingProgram.id);
        if (error) throw error;
        toast.success("Program updated");
      } else {
        const { error } = await supabase.from("study_abroad_programs").insert(programData);
        if (error) throw error;
        toast.success("Program created");
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
    try {
      const { error } = await supabase.from("study_abroad_programs").delete().eq("id", id);
      if (error) throw error;
      toast.success("Program deleted");
      loadPrograms();
    } catch (error) {
      toast.error("Failed to delete program");
    }
  };

  const handleToggleActive = async (program: StudyAbroadProgram) => {
    try {
      const { error } = await supabase
        .from("study_abroad_programs")
        .update({ is_active: !program.is_active })
        .eq("id", program.id);
      if (error) throw error;
      toast.success(program.is_active ? "Program deactivated" : "Program activated");
      loadPrograms();
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const getCountryFlag = (code: string) => {
    return COUNTRIES.find((c) => c.code === code)?.flag || "🌍";
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <GraduationCap className="h-5 w-5" />
              Study Abroad Programs
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">{totalCount} programs</p>
          </div>
          <Button size="sm" onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Add Program</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
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
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by country" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Countries</SelectItem>
              {COUNTRIES.map((country) => (
                <SelectItem key={country.code} value={country.code}>
                  {country.flag} {country.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Content */}
        {loading ? (
          <DashboardTableSkeleton rows={5} columns={6} />
        ) : error ? (
          <DashboardErrorState title="Error" message={error} onRetry={loadPrograms} />
        ) : (
          <>
            {/* Mobile Cards */}
            <div className="sm:hidden space-y-3">
              {programs.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No programs found</p>
              ) : (
                programs.map((program) => (
                  <div key={program.id} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm line-clamp-1">{program.program_name}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">{program.university_name}</p>
                      </div>
                      <span className="text-lg shrink-0">{getCountryFlag(program.country_code)}</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {program.degree_type && (
                        <Badge variant="outline" className="text-[10px]">{program.degree_type}</Badge>
                      )}
                      <Badge variant={program.is_active ? "default" : "secondary"} className="text-[10px]">
                        {program.is_active ? "Active" : "Inactive"}
                      </Badge>
                      {program.featured && (
                        <Badge variant="outline" className="text-[10px]">Featured</Badge>
                      )}
                      {program.scholarship_available && (
                        <Badge variant="outline" className="text-[10px] text-green-600 border-green-200">Scholarship</Badge>
                      )}
                    </div>
                    {program.tuition_range && (
                      <p className="text-xs text-muted-foreground">{program.tuition_range}</p>
                    )}
                    <div className="flex items-center justify-end gap-1 pt-1 border-t">
                      {program.url && (
                        <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                          <a href={program.url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleOpenDialog(program)}>
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleToggleActive(program)}>
                        {program.is_active ? "🛑" : "✅"}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDeleteId(program.id)}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Desktop Table */}
            <div className="hidden sm:block rounded-md border">
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
                  {programs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        No programs found
                      </TableCell>
                    </TableRow>
                  ) : (
                    programs.map((program) => (
                      <TableRow key={program.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium line-clamp-1">{program.program_name}</p>
                            {program.field_of_study && (
                              <p className="text-xs text-muted-foreground">{program.field_of_study}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{program.university_name}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{getCountryFlag(program.country_code)}</span>
                            <span>{program.country_name}</span>
                          </div>
                        </TableCell>
                        <TableCell>{program.degree_type || "-"}</TableCell>
                        <TableCell>{program.tuition_range || "-"}</TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1 items-start">
                            <Badge variant={program.is_active ? "default" : "secondary"} className="text-xs">
                              {program.is_active ? "Active" : "Inactive"}
                            </Badge>
                            {program.featured && (
                              <Badge variant="outline" className="text-[10px]">Featured</Badge>
                            )}
                            {program.scholarship_available && (
                              <Badge variant="outline" className="text-[10px] text-green-600 border-green-200">Scholarship</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {program.url && (
                              <Button variant="ghost" size="icon" asChild title="Visit URL">
                                <a href={program.url} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="h-4 w-4" />
                                </a>
                              </Button>
                            )}
                            <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(program)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleToggleActive(program)}
                              title={program.is_active ? "Deactivate" : "Activate"}
                            >
                              {program.is_active ? "🛑" : "✅"}
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => setDeleteId(program.id)}>
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-end space-x-2 py-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="hidden sm:inline ml-1">Previous</span>
                </Button>
                <span className="text-sm text-muted-foreground">
                  {page}/{totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  <span className="hidden sm:inline mr-1">Next</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>

      {/* Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProgram ? "Edit Program" : "Add New Program"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Country *</Label>
                <Select value={formData.country_code} onValueChange={handleCountryChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map((country) => (
                      <SelectItem key={country.code} value={country.code}>
                        {country.flag} {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Degree Type</Label>
                <Select
                  value={formData.degree_type}
                  onValueChange={(v) => setFormData((prev) => ({ ...prev, degree_type: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select degree" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEGREE_TYPES.map((type) => (
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
                onChange={(e) => setFormData((prev) => ({ ...prev, university_name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Program Name *</Label>
              <Input
                value={formData.program_name}
                onChange={(e) => setFormData((prev) => ({ ...prev, program_name: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Field of Study</Label>
                <Input
                  value={formData.field_of_study}
                  onChange={(e) => setFormData((prev) => ({ ...prev, field_of_study: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Duration</Label>
                <Input
                  value={formData.duration}
                  onChange={(e) => setFormData((prev) => ({ ...prev, duration: e.target.value }))}
                  placeholder="e.g., 2 years"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tuition Range</Label>
                <Input
                  value={formData.tuition_range}
                  onChange={(e) => setFormData((prev) => ({ ...prev, tuition_range: e.target.value }))}
                  placeholder="$30k - $50k"
                />
              </div>
              <div className="space-y-2">
                <Label>Deadline</Label>
                <Input
                  type="date"
                  value={formData.application_deadline}
                  onChange={(e) => setFormData((prev) => ({ ...prev, application_deadline: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Intake Months</Label>
              <div className="flex flex-wrap gap-2 p-3 border rounded-md bg-muted/20">
                {INTAKE_MONTHS.map((month) => (
                  <Badge
                    key={month}
                    variant={formData.intake_months.includes(month) ? "default" : "outline"}
                    className="cursor-pointer hover:bg-primary/80"
                    onClick={() => toggleIntakeMonth(month)}
                  >
                    {month} {formData.intake_months.includes(month) && <Check className="w-3 h-3 ml-1" />}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Requirements</Label>
              <div className="flex gap-2">
                <Input
                  value={requirementInput}
                  onChange={(e) => setRequirementInput(e.target.value)}
                  placeholder="Add requirement"
                  onKeyDown={(e) => e.key === "Enter" && handleAddRequirement()}
                />
                <Button type="button" variant="outline" onClick={handleAddRequirement}>
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.requirements.map((req, i) => (
                  <Badge
                    key={i}
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => handleRemoveRequirement(i)}
                  >
                    {req} ✕
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Program URL</Label>
              <Input
                value={formData.url}
                onChange={(e) => setFormData((prev) => ({ ...prev, url: e.target.value }))}
                placeholder="https://..."
              />
            </div>

            <div className="flex flex-wrap gap-6 pt-2">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.scholarship_available}
                  onCheckedChange={(v) => setFormData((prev) => ({ ...prev, scholarship_available: v }))}
                />
                <Label>Scholarship</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.featured}
                  onCheckedChange={(v) => setFormData((prev) => ({ ...prev, featured: v }))}
                />
                <Label>Featured</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(v) => setFormData((prev) => ({ ...prev, is_active: v }))}
                />
                <Label>Active</Label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t mt-4">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : editingProgram ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete AlertDialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Program</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Are you sure you want to delete this program?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteId) handleDelete(deleteId);
                setDeleteId(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
