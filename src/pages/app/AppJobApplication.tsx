import * as React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { uploadTalentCv, createTalentCvSignedUrl } from "@/domains/jobs/repo/jobsRepo";
import {
 getJobForApplication,
 getExistingTalentApplication,
 insertTalentJobApplication,
} from "@/domains/jobs/repo/jobsRepo";
import { updateTalentCvUrl } from "@/domains/talent/repo/talentRepo";
import { useTalent } from "@/hooks/useTalent";
import { useCredits } from "@/domains/finance/hooks/useCredits";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
 ArrowLeft,
 Building2,
 CheckCircle,
 FileText,
 Loader2,
 Sparkles,
 Brain,
 ArrowRight,
 UploadCloud,
 Zap,
 ShieldCheck,
 Inbox,
} from "lucide-react";
import { toast } from "sonner";
import { CreditPurchaseSheet } from "@/components/credits/CreditPurchaseSheet";
import { cn } from "@/lib/utils";
import { enhanceCoverLetter, sendJobApplication, generateJobAssessment } from "@/domains/jobs/api/jobsApi";

// =========================================================================
// DETERMINISTIC COMPONENT DATA TYPE CONTRACTS
// =========================================================================
interface Job {
 id: string;
 title: string;
 company_name: string;
 company_logo_url: string | null;
 application_email: string | null;
 ai_assessment_enabled: boolean | null;
}

interface SubmissionStage {
 progress: number;
 message: string;
}

interface JobApplicationPayload {
 id: string;
 job_assessments: { id: string }[];
}

const SUBMISSION_STAGES: SubmissionStage[] = [
 { progress: 20, message: "Saving your application..." },
 { progress: 40, message: "Uploading your CV..." },
 { progress: 60, message: "Preparing AI interview..." },
 { progress: 85, message: "Almost done..." },
];

/**
 * Job application submission page: CV upload, cover letter, and submit.
 */
