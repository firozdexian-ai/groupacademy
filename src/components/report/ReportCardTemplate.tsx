import { useMemo } from "react";
import { GraduationCap, Calendar, Award, CheckCircle, XCircle, Zap, ShieldCheck } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

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

/**
 * GroUp Academy: Institutional Assessment Telemetry Report Card (ReportCardTemplate)
 * Authoritative report card module designed for pixel-perfect PDF serialization and hardcopy generation.
 * Version: Launch Candidate · Phase Z0 Hardened Print Candidate
 */
export function ReportCardTemplate({ data }: ReportCardTemplateProps) {
  // High-Performance Data Extraction Pass: Fallback guards to defend against incomplete schema models
  const reportFidelityModel = useMemo(() => {
    const totalQuestionsNum = Number(data?.quiz_attempt?.total_questions) || 0;
    const scoredQuestionsNum = Number(data?.quiz_attempt?.score) || 0;
    const finalYieldPercentage = totalQuestionsNum > 0 ? Math.round((scoredQuestionsNum / totalQuestionsNum) * 100) : 0;

    let parsedEnrollmentDateStr = "PENDING_SYNC";
    try {
      if (data?.enrollment?.enrolled_at) {
        parsedEnrollmentDateStr = format(new Date(data.enrollment.enrolled_at), "dd_MMM_yyyy").toUpperCase();
      }
    } catch (dateErr) {
      parsedEnrollmentDateStr = "INVALID_TIMELINE";
    }

    let parsedCompletionTimestampStr = "PENDING_CALIBRATION";
    try {
      if (data?.quiz_attempt?.completed_at) {
        parsedCompletionTimestampStr = format(new Date(data.quiz_attempt.completed_at), "PPP").toUpperCase();
      }
    } catch (dateErr) {
      parsedCompletionTimestampStr = "INVALID_TIMELINE";
    }

    return {
      percentage: finalYieldPercentage,
      enrollmentDate: parsedEnrollmentDateStr,
      completionTimestamp: parsedCompletionTimestampStr,
      fullName: String(data?.student?.full_name || "Anonymous Talent Node").trim(),
      studentId: String(data?.student?.student_id || "UNASSIGNED_ID")
        .trim()
        .toUpperCase(),
      email: String(data?.student?.email || "sync_line_offline").trim(),
      courseTitle: String(data?.content?.title || "Unresolved Educational Node Specification").trim(),
      attemptId: String(data?.quiz_attempt?.id || "N/A")
        .trim()
        .toUpperCase(),
      isPassed: !!data?.quiz_attempt?.passed,
      score: scoredQuestionsNum,
      totalQuestions: totalQuestionsNum,
    };
  }, [data]);

  return (
    <div
      id="report-card-content"
      className="w-[794px] min-h-[1123px] mx-auto p-12 bg-white text-zinc-950 space-y-8 border-[16px] border-zinc-100 shadow-xl box-border antialiased print:p-8 print:border-none print:shadow-none select-none text-left"
    >
      {/* HUD LEVEL 1: DOCUMENT CONTROL HEADER STAMP CONTAINER */}
      <div className="text-center border-b-2 border-zinc-200 pb-6 relative w-full block">
        <Zap className="absolute top-0 right-0 h-6 w-6 text-zinc-300 pointer-events-none stroke-[2.2]" />
        <div className="flex items-center justify-center mb-3">
          <div className="h-14 w-14 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center shadow-inner shrink-0">
            <GraduationCap className="h-8 w-8 text-zinc-900 stroke-[2.2]" />
          </div>
        </div>
        <h1 className="text-3xl font-black uppercase italic tracking-tight text-zinc-900 leading-none">
          GroUp Academy
        </h1>
        <h2 className="text-[9px] font-bold uppercase tracking-[0.4em] text-zinc-400 mt-2 block leading-none">
          Official Assessment Telemetry Record Artifact
        </h2>
      </div>

      {/* HUD LEVEL 2: COMPOSITE METADATA TALENT IDENTITY REGISTRY MATRIX */}
      <div className="grid grid-cols-2 gap-y-4 gap-x-8 bg-zinc-50/70 p-5 rounded-xl border border-zinc-200 w-full min-w-0 font-semibold text-xs text-zinc-800 leading-none select-text">
        <div className="space-y-1.5 text-left min-w-0">
          <span className="text-[9px] font-mono font-extrabold uppercase tracking-wider text-zinc-400 block leading-none">
            Talent Identity Label
          </span>
          <p className="font-bold text-base text-zinc-900 uppercase tracking-tight block truncate pr-1">
            {reportFidelityModel.fullName}
          </p>
        </div>

        <div className="space-y-1.5 text-right min-w-0">
          <span className="text-[9px] font-mono font-extrabold uppercase tracking-wider text-zinc-400 block leading-none">
            Institutional Registry ID
          </span>
          <p className="font-mono font-bold text-sm text-zinc-900 tracking-wide block truncate pl-1">
            {reportFidelityModel.studentId}
          </p>
        </div>

        <div className="space-y-1.5 text-left min-w-0">
          <span className="text-[9px] font-mono font-extrabold uppercase tracking-wider text-zinc-400 block leading-none">
            Synchronization Network Email
          </span>
          <p className="font-medium text-xs text-zinc-600 block truncate pr-1">{reportFidelityModel.email}</p>
        </div>

        <div className="space-y-1.5 text-right min-w-0">
          <span className="text-[9px] font-mono font-extrabold uppercase tracking-wider text-zinc-400 block leading-none">
            Ecosystem Ingress Date
          </span>
          <p className="font-medium text-xs text-zinc-600 font-mono tracking-normal block truncate pl-1 tabular-nums">
            {reportFidelityModel.enrollmentDate}
          </p>
        </div>
      </div>

      {/* HUD LEVEL 3: PEDAGOGICAL COURSE TRACK SUB-NODE CALLOUT STRIP */}
      <div className="border-l-4 border-zinc-900 pl-4 py-1.5 select-text leading-none w-full min-w-0 text-left">
        <span className="text-[9px] font-mono font-extrabold uppercase tracking-wider text-zinc-400 block leading-none mb-1.5">
          Pedagogical Syllabus Course Node
        </span>
        <p className="font-black text-xl uppercase tracking-tight text-zinc-900 break-words block">
          {reportFidelityModel.courseTitle.replace(/\s+/g, "_")}
        </p>
      </div>

      {/* HUD LEVEL 4: CORE QUANTITATIVE COMPLIANCE PERFORMANCE METRICS SHEET */}
      <div className="bg-white border border-zinc-200 rounded-xl p-8 shadow-xs overflow-hidden relative w-full flex flex-col justify-center items-center">
        {reportFidelityModel.isPassed && (
          <ShieldCheck className="absolute -bottom-6 -right-6 h-28 w-28 text-emerald-600 opacity-[0.03] -rotate-12 pointer-events-none select-none" />
        )}

        <div className="text-center space-y-5 w-full flex flex-col items-center justify-center">
          <div className="flex items-center justify-center select-none">
            {reportFidelityModel.isPassed ? (
              <div className="h-14 w-14 rounded-full bg-emerald-500/10 border border-emerald-500/10 flex items-center justify-center shrink-0">
                <CheckCircle className="h-8 w-8 text-emerald-600 stroke-[2.2]" />
              </div>
            ) : (
              <div className="h-14 w-14 rounded-full bg-rose-500/10 border border-rose-500/10 flex items-center justify-center shrink-0">
                <XCircle className="h-8 w-8 text-rose-600 stroke-[2.2]" />
              </div>
            )}
          </div>

          <div className="space-y-1 w-full leading-none">
            <span className="text-[9px] font-mono font-extrabold uppercase tracking-widest text-zinc-400 block leading-none">
              Quantitative Assessment Efficiency Yield
            </span>
            <div className="flex flex-col items-center justify-center text-center pt-2">
              <p className="text-6xl font-black italic tracking-tighter text-zinc-900 font-mono tabular-nums leading-none">
                {reportFidelityModel.score}
                <span className="text-2xl text-zinc-300 font-normal mx-2 select-none">/</span>
                {reportFidelityModel.totalQuestions}
              </p>

              <p
                className={cn(
                  "text-2xl font-black uppercase tracking-tight mt-2.5 leading-none font-mono italic",
                  reportFidelityModel.isPassed ? "text-emerald-600" : "text-rose-600",
                )}
              >
                {reportFidelityModel.percentage}% Verification Parity
              </p>
            </div>
          </div>

          <div
            className={cn(
              "inline-flex items-center gap-2 px-5 h-9 rounded-xl border font-bold uppercase text-[10px] tracking-wider select-none leading-none shadow-xs mt-1",
              reportFidelityModel.isPassed
                ? "bg-emerald-500/[0.02] border-emerald-500/20 text-emerald-700"
                : "bg-rose-500/[0.02] border-rose-500/20 text-rose-700",
            )}
          >
            <Award className="h-4 w-4 stroke-[2.2]" />
            <span className="pt-0.5">
              {reportFidelityModel.isPassed ? "Ingress Complete (Node Passed)" : "Fidelity Deficit (Node Rejected)"}
            </span>
          </div>
        </div>
      </div>

      {/* HUD LEVEL 5: FOOTER SYSTEM SIGNATURE VALIDATION LOG STRIP */}
      <div className="pt-6 border-t border-zinc-200 space-y-5 select-none font-bold text-[9px] text-zinc-400 font-mono leading-none w-full shrink-0">
        <div className="flex items-center justify-between gap-4 uppercase tracking-wider h-4 leading-none w-full">
          <div className="flex items-center gap-1.5 text-left min-w-0 flex-1">
            <Calendar className="h-3.5 w-3.5 stroke-[2.2] text-zinc-300 shrink-0" />
            <span className="truncate">Calibration Clock Sync: {reportFidelityModel.completionTimestamp}</span>
          </div>
          <div className="text-right shrink-0 truncate max-w-[50%] pl-2">
            <span>Audit Tracking Hash Key: {reportFidelityModel.attemptId}</span>
          </div>
        </div>

        <div className="text-center space-y-1.5 pt-4 border-t border-zinc-100 w-full block">
          <p className="text-[8px] tracking-widest uppercase italic text-zinc-300">
            This verification document is cryptographically authorized via the GroUp Academy neural ledger architecture
            index v4.2
          </p>
          <p className="text-[9px] font-extrabold uppercase tracking-wide text-zinc-400">
            &copy; 2026 GroUp Academy &bull; Credentials Auditing and Compliance Division Registry Elements
          </p>
        </div>
      </div>
    </div>
  );
}
