import * as React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { createTalentCvSignedUrl } from "@/domains/jobs/repo/jobsRepo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
 AlertDialog,
 AlertDialogAction,
 AlertDialogCancel,
 AlertDialogContent,
 AlertDialogDescription,
 AlertDialogFooter,
 AlertDialogHeader,
 AlertDialogTitle,
 AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
 ArrowLeft,
 Building2,
 ArrowRight,
 FileText,
 Brain,
 CheckCircle2,
 Clock,
 XCircle,
 Trophy,
 Trash2,
 MessageCircle,
 RotateCcw,
 ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow, differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";
import { ApplicationMessageThread } from "@/components/applications/ApplicationMessageThread";
import { InterviewPanel } from "@/components/interviews/InterviewPanel";

// =========================================================================
// DETERMINISTIC CONTRACT INTERFACES
// =========================================================================
interface JobMetadata {
 id: string;
 title: string;
 company_name: string;
 company_logo_url: string | null;
 location: string | null;
 ai_assessment_enabled: boolean | null;
}

interface JobAssessmentNode {
 id: string;
 status: string;
}

interface Detail {
 id: string;
 job_id: string;
 application_status: string;
 delivery_status: string | null;
 cover_letter: string | null;
 cv_url: string | null;
 ai_match_score: number | null;
 ai_match_rationale: string | null;
 withdrawn_at: string | null;
 last_status_at: string | null;
 created_at: string | null;
 job: JobMetadata | null;
 assessment?: JobAssessmentNode | null;
}

interface DatabasePayloadResponse {
 id: string;
 job_id: string;
 application_status: string;
 delivery_status: string | null;
 cover_letter: string | null;
 cv_url: string | null;
 ai_match_score: number | null;
 ai_match_rationale: string | null;
 withdrawn_at: string | null;
 last_status_at: string | null;
 created_at: string | null;
 job: JobMetadata | null;
 job_assessments: JobAssessmentNode[] | null;
}

const STATUS_META: Record<
 string,
 {
 label: string;
 tone: "muted" | "primary" | "success" | "destructive";
 icon: React.ComponentType<{ className?: string }>;
 }
> = {
 submitted: { label: "Submitted", tone: "primary", icon: Clock },
 sent_to_employer: { label: "Sent to Employer", tone: "primary", icon: ArrowRight },
 viewed: { label: "Reviewed", tone: "primary", icon: CheckCircle2 },
 shortlisted: { label: "Shortlisted", tone: "success", icon: Trophy },
 hired: { label: "Hired", tone: "success", icon: Trophy },
 rejected: { label: "Not Selected", tone: "destructive", icon: XCircle },
 withdrawn: { label: "Withdrawn", tone: "muted", icon: Trash2 },
};

const TIMELINE_STEPS = [
 { id: "submitted", label: "Submitted" },
 { id: "viewed", label: "Reviewed" },
 { id: "shortlisted", label: "Shortlisted" },
 { id: "hired", label: "Hired" },
];

const STATUS_INDEX: Record<string, number> = {
 submitted: 0,
 sent_to_employer: 0,
 viewed: 1,
 shortlisted: 2,
 hired: 3,
};

/**
 * GroUp Academy: Authoritative Application Specification Ledger Node (AppApplicationDetail)
 * Hardened candidate workspace panel tracking recruitment status, processing parallel storage signing keys, and preventing client unmount memory leaks.
 * Version: Launch Candidate · Phase Z1 Integration Stability Locked
 */
