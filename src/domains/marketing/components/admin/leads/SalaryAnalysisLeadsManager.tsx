import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { withTimeout } from "@/hooks/useQueryWithTimeout";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import { DashboardTableSkeleton, DashboardErrorState } from "../../DashboardSkeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Download,
  Search,
  Eye,
  Loader2,
  TrendingUp,
  User,
  Activity,
  Zap,
  RefreshCw,
  Mail,
  ExternalLink,
} from "lucide-react";
import { format } from "date-fns";
import { SalaryAnalysisCodeGenerator } from "./SalaryAnalysisCodeGenerator";
import { TalentDetailDialog } from "../../talent/TalentDetailDialog";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Salary Intelligence Lead Orchestrator
 * CTO Reference: High-fidelity management of AI-driven salary analysis leads.
 */

interface SalaryAnalysisLead {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  job_title: string | null;
  company_name: string | null;
  status: string | null;
  ai_analysis: any;
  created_at: string | null;
  profession_category: {
    name: string;
  } | null;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  processing: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  completed: "bg-green-500/10 text-green-600 border-green-500/20",
  failed: "bg-red-500/10 text-red-600 border-red-500/20",
};

const statusLabels: Record<string, string> = {
  pending: "Pending",
  processing: "Processing",
  completed: "Completed",
  failed: "Failed",
};

