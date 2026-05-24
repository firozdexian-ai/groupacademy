import * as React from "react";
import { Link, useParams } from "react-router-dom";
import { ChevronLeft, Loader2, Send, Inbox, ShieldAlert, Paperclip, CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useSubmission, useSubmitReview } from "@/hooks/useDiscussions";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// =========================================================================
// DETERMINISTIC COMPONENT DATA TYPE CONTRACTS
// =========================================================================
interface RubricCriterion {
 key: string;
 label: string;
}

interface FileAttachment {
 name?: string;
 url: string;
}

interface SubmissionBodySchema {
 summary?: string;
}

interface SubmissionRecord {
 id: string;
 author_id: string;
 title: string | null;
 kind: string;
 status: string;
 score: number | null;
 body: SubmissionBodySchema | unknown;
 files: FileAttachment[] | unknown;
}

interface AssignmentRelation {
 id: string;
 reviewer_id: string;
 status: string;
}

interface PeerReview {
 id: string;
 reviewer_id: string;
 is_instructor: boolean;
 score: number | null;
 comments: string | null;
}

interface SubmissionDataResponse {
 submission: SubmissionRecord | null;
 assignments: AssignmentRelation[];
 reviews: PeerReview[];
}

interface RubricScoreItem {
 key: string;
 label: string;
 score: number;
}

const DEFAULT_RUBRIC: RubricCriterion[] = [
 { key: "clarity", label: "Clarity & Structure" },
 { key: "completeness", label: "Completeness" },
 { key: "originality", label: "Originality" },
 { key: "execution", label: "Execution / Polish" },
];

const SCORING_RANGE_INDEX = [1, 2, 3, 4, 5];

/**
 * GroUp Academy: Technical Peer-Review Evaluation Workspace (AppSubmissionDetail)
 * Hardened rubric evaluation terminal locking inline score arithmetic and isolating collection mapping records from DOM drift.
 * Version: Launch Candidate · Phase Z1 Transaction Matrix Sealed
 */
