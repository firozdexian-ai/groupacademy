import * as React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
 getCourseProjectById,
 getCourseProjectCourse,
 listCourseProjectSubtasks,
 submitCourseProject,
 updateCourseProjectSubtask,
 claimCourseProject,
} from "@/domains/learning/repo/learningRepo";
import { useTalent } from "@/hooks/useTalent";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
 ArrowLeft,
 BookOpen,
 Coins,
 Clock,
 CheckCircle2,
 Lock,
 Upload,
 ChevronDown,
 ChevronUp,
 Loader2,
 Send,
 ShieldAlert,
} from "lucide-react";
import { GigUploader, type UploadedFile } from "@/domains/gigs/components/talent/GigUploader";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { EmptyState } from "@/components/common/EmptyState";
import { PAGE_SHELL, PAGE_TITLE, SECTION_TITLE, META_TEXT, CARD } from "@/lib/uiTokens";

// =========================================================================
// DETERMINISTIC COMPONENT DATA TYPE CONTRACTS
// =========================================================================
interface CourseMetadata {
 id: string;
 title: string | null;
 description: string | null;
 cover_image_url: string | null;
}

interface CourseProject {
 id: string;
 course_id: string;
 status: string;
 claimed_by: string | null;
 deadline: string | null;
 total_credit_reward: number | null;
 progress_percent: number;
}

interface ProjectSubtask {
 id: string;
 project_id: string;
 title: string;
 kind: string;
 status: string;
 brief: string | null;
 expected_format: string | null;
 credit_reward: number;
 display_order: number;
 submitted_files: UploadedFile[] | unknown;
 submitted_notes: string | null;
 reviewer_notes: string | null;
}

interface ProjectCompositePayload {
 project: CourseProject;
 course: CourseMetadata | null;
 subtasks: ProjectSubtask[];
}

interface ClaimRpcResponse {
 success: boolean;
 error?: string;
}

interface CompetitionDetailProps {
 inlineSlug?: string;
 onBack?: () => void;
}

const SUBTASK_KIND_LABELS: Record<string, string> = {
 cover: "Cover Image Specs",
 intro_video: "Introductory Video",
 module_slides: "Module Lecture Slides",
 module_quiz: "Module Quiz Matrix",
 module_video: "Module Production Video",
 reading: "Reading Reference Core",
 caption: "Timed Subtitles / Captions",
 translation: "Localization Translation",
 exercise: "Applied Practice Exercise",
 flashcards: "Active Recall Flashcards",
 other: "Custom Specified Asset",
};

/**
 * GroUp Academy: Authoritative Gig Hub Course Project Panel (CourseProjectDetail)
 * Hardened assignment workbench securing subtask validation hooks and protecting credit rewards from main-thread thrash.
 * Version: Launch Candidate · Phase Z1 Production Contract Locked
 */
