import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { withTimeout } from "@/hooks/useQueryWithTimeout";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import { DashboardTableSkeleton, DashboardErrorState } from "./DashboardSkeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Download, Search, Eye, Loader2, TrendingUp, User } from "lucide-react";
import { format } from "date-fns";
import { SalaryAnalysisCodeGenerator } from "./SalaryAnalysisCodeGenerator";
import { TalentDetailDialog } from "./TalentDetailDialog";
import { useNavigate } from "react-router-dom";

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
  pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  processing: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  completed: "bg-green-500/10 text-green-500 border-green-500/20",
  failed: "bg-red-500/10 text-red-500 border-red-500/20",
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
      const { data, error: queryError } = await withTimeout(
        Promise.resolve(
          supabase
            .from("salary_analyses")
            .select(`
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
            `)
            .order("created_at", { ascending: false })
        ).then(q => q),
        TIMEOUTS.DEFAULT,
        "Loading salary analysis leads timed out"
      );

      if (queryError) throw queryError;
      setLeads(data || []);
    } catch (err: any) {
      console.error("Error loading salary analysis leads:", err);
      setError(err.message || "Failed to load salary analysis leads");
      toast.error("Failed to load salary analysis leads");
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
      lead.full_name,
      lead.email,
      lead.phone || "",
      lead.job_title || "",
      lead.company_name || "",
      lead.profession_category?.name || "",
      lead.status || "",
      lead.created_at ? format(new Date(lead.created_at), "yyyy-MM-dd") : "",
    ]);

    const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `salary-analysis-leads-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const completedCount = leads.filter((l) => l.status === "completed").length;
  const pendingCount = leads.filter((l) => l.status === "pending" || l.status === "processing").length;

  if (loading) {
    return <DashboardTableSkeleton rows={5} columns={7} />;
  }

  if (error) {
    return <DashboardErrorState title="Failed to load leads" message={error} onRetry={loadLeads} />;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Salary Analysis Leads
            </CardTitle>
            <CardDescription>
              {completedCount} completed • {pendingCount} pending/processing
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={exportToCSV}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or job title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Target Position</TableHead>
                <TableHead>Profession</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No salary analysis leads found
                  </TableCell>
                </TableRow>
              ) : (
                filteredLeads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell className="font-medium">{lead.full_name}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{lead.email}</div>
                        {lead.phone && (
                          <div className="text-muted-foreground">{lead.phone}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{lead.job_title || "-"}</div>
                        {lead.company_name && (
                          <div className="text-muted-foreground">{lead.company_name}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {lead.profession_category?.name || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={statusColors[lead.status || "pending"]}
                      >
                        {statusLabels[lead.status || "pending"]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {lead.created_at
                        ? format(new Date(lead.created_at), "MMM d, yyyy")
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedTalentEmail(lead.email);
                            setSelectedTalentName(lead.full_name);
                          }}
                          title="View Talent Profile"
                        >
                          <User className="h-4 w-4" />
                        </Button>
                        {lead.status === "completed" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/salary-analysis/results/${lead.id}`)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        )}
                        <SalaryAnalysisCodeGenerator
                          leadEmail={lead.email}
                          leadName={lead.full_name}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

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
    </Card>
  );
};
