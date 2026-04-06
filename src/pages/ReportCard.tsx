import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Download, Award, Share2, Copy } from "lucide-react";
import { toast } from "sonner";
import { ReportCardTemplate } from "@/components/report/ReportCardTemplate";
import { CertificatePDFTemplate } from "@/components/certificate/CertificatePDFTemplate";
import { generateReportCardPDF } from "@/lib/pdfGenerator";
import { generateCertificatePDF } from "@/lib/certificatePdfGenerator";
import { useCertificate } from "@/hooks/useCertificate";
import { withTimeout } from "@/hooks/useDataFetch";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface ReportData {
  student: {
    id: string;
    full_name: string;
    student_id: string;
    email: string;
  };
  content: {
    id: string;
    title: string;
    content_type: string;
  };
  quiz_attempt: {
    id: string;
    score: number;
    total_questions: number;
    passed: boolean;
    completed_at: string;
  };
  enrollment: {
    id: string;
    enrolled_at: string;
    talent_id: string;
  };
}

interface CertificateInfo {
  id: string;
  verify_code: string;
  holder_name: string;
  course_title: string;
  percentage: number | null;
  score: number | null;
  total_questions: number | null;
  issued_at: string;
}

export default function ReportCard() {
  const { enrollmentId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generatingCert, setGeneratingCert] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [certificate, setCertificate] = useState<CertificateInfo | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { issueCertificate, issuing } = useCertificate();

  useEffect(() => {
    loadReportData();
  }, [enrollmentId]);

  const loadReportData = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const { data: { user } } = await withTimeout(
        supabase.auth.getUser(),
        TIMEOUTS.AUTH,
        "Authentication timed out"
      );
      if (!user) { navigate("/auth"); return; }

      const { data: enrollment, error: enrollmentError } = await withTimeout(
        Promise.resolve(
          supabase.from("enrollments").select(`*, student:students(*), content:content(*)`).eq("id", enrollmentId).single()
        ),
        TIMEOUTS.DEFAULT,
        "Loading enrollment timed out"
      );

      if (enrollmentError || !enrollment) { toast.error("Enrollment not found"); navigate("/my-learning"); return; }

      if (enrollment.student.user_id !== user.id) {
        const { data: isAdmin } = await withTimeout(
          Promise.resolve(supabase.rpc("has_role", { _user_id: user.id, _role: "admin" })),
          TIMEOUTS.QUICK_CHECK,
          "Permission check timed out"
        );
        if (!isAdmin) { toast.error("Access denied"); navigate("/my-learning"); return; }
      }

      const { data: quizAttempt, error: quizError } = await withTimeout(
        Promise.resolve(
          supabase.from("quiz_attempts").select("*").eq("enrollment_id", enrollmentId).order("completed_at", { ascending: false }).limit(1).single()
        ),
        TIMEOUTS.DEFAULT,
        "Loading quiz attempt timed out"
      );

      if (quizError || !quizAttempt) { toast.error("No quiz attempt found"); navigate("/my-learning"); return; }

      setReportData({
        student: enrollment.student,
        content: enrollment.content,
        quiz_attempt: quizAttempt,
        enrollment: enrollment,
      });

      // Check for existing certificate
      const { data: cert } = await supabase
        .from("certificates")
        .select("id, verify_code, holder_name, course_title, percentage, score, total_questions, issued_at")
        .eq("enrollment_id", enrollmentId)
        .maybeSingle();

      if (cert) setCertificate(cert as CertificateInfo);
    } catch (error: any) {
      console.error("Error loading report:", error);
      setLoadError(error.message || "Failed to load report card");
      toast.error(error.message || "Failed to load report card");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!reportData) return;
    setGenerating(true);
    try {
      await generateReportCardPDF(reportData);
      toast.success("Report card downloaded!");
    } catch { toast.error("Failed to generate PDF"); }
    finally { setGenerating(false); }
  };

  const handleIssueCertificate = async () => {
    if (!reportData || !reportData.quiz_attempt.passed) return;
    const percentage = Math.round((reportData.quiz_attempt.score / reportData.quiz_attempt.total_questions) * 100);
    const result = await issueCertificate({
      enrollment_id: reportData.enrollment.id,
      talent_id: reportData.enrollment.talent_id,
      content_id: reportData.content.id,
      holder_name: reportData.student.full_name,
      course_title: reportData.content.title,
      score: reportData.quiz_attempt.score,
      total_questions: reportData.quiz_attempt.total_questions,
      percentage,
    });
    if (result) {
      const { data: cert } = await supabase
        .from("certificates")
        .select("id, verify_code, holder_name, course_title, percentage, score, total_questions, issued_at")
        .eq("id", result.id)
        .single();
      if (cert) {
        setCertificate(cert as CertificateInfo);
        // Send certificate notification email (fire-and-forget)
        try {
          const { sendTransactionalEmail } = await import("@/lib/emailNotifications");
          sendTransactionalEmail({
            template: "service-complete",
            talentId: reportData.enrollment.talent_id,
            data: {
              service_name: "Certificate",
              summary: `Congratulations! Your certificate for "${reportData.content.title}" has been issued. Verify at: ${window.location.origin}/verify/${cert.verify_code}`,
            },
          });
        } catch (e) {
          console.warn("[Cert] Email notification failed:", e);
        }
      }
    }
  };

  const handleDownloadCertificate = async () => {
    if (!certificate) return;
    setGeneratingCert(true);
    try {
      await generateCertificatePDF(certificate.holder_name, certificate.course_title);
      toast.success("Certificate downloaded!");
    } catch { toast.error("Failed to generate certificate"); }
    finally { setGeneratingCert(false); }
  };

  const handleCopyVerifyLink = () => {
    if (!certificate) return;
    const url = `${window.location.origin}/verify/${certificate.verify_code}`;
    navigator.clipboard.writeText(url);
    toast.success("Verification link copied!");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background py-12">
        <div className="container max-w-4xl mx-auto px-4">
          <div className="mb-6 flex items-center justify-between">
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-10 w-36" />
          </div>
          <Card className="p-8">
            <div className="space-y-6">
              <Skeleton className="h-12 w-3/4 mx-auto" />
              <Skeleton className="h-6 w-1/2 mx-auto" />
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
              </div>
              <Skeleton className="h-32" />
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <ErrorState type="generic" title="Failed to Load Report" description={loadError} onRetry={loadReportData} />
      </div>
    );
  }

  if (!reportData) return null;

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container max-w-4xl mx-auto px-4">
        {/* Actions */}
        <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
          <Button variant="ghost" onClick={() => navigate("/app/learning/my-courses")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to My Learning
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleDownloadPDF} disabled={generating}>
              <Download className="h-4 w-4 mr-2" />
              {generating ? "Generating..." : "Report PDF"}
            </Button>

            {reportData.quiz_attempt.passed && !certificate && (
              <Button onClick={handleIssueCertificate} disabled={issuing}>
                <Award className="h-4 w-4 mr-2" />
                {issuing ? "Issuing..." : "Get Certificate"}
              </Button>
            )}

            {certificate && (
              <>
                <Button onClick={handleDownloadCertificate} disabled={generatingCert}>
                  <Award className="h-4 w-4 mr-2" />
                  {generatingCert ? "Generating..." : "Certificate PDF"}
                </Button>
                <Button variant="outline" size="icon" onClick={handleCopyVerifyLink} title="Copy verification link">
                  <Copy className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Certificate badge */}
        {certificate && (
          <div className="mb-4 flex items-center justify-center gap-2 p-3 bg-accent/10 rounded-lg">
            <Award className="h-5 w-5 text-accent" />
            <span className="text-sm font-medium">Certificate Issued</span>
            <Badge variant="outline" className="font-mono text-xs">{certificate.verify_code}</Badge>
          </div>
        )}

        <Card className="p-8">
          <ReportCardTemplate data={reportData} />
        </Card>
      </div>

      {/* Hidden PDF template */}
      {certificate && <CertificatePDFTemplate data={certificate} />}
    </div>
  );
}
