import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface IssueCertificateParams {
  enrollment_id: string;
  talent_id: string;
  content_id: string;
  holder_name: string;
  course_title: string;
  score: number;
  total_questions: number;
  percentage: number;
}

export function useCertificate() {
  const [issuing, setIssuing] = useState(false);

  const issueCertificate = async (params: IssueCertificateParams) => {
    setIssuing(true);
    try {
      // Check if certificate already exists for this enrollment
      const { data: existing } = await supabase
        .from("certificates")
        .select("id, verify_code")
        .eq("enrollment_id", params.enrollment_id)
        .maybeSingle();

      if (existing) {
        return existing;
      }

      const { data, error } = await supabase
        .from("certificates")
        .insert({
          enrollment_id: params.enrollment_id,
          talent_id: params.talent_id,
          content_id: params.content_id,
          holder_name: params.holder_name,
          course_title: params.course_title,
          score: params.score,
          total_questions: params.total_questions,
          percentage: params.percentage,
        })
        .select("id, verify_code")
        .single();

      if (error) throw error;

      toast.success("Certificate issued! 🎓");
      return data;
    } catch (error: any) {
      console.error("Error issuing certificate:", error);
      toast.error("Failed to issue certificate");
      return null;
    } finally {
      setIssuing(false);
    }
  };

  const getCertificateForEnrollment = async (enrollmentId: string) => {
    const { data } = await supabase
      .from("certificates")
      .select("*")
      .eq("enrollment_id", enrollmentId)
      .maybeSingle();
    return data;
  };

  return { issueCertificate, getCertificateForEnrollment, issuing };
}
