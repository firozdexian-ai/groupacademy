import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { withTimeout } from "@/hooks/useQueryWithTimeout";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import { DashboardTableSkeleton, DashboardErrorState } from "./DashboardSkeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner"; // Standardized toast
import {
  Search,
  Download,
  ExternalLink,
  FileText,
  Mail,
  Loader2,
  Copy,
  Forward,
  CheckCircle2,
  AlertTriangle,
  Brain,
  Trophy,
  CheckCircle,
  TrendingUp,
  Mic,
  List,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import type { Database } from "@/integrations/supabase/types";

// --- Internal Hook for Debounce ---
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

// --- Types ---
type ApplicationStatus = Database["public"]["Enums"]["application_status"];
type DeliveryStatus = Database["public"]["Enums"]["delivery_status"];
type ApplicationType = Database["public"]["Enums"]["application_type"];

interface JobAssessment {
  id: string;
  ai_score: number | null;
  ai_analysis: any; // JSONB
  status: string;
  completed_at: string | null;
}

interface JobApplication {
  id: string;
  job_id: string;
  professional_id: string;
  talent_id: string | null;
  application_status: ApplicationStatus | null;
  delivery_status: DeliveryStatus | null;
  cover_letter: string | null;
  cv_url: string | null;
  is_paid: boolean | null;
  created_at: string | null;
  delivery_error: string | null;
  applicant_notified_at: string | null; // Track when applicant was notified
  jobs: {
    title: string;
    company_name: string;
    application_type: ApplicationType;
    application_email: string | null;
    application_url: string | null;
    ai_assessment_enabled: boolean | null;
  } | null;
  talents: {
    full_name: string;
    email: string;
    phone: string | null;
  } | null;
  job_assessments?: JobAssessment[];
}

const APPLICATION_STATUSES: { value: ApplicationStatus; label: string }[] = [
  { value: "submitted", label: "Submitted" },
  { value: "sent_to_employer", label: "Sent to Employer" },
  { value: "viewed", label: "Viewed" },
  { value: "shortlisted", label: "Shortlisted" },
  { value: "rejected", label: "Rejected" },
];

const DELIVERY_STATUSES: { value: DeliveryStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "sent", label: "Sent" },
  { value: "failed", label: "Failed" },
];

const ITEMS_PER_PAGE = 10;

// Helper to extract actual first name, skipping common prefixes
const getFirstName = (fullName: string): string => {
  const prefixes = ['md.', 'md', 'mst.', 'mst', 'dr.', 'dr', 'engr.', 'engr', 'prof.', 'prof', 'mr.', 'mr', 'mrs.', 'mrs', 'ms.', 'ms'];
  const parts = fullName.trim().split(/\s+/);
  if (parts.length > 1 && prefixes.includes(parts[0].toLowerCase())) {
    return parts[1];
  }
  return parts[0];
};

