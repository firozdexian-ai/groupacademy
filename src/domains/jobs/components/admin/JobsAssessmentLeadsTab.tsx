import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { withTimeout } from "@/hooks/useQueryWithTimeout";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import { DashboardTableSkeleton, DashboardErrorState } from "@/platform/admin/chrome/DashboardSkeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Download,
  Search,
  Mail,
  Phone,
  Calendar,
  User,
  ShieldCheck,
  Activity,
  Filter,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { AssessmentCodeGenerator } from "./codes/AssessmentCodeGenerator";
import { TalentDetailDialog } from "@/domains/talent/components/admin/TalentDetailDialog";
import { cn } from "@/lib/utils";

/**
 * Platform Logic: Strategic Recruitment Ledger (Assessment Leads)
 * High-fidelity monitor for talent readiness artifacts and conversion telemetry.
 * 2026 Standard: Executive Logic geometry with reinforced data range guards.
 */

interface AssessmentLead {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  percentage: number;
  readiness_level: string;
  created_at: string;
  profession_category: {
    name: string;
  } | null;
}

const readinessColors: Record<string, string> = {
  beginner: "bg-red-500/10 text-red-600 border-red-200",
  developing: "bg-orange-500/10 text-orange-600 border-orange-200",
  competent: "bg-amber-500/10 text-amber-600 border-amber-200",
  proficient: "bg-blue-500/10 text-blue-600 border-blue-200",
  expert: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
};

const PAGE_SIZE = 20;

