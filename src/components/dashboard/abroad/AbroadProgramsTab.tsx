import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { sanitizeIlike } from "@/lib/supabaseQuery";
import { withTimeout } from "@/hooks/useQueryWithTimeout";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import { DashboardTableSkeleton, DashboardErrorState } from "../DashboardSkeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Star,
  Award,
  Globe,
  RefreshCw,
  Activity,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { COUNTRIES } from "@/lib/constants/countries";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Study Abroad Program Orchestrator
 * CTO Reference: Fixed TS2304 by restoring totalPages scoping and footer logic.
 */

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

export function AbroadProgramsTab() {
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
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const loadPrograms = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const fetchPrograms = async () => {
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
        return await query.range(from, to);
      };

      const result = (await withTimeout(
        fetchPrograms(),
        TIMEOUTS.DEFAULT,
        "Loading study abroad programs timed out",
      )) as { data: StudyAbroadProgram[] | null; count: number | null; error: any };

      if (result.error) throw result.error;

      setPrograms(result.data || []);
      setTotalCount(result.count || 0);
    } catch (err: any) {
      console.error("Telemetry Fault:", err);
      setError(err.message || "Failed to load academic data.");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, countryFilter]);

  useEffect(() => {
    loadPrograms();
  }, [loadPrograms]);

  // RESET PAGE ON SEARCH/FILTER
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, countryFilter]);

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
      toast.error("Protocol Fault: University and Country required.");
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

      const executeSave = async () => {
        return editingProgram
          ? await supabase.from("study_abroad_programs").update(payload).eq("id", editingProgram.id)
          : await supabase.from("study_abroad_programs").insert([payload]);
      };

      const { error: saveError } = (await withTimeout(
        executeSave(),
        TIMEOUTS.DEFAULT,
        "Database timeout during save",
      )) as { error: any };

      if (saveError) throw saveError;
      toast.success(editingProgram ? "Node Optimized" : "Program Deployed");
      setIsDialogOpen(false);
      loadPrograms();
    } catch (err: any) {
      toast.error(err.message || "Protocol Failure: Sync failed.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error: delError } = await supabase.from("study_abroad_programs").delete().eq("id", id);
    if (!delError) {
      toast.success("Node Terminated");
      loadPrograms();
    } else {
      toast.error("Deletion Fault");
    }
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  if (loading && page === 1) return <DashboardTableSkeleton rows={8} columns={6} />;

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* EXECUTIVE HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-muted/20 p-8 rounded-[40px] border-2 border-border/40 backdrop-blur-md">
        <div className="space-y-1 text-left">
          <div className="flex items-center gap-3 text-primary">
            <Globe className="h-8 w-8" />
            <h2 className="text-4xl font-black uppercase tracking-tighter italic leading-none">Global Pulse</h2>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 italic">
            Study Abroad Registry & Academic Mobility Hub
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => handleOpenDialog()}
            className="h-14 px-8 rounded-2xl border-2 font-black uppercase text-[10px] tracking-widest gap-3 shadow-lg"
          >
            <Plus className="h-5 w-5" /> Deploy Program
          </Button>
        </div>
      </div>

      <Card className="rounded-[40px] border-2 border-border/40 bg-card/30 shadow-2xl overflow-hidden">
        <CardHeader className="p-8 border-b border-border/10 bg-muted/10">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
              <Input
                placeholder="Search university nodes or programs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-14 rounded-2xl border-2 pl-12 font-bold uppercase text-[11px] tracking-widest"
              />
            </div>
            <Select value={countryFilter} onValueChange={setCountryFilter}>
              <SelectTrigger className="w-[240px] h-14 rounded-2xl border-2 font-black uppercase text-[10px] tracking-widest">
                <SelectValue placeholder="GLOBAL SECTOR" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-2">
                <SelectItem value="all" className="font-bold text-[10px]">
                  🌍 ALL REGIONS
                </SelectItem>
                {COUNTRIES.map((c) => (
                  <SelectItem key={c.code} value={c.code} className="font-bold text-[10px]">
                    {c.flag} {c.name.toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/10">
              <TableRow className="hover:bg-transparent border-b-2">
                <TableHead className="font-black uppercase text-[10px] tracking-widest py-6 pl-8">
                  Academic Node
                </TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest">Sector</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest text-center">Badges</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest text-center">Status</TableHead>
                <TableHead className="text-right py-6 pr-8"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {programs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-20 italic font-bold opacity-50">
                    No academic nodes synchronized.
                  </TableCell>
                </TableRow>
              ) : (
                programs.map((program) => (
                  <TableRow
                    key={program.id}
                    className="group border-b border-border/5 hover:bg-muted/10 transition-colors"
                  >
                    <TableCell className="py-6 pl-8">
                      <p className="font-black text-sm uppercase italic tracking-tight">{program.university_name}</p>
                      <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5 italic">
                        {program.program_name}
                      </p>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{COUNTRIES.find((c) => c.code === program.country_code)?.flag}</span>
                        <span className="font-black text-[10px] uppercase italic tracking-tighter">
                          {program.country_name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-center gap-2">
                        {program.featured && <Star className="h-4 w-4 text-amber-500 fill-amber-500" />}
                        {program.scholarship_available && <Award className="h-4 w-4 text-emerald-500" />}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        className={cn(
                          "font-black text-[9px] uppercase italic rounded-full px-4",
                          program.is_active ? "bg-green-500/10 text-green-600" : "bg-muted text-muted-foreground",
                        )}
                      >
                        {program.is_active ? "LIVE" : "DRAFT"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right py-6 pr-8">
                      <div className="flex justify-end gap-1 opacity-20 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(program)}
                          className="hover:bg-primary/10"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteId(program.id)}
                          className="hover:bg-destructive/10 text-destructive"
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

          {/* PAGINATION FOOTER - FIXED TS2304 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-6 border-t border-border/10 bg-muted/5">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 italic">
                Sector {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="h-10 rounded-xl border-2 font-black uppercase text-[10px]"
                >
                  <ChevronLeft className="h-4 w-4 mr-2" /> PREV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="h-10 rounded-xl border-2 font-black uppercase text-[10px]"
                >
                  NEXT <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* FORM DIALOG */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl rounded-[40px] border-4 p-0 overflow-hidden bg-background">
          <div className="h-2 w-full bg-primary" />
          <div className="p-10 space-y-8 max-h-[85vh] overflow-y-auto no-scrollbar">
            <DialogHeader className="text-left">
              <DialogTitle className="text-3xl font-black uppercase italic tracking-tighter">
                Academic Deployment
              </DialogTitle>
              <DialogDescription className="text-[10px] font-bold uppercase tracking-widest">
                Define global program parameters and visibility status
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-border/10 pt-8 text-left">
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-primary italic">Global Sector</Label>
                  <Select
                    value={formData.country_code}
                    onValueChange={(code) => {
                      const country = COUNTRIES.find((c) => c.code === code);
                      setFormData((p) => ({ ...p, country_code: code, country_name: country?.name || "" }));
                    }}
                  >
                    <SelectTrigger className="h-14 rounded-2xl border-2 font-black uppercase text-xs shadow-inner">
                      <SelectValue placeholder="SELECT REGION" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-2">
                      {COUNTRIES.map((c) => (
                        <SelectItem key={c.code} value={c.code} className="font-bold text-[10px]">
                          {c.flag} {c.name.toUpperCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-primary italic">University Authority</Label>
                  <Input
                    value={formData.university_name}
                    onChange={(e) => setFormData((p) => ({ ...p, university_name: e.target.value }))}
                    className="h-14 rounded-2xl border-2 font-black uppercase text-xs"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-primary italic">Degree Protocol</Label>
                  <Select
                    value={formData.degree_type || ""}
                    onValueChange={(v) => setFormData((p) => ({ ...p, degree_type: v }))}
                  >
                    <SelectTrigger className="h-14 rounded-2xl border-2 font-black uppercase text-xs shadow-inner">
                      <SelectValue placeholder="DEGREE CLASS" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-2">
                      {DEGREE_TYPES.map((t) => (
                        <SelectItem key={t} value={t} className="font-bold text-[10px]">
                          {t.toUpperCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-primary italic">Program Identifier</Label>
                  <Input
                    value={formData.program_name}
                    onChange={(e) => setFormData((p) => ({ ...p, program_name: e.target.value }))}
                    className="h-14 rounded-2xl border-2 font-black uppercase text-xs"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-primary italic">Tuition Range (USD)</Label>
                  <Input
                    value={formData.tuition_range || ""}
                    onChange={(e) => setFormData((p) => ({ ...p, tuition_range: e.target.value }))}
                    placeholder="e.g. $15,000 - $25,000"
                    className="h-14 rounded-2xl border-2 font-black italic text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 bg-muted/30 p-6 rounded-3xl border-2 border-border/10">
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={formData.featured}
                      onCheckedChange={(v) => setFormData((p) => ({ ...p, featured: v }))}
                    />
                    <Label className="text-[10px] font-black uppercase italic">Featured</Label>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={formData.is_active}
                      onCheckedChange={(v) => setFormData((p) => ({ ...p, is_active: v }))}
                    />
                    <Label className="text-[10px] font-black uppercase italic">Live Node</Label>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="pt-8 border-t border-border/10 flex gap-4">
              <Button
                variant="ghost"
                onClick={() => setIsDialogOpen(false)}
                className="font-black uppercase text-[10px] tracking-widest italic opacity-50"
              >
                Abort Sync
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 h-16 rounded-[24px] font-black uppercase italic tracking-tighter text-xl gap-3 shadow-xl"
              >
                {saving ? <RefreshCw className="animate-spin" /> : <Zap className="fill-current" />}
                {editingProgram ? "Update Infrastructure" : "Deploy Program"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="rounded-[32px] border-4">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black uppercase italic tracking-tighter">
              Terminate Node?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs font-medium italic">
              This action will immediately remove the academic program from the global registry.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="pt-6">
            <AlertDialogCancel className="rounded-xl font-bold uppercase text-[10px]">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDelete(deleteId)}
              className="bg-destructive hover:bg-destructive/90 rounded-xl font-bold uppercase text-[10px]"
            >
              Confirm Termination
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default AbroadProgramsTab;