export default function CourseProjectDetail() {
 const { projectId: unverifiedProjectIdStr } = useParams<{ projectId: string }>();
 const navigateHook = useNavigate();
 const { talent: talentProfileRecord } = useTalent();
 const tanstackQueryClient = useQueryClient();

 const [activeExpandedSubtaskId, setActiveExpandedSubtaskId] = React.useState<string | null>(null);

 // =========================================================================
 // DATA ACQUISITION PIPELINE SECURED VIA TANSTACK CACHE CHANNEL
 // =========================================================================
 const { data: projectCompositeData, isLoading: isProjectCacheResolving } = useQuery({
 queryKey: ["app-course-project-composite-detail", unverifiedProjectIdStr],
 enabled: !!unverifiedProjectIdStr,
 queryFn: async (): Promise<ProjectCompositePayload> => {
 const { data: projectRow, error: projectQueryError } = await getCourseProjectById(
 unverifiedProjectIdStr!,
 );

 if (projectQueryError || !projectRow) throw projectQueryError || new Error("Project absent.");

 const [courseRow, subtaskRows] = await Promise.all([
 getCourseProjectCourse(projectRow.course_id),
 listCourseProjectSubtasks(unverifiedProjectIdStr!),
 ]);

 return {
 project: projectRow as unknown as CourseProject,
 course: courseRow as unknown as CourseMetadata | null,
 subtasks: (subtaskRows as unknown as ProjectSubtask[]) || [],
 };
 },
 });

 const isCandidateOwnerFlag =
 !!talentProfileRecord?.id && projectCompositeData?.project?.claimed_by === talentProfileRecord.id;
 const isProjectOpenToClaim = projectCompositeData?.project?.status === "open";
 const isProjectStatusLocked = projectCompositeData?.project
 ? !["open", "claimed", "in_progress"].includes(projectCompositeData.project.status)
 : true;

 // =========================================================================
 // ASYNC MUTATION INTERFACES: CLAIM AND TRANSACTION DISPATCH ACTIONS
 // =========================================================================
 const claimProjectMutation = useMutation({
 mutationFn: async () => {
 if (!unverifiedProjectIdStr) return;
 const rpcPayload = await claimCourseProject(unverifiedProjectIdStr);
 const castRpcResponse = rpcPayload as unknown as ClaimRpcResponse;
 if (!castRpcResponse?.success) throw new Error(castRpcResponse?.error || "Pipeline allocation failed.");
 },
 onSuccess: () => {
 toast.success("Project assigned safely. Deadline matrix fixed at 14 operational days.");
 tanstackQueryClient.invalidateQueries({
 queryKey: ["app-course-project-composite-detail", unverifiedProjectIdStr],
 });
 tanstackQueryClient.invalidateQueries({ queryKey: ["course-projects-grouped"] });
 },
 onError: (exceptionPayload: Error) => toast.error(exceptionPayload.message || "Failed to commit claim token."),
 });

 const submitEntireProjectMutation = useMutation({
 mutationFn: async () => {
 const { error: updateError } = await submitCourseProject(unverifiedProjectIdStr!);
 if (updateError) throw updateError;
 },
 onSuccess: () => {
 toast.success("Project structure deployed safely to reviewer validation queues.");
 tanstackQueryClient.invalidateQueries({
 queryKey: ["app-course-project-composite-detail", unverifiedProjectIdStr],
 });
 },
 onError: () => toast.error("Failed to commit global project verification payload."),
 });

 // =========================================================================
 // MEMOIZED PARAMETER SECTOR: AGGREGATE REWARD QUANTUM COMPILERS
 // =========================================================================
 const calculatedTotalRewardCreditsInt = React.useMemo<number>(() => {
 if (!projectCompositeData) return 0;
 if (projectCompositeData.project.total_credit_reward !== null) {
 return Number(projectCompositeData.project.total_credit_reward);
 }
 return projectCompositeData.subtasks.reduce((accumulatedSum, singleSubtask) => {
 return accumulatedSum + Number(singleSubtask.credit_reward || 0);
 }, 0);
 }, [projectCompositeData]);

 const checkAllSubtasksVerifiedDone = React.useMemo<boolean>(() => {
 if (!projectCompositeData?.subtasks || projectCompositeData.subtasks.length === 0) return false;
 return projectCompositeData.subtasks.every((subtaskNode) => ["approved", "in_review"].includes(subtaskNode.status));
 }, [projectCompositeData?.subtasks]);

 const handleToggleSubtaskExpansion = React.useCallback((targetSubtaskIdStr: string) => {
 setActiveExpandedSubtaskId((prevId) => (prevId === targetSubtaskIdStr ? null : targetSubtaskIdStr));
 }, []);

 const handleReturnToGigHubDirectory = React.useCallback(() => {
 navigateHook("/app/gigs");
 }, [navigateHook]);

 if (isProjectCacheResolving || !projectCompositeData) {
 return (
 <div className="max-w-3xl mx-auto px-4 py-6 space-y-3 block w-full select-none pointer-events-none animate-pulse">
 <Skeleton className="h-28 w-full rounded-lg block shadow-none border border-transparent" />
 <Skeleton className="h-16 w-full rounded-lg block" />
 <Skeleton className="h-16 w-full rounded-lg block" />
 </div>
 );
 }

 const {
 project: activeProjectNode,
 course: associatedCourseMetadata,
 subtasks: compiledSubtasksList,
 } = projectCompositeData;

 return (
 <div className="max-w-3xl mx-auto px-4 py-4 space-y-5 text-left antialiased block transform-gpu w-full pb-32">
 {/* HUD LEVEL 1: HUBS BACKWARD NAVIGATION HEADER LINK BAR */}
 <header className="block select-none leading-none w-full shrink-0">
 <button
 type="button"
 onClick={handleReturnToGigHubDirectory}
 className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground outline-none transition-colors duration-100"
 >
 <ArrowLeft className="h-3.5 w-3.5 stroke-[2.5]" /> <span>Return to Gig Hub Directory</span>
 </button>
 </header>

 {/* HUD LEVEL 2: COMPOSITE PROJECT METADATA CARD HERO PANELS */}
 <Card className="rounded-lg border border-primary/20 bg-linear-to-br from-primary/[0.01] to-transparent shadow-none overflow-hidden block w-full">
 <CardContent className="p-4 sm:p-5 space-y-4 block w-full leading-none">
 <div className="flex items-start gap-3.5 leading-none w-full block">
 {associatedCourseMetadata?.cover_image_url ? (
 <div className="h-12 w-12 rounded-lg bg-background border border-border/40 shadow-3xs shrink-0 overflow-hidden pointer-events-none select-none">
 <img
 src={associatedCourseMetadata.cover_image_url}
 alt=""
 className="object-cover w-full h-full block"
 />
 </div>
 ) : (
 <div className="h-12 w-12 rounded-lg bg-primary/5 border border-primary/10 flex items-center justify-center shrink-0 text-primary pointer-events-none select-none shadow-3xs">
 <BookOpen className="h-5 w-5 stroke-[2.2]" />
 </div>
 )}

 <div className="min-w-0 flex-1 leading-none space-y-1 block">
 <div className="select-none pointer-events-none leading-none block">
 <Badge
 variant="outline"
 className="font-mono text-[8px] font-black uppercase px-1.5 h-4.5 rounded-xs border-primary/20 bg-primary/5 text-primary tracking-wide pt-0 leading-none shrink-0"
 >
 Authoritative Course Production Project
 </Badge>
 </div>
 <h1 className="text-sm sm:text-base font-bold uppercase tracking-wide text-foreground truncate block pt-0.5 select-text">
 {associatedCourseMetadata?.title || "Untitled Production Blueprint Record"}
 </h1>
 {associatedCourseMetadata?.description && (
 <p className="text-[11px] sm:text-xs font-medium text-muted-foreground/70 leading-normal line-clamp-2 select-text block pr-2">
 {associatedCourseMetadata.description}
 </p>
 )}
 </div>
 </div>

 {/* Tabular Macro Performance Metrics Layout Grid */}
 <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/5 text-left block w-full shrink-0 select-none pointer-events-none tabular-nums">
 <StatRow
 icon={CheckCircle2}
 labelText="Volume Scope"
 valueText={`${compiledSubtasksList.length.toString()} Tasks`}
 />
 <StatRow
 icon={Coins}
 labelText="Net Payout Bounty"
 valueText={`${calculatedTotalRewardCreditsInt.toLocaleString()} Credits`}
 />
 <StatRow
 icon={Clock}
 labelText={activeProjectNode.deadline ? "Constraint Horizon" : "Ingress Pipeline Status"}
 valueText={
 activeProjectNode.deadline
 ? formatDistanceToNow(new Date(activeProjectNode.deadline), { addSuffix: true }).toUpperCase()
 : activeProjectNode.status.toUpperCase()
 }
 />
 </div>

 {activeProjectNode.status !== "open" && (
 <div className="space-y-1 block w-full pt-1 leading-none">
 <div className="flex justify-between items-center font-mono text-[9px] font-bold uppercase tracking-tight text-muted-foreground/50 leading-none select-none pointer-events-none w-full tabular-nums shrink-0">
 <span>Aggregated Validation Progress</span>
 <span className="text-foreground font-black font-mono">
 {activeProjectNode.progress_percent.toString()}%
 </span>
 </div>
 <Progress value={activeProjectNode.progress_percent} className="h-1.5 rounded-full block shadow-none" />
 </div>
 )}

 {/* HUD LEVEL 3: TRANSACTION PIPELINE ROUTER CONTROLLERS BUTTONS */}
 {isProjectOpenToClaim ? (
 <Button
 type="button"
 onClick={() => claimProjectMutation.mutate()}
 disabled={claimProjectMutation.isPending || !talentProfileRecord?.id}
 className="w-full h-10 rounded-lg font-bold uppercase text-xs tracking-wider gap-1.5 cursor-pointer shadow-xs transform-gpu active:scale-[0.985] block text-center mt-1"
 >
 {claimProjectMutation.isPending && (
 <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0 inline-block align-middle" />
 )}
 <span className="inline-block align-middle pt-0.5">Claim Production Blueprint Space</span>
 </Button>
 ) : isCandidateOwnerFlag && !["submitted", "approved", "paid"].includes(activeProjectNode.status) ? (
 <Button
 type="button"
 onClick={() => submitEntireProjectMutation.mutate()}
 disabled={!checkAllSubtasksVerifiedDone || submitEntireProjectMutation.isPending}
 className="w-full h-10 rounded-lg font-bold uppercase text-xs tracking-wider gap-1.5 cursor-pointer shadow-xs transform-gpu active:scale-[0.985] block text-center mt-1"
 >
 {submitEntireProjectMutation.isPending ? (
 <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0 inline-block align-middle" />
 ) : (
 <Send className="h-3.5 w-3.5 stroke-[2.2] inline-block shrink-0 align-middle" />
 )}
 <span className="inline-block align-middle pt-0.5">Authorize Entire Assignment Submission</span>
 </Button>
 ) : !isCandidateOwnerFlag && activeProjectNode.claimed_by ? (
 <div className="rounded-lg border border-amber-500/20 bg-amber-500/[0.01] p-3 font-mono text-[10px] font-black uppercase tracking-wide text-amber-700 flex items-center gap-2 select-none pointer-events-none leading-none block w-full mt-1 animate-pulse">
 <Lock className="h-4 w-4 stroke-[2.2] shrink-0" />
 <span>Project Target Mapped and Locked Under Alternative Identity Node</span>
 </div>
 ) : null}
 </CardContent>
 </Card>

 {/* HUD LEVEL 4: ITERATIVE SUB-COMPONENTS ROW CANVAS FOR SUBTASKS */}
 <section className="space-y-2 block w-full">
 <h2 className="text-xs font-mono font-extrabold uppercase tracking-wide text-muted-foreground/50 select-none block leading-none pb-2 border-b border-border/5 px-1">
 Detailed Subtask Operations Matrix
 </h2>

 {compiledSubtasksList.length === 0 ? (
 <div className="w-full block select-none pointer-events-none text-left">
 <EmptyState
 icon={ShieldAlert}
 title="Operational Subtasks Empty"
 description="Syllabus chapter demands and asset build parameter instructions are clear under this project coordinate."
 />
 </div>
 ) : (
 <div className="space-y-2.5 block w-full align-top">
 {compiledSubtasksList.map((subtaskNodeItem) => (
 <SubtaskRow
 key={`project-subtask-row-card-${subtaskNodeItem.id}`}
 subtask={subtaskNodeItem}
 isOwner={isCandidateOwnerFlag}
 isLocked={isProjectStatusLocked}
 expanded={activeExpandedSubtaskId === subtaskNodeItem.id}
 onToggle={() => handleToggleSubtaskExpansion(subtaskNodeItem.id)}
 onUpdated={() =>
 tanstackQueryClient.invalidateQueries({
 queryKey: ["app-course-project-composite-detail", unverifiedProjectIdStr],
 })
 }
 />
 ))}
 </div>
 )}
 </section>
 </div>
 );
}

