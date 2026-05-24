import * as React from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ShieldCheck, Target, Zap, ChevronRight, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

// =========================================================================
// DETERMINISTIC COMPONENT DATA TYPE CONTRACTS
// =========================================================================
interface CriteriaNode {
 band: number;
 feedback: string;
}

interface FeedbackSchema {
 criteria?: Record<string, CriteriaNode>;
 strengths?: string[];
 improvements?: string[];
 next_action?: string;
}

interface MockAttemptRecord {
 id: string;
 section: string;
 ai_band_score: number | null;
 ai_feedback: FeedbackSchema | unknown;
 created_at: string;
}

/**
 * GroUp Academy: IELTS Mock Examination Result Dossier (IELTSResults)
 * Hardened responsive viewer isolating AI band scoring metrics, criteria feedback, and structural progress indicators.
 * Version: Launch Candidate · Phase Z1 Production Contract Locked
 */
export default function IELTSResults() {
 const { id: unverifiedAttemptIdStr } = useParams<{ id: string }>();

 const { data: attemptRecordPayload, isLoading: isAttemptCacheResolving } = useQuery({
 queryKey: ["app-ielts-attempt-result-node", unverifiedAttemptIdStr],
 enabled: !!unverifiedAttemptIdStr,
 queryFn: async (): Promise<MockAttemptRecord> => {
 const { data: dbAttemptPayload, error: queryHandshakeError } = await supabase
 .from("ielts_mock_attempts")
 .select("id, section, ai_band_score, ai_feedback, created_at")
 .eq("id", unverifiedAttemptIdStr!)
 .maybeSingle();

 if (queryHandshakeError) throw queryHandshakeError;
 if (!dbAttemptPayload) throw new Error("Examination attempt registry record not localized.");
 return dbAttemptPayload as unknown as MockAttemptRecord;
 },
 });

 const activeAttemptNode = attemptRecordPayload;
 const feedbackDataPayload = (activeAttemptNode?.ai_feedback as FeedbackSchema) ?? {};

 if (isAttemptCacheResolving) {
 return (
 <div className="max-w-3xl mx-auto px-4 py-8 space-y-4 select-none pointer-events-none animate-pulse w-full block">
 <Skeleton className="h-12 w-full rounded-lg block" />
 <Skeleton className="h-40 w-full rounded-lg bg-card/10 block" />
 </div>
 );
 }

 if (!activeAttemptNode) {
 return (
 <div className="min-h-[50vh] grid place-items-center text-center p-6 antialiased select-none transform-gpu w-full">
 <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
 Examination Data Registry Unallocated
 </p>
 </div>
 );
 }

 return (
 <div className="max-w-2xl mx-auto px-4 py-6 space-y-5 antialiased block transform-gpu w-full pb-32">
 {/* HUD LEVEL 1: RESULT SUMMARY HEADER HUD */}
 <header className="flex items-center justify-between gap-4 border-b border-border/10 pb-4 w-full shrink-0 select-none leading-none">
 <div className="block leading-none">
 <p className="font-mono text-sm font-medium text-muted-foreground/50 uppercase tracking-wide block leading-none pb-1">
 Examination Result
 </p>
 <h1 className="text-base sm:text-lg font-black uppercase tracking-wide text-foreground leading-tight block select-text">
 {activeAttemptNode.section.toUpperCase()} PERFORMANCE ANALYSIS
 </h1>
 </div>
 <Badge className="font-mono text-base font-black uppercase px-3 h-9 rounded-lg border border-primary/20 bg-primary/5 text-primary shadow-3xs tracking-tighter shrink-0 select-none pointer-events-none">
 BAND {activeAttemptNode.ai_band_score !== null ? Number(activeAttemptNode.ai_band_score).toFixed(1) : "—"}
 </Badge>
 </header>

 {/* HUD LEVEL 2: CRITERIA METRICS EVALUATION MATRIX */}
 {feedbackDataPayload.criteria && (
 <div className="space-y-2 block w-full">
 {Object.entries(feedbackDataPayload.criteria).map(([criterionKeyStr, criterionDataNode]) => (
 <Card
 key={`criteria-node-evaluation-${criterionKeyStr}`}
 className="rounded-lg border border-border/60 bg-card/40 shadow-none overflow-hidden block w-full"
 >
 <CardContent className="p-3.5 space-y-1.5 block w-full leading-none">
 <div className="flex items-center justify-between gap-4 w-full block">
 <span className="text-xs sm:text-sm font-bold capitalize text-foreground/90 tracking-wide select-text">
 {criterionKeyStr.replace(/_/g, " ")}
 </span>
 <Badge
 variant="secondary"
 className="font-mono text-[9px] font-bold uppercase tracking-tight tabular-nums shrink-0 rounded-xs"
 >
 BAND {Number(criterionDataNode.band).toFixed(1)}
 </Badge>
 </div>
 <p className="text-xs text-muted-foreground/80 leading-relaxed block select-text pt-0.5">
 {criterionDataNode.feedback}
 </p>
 </CardContent>
 </Card>
 ))}
 </div>
 )}

 {/* HUD LEVEL 3: PERFORMANCE STRENGTHS AND GROWTH OPPORTUNITIES */}
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full block">
 {Array.isArray(feedbackDataPayload.strengths) && feedbackDataPayload.strengths.length > 0 && (
 <section className="space-y-2 block w-full">
 <h3 className="font-mono text-[9px] font-black uppercase text-emerald-700 tracking-wide block leading-none pb-1 border-b border-emerald-500/10">
 Identified Strengths
 </h3>
 <ul className="text-xs text-foreground/80 font-medium space-y-1.5 pl-1 block">
 {feedbackDataPayload.strengths.map((strengthStr, idx) => (
 <li key={`strength-log-item-${idx}`} className="flex gap-2">
 <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" /> {strengthStr}
 </li>
 ))}
 </ul>
 </section>
 )}

 {Array.isArray(feedbackDataPayload.improvements) && feedbackDataPayload.improvements.length > 0 && (
 <section className="space-y-2 block w-full">
 <h3 className="font-mono text-[9px] font-black uppercase text-amber-700 tracking-wide block leading-none pb-1 border-b border-amber-500/10">
 Growth Opportunities
 </h3>
 <ul className="text-xs text-foreground/80 font-medium space-y-1.5 pl-1 block">
 {feedbackDataPayload.improvements.map((improvementStr, idx) => (
 <li key={`improvement-log-item-${idx}`} className="flex gap-2">
 <Target className="h-3.5 w-3.5 text-amber-500 shrink-0" /> {improvementStr}
 </li>
 ))}
 </ul>
 </section>
 )}
 </div>

 {/* HUD LEVEL 4: NEXT ACTION EXECUTION PROTOCOL */}
 {feedbackDataPayload.next_action && (
 <Card className="rounded-lg border border-primary/30 bg-primary/[0.02] shadow-none overflow-hidden block w-full">
 <CardContent className="p-4 space-y-1 block w-full leading-none">
 <div className="font-mono text-[9px] font-black uppercase text-primary tracking-wide block leading-none pb-1.5">
 Actionable Next Protocol
 </div>
 <p className="text-xs font-semibold text-foreground leading-relaxed block select-text">
 {feedbackDataPayload.next_action}
 </p>
 </CardContent>
 </Card>
 )}
 </div>
 );
}