export default function AppJobApplication() {
 const { id: unverifiedJobIdentifierStr } = useParams<{ id: string }>();
 const navigateHook = useNavigate();
 const { talent: talentProfileRecord, refreshTalent } = useTalent();
 const { balance, canAfford, deductCredits, getServiceCost, refreshBalance } = useCredits();

 const [jobRecordState, setJobRecordState] = React.useState<Job | null>(null);
 const [isDataLayerLoading, setIsDataLayerLoading] = React.useState<boolean>(true);
 const [isSubmissionInFlight, setIsSubmissionInFlight] = React.useState<boolean>(false);
 const [isApplicationSubmitted, setIsApplicationSubmitted] = React.useState<boolean>(false);
 const [coverLetterInputStr, setCoverLetterInputStr] = React.useState<string>("");
 const [isPurchaseSheetOpen, setIsPurchaseSheetOpen] = React.useState<boolean>(false);
 const [isAIComposerProcessing, setIsAIComposerProcessing] = React.useState<boolean>(false);
 const [submissionProgressValue, setSubmissionProgressValue] = React.useState<number>(0);
 const [submissionProgressMessage, setSubmissionProgressMessage] = React.useState<string>("");
 const [generatedAssessmentId, setGeneratedAssessmentId] = React.useState<string | null>(null);
 const [isCVStorageUploading, setIsCVStorageUploading] = React.useState<boolean>(false);

 const submissionExecutionGuardRef = React.useRef<boolean>(false);
 const computedApplicationCost = getServiceCost("JOB_APPLICATION") || 0;
 const isCandidateBalanceSufficient = canAfford("JOB_APPLICATION");

 // =========================================================================
 // LIFECYCLE SECTOR 1: CONCURRENT ACCOUNT REGISTRY HANDSHAKE AND SANITIZATION
 // =========================================================================
 React.useEffect(() => {
 if (!unverifiedJobIdentifierStr) {
 setIsDataLayerLoading(false);
 return;
 }

 let isThreadActive = true;
 setIsDataLayerLoading(true);

 const executeJobDossierAndVettingLookup = async () => {
 try {
 const { data: jobQueryPayload, error: jobHandshakeError } = await getJobForApplication(
 unverifiedJobIdentifierStr,
 );

 if (jobHandshakeError || !jobQueryPayload) throw jobQueryPayload;

 if (!isThreadActive) return;
 setJobRecordState(jobQueryPayload as unknown as Job);

 if (talentProfileRecord?.id) {
 const existingApplicationRecord = await getExistingTalentApplication(
 unverifiedJobIdentifierStr,
 talentProfileRecord.id,
 );

 if (!isThreadActive) return;

 if (existingApplicationRecord) {
 setIsApplicationSubmitted(true);
 const verifiedCastAppRecord = existingApplicationRecord as unknown as JobApplicationPayload;
 const extractionAssessmentNode = verifiedCastAppRecord.job_assessments?.[0];
 if (extractionAssessmentNode?.id) {
 setGeneratedAssessmentId(extractionAssessmentNode.id);
 }
 }
 }
 } catch (fatalHandshakeException) {
 if (isThreadActive) {
 toast.error("Failed to localize requested position parameters inside systemic index registries.");
 setJobRecordState(null);
 }
 } finally {
 if (isThreadActive) setIsDataLayerLoading(false);
 }
 };

 executeJobDossierAndVettingLookup();

 return () => {
 isThreadActive = false;
 };
 }, [unverifiedJobIdentifierStr, talentProfileRecord?.id]);

 // =========================================================================
 // ACTION HOOKS: CLOUD FILE STORAGE CV UPLOAD VECTOR PIPELINES
 // =========================================================================
 const handleSecureCVStorageUploadSequence = React.useCallback(
 async (eventObj: React.ChangeEvent<HTMLInputElement>) => {
 const targetedUploadFileNode = eventObj.target.files?.[0];
 if (!targetedUploadFileNode || !talentProfileRecord) return;

 if (targetedUploadFileNode.size > 5 * 1024 * 1024) {
 toast.error("Cloud document size restrictions violated. Cap threshold limits fixed at 5.0 MB.");
 return;
 }

 setIsCVStorageUploading(true);
 try {
 const extractedFileExtensionStr = targetedUploadFileNode.name.split(".").pop();
 const generatedTargetStoragePath = `${talentProfileRecord.id}/${Date.now().toString()}-cv.${extractedFileExtensionStr}`;

 await uploadTalentCv(generatedTargetStoragePath, targetedUploadFileNode);

 const signedUrl = await createTalentCvSignedUrl(generatedTargetStoragePath, 31536000);

 const { error: relationalTalentRowUpdateError } = await updateTalentCvUrl(
 talentProfileRecord.id,
 signedUrl,
 );

 if (relationalTalentRowUpdateError) throw relationalTalentRowUpdateError;

 await refreshTalent();
 toast.success("Continuous validation CV data artifact successfully locked & hashed.");
 } catch (storageExceptionPayload) {
 toast.error("Cloud infrastructure rejected credential file payload.");
 } finally {
 setIsCVStorageUploading(false);
 }
 },
 [talentProfileRecord, refreshTalent],
 );

 // =========================================================================
 // NARRATIVE AI COMPOSER PROMPT COMPILATION INTERFACE
 // =========================================================================
 const handleAICoverLetterSynthesisSequence = React.useCallback(async () => {
 if (!talentProfileRecord || !jobRecordState) return;

 setIsAIComposerProcessing(true);
 try {
 let rpcResponsePayload: any = null;
 let edgeFunctionInvokeError: any = null;
 try {
 rpcResponsePayload = await enhanceCoverLetter({
 coverLetter:
 coverLetterInputStr ||
 `I am writing to express my structural interest in the ${jobRecordState.title} position at ${jobRecordState.company_name}.`,
 jobTitle: jobRecordState.title,
 companyName: jobRecordState.company_name,
 candidateName: talentProfileRecord.fullName,
 skills: talentProfileRecord.skills,
 });
 } catch (e) { edgeFunctionInvokeError = e; }

 if (edgeFunctionInvokeError) throw edgeFunctionInvokeError;

 if (rpcResponsePayload?.enhancedCoverLetter) {
 setCoverLetterInputStr(rpcResponsePayload.enhancedCoverLetter);
 toast.success("Cover letter generated.");
 }
 } catch (fatalAIEngineException) {
 toast.error("AI composition queues are currently restricted. Re-submit parameter query.");
 } finally {
 setIsAIComposerProcessing(false);
 }
 }, [talentProfileRecord, jobRecordState, coverLetterInputStr]);

 // =========================================================================
 // TRANSACTION SUBMISSION ENGINE PIPELINE EXECUTION
 // =========================================================================
 const handleCommitJobApplicationSequence = React.useCallback(async () => {
 if (!talentProfileRecord || !jobRecordState || submissionExecutionGuardRef.current) return;

 if (!isCandidateBalanceSufficient) {
 setIsPurchaseSheetOpen(true);
 return;
 }

 if (!talentProfileRecord.cvUrl) {
 toast.error("Dossier rejected. A verified resume tracking artifact is a required dependency block.");
 document.getElementById("cv-upload-anchor-node")?.scrollIntoView({ behavior: "smooth" });
 return;
 }

 submissionExecutionGuardRef.current = true;
 setIsSubmissionInFlight(true);
 setSubmissionProgressValue(20);
 setSubmissionProgressMessage(SUBMISSION_STAGES[0].message);

 try {
 const { data: applicationInsertPayload, error: applicationInsertError } =
 await insertTalentJobApplication({
 job_id: jobRecordState.id,
 talent_id: talentProfileRecord.id,
 cover_letter: coverLetterInputStr.trim(),
 cv_url: talentProfileRecord.cvUrl,
 delivery_status: "pending",
 });

 if (applicationInsertError || !applicationInsertPayload) throw applicationInsertError;

 await deductCredits(
 "JOB_APPLICATION",
 jobRecordState.id,
 `Job application: ${jobRecordState.title}`,
 );

 setSubmissionProgressValue(40);
 setSubmissionProgressMessage("Sending your application to the employer...");

 try { await sendJobApplication({ applicationId: applicationInsertPayload.id }); } catch {}

 if (jobRecordState.ai_assessment_enabled) {
 setSubmissionProgressValue(65);
 setSubmissionProgressMessage("Preparing your AI interview...");

 let assessmentResponsePayload: any = null;
 let assessmentGenerationError: any = null;
 try {
 assessmentResponsePayload = await generateJobAssessment({
 jobId: jobRecordState.id,
 talentId: talentProfileRecord.id,
 jobApplicationId: applicationInsertPayload.id,
 });
 } catch (e) { assessmentGenerationError = e; }

 if (!assessmentGenerationError && assessmentResponsePayload?.assessmentId) {
 setGeneratedAssessmentId(assessmentResponsePayload.assessmentId);
 }
 }

 setSubmissionProgressValue(100);
 setIsApplicationSubmitted(true);
 toast.success("Application successfully compiled and indexed.");
 refreshBalance();
 } catch (fatalSubmissionPipelineException) {
 toast.error("Secure data pipeline transaction synchronization interrupted. Please re-verify parameters.");
 }
 {
 setIsSubmissionInFlight(false);
 submissionExecutionGuardRef.current = false;
 }
 }, [
 talentProfileRecord,
 jobRecordState,
 isCandidateBalanceSufficient,
 coverLetterInputStr,
 deductCredits,
 refreshBalance,
 ]);

 const handleReturnHistoryTrigger = React.useCallback(() => {
 navigateHook(-1);
 }, [navigateHook]);

 const handleNavigateToApplicationsIndex = React.useCallback(() => {
 navigateHook("/app/applications");
 }, [navigateHook]);

 const handleNavigateToAIAssessmentMatrix = React.useCallback(() => {
 if (generatedAssessmentId) {
 navigateHook(`/app/job-assessment/${generatedAssessmentId}`);
 }
 }, [generatedAssessmentId, navigateHook]);

 // =========================================================================
 // CONDITION RENDERING LAYOUT SKELETON HANDSHAKE CHECKPOINTS
 // =========================================================================
 if (isDataLayerLoading) {
 return (
 <div className="max-w-2xl mx-auto p-12 text-center select-none pointer-events-none block w-full">
 <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto mb-4 opacity-25 stroke-[2.5]" />
 <Skeleton className="h-64 w-full rounded-xl bg-muted/20 block shadow-none" />
 </div>
 );
 }

 if (isApplicationSubmitted) {
 return (
 <div className="max-w-2xl mx-auto px-4 py-16 text-left antialiased block transform-gpu w-full">
 <Card className="rounded-xl border border-border/60 bg-card shadow-none overflow-hidden block w-full">
 <CardContent className="p-8 text-center space-y-6 block w-full leading-none">
 <div className="w-16 h-16 bg-emerald-500/5 rounded-xl border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-600 stroke-[2] select-none pointer-events-none shadow-2xs">
 <CheckCircle className="h-7 w-7" />
 </div>

 <div className="space-y-1 block select-none pointer-events-none leading-none">
 <h2 className="text-base sm:text-lg font-bold uppercase tracking-wide text-foreground">
 Submission Pipeline Finalized
 </h2>
 <p className="font-mono text-sm font-medium text-muted-foreground/50 uppercase tracking-wider leading-none block pt-0.5">
 Application credentials for position block &quot;{jobRecordState?.title}&quot; are verified inside the
 registry logs.
 </p>
 </div>

 <div className="flex flex-col gap-2.5 max-w-sm mx-auto pt-4 leading-none w-full block">
 {generatedAssessmentId && (
 <Button
 type="button"
 size="lg"
 onClick={handleNavigateToAIAssessmentMatrix}
 className="w-full h-11 px-4 rounded-lg font-bold uppercase text-xs tracking-wider gap-2 shadow-xs transition-transform transform-gpu active:scale-[0.985] cursor-pointer block"
 >
 <Brain className="h-4 w-4 stroke-[2.2] shrink-0" />
 <span>Start AI interview</span>
 </Button>
 )}
 <Button
 type="button"
 variant="outline"
 size="lg"
 onClick={handleNavigateToApplicationsIndex}
 className="w-full h-11 px-4 rounded-lg font-bold uppercase text-xs tracking-wider border border-border/60 bg-background/50 hover:bg-accent cursor-pointer shadow-2xs block"
 >
 Inspect Applications Manifest Directory
 </Button>
 </div>
 </CardContent>
 </Card>
 </div>
 );
 }

 if (!jobRecordState) {
 return (
 <div
 role="alert"
 className="min-h-[40vh] grid place-items-center text-center p-6 antialiased select-none transform-gpu"
 >
 <div className="max-w-xs block space-y-4 leading-none">
 <div className="h-9 w-9 rounded-lg bg-muted/40 border border-border/40 flex items-center justify-center text-muted-foreground/50 mx-auto pointer-events-none">
 <Inbox className="h-4 w-4 stroke-[2.2]" />
 </div>
 <div className="space-y-1 block">
 <p className="text-xs font-bold text-foreground uppercase tracking-wide">Error</p>
 <p className="text-[11px] font-semibold text-muted-foreground/60 leading-normal">
 The targeting position operational parameters could not be gathered from tracking metadata blocks.
 </p>
 </div>
 </div>
 </div>
 );
 }

 return (
 <div className="max-w-3xl mx-auto px-4 py-6 space-y-6 text-left antialiased block transform-gpu w-full pb-48">
 {/* Top bar */}
 <header className="flex items-center justify-between select-none leading-none w-full shrink-0">
 <div className="flex items-center gap-3.5 min-w-0">
 <Button
 type="button"
 variant="ghost"
 size="icon"
 className="rounded-lg h-9 w-9 hover:bg-muted cursor-pointer shrink-0 border border-border/5"
 onClick={handleReturnHistoryTrigger}
 >
 <ArrowLeft className="h-4 w-4 stroke-[2.5]" />
 </Button>
 <div className="min-w-0 leading-none space-y-0.5">
 <h1 className="font-bold text-sm sm:text-base uppercase tracking-wide text-foreground truncate block pt-0.5">
 Transmission Submission Protocol
 </h1>
 <p className="font-mono text-[9px] font-bold text-muted-foreground/40 uppercase tracking-wider block leading-none">
 DEPLOYMENT: STANDARD EMPLOYMENT APPLICATION CONTAINER
 </p>
 </div>
 </div>

 <Badge
 variant="outline"
 className="font-mono text-[9px] font-extrabold uppercase px-2 h-5 tracking-wide rounded bg-primary/5 text-primary border-primary/20 shrink-0 pointer-events-none leading-none pt-0.5"
 >
 ACTIVE PROFILE CONNECTION NODE
 </Badge>
 </header>

 {/* Job summary */}
 <Card className="rounded-xl border border-border/60 bg-card/40 shadow-none overflow-hidden block w-full select-none pointer-events-none">
 <CardContent className="p-4 flex items-center gap-3.5 leading-none w-full block">
 <div className="w-12 h-12 rounded-lg bg-background border border-border/40 shadow-inner flex items-center justify-center shrink-0 overflow-hidden">
 {jobRecordState.company_logo_url ? (
 <img src={jobRecordState.company_logo_url} className="object-cover w-full h-full block" alt="" />
 ) : (
 <Building2 className="text-primary/60 w-5 h-5 stroke-[2.2]" />
 )}
 </div>
 <div className="space-y-1 block leading-none flex-1 min-w-0">
 <h2 className="font-bold text-sm sm:text-base uppercase tracking-wide text-foreground truncate block pt-0.5 select-text">
 {jobRecordState.title}
 </h2>
 <p className="font-mono text-sm font-medium text-muted-foreground/40 uppercase tracking-tight block truncate select-text">
 ORGANIZATION BLOCK INDEX: {jobRecordState.company_name}
 </p>
 </div>
 </CardContent>
 </Card>

 {/* CV upload */}
 <Card
 id="cv-upload-anchor-node"
 className={cn(
 "rounded-xl border shadow-none overflow-hidden block w-full transition-colors duration-200",
 !talentProfileRecord?.cvUrl ? "border-primary/40 bg-primary/[0.01]" : "border-border/60 bg-card/10",
 )}
 >
 <CardHeader className="border-b border-border/5 bg-muted/20 px-4 py-3 flex flex-row items-center justify-between w-full select-none shrink-0 leading-none">
 <CardTitle className="text-[10px] font-mono font-black uppercase tracking-wide flex items-center gap-2 text-foreground/80 leading-none m-0">
 <ShieldCheck className="w-4 h-4 text-primary stroke-[2.2]" />
 <span>Verified Candidate Resume Spec File (CV)</span>
 </CardTitle>
 {talentProfileRecord?.cvUrl && (
 <Badge
 variant="outline"
 className="bg-emerald-500/5 text-emerald-600 border-emerald-500/20 text-[8px] font-mono font-black uppercase tracking-wide px-1.5 h-4.5 rounded pt-0.5 leading-none shrink-0 pointer-events-none select-none"
 >
 VERIFIED Footprint LOGGED
 </Badge>
 )}
 </CardHeader>
 <CardContent className="p-4 block w-full leading-none">
 {talentProfileRecord?.cvUrl ? (
 <div className="flex items-center justify-between p-3.5 border border-dashed rounded-lg bg-background/50 border-border/60 hover:border-border-foreground/10 transition-colors w-full block shrink-0 leading-none">
 <div className="flex items-center gap-3 min-w-0 block leading-none">
 <div className="w-9 h-9 bg-primary/5 rounded border border-primary/10 flex items-center justify-center text-primary font-mono font-black text-[9px] select-none pointer-events-none shrink-0 pt-0.5 shadow-inner">
 PDF
 </div>
 <div className="space-y-0.5 block leading-none min-w-0">
 <span className="text-xs font-bold uppercase tracking-tight text-foreground truncate block select-text pt-0.5">
 Active_Resume_Dossier_Specs.pdf
 </span>
 <p className="font-mono text-[9px] font-bold text-muted-foreground/30 uppercase tracking-widest leading-none block select-none pointer-events-none">
 Cryptographically Signed Allocation Node
 </p>
 </div>
 </div>

 <Label
 htmlFor="cv-replace-upload-trigger"
 className="cursor-pointer font-mono text-[10px] font-black uppercase tracking-wider text-primary hover:underline select-none shrink-0 pl-4 block leading-none pt-0.5"
 >
 Replace
 </Label>
 <input
 id="cv-replace-upload-trigger"
 type="file"
 className="hidden"
 accept=".pdf,.doc,.docx"
 onChange={handleSecureCVStorageUploadSequence}
 disabled={isCVStorageUploading}
 />
 </div>
 ) : (
 <div className="flex flex-col items-center p-8 border border-dashed border-border/80 rounded-lg bg-muted/5 group hover:bg-primary/[0.01] transition-all text-center block w-full leading-none space-y-4">
 {isCVStorageUploading ? (
 <Loader2 className="animate-spin text-primary h-6 w-6 stroke-[2.5] shrink-0" />
 ) : (
 <UploadCloud className="text-muted-foreground/20 w-10 h-10 stroke-[1.8] shrink-0 select-none pointer-events-none transition-transform group-hover:scale-105" />
 )}
 <div className="space-y-0.5 block select-none pointer-events-none leading-none">
 <h3 className="text-xs sm:text-sm font-bold text-foreground uppercase tracking-wide block">
 Upload CV Target Artifact
 </h3>
 <p className="font-mono text-[9px] font-bold text-muted-foreground/40 uppercase tracking-wider block">
 Isolated Sandbox Payload Endpoint • Upper Constraint Threshold Boundary Limit: 5.0 MB
 </p>
 </div>

 <Label
 htmlFor="cv-fresh-upload-trigger"
 className="cursor-pointer bg-primary text-primary-foreground h-9 px-5 rounded-lg text-xs font-medium tracking-wider inline-flex items-center shadow-2xs hover:bg-primary/90 transition-transform transform-gpu active:scale-95 shrink-0"
 >
 <Zap className="mr-1.5 h-3.5 w-3.5 stroke-[2.5]" /> <span>Select Specification File</span>
 </Label>
 <input
 id="cv-fresh-upload-trigger"
 type="file"
 className="hidden"
 accept=".pdf,.doc,.docx"
 onChange={handleSecureCVStorageUploadSequence}
 disabled={isCVStorageUploading}
 />
 </div>
 )}
 </CardContent>
 </Card>

 {/* Cover letter */}
 <Card className="rounded-xl border border-border/60 bg-card/10 shadow-none overflow-hidden block w-full">
 <CardHeader className="bg-muted/20 px-4 py-3 border-b border-border/5 flex flex-row items-center justify-between w-full select-none shrink-0 leading-none">
 <CardTitle className="text-[10px] font-mono font-black uppercase tracking-wide flex items-center gap-2 text-foreground/80 leading-none m-0">
 <Sparkles className="w-4 h-4 text-primary stroke-[2.2]" />
 <span>Candidate Cover Letter Narrative Synthesis</span>
 </CardTitle>

 <Button
 type="button"
 variant="outline"
 size="sm"
 onClick={handleAICoverLetterSynthesisSequence}
 disabled={isAIComposerProcessing || !talentProfileRecord?.cvUrl}
 className="h-8 rounded-lg border border-border/60 font-mono text-[9px] font-extrabold uppercase tracking-wide gap-1.5 bg-background hover:bg-primary/5 cursor-pointer shadow-2xs pt-0.5 flex items-center shrink-0 disabled:opacity-50"
 >
 {isAIComposerProcessing ? (
 <Loader2 className="animate-spin h-3 w-3 stroke-[2.5]" />
 ) : (
 <Zap className="h-3.5 w-3.5 text-primary stroke-[2.2]" />
 )}
 <span>Generate via Neural Prompt AI</span>
 </Button>
 </CardHeader>
 <CardContent className="p-4 block w-full leading-none">
 <Textarea
 placeholder="Introduce your background skills history framework, motivation strings, and system alignment properties directly to the reviewing recruiter panel..."
 value={coverLetterInputStr}
 onChange={(e) => setCoverLetterInputStr(e.target.value)}
 disabled={isAIComposerProcessing}
 className="min-h-[200px] font-sans text-xs sm:text-sm font-medium leading-relaxed bg-background/50 border border-border/60 focus-visible:ring-1 focus-visible:ring-ring rounded-lg shadow-none p-3 resize-none"
 />
 </CardContent>
 </Card>

 {/* Sticky submit bar */}
 <div className="fixed bottom-0 left-0 right-0 p-4 sm:p-6 bg-background/95 border-t border-border/40 z-20 shadow-[0_-12px_40px_rgba(0,0,0,0.05)] select-none pb-[max(env(safe-area-inset-bottom),0.75rem)] animate-in fade-in duration-300">
 <div className="max-w-3xl mx-auto space-y-4 block w-full leading-none">
 <div className="flex justify-between items-end px-1 leading-none w-full block shrink-0 select-none pointer-events-none font-mono tracking-tight">
 <div className="leading-none space-y-1 block">
 <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/40 leading-none">
 Estimated Transaction Fee Charge
 </p>
 <p className="text-xs sm:text-sm font-black uppercase text-foreground tabular-nums">
 {computedApplicationCost.toLocaleString()} Network Credits
 </p>
 </div>
 <div className="text-right leading-none space-y-1 block">
 <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/40 leading-none">
 Active Profile Liquid Balance
 </p>
 <p
 className={cn(
 "text-xs sm:text-sm font-black uppercase tabular-nums",
 !isCandidateBalanceSufficient ? "text-destructive animate-pulse" : "text-primary",
 )}
 >
 {balance.toLocaleString()} Credits Available
 </p>
 </div>
 </div>

 {isSubmissionInFlight ? (
 <div className="p-4 bg-primary/5 rounded-xl border border-primary/20 shadow-inner space-y-2 block w-full leading-none shrink-0 select-none pointer-events-none">
 <div className="flex items-center justify-between gap-4 leading-none w-full block font-mono text-[10px] font-black uppercase tracking-wide text-primary">
 <div className="flex items-center gap-2 min-w-0">
 <Brain className="h-4 w-4 animate-pulse stroke-[2.2] text-primary" />
 <span className="truncate block pt-0.5">{submissionProgressMessage}</span>
 </div>
 <span className="tabular-nums">{submissionProgressValue}%</span>
 </div>
 <Progress value={submissionProgressValue} className="h-1.5 rounded-full w-full block shadow-none" />
 </div>
 ) : (
 <Button
 type="button"
 disabled={isCVStorageUploading}
 onClick={handleCommitJobApplicationSequence}
 className="w-full h-12 rounded-lg font-bold uppercase tracking-widest text-xs gap-1.5 cursor-pointer shadow-xs transform-gpu active:scale-[0.99] overflow-hidden relative group"
 >
 <span className="relative z-10 flex items-center justify-center gap-1.5">
 <span>
 {isCandidateBalanceSufficient ? "Confirm & Submit" : "Top up credits"}
 </span>
 <ArrowRight className="h-4 w-4 stroke-[2.5] transition-transform group-hover:translate-x-1 shrink-0" />
 </span>
 <div className="absolute inset-0 bg-linear-to-r from-primary via-blue-600 to-primary opacity-60 group-hover:opacity-100 transition-opacity" />
 </Button>
 )}
 </div>
 </div>

 <CreditPurchaseSheet
 isOpen={isPurchaseSheetOpen}
 onClose={() => setIsPurchaseSheetOpen(false)}
 currentBalance={balance}
 />
 </div>
 );
}
