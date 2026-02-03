import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import {
  Search,
  Eye,
  Globe,
  DollarSign,
  Calendar,
  GraduationCap,
  FileText,
  MapPin,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

interface RoadmapLead {
  id: string;
  talent_id: string;
  email: string;
  full_name: string;
  status: string;
  target_countries: string[];
  target_intake: string;
  budget_level: string;
  degree_level: string;
  field_of_study: string;
  ielts_score: number | null;
  has_taken_ielts: boolean;
  gpa: string | null;
  years_experience: number | null;
  cv_text: string | null;
  education_summary: Record<string, unknown> | null;
  experience_summary: Record<string, unknown> | null;
  part_time_work_interest: boolean;
  family_support: boolean;
  special_requirements: string | null;
  roadmap_result: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  talents?: {
    full_name: string;
    email: string;
    phone: string | null;
  };
}

export function StudyAbroadRoadmapLeadsManager() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedLead, setSelectedLead] = useState<RoadmapLead | null>(null);

  const { data: leads, isLoading } = useQuery({
    queryKey: ["roadmap-leads", statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("study_abroad_roadmaps")
        .select(`
          *,
          talents (
            full_name,
            email,
            phone
          )
        `)
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as RoadmapLead[];
    },
  });

  const filteredLeads = leads?.filter((lead) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      lead.talents?.full_name?.toLowerCase().includes(searchLower) ||
      lead.talents?.email?.toLowerCase().includes(searchLower) ||
      lead.target_countries?.some((c) => c.toLowerCase().includes(searchLower)) ||
      lead.field_of_study?.toLowerCase().includes(searchLower)
    );
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "secondary",
      processing: "outline",
      completed: "default",
      failed: "destructive",
    };
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

  const handleExport = () => {
    if (!filteredLeads?.length) {
      toast.error("No data to export");
      return;
    }

    const exportData = filteredLeads.map((lead) => ({
      Name: lead.full_name || lead.talents?.full_name || "N/A",
      Email: lead.email || lead.talents?.email || "N/A",
      Phone: lead.talents?.phone || "N/A",
      Status: lead.status,
      "Target Countries": lead.target_countries?.join(", ") || "N/A",
      "Target Intake": lead.target_intake,
      "Budget Level": lead.budget_level,
      "Degree Level": lead.degree_level,
      "Field of Study": lead.field_of_study,
      "IELTS Score": lead.ielts_score || "N/A",
      GPA: lead.gpa || "N/A",
      "Work Experience": lead.years_experience ? `${lead.years_experience} years` : "N/A",
      "Created At": format(new Date(lead.created_at), "PPP"),
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Roadmap Leads");
    XLSX.writeFile(wb, `roadmap-leads-${format(new Date(), "yyyy-MM-dd")}.xlsx`);
    toast.success("Exported successfully");
  };

  const statusCounts = {
    all: leads?.length || 0,
    pending: leads?.filter((l) => l.status === "pending").length || 0,
    processing: leads?.filter((l) => l.status === "processing").length || 0,
    completed: leads?.filter((l) => l.status === "completed").length || 0,
    failed: leads?.filter((l) => l.status === "failed").length || 0,
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {Object.entries(statusCounts).map(([status, count]) => (
          <Card
            key={status}
            className={`cursor-pointer transition-colors ${
              statusFilter === status ? "border-primary bg-primary/5" : ""
            }`}
            onClick={() => setStatusFilter(status)}
          >
            <CardContent className="p-4">
              <p className="text-2xl font-bold">{count}</p>
              <p className="text-sm text-muted-foreground capitalize">{status}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Study Abroad Roadmap Leads
            </CardTitle>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, country, or field..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
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

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Target Countries</TableHead>
                  <TableHead>Intake</TableHead>
                  <TableHead>Study Level</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No roadmap leads found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLeads?.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{lead.talents?.full_name || "N/A"}</p>
                          <p className="text-sm text-muted-foreground">{lead.talents?.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {lead.target_countries?.slice(0, 2).map((country) => (
                            <Badge key={country} variant="outline" className="text-xs">
                              {country}
                            </Badge>
                          ))}
                          {(lead.target_countries?.length || 0) > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{(lead.target_countries?.length || 0) - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{lead.target_intake}</TableCell>
                      <TableCell>{lead.degree_level}</TableCell>
                      <TableCell>{getStatusBadge(lead.status)}</TableCell>
                      <TableCell>{format(new Date(lead.created_at), "MMM d, yyyy")}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedLead(lead)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedLead} onOpenChange={() => setSelectedLead(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Roadmap Request Details
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh] pr-4">
            {selectedLead && (
              <div className="space-y-6">
                {/* User Info */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase">
                    Applicant Information
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Name</p>
                      <p className="font-medium">{selectedLead.talents?.full_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{selectedLead.talents?.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium">{selectedLead.talents?.phone || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      {getStatusBadge(selectedLead.status)}
                    </div>
                  </div>
                </div>

                {/* Study Preferences */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase">
                    Study Preferences
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-start gap-2">
                      <Globe className="h-4 w-4 mt-1 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Target Countries</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {selectedLead.target_countries?.map((c) => (
                            <Badge key={c} variant="secondary">
                              {c}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Calendar className="h-4 w-4 mt-1 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Target Intake</p>
                        <p className="font-medium">{selectedLead.target_intake}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <DollarSign className="h-4 w-4 mt-1 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Budget Level</p>
                        <p className="font-medium">{selectedLead.budget_level}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <GraduationCap className="h-4 w-4 mt-1 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Degree Level</p>
                        <p className="font-medium">{selectedLead.degree_level}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <FileText className="h-4 w-4 mt-1 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Field of Study</p>
                        <p className="font-medium">{selectedLead.field_of_study}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Academic Info */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase">
                    Academic Profile
                  </h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">IELTS Score</p>
                      <p className="font-medium">{selectedLead.ielts_score || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">GPA</p>
                      <p className="font-medium">{selectedLead.gpa || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Work Experience</p>
                      <p className="font-medium">
                        {selectedLead.years_experience
                          ? `${selectedLead.years_experience} years`
                          : "N/A"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* AI Roadmap Summary */}
                {selectedLead.roadmap_result && selectedLead.status === "completed" && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm text-muted-foreground uppercase">
                      AI Roadmap Generated
                    </h4>
                    <div className="bg-muted/50 rounded-lg p-4">
                      <p className="text-sm text-muted-foreground">
                        Roadmap has been generated successfully. The user can view their
                        personalized 12-month study abroad plan in their results page.
                      </p>
                    </div>
                  </div>
                )}

                {/* Timestamps */}
                <div className="text-sm text-muted-foreground border-t pt-4">
                  <p>Created: {format(new Date(selectedLead.created_at), "PPP 'at' p")}</p>
                  <p>Updated: {format(new Date(selectedLead.updated_at), "PPP 'at' p")}</p>
                </div>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
