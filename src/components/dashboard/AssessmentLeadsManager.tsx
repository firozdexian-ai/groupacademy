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
import { Download, Search, Mail, Phone, Calendar, User } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { AssessmentCodeGenerator } from "./AssessmentCodeGenerator";
import { TalentDetailDialog } from "./TalentDetailDialog";

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
  beginner: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  developing: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  competent: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  proficient: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  expert: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
};

const PAGE_SIZE = 20;

export function AssessmentLeadsManager() {
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
    loadLeads();
  }, [page]);

  const loadLeads = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: queryError, count } = await withTimeout(
        Promise.resolve(
          supabase
            .from("career_assessments")
            .select(`
              id,
              full_name,
              email,
              phone,
              percentage,
              readiness_level,
              created_at,
              profession_category:profession_categories(name)
            `, { count: 'exact' })
            .order("created_at", { ascending: false })
            .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
        ).then(q => q),
        TIMEOUTS.DEFAULT,
        "Loading assessment leads timed out"
      );

      if (queryError) throw queryError;
      setLeads(data || []);
      setTotalCount(count || 0);
    } catch (err: any) {
      console.error("Error loading leads:", err);
      setError(err.message || "Failed to load assessment leads");
      toast.error("Failed to load assessment leads");
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (lead.phone && lead.phone.includes(searchQuery));
    const matchesReadiness =
      readinessFilter === "all" || lead.readiness_level === readinessFilter;
    return matchesSearch && matchesReadiness;
  });

  const exportToCSV = () => {
    const headers = ["Name", "Email", "Phone", "Profession", "Score %", "Readiness Level", "Date"];
    const rows = filteredLeads.map((lead) => [
      lead.full_name,
      lead.email,
      lead.phone || "",
      lead.profession_category?.name || "",
      lead.percentage.toString(),
      lead.readiness_level,
      format(new Date(lead.created_at), "yyyy-MM-dd HH:mm"),
    ]);

    const csvContent = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `assessment_leads_${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Leads exported successfully");
  };

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
          <CardTitle className="text-lg">
            Assessment Leads ({totalCount} total{filteredLeads.length !== leads.length ? `, showing ${filteredLeads.length}` : ''})
          </CardTitle>
          <Button onClick={exportToCSV} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
        <div className="flex gap-4 mt-4 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={readinessFilter} onValueChange={setReadinessFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by readiness" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="beginner">Beginner</SelectItem>
              <SelectItem value="developing">Developing</SelectItem>
              <SelectItem value="competent">Competent</SelectItem>
              <SelectItem value="proficient">Proficient</SelectItem>
              <SelectItem value="expert">Expert</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {filteredLeads.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No assessment leads found.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Profession</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell className="font-medium">{lead.full_name}</TableCell>
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
                    <TableCell>{lead.profession_category?.name || "-"}</TableCell>
                    <TableCell>
                      <span className="font-semibold">{lead.percentage}%</span>
                    </TableCell>
                    <TableCell>
                      <Badge className={readinessColors[lead.readiness_level] || ""}>
                        {lead.readiness_level}
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
                        <AssessmentCodeGenerator leadEmail={lead.email} leadName={lead.full_name} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t mt-4">
            <p className="text-sm text-muted-foreground">
              Page {page + 1} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0 || loading}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1 || loading}
              >
                Next
              </Button>
            </div>
          </div>
        )}
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
}
