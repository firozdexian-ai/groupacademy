import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ShieldCheck, Calendar, GraduationCap, Award, AlertTriangle } from "lucide-react";

interface CertificateRecord {
  id: string;
  holder_name: string;
  course_title: string;
  verify_code: string;
  percentage: number | null;
  score: number | null;
  total_questions: number | null;
  issued_at: string;
}

export default function VerifyCertificate() {
  const { code } = useParams<{ code: string }>();
  const [certificate, setCertificate] = useState<CertificateRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!code) return;
    (async () => {
      const { data, error } = await supabase
        .from("certificates")
        .select("id, holder_name, course_title, verify_code, percentage, score, total_questions, issued_at")
        .eq("verify_code", code.toUpperCase())
        .single();

      if (error || !data) {
        setNotFound(true);
      } else {
        setCertificate(data as CertificateRecord);
      }
      setLoading(false);
    })();
  }, [code]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-2 text-2xl font-bold text-primary">
            <GraduationCap className="h-7 w-7" />
            GroUp Academy
          </Link>
          <p className="text-sm text-muted-foreground mt-1">Certificate Verification</p>
        </div>

        {loading ? (
          <Card className="p-8 space-y-4">
            <Skeleton className="h-8 w-3/4 mx-auto" />
            <Skeleton className="h-5 w-1/2 mx-auto" />
            <Skeleton className="h-20 w-full" />
          </Card>
        ) : notFound ? (
          <Card className="p-8 text-center space-y-4">
            <AlertTriangle className="h-12 w-12 text-warning mx-auto" />
            <h2 className="text-xl font-semibold">Certificate Not Found</h2>
            <p className="text-muted-foreground text-sm">
              No certificate matches the code <strong className="font-mono">{code?.toUpperCase()}</strong>.
              Please double-check the verification code and try again.
            </p>
          </Card>
        ) : certificate ? (
          <Card className="p-8 space-y-6">
            {/* Verified badge */}
            <div className="flex items-center justify-center gap-2">
              <ShieldCheck className="h-6 w-6 text-accent" />
              <Badge variant="outline" className="border-accent text-accent font-semibold text-sm px-4 py-1">
                Verified Certificate
              </Badge>
            </div>

            {/* Holder */}
            <div className="text-center">
              <p className="text-sm text-muted-foreground">This certifies that</p>
              <h2 className="text-2xl font-bold mt-1">{certificate.holder_name}</h2>
            </div>

            {/* Course */}
            <div className="text-center">
              <p className="text-sm text-muted-foreground">has completed</p>
              <h3 className="text-lg font-semibold text-primary mt-1">{certificate.course_title}</h3>
            </div>

            {/* Score */}
            {certificate.percentage !== null && (
              <div className="flex items-center justify-center gap-2 bg-accent/10 rounded-full px-4 py-2 mx-auto w-fit">
                <Award className="h-4 w-4 text-accent" />
                <span className="text-sm font-medium">
                  Score: {certificate.score}/{certificate.total_questions} ({certificate.percentage}%)
                </span>
              </div>
            )}

            {/* Date & Code */}
            <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-4">
              <div className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {format(new Date(certificate.issued_at), "MMMM d, yyyy")}
              </div>
              <span className="font-mono">{certificate.verify_code}</span>
            </div>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