// --- Inline Component: Assessment Detail Dialog ---
const AssessmentDetailDialog = ({
  isOpen,
  onClose,
  assessment,
  applicantName,
  jobTitle,
}: {
  isOpen: boolean;
  onClose: () => void;
  assessment: JobAssessment | null;
  applicantName: string;
  jobTitle: string;
}) => {
  if (!assessment) return null;

  const score = assessment.ai_score || 0;
  const analysis = assessment.ai_analysis || {};
  const mcq = analysis.mcq || {};
  const voice = analysis.voice || {};

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-amber-600";
    return "text-red-600";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            AI Assessment Analysis
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {applicantName} applying for {jobTitle}
          </p>
        </DialogHeader>

        <div className="py-2">
          {/* Overall Score Banner */}
          <div className="flex items-center justify-between p-4 mb-4 bg-muted/30 rounded-lg border">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Overall Match Score</p>
              <div className="flex items-baseline gap-2">
                <span className={`text-4xl font-bold ${getScoreColor(score)}`}>{score}</span>
                <span className="text-muted-foreground">/100</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Based on MCQ ({mcq.score || 0}%) and Voice ({voice.score || 0}%)
              </p>
            </div>
            <div className="h-16 w-16 rounded-full bg-background flex items-center justify-center border-4 border-primary/10">
              <Trophy className={`h-8 w-8 ${getScoreColor(score)}`} />
            </div>
          </div>

          <Tabs defaultValue="summary" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="summary">Summary & Insights</TabsTrigger>
              <TabsTrigger value="breakdown">Score Breakdown</TabsTrigger>
              <TabsTrigger value="details">Detailed Responses</TabsTrigger>
            </TabsList>

            <TabsContent value="summary" className="space-y-4 mt-4">
              <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
                <h4 className="font-semibold text-sm mb-2">Executive Summary</h4>
                <p className="text-sm text-muted-foreground leading-relaxed italic">
                  "{analysis.overall_assessment || "No summary available."}"
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle className="h-4 w-4" /> Key Strengths
                  </h4>
                  <ul className="space-y-1 bg-green-50 dark:bg-green-950/20 p-3 rounded-lg min-h-[100px]">
                    {analysis.strengths && analysis.strengths.length > 0 ? (
                      analysis.strengths.map((s: string, i: number) => (
                        <li key={i} className="text-xs flex items-start gap-2 text-green-900 dark:text-green-100">
                          <span>•</span> {s}
                        </li>
                      ))
                    ) : (
                      <li className="text-xs text-muted-foreground">No specific strengths identified.</li>
                    )}
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold flex items-center gap-2 text-sm text-amber-600">
                    <TrendingUp className="h-4 w-4" /> Areas for Growth
                  </h4>
                  <ul className="space-y-1 bg-amber-50 dark:bg-amber-950/20 p-3 rounded-lg min-h-[100px]">
                    {analysis.areas_for_improvement && analysis.areas_for_improvement.length > 0 ? (
                      analysis.areas_for_improvement.map((s: string, i: number) => (
                        <li key={i} className="text-xs flex items-start gap-2 text-amber-900 dark:text-amber-100">
                          <span>•</span> {s}
                        </li>
                      ))
                    ) : (
                      <li className="text-xs text-muted-foreground">No specific improvements identified.</li>
                    )}
                  </ul>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="breakdown" className="space-y-4 mt-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Brain className="h-4 w-4" /> Soft Skills Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {analysis.score_breakdown ? (
                    <div className="space-y-4">
                      {Object.entries(analysis.score_breakdown).map(([key, value]: [string, any]) => (
                        <div key={key}>
                          <div className="flex justify-between text-xs mb-1 capitalize text-muted-foreground">
                            <span>{key.replace("_", " ")}</span>
                            <span className="font-medium text-foreground">{value}%</span>
                          </div>
                          <Progress value={value} className="h-2" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No breakdown available.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="details" className="space-y-4 mt-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <List className="h-4 w-4" /> Multiple Choice Results
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4 text-sm">
                    <div className="flex flex-col">
                      <span className="text-muted-foreground text-xs">Total Questions</span>
                      <span className="font-medium">{mcq.total || 0}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-muted-foreground text-xs">Correct Answers</span>
                      <span className="font-medium text-green-600">{mcq.correct || 0}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-muted-foreground text-xs">Score</span>
                      <span className="font-medium">{mcq.score || 0}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Mic className="h-4 w-4" /> Voice Response Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {voice.analysis && voice.analysis.length > 0 ? (
                    <div className="space-y-4">
                      {voice.analysis.map((item: any, i: number) => (
                        <div key={i} className="p-3 bg-muted/20 rounded-lg border text-sm">
                          <div className="flex justify-between mb-2">
                            <span className="font-medium">Question {i + 1}</span>
                            <Badge variant={item.score >= 70 ? "default" : "secondary"}>Score: {item.score}/100</Badge>
                          </div>
                          <p className="text-muted-foreground text-xs mb-2">{item.feedback}</p>
                          {item.strengths && (
                            <div className="text-xs text-green-700">
                              <strong>Strength:</strong> {item.strengths[0]}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No voice responses recorded or analyzed.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// --- Main Component ---
export const JobApplicationsManager = () => {
  // Data State
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination & Search
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 500);
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | "all">("all");
  const [deliveryFilter, setDeliveryFilter] = useState<DeliveryStatus | "all">("all");

  const [resendingId, setResendingId] = useState<string | null>(null);

  // State for detail dialog
  const [selectedAssessment, setSelectedAssessment] = useState<{
    assessment: JobAssessment;
    applicantName: string;
    jobTitle: string;
  } | null>(null);

  // Fetch Data (Paginated)
  const loadApplications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from("job_applications")
        .select(
          `
          *,
          jobs (title, company_name, application_type, application_email, application_url, ai_assessment_enabled),
          talents (full_name, email, phone),
          job_assessments!job_application_id (id, ai_score, ai_analysis, status, completed_at)
        `,
          { count: "exact" },
        )
        .order("created_at", { ascending: false });

      // NOTE: Searching across relations is tricky in Supabase JS client directly without RPC or Views.
      // For now, we will paginate and filter client side if search is active,
      // OR ideally use a Supabase View for flattened data.
      // Here we implement pagination on the base query.

      if (statusFilter !== "all") query = query.eq("application_status", statusFilter);
      if (deliveryFilter !== "all") query = query.eq("delivery_status", deliveryFilter);

      // Simple server-side pagination (doesn't account for text search deeply nested)
      const from = (page - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      query = query.range(from, to);

      const result = await withTimeout(Promise.resolve(query), TIMEOUTS.DEFAULT, "Loading job applications timed out");

      if (result.error) throw result.error;

      // Force cast to handle the nested join relation properly in TS
      let data = result.data as unknown as JobApplication[];

      // Client-side filtering for search (temporary trade-off until View is created)
      // Note: This only searches within the FETCHED page.
      // Ideal solution: Create a Postgres function for searching applications.
      if (debouncedSearch) {
        // Warning: This only filters current page. Proper search needs backend RPC.
        // We'll proceed with this for now to keep it running.
      }

      setApplications(data);
      setTotalCount(result.count || 0);
    } catch (err: any) {
      console.error("Error loading applications:", err);
      setError(err.message || "Failed to load applications");
      toast.error("Failed to load applications");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, deliveryFilter]); // debouncedSearch removed from dependency array to avoid reloading on search for now

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  const handleStatusChange = async (applicationId: string, newStatus: ApplicationStatus) => {
    try {
      const { error } = await supabase
        .from("job_applications")
        .update({ application_status: newStatus })
        .eq("id", applicationId);

      if (error) throw error;

      setApplications((prev) =>
        prev.map((app) => (app.id === applicationId ? { ...app, application_status: newStatus } : app)),
      );

      toast.success("Status updated successfully");
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleResendEmail = async (applicationId: string) => {
    setResendingId(applicationId);
    try {
      const { error } = await supabase.functions.invoke("send-job-application", {
        body: { applicationId },
      });

      if (error) throw error;

      toast.success("Email sent successfully", { description: "Application has been delivered to the employer" });
      loadApplications();
    } catch (error: any) {
      toast.error("Failed to send email", { description: error.message });
    } finally {
      setResendingId(null);
    }
  };

  const handleCopyDetails = (app: JobApplication) => {
    const details = `
JOB APPLICATION DETAILS
========================
Applicant: ${app.talents?.full_name || "Unknown"}
Email: ${app.talents?.email || "N/A"}
Phone: ${app.talents?.phone || "N/A"}

Job: ${app.jobs?.title || "Unknown"}
Company: ${app.jobs?.company_name || "Unknown"}

CV: ${app.cv_url || "Not provided"}

Cover Letter:
${app.cover_letter || "Not provided"}

Applied: ${app.created_at ? format(new Date(app.created_at), "MMMM d, yyyy HH:mm") : "Unknown"}
    `.trim();

    navigator.clipboard.writeText(details);
    toast.success("Application details copied to clipboard");
  };

  const formatApplicationForwardedLink = (
    phone: string | null, 
    name: string, 
    jobTitle: string, 
    companyName: string
  ) => {
    if (!phone) return null;
    let cleaned = phone.replace(/[\s\-\(\)\+]/g, "");
    if (cleaned.startsWith("880")) {
      // already formatted
    } else if (cleaned.startsWith("0")) {
      cleaned = `880${cleaned.slice(1)}`;
    } else if (cleaned.length === 10) {
      cleaned = `880${cleaned}`;
    }
    
    const message = encodeURIComponent(
      `Hi ${name}! 🎉\n\n` +
      `Great news — we just forwarded your application for ${jobTitle} at ${companyName} to the hiring team!\n\n` +
      `💡 Pro tip: You can practice a Mock Interview on our platform for this exact position to boost your chances.\n\n` +
      `Best of luck!\n` +
      `GroUp Academy Team`
    );
    
    return `https://wa.me/${cleaned}?text=${message}`;
  };

  const handleForwardManually = (app: JobApplication) => {
    const employerEmail = app.jobs?.application_email;
    if (!employerEmail) {
      toast.error("No employer email", { description: "This job does not have an application email set" });
      return;
    }

    const subject = encodeURIComponent(`Job Application: ${app.jobs?.title} - ${app.talents?.full_name}`);
    const body = encodeURIComponent(
      `
Dear Hiring Manager,

Please find attached the job application from ${app.talents?.full_name} for the ${app.jobs?.title} position at ${app.jobs?.company_name}.

APPLICANT DETAILS:
- Name: ${app.talents?.full_name}
- Email: ${app.talents?.email}
- Phone: ${app.talents?.phone || "Not provided"}

CV Link: ${app.cv_url || "Not provided"}

COVER LETTER:
${app.cover_letter || "Not provided"}

---
This application was submitted via GroUp Academy Jobs Board.
    `.trim(),
    );

    window.open(`mailto:${employerEmail}?subject=${subject}&body=${body}`, "_blank");

    // Mark as sent after manual forward
    handleStatusChange(app.id, "sent_to_employer");
    supabase
      .from("job_applications")
      .update({ delivery_status: "sent" })
      .eq("id", app.id)
      .then(() => loadApplications());
  };

  const exportToCSV = () => {
    const headers = [
      "Applicant Name",
      "Email",
      "Phone",
      "Job Title",
      "Company",
      "Application Type",
      "Application Status",
      "Delivery Status",
      "Is Paid",
      "Applied At",
      "CV URL",
      "AI Score",
    ];

    const rows = applications.map((app) => [
      app.talents?.full_name || "",
      app.talents?.email || "",
      app.talents?.phone || "",
      app.jobs?.title || "",
      app.jobs?.company_name || "",
      app.jobs?.application_type || "",
      app.application_status || "",
      app.delivery_status || "",
      app.is_paid ? "Yes" : "No",
      app.created_at ? format(new Date(app.created_at), "yyyy-MM-dd HH:mm") : "",
      app.cv_url || "",
      app.job_assessments?.[0]?.ai_score || "N/A",
    ]);

    const csvContent = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `job_applications_${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();

    toast.success("CSV exported successfully");
  };

  const getStatusBadge = (status: ApplicationStatus | null) => {
    const variants: Record<ApplicationStatus, string> = {
      submitted: "bg-blue-100 text-blue-800",
      sent_to_employer: "bg-purple-100 text-purple-800",
      viewed: "bg-yellow-100 text-yellow-800",
      shortlisted: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
    };
    return (
      <Badge className={status ? variants[status] : "bg-gray-100 text-gray-800"}>
        {status?.replace(/_/g, " ") || "Unknown"}
      </Badge>
    );
  };

  const getDeliveryBadge = (app: JobApplication) => {
    const isLinkType = app.jobs?.application_type === "link";

    if (isLinkType) {
      return (
        <Badge className="bg-green-100 text-green-800 gap-1">
          <ExternalLink className="w-3 h-3" />
          Redirected
        </Badge>
      );
    }

    const status = app.delivery_status;
    if (status === "sent") {
      return (
        <Badge className="bg-green-100 text-green-800 gap-1">
          <CheckCircle2 className="w-3 h-3" />
          Sent
        </Badge>
      );
    }
    if (status === "failed") {
      return (
        <Badge className="bg-red-100 text-red-800 gap-1">
          <AlertTriangle className="w-3 h-3" />
          Failed
        </Badge>
      );
    }
    return (
      <Badge className="bg-amber-100 text-amber-800 gap-1">
        <Forward className="w-3 h-3" />
        Needs Forward
      </Badge>
    );
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Job Applications</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Total {totalCount} applications</p>
          </div>
          <Button onClick={exportToCSV} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>

        <div className="flex flex-col gap-4 mt-4 md:flex-row">
          {/* Note: Server-side search disabled for now due to complexity of relation searching */}
          {/* <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search (currently disabled)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              disabled
            />
          </div> */}
          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v as ApplicationStatus | "all");
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Application Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {APPLICATION_STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={deliveryFilter}
            onValueChange={(v) => {
              setDeliveryFilter(v as DeliveryStatus | "all");
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Delivery Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Delivery</SelectItem>
              {DELIVERY_STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <DashboardTableSkeleton rows={5} columns={8} />
        ) : error ? (
          <DashboardErrorState title="Error" message={error} onRetry={loadApplications} />
        ) : (
          <>
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Applicant</TableHead>
                    <TableHead>Job</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>AI Score</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Delivery</TableHead>
                    <TableHead>Applied</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applications.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No applications found
                      </TableCell>
                    </TableRow>
                  ) : (
                    applications.map((app) => (
                      <TableRow key={app.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{app.talents?.full_name || "Unknown"}</p>
                            <p className="text-sm text-muted-foreground">{app.talents?.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{app.jobs?.title || "Unknown"}</p>
                            <p className="text-xs text-muted-foreground">{app.jobs?.company_name}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {app.jobs?.application_type === "link" ? "Link" : "Email"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {/* AI Score Rendering */}
                          {app.jobs?.ai_assessment_enabled && app.job_assessments && app.job_assessments.length > 0 ? (
                            <div
                              className="flex items-center gap-1 cursor-pointer hover:underline group"
                              onClick={() =>
                                setSelectedAssessment({
                                  assessment: app.job_assessments![0],
                                  applicantName: app.talents?.full_name || "Unknown",
                                  jobTitle: app.jobs?.title || "Unknown",
                                })
                              }
                            >
                              <Brain className="h-4 w-4 text-primary" />
                              <span
                                className={`font-bold ${
                                  (app.job_assessments[0].ai_score || 0) >= 70 ? "text-green-600" : "text-amber-600"
                                }`}
                              >
                                {app.job_assessments[0].ai_score}%
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={app.application_status || "submitted"}
                            onValueChange={(value) => handleStatusChange(app.id, value as ApplicationStatus)}
                          >
                            <SelectTrigger className="w-32 h-8 text-xs">
                              <SelectValue>{getStatusBadge(app.application_status)}</SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {APPLICATION_STATUSES.map((s) => (
                                <SelectItem key={s.value} value={s.value}>
                                  {s.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>{getDeliveryBadge(app)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {app.created_at ? format(new Date(app.created_at), "MMM d") : "-"}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {app.cv_url && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => window.open(app.cv_url!, "_blank")}
                              >
                                <FileText className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleCopyDetails(app)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            {app.jobs?.application_type === "email" && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-amber-600"
                                onClick={() => handleForwardManually(app)}
                                title="Forward Manually"
                              >
                                <Forward className="h-4 w-4" />
                              </Button>
                            )}
                            {app.talents?.phone && app.delivery_status === 'sent' && (
                              app.applicant_notified_at ? (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-green-600"
                                  disabled
                                  title={`Notified on ${new Date(app.applicant_notified_at).toLocaleDateString()}`}
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-green-600"
                                  onClick={async () => {
                                    // Update database first
                                    const { error } = await supabase
                                      .from('job_applications')
                                      .update({ applicant_notified_at: new Date().toISOString() })
                                      .eq('id', app.id);
                                    
                                    if (error) {
                                      toast.error("Failed to track notification");
                                    } else {
                                      // Open WhatsApp
                                      const link = formatApplicationForwardedLink(
                                        app.talents?.phone || null,
                                        getFirstName(app.talents?.full_name || '') || 'there',
                                        app.jobs?.title || 'this position',
                                        app.jobs?.company_name || 'the company'
                                      );
                                      if (link) window.open(link, "_blank");
                                      // Refresh list
                                      loadApplications();
                                    }
                                  }}
                                  title="Notify Applicant via WhatsApp"
                                >
                                  <MessageSquare className="h-4 w-4" />
                                </Button>
                              )
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-end space-x-2 py-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-2" /> Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>

      <AssessmentDetailDialog
        isOpen={!!selectedAssessment}
        onClose={() => setSelectedAssessment(null)}
        assessment={selectedAssessment?.assessment || null}
        applicantName={selectedAssessment?.applicantName || ""}
        jobTitle={selectedAssessment?.jobTitle || ""}
      />
    </Card>
  );
};