export default function AppSubmissionDetail() {
 const { submissionId: unverifiedSubmissionIdStr } = useParams<{ submissionId: string }>();
 const { user: userAuthRecord } = useAuth();
 const { toast } = useToast();

 const { data: submissionResponsePayload, isLoading: isSubmissionCacheResolving } =
 useSubmission(unverifiedSubmissionIdStr);
 const submitReviewMutation = useSubmitReview();

 const [scoresFormState, setScoresFormState] = React.useState<Record<string, number>>({});
 const [commentsInputStr, setCommentsInputStr] = React.useState<string>("");

 // Cleanly cast response arrays via structural database schemas
 const resolvedResponseData = submissionResponsePayload as unknown as SubmissionDataResponse | undefined;

 // =========================================================================
 // MEMOIZED PARAMETER SECTOR: ROLE EVALUATION & MATH OVERHEAD SHIELDS
 // =========================================================================
 const isReviewerAssignedFlag = React.useMemo<boolean>(() => {
 if (!resolvedResponseData?.assignments || !userAuthRecord?.id) return false;
 return resolvedResponseData.assignments.some(
 (assignmentItem) => assignmentItem.reviewer_id === userAuthRecord.id && assignmentItem.status === "pending",
 );
 }, [resolvedResponseData, userAuthRecord?.id]);

 const hasAlreadyReviewedFlag = React.useMemo<boolean>(() => {
 if (!resolvedResponseData?.reviews || !userAuthRecord?.id) return false;
 return resolvedResponseData.reviews.some((reviewItem) => reviewItem.reviewer_id === userAuthRecord.id);
 }, [resolvedResponseData, userAuthRecord?.id]);

 const calculatedAverageRubricScoreNum = React.useMemo<number>(() => {
 const identifiedScoresArray = Object.values(scoresFormState);
 if (identifiedScoresArray.length === 0) return 0;
 const scoresSummation = identifiedScoresArray.reduce((accTotal, singleScore) => accTotal + singleScore, 0);
 return scoresSummation / identifiedScoresArray.length;
 }, [scoresFormState]);

 const handleScoreSelectionAction = React.useCallback((criterionKey: string, numericScore: number) => {
 setScoresFormState((prevMap) => ({ ...prevMap, [criterionKey]: numericScore }));
 }, []);

 // =========================================================================
 // WRITING LANE CONSOLE: HARDENED PEER MUTATION DISPATCH TIMELINE
 // =========================================================================
 const handleCommitReviewSubmission = React.useCallback(async () => {
 if (!unverifiedSubmissionIdStr) return;

 const selectedScoresLengthInt = Object.keys(scoresFormState).length;
 if (selectedScoresLengthInt < DEFAULT_RUBRIC.length) {
 toast({
 title: "Incomplete Rubric",
 description:
 "All framework validation parameters inside the standard rubric require an active index allocation.",
 variant: "destructive",
 });
 return;
 }

 const compiledRubricScoresPayload: RubricScoreItem[] = DEFAULT_RUBRIC.map((criterionNode) => ({
 key: criterionNode.key,
 label: criterionNode.label,
 score: scoresFormState[criterionNode.key],
 }));

 try {
 await submitReviewMutation.mutateAsync({
 submission_id: unverifiedSubmissionIdStr,
 rubric: compiledRubricScoresPayload,
 score: calculatedAverageRubricScoreNum,
 comments: commentsInputStr.trim(),
 });

 toast({
 title: "Review Successfully Logged",
 description: "Audit verification records appended to the tracking registry layer.",
 });
 } catch (mutationExceptionPayload: any) {
 toast({
 title: "Transaction Refused",
 description: mutationExceptionPayload.message || "Failed to finalize evaluation data block settings.",
 variant: "destructive",
 });
 }
 }, [
 scoresFormState,
 unverifiedSubmissionIdStr,
 calculatedAverageRubricScoreNum,
 commentsInputStr,
 submitReviewMutation,
 toast,
 ]);

 if (isSubmissionCacheResolving) {
 return (
 <div
 role="status"
 className="min-h-[50vh] w-full grid place-items-center font-mono text-[10px] sm:text-xs font-bold uppercase tracking-widest text-muted-foreground/40 select-none antialiased"
 >
 <div className="flex items-center gap-2.5">
 <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
 <span>Synchronizing Submission Dossier...</span>
 </div>
 </div>
 );
 }

 if (!resolvedResponseData?.submission) {
 return (
 <div
 role="alert"
 className="min-h-[50vh] grid place-items-center text-center p-6 antialiased select-none transform-gpu"
 >
 <div className="max-w-xs block space-y-4 leading-none">
 <div className="h-9 w-9 rounded-lg bg-muted/40 border border-border/40 flex items-center justify-center text-muted-foreground/50 mx-auto pointer-events-none">
 <ShieldAlert className="h-4 w-4 stroke-[2.2]" />
 </div>
 <div className="space-y-1 block leading-none">
 <p className="text-xs font-bold text-foreground uppercase tracking-wide">Submission Missing</p>
 <p className="text-[11px] font-semibold text-muted-foreground/60 leading-normal mt-1">
 The targeted curriculum assignment response could not be verified inside active sandbox lines.
 </p>
 </div>
 <Button
 type="button"
 asChild
 variant="outline"
 className="h-8 rounded-lg font-mono text-xs font-medium tracking-wider px-3 shadow-2xs"
 >
 <Link to="/app/review-queue">Return to Vetting Queue</Link>
 </Button>
 </div>
 </div>
 );
 }

 const assignmentSubmissionItem = resolvedResponseData.submission;
 const historicReviewsCollection = resolvedResponseData.reviews || [];

 const isCurrentUserAuthorFlag = assignmentSubmissionItem.author_id === userAuthRecord?.id;
 const parsedBodyObject = assignmentSubmissionItem.body as SubmissionBodySchema | null;
 const parsedFilesCollection = assignmentSubmissionItem.files as FileAttachment[] | null;

 return (
 <div className="max-w-2xl mx-auto px-4 py-4 pb-32 text-left antialiased block transform-gpu w-full">
 {/* HUD LEVEL 1: APPLICATION DIR RUNWAY HUD ROUTER CONSOLE */}
 <header className="block w-full select-none pb-2 border-b border-border/10">
 <Link
 to="/app/review-queue"
 className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors leading-none"
 >
 <ChevronLeft className="h-3 w-3 stroke-[2.5]" /> <span>Return to Evaluation Queue</span>
 </Link>

 <h1 className="text-base sm:text-lg md:text-xl font-bold uppercase tracking-wide text-foreground leading-tight mt-3 block select-text">
 {assignmentSubmissionItem.title ?? "Assignment Submission Record"}
 </h1>

 <div className="flex gap-1.5 items-center flex-wrap leading-none select-none pointer-events-none pt-1.5 w-full block">
 <Badge
 variant="outline"
 className="font-mono text-[8px] font-black uppercase px-1.5 h-4.5 rounded-xs bg-background border-border/40 tracking-wide pt-0.5 leading-none shrink-0"
 >
 {assignmentSubmissionItem.kind.replace(/_/g, " ").toUpperCase()}
 </Badge>
 <Badge
 variant="secondary"
 className="font-mono text-[8px] font-black uppercase px-1.5 h-4.5 rounded-xs text-muted-foreground border border-border/5 tracking-wide pt-0.5 leading-none shrink-0"
 >
 {assignmentSubmissionItem.status.toUpperCase()}
 </Badge>
 {assignmentSubmissionItem.score !== null && (
 <Badge className="font-mono text-[8px] font-black uppercase px-1.5 h-4.5 rounded-xs border border-transparent bg-emerald-500 text-white tracking-wide pt-0.5 leading-none shrink-0 tabular-nums">
 AVG RATIO: {Number(assignmentSubmissionItem.score).toFixed(1)}
 </Badge>
 )}
 </div>
 </header>

 {/* HUD LEVEL 2: DETAILED ABSTRACT SUBMISSION RECORD DESCRIPTION BODY CARD */}
 <main className="mt-4 space-y-4 block w-full">
 <Card className="rounded-lg border border-border/60 bg-card/40 shadow-none overflow-hidden block w-full">
 <CardContent className="p-3.5 space-y-3 block w-full leading-none">
 {parsedBodyObject?.summary ? (
 <p className="text-xs sm:text-sm text-foreground/90 font-medium leading-relaxed block select-text whitespace-pre-wrap tracking-normal">
 {parsedBodyObject.summary}
 </p>
 ) : (
 <p className="text-xs text-muted-foreground/40 font-semibold italic block select-none pointer-events-none py-1">
 No supplementary summary context provided by applicant node.
 </p>
 )}

 {Array.isArray(parsedFilesCollection) && parsedFilesCollection.length > 0 && (
 <div className="space-y-1.5 block w-full border-t border-border/5 pt-3 leading-none shrink-0">
 {parsedFilesCollection.map((attachmentItem, attachmentIdx) => (
 <a
 key={`submission-file-link-endpoint-${attachmentIdx}`}
 href={attachmentItem.url}
 target="_blank"
 rel="noopener noreferrer"
 className="text-xs font-mono font-bold text-primary hover:underline inline-flex items-center gap-1.5 max-w-md truncate h-5 block leading-none"
 >
 <Paperclip className="h-3.5 w-3.5 stroke-[2.2] text-muted-foreground/50 shrink-0" />
 <span>{attachmentItem.name ?? "Transmitted Document Attachment File Link"}</span>
 </a>
 ))}
 </div>
 )}
 </CardContent>
 </Card>

 {/* HUD LEVEL 3: HISTORIC VERIFIED RECRUITER AND PEER REVIEWS LOG PANEL STREAM */}
 {(isCurrentUserAuthorFlag ||
 assignmentSubmissionItem.status === "reviewed" ||
 assignmentSubmissionItem.status === "approved") &&
 historicReviewsCollection.length > 0 && (
 <section className="space-y-2 block w-full">
 <h2 className="text-xs font-mono font-extrabold uppercase tracking-wide text-muted-foreground/50 select-none block leading-none pb-2 border-b border-border/5">
 Reconciled Evaluation Appraisals ({historicReviewsCollection.length.toString()})
 </h2>
 <div className="space-y-2 block w-full mt-2.5">
 {historicReviewsCollection.map((reviewRecordItem) => (
 <Card
 key={`historic-review-card-log-${reviewRecordItem.id}`}
 className="rounded-lg border border-border/60 bg-card/20 shadow-none overflow-hidden block w-full"
 >
 <CardContent className="p-3.5 space-y-2 block w-full leading-none">
 <div className="flex items-center justify-between gap-4 leading-none w-full shrink-0 select-none pointer-events-none">
 <span className="font-mono text-[9px] font-black uppercase tracking-wide text-muted-foreground/60">
 {reviewRecordItem.is_instructor ? "Authoritative Instructor Module" : "Peer Auditor Node"}
 </span>
 {reviewRecordItem.score !== null && (
 <Badge
 variant="outline"
 className="font-mono text-[8px] font-black uppercase px-1.5 h-4 h-4.5 rounded-xs border-border/40 bg-background text-foreground tracking-wide tabular-nums pt-0.5 leading-none"
 >
 SCORE: {Number(reviewRecordItem.score).toFixed(1)} / 5.0
 </Badge>
 )}
 </div>
 {reviewRecordItem.comments && (
 <p className="text-xs text-muted-foreground/80 font-medium leading-relaxed block select-text whitespace-pre-wrap tracking-normal pt-1">
 {reviewRecordItem.comments}
 </p>
 )}
 </CardContent>
 </Card>
 ))}
 </div>
 </section>
 )}

 {/* HUD LEVEL 4: SYSTEM ASSIGNED INTERACTIVE RUBRIC SCORING TERMINAL SLOT */}
 {isReviewerAssignedFlag && !hasAlreadyReviewedFlag && (
 <section className="space-y-2 block w-full pt-2">
 <h2 className="text-xs font-mono font-extrabold uppercase tracking-wide text-primary select-none block leading-none pb-2 border-b border-border/5">
 Submit Rubric Evaluation Settings
 </h2>

 <Card className="rounded-lg border border-primary/20 bg-primary/[0.01] shadow-none overflow-hidden block w-full">
 <CardContent className="p-4 space-y-4 block w-full leading-none">
 {/* Iterative Selection Tracks Matrix */}
 <div className="space-y-2.5 block w-full select-none">
 {DEFAULT_RUBRIC.map((criterionItem) => {
 const currentSelectedScoreValue = scoresFormState[criterionItem.key];

 return (
 <div
 key={`rubric-evaluation-row-item-${criterionItem.key}`}
 className="flex items-center justify-between gap-4 border-b border-border/5 pb-2 last:border-b-0 last:pb-0 h-8 block leading-none w-full"
 >
 <span className="text-xs font-bold text-foreground/80 pt-0.5">{criterionItem.label}</span>
 <div className="flex gap-1 shrink-0 items-center block h-7">
 {SCORING_RANGE_INDEX.map((scoreDigitInt) => {
 const isDigitActiveFlag = currentSelectedScoreValue === scoreDigitInt;

 return (
 <button
 key={`score-cell-digit-trigger-${criterionItem.key}-${scoreDigitInt}`}
 type="button"
 onClick={() => handleScoreSelectionAction(criterionItem.key, scoreDigitInt)}
 className={cn(
 "h-7 w-7 rounded font-mono text-xs font-bold tracking-tight border cursor-pointer transition-all outline-none block text-center pt-0.5 shadow-3xs",
 isDigitActiveFlag
 ? "bg-primary border-primary text-primary-foreground font-black scale-105"
 : "bg-background border-border/60 text-muted-foreground/60 hover:bg-accent",
 )}
 >
 {scoreDigitInt.toString()}
 </button>
 );
 })}
 </div>
 </div>
 );
 })}
 </div>

 <div className="space-y-1 block leading-none pt-2 border-t border-border/5">
 <Textarea
 disabled={submitReviewMutation.isPending}
 rows={3}
 placeholder="Provide explicit feedback narratives, structural suggestions, and code corrections directly to the applicant node..."
 value={commentsInputStr}
 onChange={(e) => setCommentsInputStr(e.target.value)}
 className="bg-background/50 border border-border/60 focus-visible:ring-1 focus-visible:ring-ring rounded-lg shadow-none text-xs sm:text-sm font-sans leading-relaxed resize-none p-3"
 />
 </div>

 {/* LOWER FORM CONTROLS CORE */}
 <div className="flex items-center justify-between gap-4 pt-1 select-none w-full shrink-0 leading-none">
 <span className="font-mono text-[10px] font-black text-muted-foreground/40 uppercase tracking-tight tabular-nums">
 Running Average Compound Fit:{" "}
 <span className="text-foreground font-mono font-black select-text">
 {calculatedAverageRubricScoreNum.toFixed(1)} / 5.0
 </span>
 </span>

 <Button
 type="button"
 size="sm"
 onClick={handleCommitReviewSubmission}
 disabled={
 submitReviewMutation.isPending || Object.keys(scoresFormState).length < DEFAULT_RUBRIC.length
 }
 className="h-8.5 rounded-lg font-mono text-[10px] font-extrabold uppercase tracking-wider gap-1.5 cursor-pointer shadow-xs transform-gpu active:scale-[0.985] disabled:opacity-50"
 >
 {submitReviewMutation.isPending ? (
 <Loader2 className="h-3.5 w-3.5 animate-spin" />
 ) : (
 <CheckCircle className="h-3.5 w-3.5 stroke-[2.2]" />
 )}
 <span>Publish Audit Report</span>
 </Button>
 </div>
 </CardContent>
 </Card>
 </section>
 )}
 </main>
 </div>
 );
}