export const SalaryAnalysisLeadsManager = () => {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<SalaryAnalysisLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedTalentEmail, setSelectedTalentEmail] = useState<string | null>(null);
  const [selectedTalentName, setSelectedTalentName] = useState<string>("");

  useEffect(() => {
    loadLeads();
  }, []);

  const loadLeads = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Wrap query in native async for standard Promise behavior
      const fetchLeads = async () => {
        return await supabase
          .from("salary_analyses")
          .select(
            `
            id,
            full_name,
            email,
            phone,
            job_title,
            company_name,
            status,
            ai_analysis,
            created_at,
            profession_category:profession_categories(name)
          `,
          )
          .order("created_at", { ascending: false });
      };

      // 2. Execute via platform timeout protocol
      const result = (await withTimeout(fetchLeads(), TIMEOUTS.DEFAULT, "Loading salary analysis leads timed out")) as {
        data: any[] | null;
        error: any;
      };

      if (result.error) throw result.error;
      setLeads(result.data || []);
    } catch (err: any) {
      console.error("Telemetry Fault:", err);
      setError(err.message || "Failed to load leads");
      toast.error("System Error: Lead synchronization failed.");
    } finally {
      setLoading(false);
    }
  };

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (lead.job_title?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);

    const matchesStatus = statusFilter === "all" || lead.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const exportToCSV = () => {
    const headers = ["Name", "Email", "Phone", "Job Title", "Company", "Profession", "Status", "Date"];
    const rows = filteredLeads.map((lead) => [
      `"${lead.full_name}"`,
      `"${lead.email}"`,
      `"${lead.phone || ""}"`,
      `"${lead.job_title || ""}"`,
      `"${lead.company_name || ""}"`,
      `"${lead.profession_category?.name || ""}"`,
      `"${lead.status || ""}"`,
      `"${lead.created_at ? format(new Date(lead.created_at), "yyyy-MM-dd") : ""}"`,
    ]);

    const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `salary_leads_${format(new Date(), "yyyy-MM-dd")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Protocol: Leads exported to CSV.");
  };

  const completedCount = leads.filter((l) => l.status === "completed").length;

  if (loading) return <DashboardTableSkeleton rows={8} columns={7} />;
  if (error) return <DashboardErrorState title="Telemetry Failure" message={error} onRetry={loadLeads} />;

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* EXECUTIVE KPI BAR */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-muted/20 p-8 rounded-[40px] border-2 border-border/40 backdrop-blur-md">
        <div className="space-y-1 text-left">
          <div className="flex items-center gap-3 text-primary">
            <Activity className="h-8 w-8" />
            <h2 className="text-4xl font-black uppercase tracking-tighter italic leading-none">Salary Pulse</h2>
          </div>
          <div className="flex items-center gap-4 mt-2">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 italic">
              AI Intelligence Lead Radar
            </p>
            <Badge className="bg-primary/10 text-primary border-none font-black text-[9px] px-3 py-1 italic rounded-full">
              {completedCount} VERIFIED CONVERSIONS
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={exportToCSV}
            variant="outline"
            className="h-14 px-8 rounded-2xl border-2 font-black uppercase text-[10px] tracking-widest gap-3"
          >
            <Download className="h-4 w-4" /> Export Registry
          </Button>
          <Button variant="ghost" size="icon" onClick={loadLeads} className="h-14 w-14 rounded-2xl border-2">
            <RefreshCw className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <Card className="rounded-[40px] border-2 border-border/40 bg-card/30 shadow-2xl overflow-hidden">
        <CardHeader className="p-8 border-b border-border/10 bg-muted/10">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
              <Input
                placeholder="Search registry by name, email, or role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-14 rounded-2xl border-2 pl-12 font-bold uppercase text-[11px] tracking-widest"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px] h-14 rounded-2xl border-2 font-black uppercase text-[10px] tracking-widest">
                <SelectValue placeholder="STATUS FILTER" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-2">
                <SelectItem value="all" className="font-bold text-[10px]">
                  ALL STATUS
                </SelectItem>
                {Object.entries(statusLabels).map(([val, label]) => (
                  <SelectItem key={val} value={val} className="font-bold text-[10px]">
                    {label.toUpperCase()}
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
                <TableHead className="font-black uppercase text-[10px] tracking-widest py-6 pl-8">Lead Node</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest">Target Role</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest">Structural Class</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest">Protocol Status</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest">Deployment</TableHead>
                <TableHead className="text-right py-6 pr-8"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-20 italic font-bold opacity-50">
                    No lead synchronization found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredLeads.map((lead) => (
                  <TableRow
                    key={lead.id}
                    className="group border-b border-border/5 hover:bg-muted/10 transition-colors"
                  >
                    <TableCell className="py-6 pl-8">
                      <p className="font-black text-sm uppercase italic tracking-tight">{lead.full_name}</p>
                      <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5 italic flex items-center gap-1">
                        <Mail className="h-2 w-2" /> {lead.email}
                      </p>
                    </TableCell>
                    <TableCell>
                      <p className="font-black uppercase italic text-xs leading-none">{lead.job_title || "-"}</p>
                      {lead.company_name && (
                        <p className="text-[8px] font-bold text-muted-foreground/50 uppercase tracking-widest mt-1">
                          at {lead.company_name}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-black text-[9px] uppercase tracking-tighter border-2">
                        {lead.profession_category?.name || "UNASSIGNED"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={cn(
                          "font-black text-[9px] uppercase tracking-widest italic rounded-full px-4",
                          statusColors[lead.status || "pending"],
                        )}
                      >
                        {statusLabels[lead.status || "pending"]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span className="text-[10px] font-black italic">
                          {lead.created_at ? format(new Date(lead.created_at), "MMM d, yyyy") : "N/A"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right py-6 pr-8">
                      <div className="flex justify-end gap-1 opacity-20 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedTalentEmail(lead.email);
                            setSelectedTalentName(lead.full_name);
                          }}
                          className="hover:bg-primary/10 hover:text-primary"
                        >
                          <User className="h-4 w-4" />
                        </Button>
                        {lead.status === "completed" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(`/salary-analysis/results/${lead.id}`)}
                            className="hover:bg-primary/10 hover:text-primary"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        )}
                        <SalaryAnalysisCodeGenerator leadEmail={lead.email} leadName={lead.full_name} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

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
};

// Helper for consistency
function Calendar(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("lucide lucide-calendar", props.className)}
    >
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
      <path d="M16 2v4" />
      <path d="M8 2v4" />
      <path d="M3 10h18" />
    </svg>
  );
}
