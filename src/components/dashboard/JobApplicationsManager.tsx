import { useState, useEffect } from "react";
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
import { toast } from "@/hooks/use-toast";
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
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import type { Database } from "@/integrations/supabase/types";

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

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-amber-600";
    return "text-red-600";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            AI Assessment Analysis
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {applicantName} applying for {jobTitle}
          </p>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Overall Score */}
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Overall Match Score</p>
              <div className="flex items-baseline gap-2">
                <span className={`text-4xl font-bold ${getScoreColor(score)}`}>{score}</span>
                <span className="text-muted-foreground">/100</span>
              </div>
            </div>
            <div className="h-16 w-16 rounded-full bg-background flex items-center justify-center border-4 border-primary/10">
              <Trophy className={`h-8 w-8 ${getScoreColor(score)}`} />
            </div>
          </div>

          {/* Breakdown */}
          {analysis.score_breakdown && (
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2 text-sm">Score Breakdown</h4>
              <div className="space-y-3">
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
            </div>
          )}

          {/* Strengths & Weaknesses Grid */}
          <div className="grid md:grid-cols-2 gap-4">
            {analysis.strengths && (
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle className="h-4 w-4" /> Key Strengths
                </h4>
                <ul className="space-y-1 bg-green-50 dark:bg-green-950/20 p-3 rounded-lg">
                  {analysis.strengths.map((s: string, i: number) => (
                    <li key={i} className="text-xs flex items-start gap-2 text-green-900 dark:text-green-100">
                      <span>•</span> {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {analysis.areas_for_improvement && (
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2 text-sm text-amber-600">
                  <TrendingUp className="h-4 w-4" /> Areas for Growth
                </h4>
                <ul className="space-y-1 bg-amber-50 dark:bg-amber-950/20 p-3 rounded-lg">
                  {analysis.areas_for_improvement.map((s: string, i: number) => (
                    <li key={i} className="text-xs flex items-start gap-2 text-amber-900 dark:text-amber-100">
                      <span>•</span> {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* AI Summary */}
          {analysis.overall_assessment && (
            <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
              <h4 className="font-semibold text-sm mb-2">AI Summary</h4>
              <p className="text-sm text-muted-foreground leading-relaxed italic">"{analysis.overall_assessment}"</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

// --- Main Component ---
export const JobApplicationsManager = () => {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deliveryFilter, setDeliveryFilter] = useState<string>("all");
  const [resendingId, setResendingId] = useState<string | null>(null);

  // State for detail dialog
  const [selectedAssessment, setSelectedAssessment] = useState<{
    assessment: JobAssessment;
    applicantName: string;
    jobTitle: string;
  } | null>(null);

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    setLoading(true);
    setError(null);
    try {
      // Updated query to fetch job_assessments relation
      const { data, error: queryError } = await withTimeout(
        Promise.resolve(
          supabase
            .from("job_applications")
            .select(
              `
              *,
              jobs (title, company_name, application_type, application_email, application_url, ai_assessment_enabled),
              talents (full_name, email, phone),
              job_assessments!job_application_id (id, ai_score, ai_analysis, status, completed_at)
            `,
            )
            .order("created_at", { ascending: false }),
        ).then((q) => q),
        TIMEOUTS.DEFAULT,
        "Loading job applications timed out",
      );

      if (queryError) throw queryError;

      // Force cast to handle the nested join relation properly in TS
      setApplications(data as unknown as JobApplication[]);
    } catch (err: any) {
      console.error("Error loading applications:", err);
      setError(err.message || "Failed to load applications");
      toast({
        title: "Error",
        description: "Failed to load applications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredApplications = applications.filter((app) => {
    const matchesSearch =
      app.talents?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.talents?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.jobs?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.jobs?.company_name?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || app.application_status === statusFilter;
    const matchesDelivery = deliveryFilter === "all" || app.delivery_status === deliveryFilter;

    return matchesSearch && matchesStatus && matchesDelivery;
  });

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

      toast({ title: "Status updated successfully" });
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    }
  };

  const handleResendEmail = async (applicationId: string) => {
    setResendingId(applicationId);
    try {
      const { error } = await supabase.functions.invoke("send-job-application", {
        body: { applicationId },
      });

      if (error) throw error;

      toast({
        title: "Email sent successfully",
        description: "Application has been delivered to the employer",
      });

      loadApplications();
    } catch (error: any) {
      console.error("Error sending email:", error);
      toast({
        title: "Failed to send email",
        description: error.message || "Please try again later",
        variant: "destructive",
      });
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
    toast({ title: "Application details copied to clipboard" });
  };

  const handleForwardManually = (app: JobApplication) => {
    const employerEmail = app.jobs?.application_email;
    if (!employerEmail) {
      toast({
        title: "No employer email",
        description: "This job does not have an application email set",
        variant: "destructive",
      });
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

    const rows = filteredApplications.map((app) => [
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

    toast({ title: "CSV exported successfully" });
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

  if (loading) {
    return <DashboardTableSkeleton rows={5} columns={8} />;
  }

  if (error) {
    return <DashboardErrorState title="Failed to load applications" message={error} onRetry={loadApplications} />;
  }

  const stats = {
    total: applications.length,
    needsForward: applications.filter((a) => a.jobs?.application_type === "email" && a.delivery_status === "pending")
      .length,
    shortlisted: applications.filter((a) => a.application_status === "shortlisted").length,
    paid: applications.filter((a) => a.is_paid).length,
  };

  return (
    <Card>
      <CardHeader>
        {/* Header content */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Job Applications ({filteredApplications.length})</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {stats.needsForward > 0 && (
                <span className="text-amber-600 font-medium">{stats.needsForward} need forwarding • </span>
              )}
              {stats.shortlisted} shortlisted • {stats.paid} paid
            </p>
          </div>
          <Button onClick={exportToCSV} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-4 mt-4 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, job, company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
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
          <Select value={deliveryFilter} onValueChange={setDeliveryFilter}>
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
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Applicant</TableHead>
                <TableHead>Job</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>AI Score</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Delivery</TableHead>
                <TableHead>Paid</TableHead>
                <TableHead>Applied</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredApplications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    No applications found
                  </TableCell>
                </TableRow>
              ) : (
                filteredApplications.map((app) => (
                  <TableRow
                    key={app.id}
                    className={
                      app.jobs?.application_type === "email" && app.delivery_status === "pending"
                        ? "bg-amber-50/50 dark:bg-amber-950/10"
                        : ""
                    }
                  >
                    <TableCell>
                      <div>
                        <p className="font-medium">{app.talents?.full_name || "Unknown"}</p>
                        <p className="text-sm text-muted-foreground">{app.talents?.email}</p>
                        {app.talents?.phone && <p className="text-sm text-muted-foreground">{app.talents.phone}</p>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{app.jobs?.title || "Unknown"}</p>
                        <p className="text-sm text-muted-foreground">{app.jobs?.company_name}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={app.jobs?.application_type === "link" ? "secondary" : "outline"}>
                        {app.jobs?.application_type === "link" ? "Link" : "Email"}
                      </Badge>
                    </TableCell>

                    {/* NEW AI SCORE COLUMN */}
                    <TableCell>
                      {app.jobs?.ai_assessment_enabled ? (
                        app.job_assessments && app.job_assessments.length > 0 ? (
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
                            <Brain className="h-4 w-4 text-primary group-hover:text-primary/80" />
                            <span
                              className={`font-semibold ${
                                (app.job_assessments[0].ai_score || 0) >= 70
                                  ? "text-green-600"
                                  : (app.job_assessments[0].ai_score || 0) >= 50
                                    ? "text-amber-600"
                                    : "text-red-600"
                              }`}
                            >
                              {app.job_assessments[0].ai_score !== null
                                ? `${app.job_assessments[0].ai_score}%`
                                : "Pending"}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">Not taken</span>
                        )
                      ) : (
                        <span className="text-sm text-muted-foreground">N/A</span>
                      )}
                    </TableCell>

                    <TableCell>
                      <Select
                        value={app.application_status || "submitted"}
                        onValueChange={(value) => handleStatusChange(app.id, value as ApplicationStatus)}
                      >
                        <SelectTrigger className="w-36">
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
                    <TableCell>
                      <Badge variant={app.is_paid ? "default" : "secondary"}>{app.is_paid ? "Paid" : "Free"}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {app.created_at ? format(new Date(app.created_at), "MMM d, yyyy") : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {app.cv_url && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => window.open(app.cv_url!, "_blank")}
                            title="View CV"
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleCopyDetails(app)}
                          title="Copy Details"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        {app.jobs?.application_type === "email" && app.delivery_status !== "sent" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-amber-600 hover:text-amber-700"
                            onClick={() => handleForwardManually(app)}
                            title="Forward to Employer"
                          >
                            <Forward className="h-4 w-4" />
                          </Button>
                        )}
                        {app.jobs?.application_type === "email" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleResendEmail(app.id)}
                            disabled={resendingId === app.id}
                            title="Resend Email"
                          >
                            {resendingId === app.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Mail className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                        {app.jobs?.application_url && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => window.open(app.jobs!.application_url!, "_blank")}
                            title="View External Link"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
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
