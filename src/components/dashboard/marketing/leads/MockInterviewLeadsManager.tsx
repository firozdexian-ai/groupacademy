import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { withTimeout } from "@/hooks/useQueryWithTimeout";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import { DashboardTableSkeleton, DashboardErrorState } from "../../DashboardSkeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  ExternalLink,
  User,
  Activity,
  Zap,
  TrendingUp,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { MockInterviewCodeGenerator } from "./MockInterviewCodeGenerator";
import { TalentDetailDialog } from "../../talent/TalentDetailDialog";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Mock Interview Leads Orchestrator
 * CTO Reference: Fixed TS2339/TS2739 via native async promise wrapping. [cite: 4, 16]
 */

interface MockInterviewLead {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  job_title: string | null;
  company_name: string | null;
  selection_percentage: number | null;
  performance_level: string | null;
  difficulty: string | null;
  question_count: number | null;
  status: string | null;
  created_at: string;
  completed_at: string | null;
}

const performanceColors: Record<string, string> = {
  needs_work: "bg-red-500/10 text-red-600 border-red-500/20",
  developing: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  competent: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  strong: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  excellent: "bg-green-500/10 text-green-600 border-green-500/20",
};

const performanceLabels: Record<string, string> = {
  needs_work: "Needs Work",
  developing: "Developing",
  competent: "Competent",
  strong: "Strong",
  excellent: "Excellent",
};

