import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeft,
  Download,
  Award,
  Share2,
  Copy,
  ShieldCheck,
  FileText,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  Loader2,
} from "lucide-react";
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
import { cn } from "@/lib/utils";
import { Navbar } from "@/components/Navbar";

interface ReportData {
  student: { id: string; full_name: string; student_id: string; email: string };
  content: { id: string; title: string; content_type: string };
  quiz_attempt: { id: string; score: number; total_questions: number; passed: boolean; completed_at: string };
  enrollment: { id: string; enrolled_at: string; talent_id: string };
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
    if (enrollmentId) loadReportData();
  }, [enrollmentId]);

  const loadReportData = async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return navigate("/auth");

      const { data: enrollment, error: enrollError } = await supabase
        .from("enrollments")
        .select(`*, student:students(*), content:content(*)`)
        .eq("id", enrollmentId)
        .single();

      if (enrollError || !enrollment) throw new Error("Academic Record Not Found");

      // Permission Logic: Self or Admin
      if (enrollment.student.user_id !== user.id) {
        const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
        if (!isAdmin) throw new Error("Unauthorized: Access Denied to Node");
      }

      const { data: quizAttempt } = await supabase
        .from("quiz_attempts")
        .select("*")
        .eq("enrollment_id", enrollmentId)
        .order("completed_at", { ascending: false })
        .limit(1)
        .single();

      if (!quizAttempt) throw new Error("Evaluation Logic Missing: No Quiz Found");

      setReportData({
        student: enrollment.student,
        content: enrollment.content,
        quiz_attempt: quizAttempt,
        enrollment,
      });

      const { data: cert } = await supabase
        .from("certificates")
        .select("*")
        .eq("enrollment_id", enrollmentId)
        .maybeSingle();
      if (cert) setCertificate(cert as any);
    } catch (err: any) {
      setLoadError(err.message);
    } finally {
      setLoading(false);
    }
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
      const { data: cert } = await supabase.from("certificates").select("*").eq("id", result.id).single();
      if (cert) {
        setCertificate(cert as any);
        toast.success("Identity Verified: Certificate Generated.");
      }
    }
  };

  const handleDownloadCertificate = async () => {
    if (!certificate) return;
    setGeneratingCert(true);
    try {
      await generateCertificatePDF(certificate.holder_name, certificate.course_title);
      toast.success("Credential Exported to PDF");
    } catch {
      toast.error("Serialization Fault: Export Failed");
    } finally {
      setGeneratingCert(false);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">
          Parsing Academic Logic
        </p>
      </div>
    );

  if (loadError)
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <ErrorState type="server" title="Logic Trace Failed" description={loadError} onRetry={loadReportData} />
      </div>
    );

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col selection:bg-primary/10">
      <Navbar />
      <main className="flex-1 container max-w-5xl mx-auto px-6 py-12 space-y-8 animate-in fade-in duration-700">
        {/* Navigation HUD */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-4">
          <div className="space-y-2">
            <Button
              variant="ghost"
              onClick={() => navigate("/app/learning/my-courses")}
              className="rounded-xl font-bold uppercase text-[10px] tracking-widest pl-0 hover:bg-transparent"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Curriculum Hub
            </Button>
            <h1 className="text-4xl font-black tracking-tighter">Academic Artifact</h1>
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-tight">
              {reportData?.content.title}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="rounded-xl h-12 font-black uppercase text-[10px] tracking-widest border-border/40"
              onClick={() => generateReportCardPDF(reportData!)}
              disabled={generating}
            >
              {generating ? <Loader2 className="animate-spin" /> : <FileText className="h-4 w-4 mr-2" />} Logic Report
            </Button>
            {certificate ? (
              <Button
                className="rounded-xl h-12 px-6 font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20"
                onClick={handleDownloadCertificate}
                disabled={generatingCert}
              >
                {generatingCert ? <Loader2 className="animate-spin" /> : <Award className="h-4 w-4 mr-2" />} Export
                Certificate
              </Button>
            ) : (
              reportData?.quiz_attempt.passed && (
                <Button
                  className="rounded-xl h-12 px-6 font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20 animate-pulse"
                  onClick={handleIssueCertificate}
                  disabled={issuing}
                >
                  <Sparkles className="h-4 w-4 mr-2" /> Verify Identity & Issue
                </Button>
              )
            )}
          </div>
        </header>

        {/* Global Verification Badge */}
        {certificate && (
          <Card className="rounded-[32px] border-emerald-500/20 bg-emerald-500/[0.03] p-4 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                <ShieldCheck className="h-6 w-6 text-emerald-600" />
              </div>
              <div className="space-y-0.5">
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700">
                  Credential Status: Protocol Verified
                </p>
                <p className="text-xs font-bold font-mono opacity-60">AUTH_SIG: {certificate.verify_code}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-10 rounded-xl font-black uppercase text-[9px] tracking-widest"
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/verify/${certificate.verify_code}`);
                  toast.success("Verification link synchronized.");
                }}
              >
                <Copy className="h-3 w-3 mr-2" /> Copy Verify Link
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-xl bg-background border border-emerald-500/10"
                onClick={() => window.open(`${window.location.origin}/verify/${certificate.verify_code}`, "_blank")}
              >
                <ExternalLink className="h-4 w-4 text-emerald-600" />
              </Button>
            </div>
          </Card>
        )}

        {/* Core Report Artifact */}
        <Card className="rounded-[40px] border-border/40 shadow-2xl overflow-hidden bg-white dark:bg-card/50">
          <CardContent className="p-0">
            <ReportCardTemplate data={reportData!} />
          </CardContent>
        </Card>

        {/* Engineering Footnote */}
        <footer className="text-center pt-8">
          <p className="text-[9px] font-black uppercase tracking-[0.4em] text-muted-foreground/30">
            Artifact Timestamp: {new Date(reportData!.quiz_attempt.completed_at).toISOString()} • Node Integrity: High
          </p>
        </footer>
      </main>

      {/* Hidden serialization templates */}
      <div className="hidden">{certificate && <CertificatePDFTemplate data={certificate} />}</div>
    </div>
  );
}
