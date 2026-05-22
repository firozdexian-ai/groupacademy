import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { getCertificateByVerifyCode } from "@/domains/learning/repo/learningRepo";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ShieldCheck,
  Calendar,
  GraduationCap,
  Award,
  AlertCircle,
  ExternalLink,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  UserCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CertificateRecord {
  id: string;
  holder_name: string;
  course_title: string;
  verify_code: string;
  percentage: number | null;
  score: number | null;
  total_questions: number | null;
  issued_at: string;
  kind?: string | null;
}

export default function VerifyCertificate() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [certificate, setCertificate] = useState<CertificateRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!code) return;
    const fetchProtocol = async () => {
      setLoading(true);
      const { data, error } = await getCertificateByVerifyCode(code);

      if (error || !data) {
        setNotFound(true);
      } else {
        setCertificate(data as CertificateRecord);
      }
      setLoading(false);
    };
    fetchProtocol();
  }, [code]);

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col selection:bg-primary/10">
      {/* Dynamic Header */}
      <header className="p-6">
        <Link to="/" className="flex items-center gap-2 group w-fit">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center transition-transform group-hover:rotate-12">
            <GraduationCap className="h-6 w-6 text-primary" />
          </div>
          <span className="font-black tracking-tighter text-xl uppercase">GroUp Academy</span>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-xl space-y-8 animate-in fade-in duration-700">
          {loading ? (
            <Card className="rounded-[40px] border-border/40 p-12 space-y-6 bg-card/50 backdrop-blur-xl">
              <Skeleton className="h-12 w-12 rounded-full mx-auto" />
              <div className="space-y-2 text-center">
                <Skeleton className="h-8 w-3/4 mx-auto rounded-lg" />
                <Skeleton className="h-4 w-1/2 mx-auto rounded-lg" />
              </div>
              <Skeleton className="h-32 w-full rounded-3xl" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </Card>
          ) : notFound ? (
            <Card className="rounded-[40px] border-border/40 overflow-hidden shadow-2xl bg-card">
              <CardContent className="p-12 text-center space-y-6">
                <div className="h-20 w-20 rounded-3xl bg-rose-500/10 flex items-center justify-center mx-auto">
                  <AlertCircle className="h-10 w-10 text-rose-500" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-3xl font-black tracking-tighter uppercase">Artifact Not Found</h2>
                  <p className="text-muted-foreground font-medium">
                    No record matches code: <span className="font-mono text-foreground">{code?.toUpperCase()}</span>
                  </p>
                </div>
                <div className="pt-4 grid gap-3">
                  <Button
                    onClick={() => navigate("/")}
                    className="h-12 rounded-xl font-black uppercase text-[10px] tracking-widest"
                  >
                    Return Home
                  </Button>
                  <Button
                    variant="ghost"
                    asChild
                    className="text-[10px] font-black uppercase tracking-widest text-muted-foreground underline underline-offset-4"
                  >
                    <Link to="/auth">Technical Support</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : certificate ? (
            <Card className="rounded-[40px] border-border/40 overflow-hidden shadow-[0_32px_64px_-12px_rgba(0,0,0,0.1)] bg-card relative">
              <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500" />

              <CardContent className="p-10 md:p-14 space-y-12">
                {/* Status HUD */}
                <div className="flex flex-col items-center gap-4">
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping opacity-40" />
                    <div className="relative h-16 w-16 rounded-[22px] bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                      <ShieldCheck className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <div className="space-y-1 text-center">
                    <Badge className="bg-emerald-500/10 text-emerald-600 border-none rounded-full px-4 py-1 font-black uppercase text-[9px] tracking-widest">
                      Protocol Verified
                    </Badge>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] pt-1">
                      Authenticity Guaranteed by GroUp Academy
                    </p>
                  </div>
                </div>

                {/* Identity Logic */}
                <div className="space-y-10">
                  <div className="text-center space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-60">
                      Recipient Identity
                    </p>
                    <h2 className="text-4xl md:text-5xl font-black tracking-tighter leading-none">
                      {certificate.holder_name}
                    </h2>
                  </div>

                  <div className="flex items-center justify-center gap-4">
                    <div className="h-px bg-border flex-1" />
                    <Sparkles className="h-4 w-4 text-primary" />
                    <div className="h-px bg-border flex-1" />
                  </div>

                  <div className="text-center space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-60">
                      {certificate.kind === "track" ? "Track Completed" : "Accomplishment Node"}
                    </p>
                    <div className="p-6 rounded-[32px] bg-primary/[0.03] border border-primary/10">
                      <h3 className="text-xl md:text-2xl font-black tracking-tight text-primary uppercase leading-tight">
                        {certificate.course_title}
                      </h3>
                    </div>
                  </div>
                </div>

                {/* Telemetry Footer */}
                <div className="grid grid-cols-2 gap-6 pt-6 border-t border-border/10">
                  <div className="space-y-1">
                    <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">
                      Issuance Timestamp
                    </p>
                    <div className="flex items-center gap-2 text-sm font-bold">
                      <Calendar className="h-3.5 w-3.5 text-primary" />
                      {format(new Date(certificate.issued_at), "dd MMM yyyy")}
                    </div>
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">
                      Unique Hash (Sign)
                    </p>
                    <p className="font-mono text-xs font-bold bg-muted/50 rounded-lg px-2 py-1 inline-block">
                      {certificate.verify_code}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {/* Social Proof / Next Steps */}
          {!loading && certificate && (
            <Card className="rounded-3xl border-primary/10 bg-primary/5 p-6 animate-in slide-in-from-bottom-4 duration-1000 delay-300">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center shadow-sm">
                    <UserCheck className="h-6 w-6 text-primary" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary">Recruiter Portal</p>
                    <p className="text-xs font-medium text-muted-foreground">Interested in hiring similar talent?</p>
                  </div>
                </div>
                <Button
                  asChild
                  variant="outline"
                  className="rounded-xl border-primary/20 hover:bg-primary/10 font-black uppercase text-[9px] tracking-widest h-10 px-6"
                >
                  <Link to="/jobs">
                    Explore Talent Hub <ExternalLink className="ml-2 h-3 w-3" />
                  </Link>
                </Button>
              </div>
            </Card>
          )}

          <p className="text-center text-[9px] font-black uppercase tracking-[0.4em] text-muted-foreground/30 pt-4 pb-12">
            Identity Persistence Node v2.6.01 Secure
          </p>
        </div>
      </main>
    </div>
  );
}