// =========================================================================
// INTERMEDIATE LAYOUT HELPER STRUCTURE A: STAT CELL UNIT CARD
// =========================================================================
function StatRow({
 icon: Icon,
 labelText,
 valueText,
}: {
 icon: React.ComponentType<{ className?: string }>;
 labelText: string;
 valueText: string;
}) {
 return (
 <div className="flex flex-col items-start leading-none space-y-0.5 block flex-1 min-w-0">
 <div className="flex items-center gap-1 font-mono text-[9px] font-bold uppercase tracking-wide text-muted-foreground/40 leading-none">
 <Icon className="h-3.5 w-3.5 stroke-[2] shrink-0" /> <span>{labelText}</span>
 </div>
 <p className="text-xs font-bold text-foreground truncate block pt-0.5 leading-tight uppercase tracking-wide">
 {valueText}
 </p>
 </div>
 );
}

// =========================================================================
// INTERMEDIATE LAYOUT HELPER STRUCTURE B: DYNAMIC COLLAPSIBLE EXPANSION ROW
// =========================================================================
interface SubtaskRowProps {
 subtask: ProjectSubtask;
 isOwner: boolean;
 isLocked: boolean;
 expanded: boolean;
 onToggle: () => void;
 onUpdated: () => void;
}

function SubtaskRow({ subtask, isOwner, isLocked, expanded, onToggle, onUpdated }: SubtaskRowProps) {
 const [uploadedFilesCollection, setUploadedFilesCollection] = React.useState<UploadedFile[]>(() => {
 return Array.isArray(subtask.submitted_files) ? (subtask.submitted_files as UploadedFile[]) : [];
 });
 const [textReviewerNotesInput, setTextReviewerNotesInput] = React.useState<string>(subtask.submitted_notes || "");
 const [isDataMutationPending, setIsDataMutationPending] = React.useState<boolean>(false);

 const isRowContentEditable = isOwner && !isLocked && subtask.status !== "approved";

 const handleSaveSubtaskPayloadAction = async () => {
 setIsDataMutationPending(true);
 const isThreadMountedFlag = { current: true };

 try {
 const { error: updateHandshakeError } = await updateCourseProjectSubtask(subtask.id, {
 submitted_files: uploadedFilesCollection as any,
 submitted_notes: textReviewerNotesInput.trim() || null,
 submitted_at: uploadedFilesCollection.length ? new Date().toISOString() : null,
 status: uploadedFilesCollection.length ? "in_review" : "pending",
 });

 if (updateHandshakeError) throw updateHandshakeError;

 toast.success("Subtask progress variables successfully updated.");
 if (isThreadMountedFlag.current) onUpdated();
 } catch (mutationExceptionPayload: any) {
 toast.error(mutationExceptionPayload.message || "Failed to finalize subtask save operation.");
 } finally {
 if (isThreadMountedFlag.current) {
 setIsDataMutationPending(false);
 }
 isThreadMountedFlag.current = false;
 }
 };

 const compiledStatusColorPreset = React.useMemo<string>(() => {
 if (subtask.status === "approved") return "border-emerald-500/20 bg-emerald-500/[0.01] text-emerald-700";
 if (subtask.status === "in_review") return "border-blue-500/20 bg-blue-500/[0.01] text-blue-700";
 if (subtask.status === "rejected") return "border-rose-500/20 bg-rose-500/[0.01] text-rose-700";
 return "border-border/60 bg-background text-muted-foreground/60";
 }, [subtask.status]);

 return (
 <Card className="rounded-lg border border-border/60 bg-card/20 shadow-none overflow-hidden block w-full transform-gpu">
 <button
 type="button"
 onClick={onToggle}
 className="w-full p-3.5 flex items-center gap-3.5 hover:bg-muted/40 transition-colors text-left leading-none outline-none block cursor-pointer"
 >
 <div
 className={cn(
 "h-9 w-9 rounded border flex items-center justify-center shrink-0 shadow-3xs rounded-sm select-none pointer-events-none",
 compiledStatusColorPreset,
 )}
 >
 {subtask.status === "approved" ? (
 <CheckCircle2 className="h-4 w-4 stroke-[2.5]" />
 ) : (
 <Upload className="h-4 w-4 stroke-[2.2]" />
 )}
 </div>

 <div className="min-w-0 flex-1 space-y-1 block leading-none">
 <div className="flex items-center gap-1.5 flex-wrap select-none pointer-events-none leading-none">
 <Badge
 variant="outline"
 className="font-mono text-[8px] font-black uppercase px-1.5 h-4.5 rounded-xs border-border/40 bg-background tracking-wide pt-0 leading-none shrink-0"
 >
 {SUBTASK_KIND_LABELS[subtask.kind] || subtask.kind.toUpperCase()}
 </Badge>
 <Badge
 className={cn(
 "font-mono text-[8px] font-black uppercase px-1.5 h-4.5 rounded-xs tracking-wide pt-0 leading-none shrink-0 border rounded-xs shadow-3xs",
 compiledStatusColorPreset,
 )}
 >
 {subtask.status.replace("_", " ").toUpperCase()}
 </Badge>
 </div>
 <p className="text-xs sm:text-sm font-bold text-foreground truncate block pt-0.5 select-text">
 {subtask.title}
 </p>
 </div>

 <div className="flex items-center gap-3 shrink-0 select-none pointer-events-none font-mono tracking-tight text-xs h-5 leading-none">
 <span className="font-extrabold text-amber-600 flex items-center gap-0.5 tabular-nums">
 <Coins className="h-3.5 w-3.5 stroke-[2] shrink-0 text-amber-500" /> {subtask.credit_reward.toString()}
 </span>
 {expanded ? (
 <ChevronUp className="h-4 w-4 text-muted-foreground/40 stroke-[2.2]" />
 ) : (
 <ChevronDown className="h-4 w-4 text-muted-foreground/40 stroke-[2.2]" />
 )}
 </div>
 </button>

 {/* COMPACT INTERACTION ACCORDION VIEWPORT CONTAINER CORES */}
 {expanded && (
 <CardContent className="p-3.5 pt-0 space-y-3.5 border-t border-border/5 bg-muted/[0.01] block w-full leading-none animate-in fade-in duration-150">
 {subtask.brief && (
 <p className="text-xs text-muted-foreground/80 font-medium leading-relaxed block select-text pr-2 pt-2.5">
 {subtask.brief}
 </p>
 )}
 {subtask.expected_format && (
 <div className="font-mono text-sm font-medium text-muted-foreground/40 uppercase tracking-tight block select-none pointer-events-none leading-none pb-2 border-b border-border/5">
 <span>Target Standard Format Matrix Constraint: </span>
 <span className="text-foreground font-sans text-xs sm:text-sm font-semibold lowercase tracking-normal select-text pl-0.5">
 {subtask.expected_format}
 </span>
 </div>
 )}

 {isRowContentEditable ? (
 <div className="space-y-3 block w-full leading-none mt-1">
 <GigUploader
 value={uploadedFilesCollection}
 onChange={setUploadedFilesCollection}
 folder={`subtask/${subtask.id}`}
 maxFiles={5}
 />
 <Textarea
 placeholder="Declare structural contextual validation notes, implementation remarks, or framework links directly to your reviewer..."
 value={textReviewerNotesInput}
 onChange={(e) => setTextReviewerNotesInput(e.target.value)}
 className="bg-background border border-border/60 focus-visible:ring-1 focus-visible:ring-ring rounded-lg text-xs sm:text-sm font-sans leading-relaxed resize-none p-2.5"
 rows={2}
 />
 <Button
 type="button"
 onClick={handleSaveSubtaskPayloadAction}
 disabled={isDataMutationPending}
 className="w-full h-8.5 rounded-lg font-mono text-[10px] font-extrabold uppercase tracking-wider cursor-pointer shadow-2xs transform-gpu active:scale-[0.99] block text-center"
 >
 {isDataMutationPending ? (
 <Loader2 className="h-3.5 w-3.5 animate-spin mx-auto block shrink-0" />
 ) : (
 <span>Commit Subtask Workspace Modifications</span>
 )}
 </Button>
 </div>
 ) : uploadedFilesCollection.length > 0 ? (
 <div className="space-y-2 block w-full pt-1 leading-none border-b border-border/5 pb-2.5">
 <p className="font-mono text-[9px] font-bold text-muted-foreground/40 uppercase tracking-wide select-none pointer-events-none block leading-none">
 Committed File Attachments Manifest
 </p>
 <ul className="text-xs font-semibold font-mono text-primary leading-none space-y-1.5 block select-text">
 {uploadedFilesCollection.map((fileItem) => (
 <li key={`subtask-file-node-${fileItem.path}`} className="truncate block flex items-center gap-1.5">
 <span>📎</span> <span>{fileItem.name}</span>
 </li>
 ))}
 </ul>
 </div>
 ) : (
 <p className="text-[11px] font-medium text-muted-foreground/40 italic select-none pointer-events-none block py-1">
 {isOwner
 ? "This production workspace container must be actively claimed and unlocked to upload credentials targets."
 : "Claim this course construction blueprint to activate work on this subtask parameter."}
 </p>
 )}

 {subtask.reviewer_notes && (
 <div className="rounded-lg border border-border/60 bg-muted/40 p-3 block w-full leading-none select-text mt-1">
 <p className="font-mono text-[9px] font-bold uppercase text-muted-foreground/40 tracking-wide block mb-1 select-none pointer-events-none leading-none">
 Reviewer Evaluation Feedback Notes
 </p>
 <p className="text-xs text-foreground/80 font-medium leading-relaxed tracking-normal">
 {subtask.reviewer_notes}
 </p>
 </div>
 )}
 </CardContent>
 )}
 </Card>
 );
}
