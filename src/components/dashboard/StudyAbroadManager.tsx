import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { sanitizeIlike } from "@/lib/supabaseQuery";
import { withTimeout } from "@/hooks/useQueryWithTimeout";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import { DashboardTableSkeleton, DashboardErrorState } from "./DashboardSkeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
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
  Star,
  Award,
  Globe,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { COUNTRIES } from "@/lib/constants/countries";
import { cn } from "@/lib/utils";

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
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
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
        const safe = sanitizeIlike(debouncedSearch);
        if (safe) {
          query = query.or(`university_name.ilike.%${safe}%,program_name.ilike.%${safe}%`);
        }
      }

      if (countryFilter !== "all") {
        query = query.eq("country_code", countryFilter);
      }

      const from = (page - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      query = query.range(from, to);

      const { data, count, error: supabaseError } = await query;
      if (supabaseError) throw supabaseError;

      setPrograms((data as unknown as StudyAbroadProgram[]) || []);
      setTotalCount(count || 0);
    } catch (err: any) {
      console.error("Error loading programs:", err);
      setError(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, countryFilter]);

  useEffect(() => {
    loadPrograms();
  }, [loadPrograms]);

  const handleOpenDialog = (program?: StudyAbroadProgram) => {
    if (program) {
      setEditingProgram(program);
      setFormData({
        ...program,
        degree_type: program.degree_type || "",
        field_of_study: program.field_of_study || "",
        duration: program.duration || "",
        tuition_range: program.tuition_range || "",
        requirements: Array.isArray(program.requirements) ? program.requirements : [],
        intake_months: program.intake_months || [],
        application_deadline: program.application_deadline || "",
        url: program.url || "",
      });
    } else {
      setEditingProgram(null);
      setFormData(emptyProgram);
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.country_code || !formData.university_name.trim()) {
      toast.error("University name and country are required");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        university_name: formData.university_name.trim(),
        program_name: formData.program_name.trim(),
        intake_months: formData.intake_months.length > 0 ? formData.intake_months : null,
        url: formData.url?.trim() || null,
      };

      const { error: saveError } = editingProgram
        ? await supabase.from("study_abroad_programs").update(payload).eq("id", editingProgram.id)
        : await supabase.from("study_abroad_programs").insert([payload]);

      if (saveError) throw saveError;
      toast.success(editingProgram ? "Program updated" : "Program created");
      setIsDialogOpen(false);
      loadPrograms();
    } catch (err: any) {
      toast.error(err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error: delError } = await supabase.from("study_abroad_programs").delete().eq("id", id);
    if (!delError) {
      toast.success("Program removed");
      loadPrograms();
    } else {
      toast.error("Delete failed");
    }
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <Card className="shadow-sm border-muted">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-xl flex items-center gap-2 font-bold">
              <Globe className="h-5 w-5 text-primary" />
              Study Abroad Catalog
            </CardTitle>
            <CardDescription>{totalCount} global programs currently listed</CardDescription>
          </div>
          <Button size="sm" onClick={() => handleOpenDialog()} className="shadow-sm">
            <Plus className="h-4 w-4 mr-2" /> Add Program
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search university or program..."
              className="pl-9 h-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={countryFilter} onValueChange={setCountryFilter}>
            <SelectTrigger className="w-full sm:w-[200px] h-9">
              <SelectValue placeholder="All Countries" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">🌍 All Countries</SelectItem>
              {COUNTRIES.map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  {c.flag} {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <DashboardTableSkeleton rows={5} columns={6} />
        ) : error ? (
          <DashboardErrorState title="Error" message={error} onRetry={loadPrograms} />
        ) : (
          <div className="rounded-xl border border-muted bg-background overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="font-bold">University & Program</TableHead>
                  <TableHead className="font-bold">Region</TableHead>
                  <TableHead className="font-bold">Specs</TableHead>
                  <TableHead className="font-bold text-center">Badges</TableHead>
                  <TableHead className="font-bold">Status</TableHead>
                  <TableHead className="text-right font-bold pr-6">Manage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {programs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground italic">
                      No programs match your search.
                    </TableCell>
                  </TableRow>
                ) : (
                  programs.map((program) => (
                    <TableRow key={program.id} className="hover:bg-muted/20 transition-colors">
                      <TableCell className="max-w-[250px]">
                        <div className="font-bold text-sm truncate">{program.university_name}</div>
                        <div className="text-xs text-muted-foreground truncate">{program.program_name}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-xs font-medium">
                          <span>{COUNTRIES.find((c) => c.code === program.country_code)?.flag}</span>
                          <span>{program.country_name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-[10px] space-y-0.5">
                          <div className="font-medium">{program.degree_type || "N/A"}</div>
                          <div className="text-muted-foreground">{program.tuition_range || "Contact"}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-center gap-1.5">
                          {program.featured && (
                            <span title="Featured Program">
                              <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                            </span>
                          )}
                          {program.scholarship_available && (
                            <span title="Scholarship Available">
                              <Award className="h-4 w-4 text-emerald-500" />
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={program.is_active ? "default" : "secondary"}
                          className="text-[10px] uppercase font-bold tracking-tight"
                        >
                          {program.is_active ? "Live" : "Draft"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleOpenDialog(program)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                            onClick={() => setDeleteId(program.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-muted-foreground">
              Showing page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next <ChevronRight className="h-4 w-4 mr-1" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              {editingProgram ? "Update Program" : "Create Program Listing"}
            </DialogTitle>
            <DialogDescription>Fill in the global program details below.</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6 border-t border-b">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="font-bold">Target Country *</Label>
                <Select
                  value={formData.country_code}
                  onValueChange={(code) => {
                    const country = COUNTRIES.find((c) => c.code === code);
                    setFormData((p) => ({ ...p, country_code: code, country_name: country?.name || "" }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Country" />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map((c) => (
                      <SelectItem key={c.code} value={c.code}>
                        {c.flag} {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="font-bold">University Name *</Label>
                <Input
                  value={formData.university_name}
                  onChange={(e) => setFormData((p) => ({ ...p, university_name: e.target.value }))}
                  placeholder="University Name"
                />
              </div>
              <div className="space-y-2">
                <Label className="font-bold">Degree Type</Label>
                <Select
                  value={formData.degree_type || ""}
                  onValueChange={(v) => setFormData((p) => ({ ...p, degree_type: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Degree Level" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEGREE_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="font-bold">Program Name *</Label>
                <Input
                  value={formData.program_name}
                  onChange={(e) => setFormData((p) => ({ ...p, program_name: e.target.value }))}
                  placeholder="Program Name"
                />
              </div>
              <div className="space-y-2">
                <Label className="font-bold">Annual Tuition (USD)</Label>
                <Input
                  value={formData.tuition_range || ""}
                  onChange={(e) => setFormData((p) => ({ ...p, tuition_range: e.target.value }))}
                  placeholder="e.g., $25,000"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2 pt-8">
                  <Switch
                    checked={formData.featured}
                    onCheckedChange={(v) => setFormData((p) => ({ ...p, featured: v }))}
                  />
                  <Label>Featured</Label>
                </div>
                <div className="flex items-center space-x-2 pt-8">
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(v) => setFormData((p) => ({ ...p, is_active: v }))}
                  />
                  <Label>Active</Label>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6">
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving} className="min-w-[120px]">
              {saving ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
              {editingProgram ? "Update" : "Publish"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Program Listing?</AlertDialogTitle>
            <AlertDialogDescription>This program will be removed from the portal immediately.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDelete(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