export function JobsAssessmentLeadsTab() {
  const [leads, setLeads] = useState<AssessmentLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [readinessFilter, setReadinessFilter] = useState<string>("all");
  const [selectedTalentEmail, setSelectedTalentEmail] = useState<string | null>(null);
  const [selectedTalentName, setSelectedTalentName] = useState<string>("");
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    loadRegistryLeads();
  }, [page]);

  const loadRegistryLeads = async () => {
    setLoading(true);
    setError(null);
    try {
      const {
        data,
        error: queryError,
        count,
      } = await withTimeout(
        Promise.resolve(
          supabase
            .from("career_assessments")
            .select(
              `
              id,
              full_name,
              email,
              phone,
              percentage,
              readiness_level,
              created_at,
              profession_category:profession_categories(name)
            `,
              { count: "exact" },
            )
            .order("created_at", { ascending: false })
            .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1),
        ),
        TIMEOUTS.DEFAULT,
        "Registry Link Timeout",
      );

      if (queryError) throw queryError;
      setLeads(data || []);
      setTotalCount(count || 0);
    } catch (err: any) {
      console.error("Registry Sync Fault:", err);
      setError(err.message || "Failed to synchronize assessment leads");
    } finally {
      setLoading(false);
    }
  };

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (lead.phone && lead.phone.includes(searchQuery));
    const matchesReadiness = readinessFilter === "all" || lead.readiness_level === readinessFilter;
    return matchesSearch && matchesReadiness;
  });

  const exportArtifactCSV = () => {
    const headers = ["Entity Name", "Email", "Phone", "Profession Node", "Score %", "Readiness Logic", "Sync Date"];
    const rows = filteredLeads.map((lead) => [
      lead.full_name,
      lead.email,
      lead.phone || "NULL",
      lead.profession_category?.name || "UNASSIGNED",
      lead.percentage.toString(),
      lead.readiness_level.toUpperCase(),
      format(new Date(lead.created_at), "yyyy-MM-dd HH:mm"),
    ]);

    const csvContent = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Registry_Leads_${format(new Date(), "yyyyMMdd")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Artifact exported: CSV sequence generated.");
  };

  if (loading) return <DashboardTableSkeleton rows={5} columns={7} />;

  if (error) return <DashboardErrorState title="Registry Sync Failure" message={error} onRetry={loadRegistryLeads} />;

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <div className="space-y-8 animate-in fade-in duration-1000">
      {/* Executive Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-[20px] bg-primary/10 flex items-center justify-center border border-primary/20">
              <Activity className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-4xl font-black uppercase tracking-tighter italic leading-none">Leads</h2>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 italic ml-16">
            Neural Recruitment Telemetry v2.6
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge
            variant="outline"
            className="rounded-lg border-primary/20 text-primary font-black uppercase text-[9px] px-3 py-1.5 tracking-widest italic bg-primary/5"
          >
            {totalCount} Total Entities detected
          </Badge>
          <Button
            onClick={exportArtifactCSV}
            variant="outline"
            className="rounded-xl h-11 px-6 border-2 font-black uppercase text-[10px] tracking-widest gap-2 shadow-sm hover:bg-primary/5"
          >
            <Download className="w-4 h-4 text-primary" /> Export Artifact
          </Button>
        </div>
      </div>

      {/* Query Console */}
      <Card className="rounded-[32px] border-2 border-border/40 bg-card/30 backdrop-blur-md shadow-sm overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
              <Input
                placeholder="Interrogate registry by name, email, or telemetry..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-14 bg-card/50 border-2 border-border/10 rounded-2xl font-bold tracking-tight text-base"
              />
            </div>
            <div className="flex gap-3">
              <div className="relative flex items-center">
                <Filter className="absolute left-4 h-4 w-4 text-muted-foreground/40 pointer-events-none" />
                <Select value={readinessFilter} onValueChange={setReadinessFilter}>
                  <SelectTrigger className="w-[200px] h-14 pl-11 rounded-2xl border-2 font-black uppercase text-[10px] tracking-widest bg-card/50">
                    <SelectValue placeholder="Logic Status" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-2">
                    <SelectItem value="all" className="font-bold">
                      GLOBAL REGISTRY
                    </SelectItem>
                    {Object.keys(readinessColors).map((level) => (
                      <SelectItem key={level} value={level} className="font-bold capitalize">
                        {level.toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Registry Viewport */}
      <Card className="rounded-[40px] border-2 border-border/40 overflow-hidden shadow-2xl bg-card/30 backdrop-blur-xl">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="hover:bg-transparent border-b-2">
                  <TableHead className="text-[10px] font-black py-8 px-8">
                    Entity Spec
                  </TableHead>
                  <TableHead className="text-[10px] font-black">Uplink Telemetry</TableHead>
                  <TableHead className="text-[10px] font-black">Logic Class</TableHead>
                  <TableHead className="text-[10px] font-black text-center">Score</TableHead>
                  <TableHead className="text-[10px] font-black">Readiness</TableHead>
                  <TableHead className="text-[10px] font-black">Sync Date</TableHead>
                  <TableHead className="text-right text-[10px] font-black pr-8">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-32 text-muted-foreground/40 italic font-black"
                    >
                      No entities detected in current logic path.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLeads.map((lead) => (
                    <TableRow key={lead.id} className="group transition-all hover:bg-primary/[0.02]">
                      <TableCell className="px-8 py-6 font-black uppercase tracking-tight text-sm italic group-hover:text-primary transition-colors">
                        {lead.full_name}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-[11px] font-bold text-foreground/80">
                            <Mail className="h-3.5 w-3.5 text-primary/40" /> {lead.email}
                          </div>
                          {lead.phone && (
                            <div className="flex items-center gap-2 text-[10px] font-medium text-muted-foreground italic">
                              <Phone className="h-3 w-3" /> {lead.phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="rounded-lg border-2 font-black text-[9px] bg-background"
                        >
                          {lead.profession_category?.name || "UNCLASSED"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center font-black text-lg italic tracking-tighter">
                        {lead.percentage}%
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={cn(
                            "rounded-lg font-black text-[8px]  border-2 px-3 py-1 shadow-inner",
                            readinessColors[lead.readiness_level],
                          )}
                        >
                          {lead.readiness_level}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground/40 italic">
                          <Calendar className="h-3.5 w-3.5" />
                          {format(new Date(lead.created_at), "MMM d, yyyy")}
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-8">
                        <div className="flex justify-end items-center gap-3">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 rounded-xl hover:bg-primary/10 transition-all shadow-inner group/btn"
                            onClick={() => {
                              setSelectedTalentEmail(lead.email);
                              setSelectedTalentName(lead.full_name);
                            }}
                          >
                            <User className="h-5 w-5 text-muted-foreground/40 group-hover/btn:text-primary transition-colors" />
                          </Button>
                          <AssessmentCodeGenerator leadEmail={lead.email} leadName={lead.full_name} />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Logic Pagination HUD */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between p-6 bg-muted/20 rounded-[32px] border-2 border-border/40 backdrop-blur-md">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 italic">
            Registry Frame: Cycle {page + 1} / {totalPages}
          </p>
          <div className="flex gap-4">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl h-11 px-6 border-2 font-black uppercase text-[10px] tracking-widest gap-2 disabled:opacity-20"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              <ChevronLeft className="h-4 w-4" /> Previous Node
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl h-11 px-6 border-2 font-black uppercase text-[10px] tracking-widest gap-2 disabled:opacity-20"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
            >
              Next Node <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <TalentDetailDialog
        open={!!selectedTalentEmail}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedTalentEmail(null);
            setSelectedTalentName("");
          }
        }}
        talentEmail={selectedTalentEmail || ""}
        talentName={selectedTalentName}
      />
    </div>
  );
}