export function MockInterviewLeadsManager() {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<MockInterviewLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [performanceFilter, setPerformanceFilter] = useState<string>("all");
  const [selectedTalentEmail, setSelectedTalentEmail] = useState<string | null>(null);
  const [selectedTalentName, setSelectedTalentName] = useState<string>("");

  useEffect(() => {
    loadLeads();
  }, []);

  const loadLeads = async () => {
    setLoading(true);
    setError(null);
    try {
      // FIXED: Wrap PostgrestBuilder in a native async function to ensure native Promise return [cite: 33, 43]
      const fetchLeads = async () => {
        return await supabase.from("mock_interviews").select("*").order("created_at", { ascending: false });
      };

      // FIXED: Destructure from the result of withTimeout with a specific cast [cite: 36, 43]
      const result = (await withTimeout(fetchLeads(), TIMEOUTS.DEFAULT, "Loading mock interview leads timed out")) as {
        data: MockInterviewLead[] | null;
        error: any;
      };

      if (result.error) throw result.error;
      setLeads(result.data || []);
    } catch (err: any) {
      console.error("Telemetry Fault:", err);
      setError(err.message || "Failed to load mock interview leads");
      toast.error("System Error: Failed to synchronize lead data.");
    } finally {
      setLoading(false);
    }
  };

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (lead.phone && lead.phone.includes(searchQuery)) ||
      (lead.job_title && lead.job_title.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
    const matchesPerformance = performanceFilter === "all" || lead.performance_level === performanceFilter;
    return matchesSearch && matchesStatus && matchesPerformance;
  });

  const exportToCSV = () => {
    const headers = ["Name", "Email", "Phone", "Job Title", "Company", "Score %", "Performance", "Status", "Date"];
    const rows = filteredLeads.map((lead) => [
      lead.full_name,
      lead.email,
      lead.phone || "",
      lead.job_title || "",
      lead.company_name || "",
      lead.selection_percentage?.toString() || "",
      lead.performance_level || "",
      lead.status || "",
      format(new Date(lead.created_at), "yyyy-MM-dd"),
    ]);

    const csvContent = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `mock_interview_leads_${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Protocol: Leads exported to CSV.");
  };

  const completedCount = leads.filter((l) => l.status === "completed").length;
  const avgScore =
    leads.length > 0
      ? Math.round(leads.reduce((acc, curr) => acc + (curr.selection_percentage || 0), 0) / leads.length)
      : 0;

  if (loading) return <DashboardTableSkeleton rows={8} columns={8} />;
  if (error) return <DashboardErrorState title="Telemetry Failure" message={error} onRetry={loadLeads} />;

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* EXECUTIVE TELEMETRY HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-muted/20 p-8 rounded-[40px] border-2 border-border/40 backdrop-blur-md">
        <div className="space-y-1 text-left">
          <div className="flex items-center gap-3 text-primary">
            <Activity className="h-8 w-8" />
            <h2 className="text-4xl font-black uppercase tracking-tighter italic leading-none">Interview Pulse</h2>
          </div>
          <div className="flex items-center gap-4 mt-2">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 italic">
              AI Career Service Radar [cite: 78, 135]
            </p>
            <Badge className="bg-primary/10 text-primary border-none font-black text-[9px] px-3 py-1 italic rounded-full">
              <TrendingUp className="h-3 w-3 mr-1" /> {avgScore}% AVG SCORE
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden md:block mr-4">
            <p className="text-[10px] font-black uppercase text-muted-foreground italic tracking-widest">
              Active Conversions [cite: 117]
            </p>
            <p className="text-xl font-black italic text-primary">
              {completedCount} / {leads.length}
            </p>
          </div>
          <Button
            onClick={exportToCSV}
            variant="outline"
            className="h-14 px-8 rounded-2xl border-2 font-black uppercase text-[10px] tracking-widest gap-3"
          >
            <Download className="h-4 w-4" /> Export Leads
          </Button>
        </div>
      </div>

      <Card className="rounded-[40px] border-2 border-border/40 bg-card/30 shadow-2xl overflow-hidden">
        <CardHeader className="p-8 border-b border-border/10 bg-muted/10">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
              <Input
                placeholder="Search leads by name, email, or role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-14 rounded-2xl border-2 pl-12 font-bold uppercase text-[11px] tracking-widest"
              />
            </div>
            <div className="flex gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px] h-14 rounded-2xl border-2 font-black uppercase text-[10px] tracking-widest">
                  <SelectValue placeholder="STATUS" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-2">
                  <SelectItem value="all" className="font-bold uppercase text-[10px]">
                    ALL STATUS
                  </SelectItem>
                  <SelectItem value="completed" className="font-bold uppercase text-[10px]">
                    COMPLETED
                  </SelectItem>
                  <SelectItem value="in_progress" className="font-bold uppercase text-[10px]">
                    IN PROGRESS
                  </SelectItem>
                  <SelectItem value="abandoned" className="font-bold uppercase text-[10px]">
                    ABANDONED
                  </SelectItem>
                </SelectContent>
              </Select>
              <Select value={performanceFilter} onValueChange={setPerformanceFilter}>
                <SelectTrigger className="w-[180px] h-14 rounded-2xl border-2 font-black uppercase text-[10px] tracking-widest">
                  <SelectValue placeholder="PERFORMANCE" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-2">
                  <SelectItem value="all" className="font-bold uppercase text-[10px]">
                    ALL LEVELS
                  </SelectItem>
                  {Object.entries(performanceLabels).map(([val, label]) => (
                    <SelectItem key={val} value={val} className="font-bold uppercase text-[10px]">
                      {label.toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="ghost" size="icon" onClick={loadLeads} className="h-14 w-14 rounded-2xl border-2">
                <RefreshCw className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/10">
              <TableRow className="hover:bg-transparent border-b-2">
                <TableHead className="font-black uppercase text-[10px] tracking-widest py-6 pl-8">Lead Node</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest">Target Role</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest">Pulse Score</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest">Performance</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest">Status</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest">Deployment</TableHead>
                <TableHead className="text-right py-6 pr-8"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-20 italic font-bold opacity-50">
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
                      <p className="font-black text-sm uppercase italic tracking-tight">{lead.full_name || "-"}</p>
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
                      {lead.selection_percentage !== null ? (
                        <div className="flex items-center gap-2">
                          <Zap className="h-3 w-3 text-primary fill-current" />
                          <span className="font-black italic text-sm">{lead.selection_percentage}%</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs italic">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {lead.performance_level ? (
                        <Badge
                          className={cn(
                            "font-black text-[9px] uppercase tracking-widest italic border-2 px-3 py-1",
                            performanceColors[lead.performance_level],
                          )}
                        >
                          {performanceLabels[lead.performance_level]}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs italic">PENDING</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={cn(
                          "font-black text-[9px] uppercase tracking-widest italic rounded-full px-4",
                          lead.status === "completed"
                            ? "bg-green-500/10 text-green-600"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        {lead.status || "UNKNOWN"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span className="text-[10px] font-black italic">
                          {format(new Date(lead.created_at), "MMM d, yyyy")}
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
                            onClick={() => navigate(`/mock-interview/results/${lead.id}`)}
                            className="hover:bg-primary/10 hover:text-primary"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        )}
                        <MockInterviewCodeGenerator leadEmail={lead.email} leadName={lead.full_name} />
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
}