export default function AppApplicationDetail() {
 const { id: rawRouteIdentifierStr } = useParams<{ id: string }>();
 const executeNavigationHook = useNavigate();

 const [isLedgerResolving, setIsLedgerResolving] = React.useState<boolean>(true);
 const [applicationDetailState, setApplicationDetailState] = React.useState<Detail | null>(null);
 const [isWithdrawActionPending, setIsWithdrawActionPending] = React.useState<boolean>(false);

 // =========================================================================
 // LIFECYCLE SECTOR 1: CORE RECORD FETCH WITH ISOLATED CANCELLATION ANCHORS
 // =========================================================================
 React.useEffect(() => {
 if (!rawRouteIdentifierStr) {
 setIsLedgerResolving(false);
 return;
 }

 let isThreadActive = true;
 setIsLedgerResolving(true);

 const executeApplicationSpecificationLookup = async () => {
 try {
 const { data: rawResponsePayload, error: databaseHandshakeError } = await supabase
 .from("job_applications")
 .select(
 `
 id, job_id, application_status, delivery_status, cover_letter, cv_url, ai_match_score, ai_match_rationale,
 withdrawn_at, last_status_at, created_at,
 job:jobs(id, title, company_name, company_logo_url, location, ai_assessment_enabled),
 job_assessments(id, status)
 `,
 )
 .eq("id", rawRouteIdentifierStr)
 .maybeSingle();

 if (!isThreadActive) return;

 if (databaseHandshakeError || !rawResponsePayload) {
 toast.error("The requested application dossier could not be retrieved safely.");
 setApplicationDetailState(null);
 return;
 }

 // Cleanly cast response mapping shapes via strict contract variables
 const robustDataNode = rawResponsePayload as unknown as DatabasePayloadResponse;
 const localizedAssessmentNode = robustDataNode.job_assessments?.[0] || null;

 setApplicationDetailState({
 id: robustDataNode.id,
 job_id: robustDataNode.job_id,
 application_status: robustDataNode.application_status,
 delivery_status: robustDataNode.delivery_status,
 cover_letter: robustDataNode.cover_letter,
 cv_url: robustDataNode.cv_url,
 ai_match_score: robustDataNode.ai_match_score,
 ai_match_rationale: robustDataNode.ai_match_rationale,
 withdrawn_at: robustDataNode.withdrawn_at,
 last_status_at: robustDataNode.last_status_at,
 created_at: robustDataNode.created_at,
 job: robustDataNode.job,
 assessment: localizedAssessmentNode,
 });
 } catch (fatalExceptionPayload) {
 if (isThreadActive) toast.error("System connection interface drops recorded.");
 } finally {
 if (isThreadActive) setIsLedgerResolving(false);
 }
 };

 executeApplicationSpecificationLookup();

 return () => {
 isThreadActive = false;
 };
 }, [rawRouteIdentifierStr]);

 // =========================================================================
 // ACTION HOOKS: PERSISTENT CLOUD FILE INGRESS RESOLUTIONS
 // =========================================================================
 const handleViewSubmittedCVDocument = React.useCallback(async () => {
 if (!applicationDetailState?.cv_url) return;

 if (applicationDetailState.cv_url.startsWith("http")) {
 window.open(applicationDetailState.cv_url, "_blank", "noopener,noreferrer");
 return;
 }

 try {
 const temporarySignedUrlToken = await createTalentCvSignedUrl(
 applicationDetailState.cv_url,
 60,
 ).catch(() => null);

 if (!temporarySignedUrlToken) {
 toast.error("The request to authenticate secure cloud credential links was refused.");
 return;
 }

 window.open(temporarySignedUrlToken, "_blank", "noopener,noreferrer");
 } catch (suppressedStorageException) {
 toast.error("Cloud file subsystem rejected target asset call indices.");
 }
 }, [applicationDetailState]);

 const handleWithdrawSequenceAction = React.useCallback(async () => {
 if (!applicationDetailState) return;

 setIsWithdrawActionPending(true);
 const serializedUtcTimestampString = new Date().toISOString();

 try {
 const { error: patchHandshakeError } = await supabase
 .from("job_applications")
 .update({
 application_status: "withdrawn",
 withdrawn_at: serializedUtcTimestampString,
 })
 .eq("id", applicationDetailState.id);

 if (patchHandshakeError) throw patchHandshakeError;

 toast.success("Application classification states successfully updated.");
 setApplicationDetailState((prevNode) =>
 prevNode ? { ...prevNode, application_status: "withdrawn", withdrawn_at: serializedUtcTimestampString } : null,
 );
 } catch (mutationExceptionPayload) {
 toast.error("Failed to alter registration lifecycle tracking paths.");
 } finally {
 setIsWithdrawActionPending(false);
 }
 }, [applicationDetailState]);

 const handleRestoreSequenceAction = React.useCallback(async () => {
 if (!applicationDetailState) return;

 try {
 const { error: restorationHandshakeError } = await supabase
 .from("job_applications")
 .update({
 application_status: "submitted",
 withdrawn_at: null,
 })
 .eq("id", applicationDetailState.id);

 if (restorationHandshakeError) throw restorationHandshakeError;

 toast.success("Application successfully restored to matching vetting lists.");
 setApplicationDetailState((prevNode) =>
 prevNode ? { ...prevNode, application_status: "submitted", withdrawn_at: null } : null,
 );
 } catch (mutationExceptionPayload) {
 toast.error("Restoration protocol refused by remote transactional database engine.");
 }
 }, [applicationDetailState]);

 const handleNavigateToApplicationsDirectory = React.useCallback(() => {
 executeNavigationHook("/app/applications");
 }, [executeNavigationHook]);

 const handleNavigateToJobSnapshot = React.useCallback(() => {
 if (applicationDetailState?.job?.id) {
 executeNavigationHook(`/app/jobs/${applicationDetailState.job.id}`);
 }
 }, [applicationDetailState, executeNavigationHook]);

 const handleNavigateToAIAssessment = React.useCallback(() => {
 if (applicationDetailState?.assessment?.id) {
 executeNavigationHook(`/app/job-assessment/${applicationDetailState.assessment.id}`);
 }
 }, [applicationDetailState, executeNavigationHook]);

 // =========================================================================
 // RENDERING CONTROLLERS: STATE INTERCEPT BLOCKS
 // =========================================================================
 if (isLedgerResolving) {
 return (
 <div className="max-w-3xl mx-auto px-4 py-6 space-y-4 text-left antialiased block w-full select-none pointer-events-none">
 <Skeleton className="h-8 w-36 rounded-lg shrink-0 block" />
 <Skeleton className="h-32 w-full rounded-xl shrink-0 block mt-2" />
 <Skeleton className="h-40 w-full rounded-xl shrink-0 block" />
 </div>
 );
 }

 if (!applicationDetailState || !applicationDetailState.job) {
 return (
 <div
 role="alert"
 className="min-h-[50vh] grid place-items-center text-center p-6 antialiased select-none transform-gpu"
 >
 <div className="max-w-xs block space-y-4 leading-none">
 <div className="h-9 w-9 rounded-lg bg-muted/40 border border-border/40 flex items-center justify-center text-muted-foreground/50 mx-auto pointer-events-none">
 <ShieldAlert className="h-4 w-4 stroke-[2.2]" />
 </div>
 <div className="space-y-1 block">
 <p className="text-xs font-bold text-foreground uppercase tracking-wide">Dossier Missing</p>
 <p className="text-[11px] font-semibold text-muted-foreground/60 leading-normal">
 The targeted application tracking instance data could not be localized within verified record arrays.
 </p>
 </div>
 <Button
 type="button"
 size="sm"
 onClick={handleNavigateToApplicationsDirectory}
 className="h-8 px-3 rounded-lg text-xs font-medium tracking-wider"
 >
 Return to Core Index Grid
 </Button>
 </div>
 </div>
 );
 }

 const activeStatusMeta = STATUS_META[applicationDetailState.application_status] || STATUS_META.submitted;
 const ActiveStatusIconAsset = activeStatusMeta.icon;
 const isSubmissionLifecycleClosed = ["rejected", "withdrawn", "hired"].includes(
 applicationDetailState.application_status,
 );
 const numericalTimelineStepIdx = STATUS_INDEX[applicationDetailState.application_status] ?? 0;

 return (
 <div className="max-w-3xl mx-auto px-4 pt-3 pb-16 space-y-4 block text-left antialiased transform-gpu w-full">
 {/* HUD LEVEL 1: OVERVIEW CONTROL CONSOLE BAR */}
 <div className="flex items-center justify-between select-none leading-none w-full shrink-0">
 <Button
 type="button"
 variant="ghost"
 size="sm"
 className="h-8 px-2 rounded-md font-bold uppercase tracking-wide text-xs gap-1 cursor-pointer text-muted-foreground hover:text-foreground"
 onClick={handleNavigateToApplicationsDirectory}
 >
 <ArrowLeft className="h-3.5 w-3.5 stroke-[2.5]" />
 <span>Applications Directory</span>
 </Button>

 <Badge
 className={cn(
 "font-mono text-[9px] font-black uppercase px-2 h-5 tracking-wide pointer-events-none border shadow-2xs pt-0.5 rounded-xs leading-none shrink-0",
 activeStatusMeta.tone === "primary" && "bg-primary/5 text-primary border-primary/20",
 activeStatusMeta.tone === "success" && "bg-emerald-500/5 text-emerald-600 border-emerald-500/20",
 activeStatusMeta.tone === "destructive" && "bg-destructive/5 text-destructive border-destructive/20",
 activeStatusMeta.tone === "muted" && "bg-muted text-muted-foreground border-border",
 )}
 >
 <ActiveStatusIconAsset className="h-3 w-3 stroke-[2.5] shrink-0 mr-1" />
 <span>{activeStatusMeta.label}</span>
 </Badge>
 </div>

 {/* HUD LEVEL 2: DETAILED ASSIGNMENT SOURCE VIEW CARD */}
 <Card
 onClick={handleNavigateToJobSnapshot}
 className="rounded-xl border border-border/60 bg-card/40 hover:border-border-foreground/10 transition-colors duration-100 shadow-none cursor-pointer overflow-hidden block w-full"
 >
 <CardContent className="p-4 flex items-center gap-3.5 leading-none w-full block">
 <div className="h-11 w-11 rounded-lg bg-background border border-border/40 shadow-2xs overflow-hidden flex items-center justify-center shrink-0 pointer-events-none select-none">
 {applicationDetailState.job.company_logo_url ? (
 <img
 src={applicationDetailState.job.company_logo_url}
 alt=""
 className="object-cover w-full h-full block"
 />
 ) : (
 <Building2 className="h-5 w-5 text-primary stroke-[2.2]" />
 )}
 </div>

 <div className="flex-1 min-w-0 leading-none space-y-1 block">
 <p className="text-xs sm:text-sm font-bold text-foreground truncate block uppercase tracking-wide pt-0.5 select-text">
 {applicationDetailState.job.title}
 </p>
 <p className="text-[11px] font-semibold text-muted-foreground/70 truncate block select-text leading-tight">
 {applicationDetailState.job.company_name} <span className="font-mono opacity-30 select-none mx-1">·</span>{" "}
 {applicationDetailState.job.location || "Remote"}
 </p>
 <p className="font-mono text-[9px] font-bold text-muted-foreground/40 uppercase tracking-tight block leading-none tabular-nums pt-0.5">
 Uplink Logged:{" "}
 {applicationDetailState.created_at
 ? formatDistanceToNow(new Date(applicationDetailState.created_at), { addSuffix: true }).toUpperCase()
 : "SPEC INTERVAL NOT FOUND"}
 </p>
 </div>

 <ArrowRight className="h-4 w-4 text-muted-foreground/40 stroke-[2.2] shrink-0 select-none pointer-events-none" />
 </CardContent>
 </Card>

 {/* HUD LEVEL 3: PROGRESS TIMELINE CHANNELS BAR */}
 {!isSubmissionLifecycleClosed && (
 <Card className="rounded-xl border border-border/60 bg-card/10 shadow-none overflow-hidden block w-full select-none">
 <CardContent className="p-4 block w-full leading-none">
 <p className="text-[10px] font-mono font-black uppercase tracking-wide text-muted-foreground/40 leading-none pb-3 border-b border-border/5 mb-4">
 Vetting Pipeline Progression Coordinates
 </p>

 <div className="relative flex justify-between items-center w-full block">
 <div className="absolute top-2 left-0 right-0 h-px bg-border/60 z-0 pointer-events-none" />
 <div
 className="absolute top-2 left-0 h-px bg-primary transition-all duration-300 z-0 pointer-events-none"
 style={{ width: `${(numericalTimelineStepIdx / (TIMELINE_STEPS.length - 1)) * 100}%` }}
 />

 {TIMELINE_STEPS.map((stepNodeItem, stepIndexPosition) => {
 const isStepActiveFlag = stepIndexPosition <= numericalTimelineStepIdx;

 return (
 <div
 key={stepNodeItem.id}
 className="flex flex-col items-center flex-1 relative z-10 block leading-none"
 >
 <div
 className={cn(
 "h-4 w-4 rounded-full border bg-background grid place-items-center transition-colors shadow-2xs",
 isStepActiveFlag ? "border-primary" : "border-muted-foreground/20",
 )}
 >
 {isStepActiveFlag && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
 </div>
 <span
 className={cn(
 "font-mono text-[9px] font-extrabold uppercase mt-2 tracking-tight block",
 isStepActiveFlag ? "text-foreground font-black" : "text-muted-foreground/40",
 )}
 >
 {stepNodeItem.label}
 </span>
 </div>
 );
 })}
 </div>
 </CardContent>
 </Card>
 )}

 {/* HUD LEVEL 4: SYSTEM COMPLIANCE INTERFACE NUDGE */}
 {applicationDetailState.job.ai_assessment_enabled &&
 !isSubmissionLifecycleClosed &&
 applicationDetailState.assessment &&
 applicationDetailState.assessment.status !== "completed" && (
 <Card className="rounded-xl border border-amber-500/20 bg-amber-500/[0.02] shadow-none overflow-hidden block w-full">
 <CardContent className="p-3.5 flex items-center justify-between gap-4 leading-none w-full block">
 <Brain className="h-5 w-5 text-amber-500 stroke-[2.2] shrink-0 select-none pointer-events-none animate-pulse" />
 <div className="flex-1 min-w-0 leading-none space-y-1 block select-none pointer-events-none">
 <p className="text-xs sm:text-sm font-bold uppercase tracking-wide text-foreground">
 Pending AI Evaluation Task Sequence
 </p>
 <p className="text-[11px] font-semibold text-muted-foreground/60 leading-tight block">
 Mandatory platform testing metric verified. Action required to complete corporate profile distribution
 mapping.
 </p>
 </div>

 <Button
 type="button"
 size="sm"
 onClick={handleNavigateToAIAssessment}
 className="h-8 rounded-lg font-mono text-[10px] font-extrabold uppercase tracking-wider px-3 shrink-0 cursor-pointer shadow-2xs transform-gpu active:scale-[0.985]"
 >
 Launch Matrix Test
 </Button>
 </CardContent>
 </Card>
 )}

 {/* HUD LEVEL 5: SYNTHETIC SKILL CAP MATCH INDEX OVERVIEW */}
 {applicationDetailState.ai_match_score !== null && (
 <Card className="rounded-xl border border-border/60 bg-card/40 shadow-none block w-full overflow-hidden">
 <CardContent className="p-4 space-y-2 block w-full leading-none">
 <div className="flex items-center gap-1.5 font-mono text-[10px] font-black tracking-wide uppercase text-primary select-none pointer-events-none leading-none block border-b border-border/5 pb-2">
 <Brain className="h-4 w-4 stroke-[2.2]" />
 <span className="pt-0.5">
 Synthetic Mastery Fit Alignment:{" "}
 <span className="text-foreground font-mono tabular-nums">
 {Math.round(Number(applicationDetailState.ai_match_score))}% Match Ratio
 </span>
 </span>
 </div>

 {applicationDetailState.ai_match_rationale && (
 <p className="text-xs text-muted-foreground/80 leading-relaxed font-medium block select-text whitespace-pre-wrap pt-0.5">
 {applicationDetailState.ai_match_rationale}
 </p>
 )}
 </CardContent>
 </Card>
 )}

 {/* HUD LEVEL 6: CANDIDATE SUBMISSION VERIFICATION WORKSPACE PACKAGES */}
 <Card className="rounded-xl border border-border/60 bg-card/40 shadow-none block w-full overflow-hidden">
 <CardContent className="p-4 space-y-3 block w-full leading-none">
 <p className="text-xs font-mono font-extrabold uppercase tracking-wide text-muted-foreground/50 select-none block leading-none pb-2 border-b border-border/5">
 Distributed Candidate Credentials Packages
 </p>

 {applicationDetailState.cv_url ? (
 <Button
 type="button"
 variant="outline"
 size="sm"
 className="w-full h-9 rounded-lg font-mono text-[10px] font-extrabold uppercase tracking-wider justify-start border border-border/60 bg-background/50 hover:bg-accent hover:text-foreground cursor-pointer transition-colors shadow-2xs pl-3 shrink-0"
 onClick={handleViewSubmittedCVDocument}
 >
 <FileText className="h-4 w-4 text-muted-foreground/60 stroke-[2.2] mr-2 shrink-0" />
 <span>Inspect Transmitted CV Specification Document</span>
 </Button>
 ) : (
 <p className="text-xs font-semibold text-muted-foreground/40 py-1 block select-none pointer-events-none">
 No continuous verification curriculum attachment tracked for this application sequence instance block.
 </p>
 )}

 {applicationDetailState.cover_letter && (
 <div className="space-y-1.5 pt-1 block w-full leading-none">
 <p className="font-mono text-[9px] font-bold text-muted-foreground/40 uppercase tracking-wide block select-none pointer-events-none leading-none">
 Transmitted Narrative Cover Letter Abstract
 </p>
 <p className="text-xs sm:text-sm text-foreground/80 font-medium whitespace-pre-wrap leading-relaxed bg-muted/40 border border-border/5 rounded-lg p-3 block select-text pr-1.5 pr-2 tracking-normal">
 {applicationDetailState.cover_letter}
 </p>
 </div>
 )}
 </CardContent>
 </Card>

 {/* HUD LEVEL 7: RECRUITER CHAT MESSAGES PANEL ARCHIVE */}
 {!isSubmissionLifecycleClosed && (
 <Card className="rounded-xl border border-border/60 bg-card/40 shadow-none overflow-hidden block w-full">
 <CardContent className="p-4 space-y-3 block w-full leading-none">
 <div className="flex items-center gap-1.5 font-mono text-[10px] font-extrabold text-muted-foreground/40 uppercase tracking-wide border-b border-border/5 pb-2 select-none pointer-events-none leading-none block w-full">
 <MessageCircle className="h-4 w-4 text-primary stroke-[2.2]" />
 <span className="pt-0.5">Encrypted Communication Thread Channel</span>
 </div>
 <ApplicationMessageThread applicationId={applicationDetailState.id} actorRole="talent" />
 </CardContent>
 </Card>
 )}

 {/* HUD LEVEL 8: RELATIONAL INTERVIEW SCHEDULING ROSTERS TRACKS */}
 <InterviewPanel applicationId={applicationDetailState.id} actorRole="talent" />

 {/* HUD LEVEL 9: COMPLIANCE MUTATION ROLLBACK TIMEFRAME INTERVAL TRIGGERS */}
 {applicationDetailState.application_status === "withdrawn" &&
 applicationDetailState.withdrawn_at &&
 differenceInDays(new Date(), new Date(applicationDetailState.withdrawn_at)) < 7 && (
 <Button
 type="button"
 variant="outline"
 size="sm"
 onClick={handleRestoreSequenceAction}
 className="w-full h-9 rounded-lg font-mono text-[10px] font-extrabold uppercase tracking-wider text-primary border-primary/20 hover:bg-primary/5 cursor-pointer shadow-2xs shrink-0 transform-gpu active:scale-[0.995] block"
 >
 <RotateCcw className="h-3.5 w-3.5 stroke-[2.5] mr-2 shrink-0 inline-block align-middle" />
 <span className="inline-block align-middle pt-0.5">Re-activate Allocation Dossier Parameters</span>
 </Button>
 )}

 {/* HUD LEVEL 10: ALIGNMENT VOID WITHDRAWAL MUTATION MECHANISMS */}
 {!isSubmissionLifecycleClosed && (
 <AlertDialog>
 <AlertDialogTrigger asChild>
 <Button
 type="button"
 variant="ghost"
 size="sm"
 className="w-full h-8 px-4 rounded-lg font-mono text-[10px] font-extrabold uppercase tracking-wide text-destructive hover:text-destructive hover:bg-destructive/5 cursor-pointer transition-colors shadow-none shrink-0 block"
 >
 <Trash2 className="h-3.5 w-3.5 stroke-[2.2] mr-2 shrink-0 inline-block align-middle" />
 <span className="inline-block align-middle pt-0.5">Withdraw Application Credentials</span>
 </Button>
 </AlertDialogTrigger>
 <AlertDialogContent className="rounded-xl border border-border/60 bg-popover text-popover-foreground">
 <AlertDialogHeader className="text-left select-none pointer-events-none block leading-none pb-2 border-b border-border/5">
 <AlertDialogTitle className="text-sm font-bold uppercase tracking-wide text-foreground leading-none">
 Terminate Dossier Review Sequence?
 </AlertDialogTitle>
 <AlertDialogDescription className="text-xs font-semibold text-muted-foreground/60 leading-normal block pt-1.5">
 The evaluation recruiter interface network will immediately freeze processing loops for this profile
 track. Re-submission capabilities remain locked unless recruitment limits expand later.
 </AlertDialogDescription>
 </AlertDialogHeader>
 <AlertDialogFooter className="flex items-center gap-1.5 select-none leading-none block w-full mt-4 shrink-0 pt-0.5">
 <AlertDialogCancel className="h-8 px-3 rounded-lg text-xs font-medium tracking-wider border border-border/60 bg-transparent text-foreground hover:bg-muted cursor-pointer transition-colors m-0">
 Cancel
 </AlertDialogCancel>
 <AlertDialogAction
 onClick={handleWithdrawSequenceAction}
 disabled={isWithdrawActionPending}
 className="h-8 px-3 rounded-lg text-xs font-medium tracking-wider bg-destructive text-destructive-foreground hover:bg-destructive/90 cursor-pointer transition-colors shadow-2xs shrink-0 block m-0 disabled:opacity-50"
 >
 Withdraw
 </AlertDialogAction>
 </AlertDialogFooter>
 </AlertDialogContent>
 </AlertDialog>
 )}
 </div>
 );
}
