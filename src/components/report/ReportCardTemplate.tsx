import { GraduationCap, Calendar, Award, CheckCircle, XCircle, Zap, ShieldCheck } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Institutional Assessment Artifact
 * CTO Reference: Authoritative report card template for high-fidelity PDF generation.
 */

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

interface ReportCardTemplateProps {
  data: ReportData;
}

export function ReportCardTemplate({ data }: ReportCardTemplateProps) {
  const percentage = Math.round((data.quiz_attempt.score / data.quiz_attempt.total_questions) * 100);

  return (
    <div
      id="report-card-content"
      className="max-w-[800px] mx-auto p-12 bg-white text-slate-950 space-y-10 border-[12px] border-slate-50 shadow-2xl"
    >
      {/* HUD: DOCUMENT_HEADER */}
      <div className="text-center border-b-4 border-primary/20 pb-8 relative">
        <Zap className="absolute top-0 right-0 h-8 w-8 text-primary opacity-20" />
        <div className="flex items-center justify-center mb-4">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center shadow-lg">
            <GraduationCap className="h-10 w-10 text-primary" />
          </div>
        </div>
        <h1 className="text-4xl font-black uppercase italic tracking-tighter text-foreground">GroUp_Academy</h1>
        <h2 className="text-[10px] font-bold uppercase tracking-[0.5em] text-muted-foreground italic mt-2">
          Official_Assessment_Telemetry
        </h2>
      </div>

      {/* COMPONENT: IDENTITY_REGISTRY */}
      <div className="grid grid-cols-2 gap-8 bg-slate-50/50 p-6 rounded-[24px] border-2 border-slate-100">
        <div className="space-y-1">
          <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground italic">
            Student_Identity
          </p>
          <p className="font-bold text-xl uppercase tracking-tight">{data.student.full_name}</p>
        </div>
        <div className="space-y-1 text-right">
          <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground italic">
            Institutional_ID
          </p>
          <p className="font-mono font-bold text-lg text-primary">{data.student.student_id}</p>
        </div>
        <div className="space-y-1">
          <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground italic">Sync_Email</p>
          <p className="font-medium text-sm">{data.student.email}</p>
        </div>
        <div className="space-y-1 text-right">
          <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground italic">Registry_Date</p>
          <p className="font-medium text-sm tabular-nums">
            {format(new Date(data.enrollment.enrolled_at), "dd_MMM_yyyy").toUpperCase()}
          </p>
        </div>
      </div>

      {/* COMPONENT: CURRICULUM_NODE */}
      <div className="border-l-4 border-primary pl-6 py-2">
        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground italic mb-1">
          Pedagogical_Course_Node
        </p>
        <p className="font-black text-2xl uppercase italic tracking-tighter">{data.content.title.replace(" ", "_")}</p>
      </div>

      {/* HUD: PERFORMANCE_METRICS */}
      <div className="bg-white border-2 border-slate-100 rounded-[32px] p-10 shadow-inner overflow-hidden relative">
        {data.quiz_attempt.passed && (
          <ShieldCheck className="absolute -bottom-4 -right-4 h-32 w-32 text-emerald-500 opacity-5 -rotate-12" />
        )}
        <div className="text-center space-y-6">
          <div className="flex items-center justify-center">
            {data.quiz_attempt.passed ? (
              <div className="h-20 w-20 rounded-full bg-emerald-500/10 flex items-center justify-center animate-in zoom-in">
                <CheckCircle className="h-12 w-12 text-emerald-500" />
              </div>
            ) : (
              <div className="h-20 w-20 rounded-full bg-rose-500/10 flex items-center justify-center animate-in shake-2">
                <XCircle className="h-12 w-12 text-rose-500" />
              </div>
            )}
          </div>

          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground italic">
              Assessment_Yield
            </p>
            <div className="flex flex-col items-center">
              <p className="text-7xl font-black italic tracking-tighter tabular-nums">
                {data.quiz_attempt.score}
                <span className="text-3xl text-muted-foreground/30 mx-2">/</span>
                {data.quiz_attempt.total_questions}
              </p>
              <p
                className={cn(
                  "text-4xl font-black italic tracking-tighter mt-1",
                  data.quiz_attempt.passed ? "text-emerald-500" : "text-rose-500",
                )}
              >
                {percentage}%_PARITY
              </p>
            </div>
          </div>

          <div
            className={cn(
              "inline-flex items-center gap-3 px-8 py-3 rounded-2xl border-2 font-black uppercase italic tracking-[0.2em] shadow-lg",
              data.quiz_attempt.passed
                ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-600"
                : "bg-rose-500/5 border-rose-500/20 text-rose-600",
            )}
          >
            <Award className="h-5 w-5" />
            <span>{data.quiz_attempt.passed ? "NODE_PASSED" : "NODE_DEFICIT"}</span>
          </div>
        </div>
      </div>

      {/* FOOTER: SYSTEM_DATA */}
      <div className="pt-10 border-t-2 border-dashed border-slate-200 space-y-6">
        <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-widest italic">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 opacity-40" />
            <span>Sync_Timestamp: {format(new Date(data.quiz_attempt.completed_at), "PPP").toUpperCase()}</span>
          </div>
          <div className="text-right">
            <span>Registry_ID: {data.quiz_attempt.id.toUpperCase()}</span>
          </div>
        </div>

        <div className="text-center space-y-2 pt-4">
          <p className="text-[8px] font-black uppercase tracking-[0.4em] text-muted-foreground/40 italic">
            This artifact is verified via GroUp Academy Neural Ledger v4.2
          </p>
          <p className="text-[9px] font-bold text-primary/40 uppercase">
            © {new Date().getFullYear()} GroUp_Academy // Authorized_Credentials_Division
          </p>
        </div>
      </div>
    </div>
  );
}
