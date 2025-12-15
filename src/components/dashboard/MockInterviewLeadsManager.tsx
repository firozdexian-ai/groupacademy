import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { withTimeout } from "@/hooks/useQueryWithTimeout";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import { DashboardTableSkeleton, DashboardErrorState } from "./DashboardSkeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Search, Mail, Phone, Calendar, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { MockInterviewCodeGenerator } from "./MockInterviewCodeGenerator";
import { useNavigate } from "react-router-dom";

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
  needs_work: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  developing: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  competent: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  strong: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  excellent: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
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

  useEffect(() => {
    loadLeads();
  }, []);

  const loadLeads = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: queryError } = await withTimeout(
        Promise.resolve(
          supabase
            .from("mock_interviews")
            .select("*")
            .order("created_at", { ascending: false })
        ).then(q => q),
        TIMEOUTS.DEFAULT,
        "Loading mock interview leads timed out"
      );

      if (queryError) throw queryError;
      setLeads(data || []);
    } catch (err: any) {
      console.error("Error loading leads:", err);
      setError(err.message || "Failed to load mock interview leads");
      toast.error("Failed to load mock interview leads");
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
    const matchesStatus =
      statusFilter === "all" || lead.status === statusFilter;
    const matchesPerformance =
      performanceFilter === "all" || lead.performance_level === performanceFilter;
    return matchesSearch && matchesStatus && matchesPerformance;
  });

  const exportToCSV = () => {
    const headers = ["Name", "Email", "Phone", "Job Title", "Company", "Score %", "Performance", "Status", "Difficulty", "Questions", "Date"];
    const rows = filteredLeads.map((lead) => [
      lead.full_name,
      lead.email,
      lead.phone || "",
      lead.job_title || "",
      lead.company_name || "",
      lead.selection_percentage?.toString() || "",
      lead.performance_level || "",
      lead.status || "",
      lead.difficulty || "",
      lead.question_count?.toString() || "",
      format(new Date(lead.created_at), "yyyy-MM-dd HH:mm"),
    ]);

    const csvContent = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `mock_interview_leads_${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Leads exported successfully");
  };

  const completedCount = leads.filter(l => l.status === "completed").length;
  const inProgressCount = leads.filter(l => l.status === "in_progress").length;

  if (loading) {
    return <DashboardTableSkeleton rows={5} columns={7} />;
  }

  if (error) {
    return <DashboardErrorState title="Failed to load leads" message={error} onRetry={loadLeads} />;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <CardTitle className="text-lg">Mock Interview Leads ({filteredLeads.length})</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {completedCount} completed • {inProgressCount} in progress
            </p>
          </div>
          <Button onClick={exportToCSV} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
        <div className="flex gap-4 mt-4 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, phone, or job title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="abandoned">Abandoned</SelectItem>
            </SelectContent>
          </Select>
          <Select value={performanceFilter} onValueChange={setPerformanceFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Performance" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="needs_work">Needs Work</SelectItem>
              <SelectItem value="developing">Developing</SelectItem>
              <SelectItem value="competent">Competent</SelectItem>
              <SelectItem value="strong">Strong</SelectItem>
              <SelectItem value="excellent">Excellent</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {filteredLeads.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No mock interview leads found.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Performance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell className="font-medium">{lead.full_name || "-"}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 text-sm">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" /> {lead.email}
                        </span>
                        {lead.phone && (
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Phone className="h-3 w-3" /> {lead.phone}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {lead.job_title || "-"}
                        {lead.company_name && (
                          <span className="text-muted-foreground block text-xs">
                            at {lead.company_name}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {lead.selection_percentage !== null ? (
                        <span className="font-semibold">{lead.selection_percentage}%</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {lead.performance_level ? (
                        <Badge className={performanceColors[lead.performance_level] || ""}>
                          {performanceLabels[lead.performance_level] || lead.performance_level}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={lead.status === "completed" ? "default" : "secondary"}>
                        {lead.status || "unknown"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(lead.created_at), "MMM d, yyyy")}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {lead.status === "completed" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/mock-interview/results/${lead.id}`)}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        )}
                        <MockInterviewCodeGenerator leadEmail={lead.email} leadName={lead.full_name} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
