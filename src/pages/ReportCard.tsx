import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Download } from "lucide-react";
import { toast } from "sonner";
import { ReportCardTemplate } from "@/components/report/ReportCardTemplate";
import { generateReportCardPDF } from "@/lib/pdfGenerator";
import { withTimeout } from "@/hooks/useDataFetch";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";

interface ReportData {
  student: {
    full_name: string;
    student_id: string;
    email: string;
  };
  content: {
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
    enrolled_at: string;
  };
}

export default function ReportCard() {
  const { enrollmentId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

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
      if (!user) {
        navigate("/auth");
        return;
      }

      // Get enrollment with related data
      const { data: enrollment, error: enrollmentError } = await withTimeout(
        Promise.resolve(
          supabase
            .from("enrollments")
            .select(`
              *,
              student:students(*),
              content:content(*)
            `)
            .eq("id", enrollmentId)
            .single()
        ),
        TIMEOUTS.DEFAULT,
        "Loading enrollment timed out"
      );

      if (enrollmentError || !enrollment) {
        toast.error("Enrollment not found");
        navigate("/my-learning");
        return;
      }

      // Verify access
      if (enrollment.student.user_id !== user.id) {
        const { data: isAdmin } = await withTimeout(
          Promise.resolve(
            supabase.rpc("has_role", {
              _user_id: user.id,
              _role: "admin"
            })
          ),
          TIMEOUTS.QUICK_CHECK,
          "Permission check timed out"
        );

        if (!isAdmin) {
          toast.error("Access denied");
          navigate("/my-learning");
          return;
        }
      }

      // Get quiz attempt
      const { data: quizAttempt, error: quizError } = await withTimeout(
        Promise.resolve(
          supabase
            .from("quiz_attempts")
            .select("*")
            .eq("enrollment_id", enrollmentId)
            .order("completed_at", { ascending: false })
            .limit(1)
            .single()
        ),
        TIMEOUTS.DEFAULT,
        "Loading quiz attempt timed out"
      );

      if (quizError || !quizAttempt) {
        toast.error("No quiz attempt found");
        navigate("/my-learning");
        return;
      }

      setReportData({
        student: enrollment.student,
        content: enrollment.content,
        quiz_attempt: quizAttempt,
        enrollment: enrollment,
      });
    } catch (error: any) {
      console.error("Error loading report:", error);
      const errorMessage = error.message || "Failed to load report card";
      setLoadError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!reportData) return;

    setGenerating(true);
    try {
      await generateReportCardPDF(reportData);
      toast.success("Report card downloaded successfully!");
    } catch (error: any) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF");
    } finally {
      setGenerating(false);
    }
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
        <ErrorState
          type="generic"
          title="Failed to Load Report"
          description={loadError}
          onRetry={loadReportData}
        />
      </div>
    );
  }

  if (!reportData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container max-w-4xl mx-auto px-4">
        <div className="mb-6 flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate("/my-learning")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to My Learning
          </Button>
          <Button onClick={handleDownloadPDF} disabled={generating}>
            <Download className="h-4 w-4 mr-2" />
            {generating ? "Generating..." : "Download PDF"}
          </Button>
        </div>

        <Card className="p-8">
          <ReportCardTemplate data={reportData} />
        </Card>
      </div>
    </div>
  );
}
