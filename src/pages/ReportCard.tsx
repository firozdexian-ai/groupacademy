import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Download } from "lucide-react";
import { toast } from "sonner";
import { ReportCardTemplate } from "@/components/report/ReportCardTemplate";
import { generateReportCardPDF } from "@/lib/pdfGenerator";

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

  useEffect(() => {
    loadReportData();
  }, [enrollmentId]);

  const loadReportData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Get enrollment with related data
      const { data: enrollment, error: enrollmentError } = await supabase
        .from("enrollments")
        .select(`
          *,
          student:students(*),
          content:content(*)
        `)
        .eq("id", enrollmentId)
        .single();

      if (enrollmentError || !enrollment) {
        toast.error("Enrollment not found");
        navigate("/my-learning");
        return;
      }

      // Verify access
      if (enrollment.student.user_id !== user.id) {
        const { data: isAdmin } = await supabase.rpc("has_role", {
          _user_id: user.id,
          _role: "admin"
        });

        if (!isAdmin) {
          toast.error("Access denied");
          navigate("/my-learning");
          return;
        }
      }

      // Get quiz attempt
      const { data: quizAttempt, error: quizError } = await supabase
        .from("quiz_attempts")
        .select("*")
        .eq("enrollment_id", enrollmentId)
        .order("completed_at", { ascending: false })
        .limit(1)
        .single();

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
      toast.error("Failed to load report card");
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
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
