import * as React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
 getCompetitionBySlug,
 getMyCompetitionSubmission,
 upsertCompetitionSubmission,
} from "@/domains/ugc/repo/ugcRepo";
import { useTalent } from "@/contexts/TalentContext";
import {
 Trophy,
 Calendar,
 Users,
 ArrowLeft,
 Clock,
 Gift,
 CheckCircle,
 Upload,
 ExternalLink,
 Zap,
 Target,
 ShieldCheck,
 Loader2
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { format, differenceInDays } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/common/EmptyState";
import { PAGE_SHELL, PAGE_TITLE, SECTION_TITLE, META_TEXT, CARD } from "@/lib/uiTokens";

// =========================================================================
// DETERMINISTIC COMPONENT DATA TYPE CONTRACTS
// =========================================================================
interface PrizeConfigItem {
 name?: string;
 description?: string;
}

interface CompetitionRecord {
 id: string;
 title: string;
 slug: string;
 description: string | null;
 rules: string | null;
 featured_image: string | null;
 is_featured: boolean | null;
 status: string;
 start_date: string;
 end_date: string;
 submission_deadline: string;
 max_participants: number | null;
 prizes: string[] | PrizeConfigItem[] | unknown;
}

interface CompetitionSubmission {
 id: string;
 competition_id: string;
 talent_id: string;
 submission_url: string;
 description: string | null;
 status: string;
 feedback: string | null;
 created_at: string;
}

interface StatusConfigItem {
 label: string;
 color: string;
 icon: React.ComponentType<{ className?: string }>;
}

const STATUS_PRESETS_DIRECTORY: Record<string, StatusConfigItem> = {
 upcoming: { label: "Upcoming Run", color: "bg-blue-500/5 text-blue-600 border-blue-500/10", icon: Calendar },
 active: { label: "Live now", color: "bg-emerald-500/5 text-emerald-600 border-emerald-500/10", icon: Zap },
 judging: { label: "Evaluation Underway", color: "bg-amber-500/5 text-amber-600 border-amber-500/10", icon: Target },
 completed: { label: "Completed Manifest", color: "bg-muted text-muted-foreground border-border/40", icon: CheckCircle },
 cancelled: { label: "Terminated Operation", color: "bg-destructive/5 text-destructive border-destructive/10", icon: ShieldCheck },
};

interface CompetitionDetailProps {
 inlineSlug?: string;
 onBack?: () => void;
}

/**
 * GroUp Academy: Authoritative Arena Challenge Dashboard (CompetitionDetail)
 * Hardened responsive environment processing portfolio entry updates and locking temporal interval calculations defensively.
 * Version: Launch Candidate · Phase Z1 Integration Stability Locked
 */
export default function CompetitionDetail({ inlineSlug, onBack }: CompetitionDetailProps) {
 const { slug: urlSlugStr } = useParams<{ slug: string }>();
 const navigateHook = useNavigate();
 const queryClient = useQueryClient();
 const { talent: talentProfileRecord } = useTalent();

 const activeChallengeSlug = inlineSlug || urlSlugStr;

 const [textSubmissionUrlInput, setTextSubmissionUrlInput] = React.useState<string>("");
 const [textDescriptionInput, setTextDescriptionInput] = React.useState<string>("");
 const [isSubmitSheetOpen, setIsSubmitSheetOpen] = React.useState<boolean>(false);

 const handleReturnToDirectoryTrigger = React.useCallback(() => {
 if (onBack) {
 onBack();
 } else {
 navigateHook("/app/learning/competitions");
 }
 }, [onBack, navigateHook]);

 // =========================================================================
 // DATA ACQUISITION PIPELINE SECURED VIA TANSTACK CACHE CHANNEL
 // =========================================================================
 const { data: competitionChallengeQueryPayload, isLoading: isChallengeCacheResolving } = useQuery({
 queryKey: ["app-competition-specification-detail", activeChallengeSlug],
 queryFn: async (): Promise<CompetitionRecord> => {
 const row = await getCompetitionBySlug(activeChallengeSlug!);
 return row as unknown as CompetitionRecord;
 },
 enabled: !!activeChallengeSlug,
 staleTime: 4 * 60 * 1000,
 });

 const activeChallengeItem = competitionChallengeQueryPayload;

 const { data: candidateSubmissionPayload } = useQuery({
 queryKey: ["my-competition-submission-node", activeChallengeItem?.id, talentProfileRecord?.id],
 queryFn: async (): Promise<CompetitionSubmission | null> => {
 if (!activeChallengeItem?.id || !talentProfileRecord?.id) return null;
 const row = await getMyCompetitionSubmission({
 competitionId: activeChallengeItem.id,
 talentId: talentProfileRecord.id,
 });
 return row as unknown as CompetitionSubmission | null;
 },
 enabled: !!activeChallengeItem?.id && !!talentProfileRecord?.id,
 });

 // =========================================================================
 // TRANSACTION MUTATION LANE: ENTRY SUBMISSION DISPATCH CORE
 // =========================================================================
 const executeSubmitMutationTrigger = useMutation({
 mutationFn: async () => {
 if (!activeChallengeItem || !talentProfileRecord) {
 throw new Error("Authorization signature expired. Authenticate container profile.");
 }
 const { error: mutationRpcHandshakeError } = await upsertCompetitionSubmission({
 competition_id: activeChallengeItem.id,
 talent_id: talentProfileRecord.id,
 submission_url: textSubmissionUrlInput.trim(),
 description: textDescriptionInput.trim() || null,
 status: "submitted",
 });
 if (mutationRpcHandshakeError) throw mutationRpcHandshakeError;
 },
 onSuccess: () => {
 toast.success("Operational challenge entry portfolio successfully locked.");
 setIsSubmitSheetOpen(false);
 setTextSubmissionUrlInput("");
 setTextDescriptionInput("");
 queryClient.invalidateQueries({ queryKey: ["my-competition-submission-node"] });
 },
 onError: (mutationRejectionPayload: Error) => {
 toast.error(mutationRejectionPayload.message || "Failed to finalize project entry transmission parameters.");
 },
 });

 // =========================================================================
 // MEMOIZED PARAMETER SECTOR: SECURE TIMELINE RANGE EVALUATION OVERHEADS
 // =========================================================================
 const calculatedChronoMetrics = React.useMemo(() => {
 if (!activeChallengeItem) return { deadlinePassed: true, daysLeft: null, dateRangeLabel: "", deadlineLabel: "" };
 
 const onsetDate = new Date(activeChallengeItem.start_date);
 const ceilingDate = new Date(activeChallengeItem.end_date);
 const targetDeadlineDate = new Date(activeChallengeItem.submission_deadline);
 const currentSystemDate = new Date();

 const rangeStr = `${format(onsetDate, "MMM d")} – ${format(ceilingDate, "MMM d")}`;
 const deadlineStr = format(targetDeadlineDate, "MMM d");
 const deltaDays = differenceInDays(targetDeadlineDate, currentSystemDate);

 return {
 daysLeft: deltaDays,
 dateRangeLabel: rangeStr,
 deadlineLabel: deadlineStr,
 };
 }, [activeChallengeItem]);

 const resolvedPrizesListArray = React.useMemo<string[]>(() => {
 if (!activeChallengeItem?.prizes || !Array.isArray(activeChallengeItem.prizes)) return [];
 return activeChallengeItem.prizes.map((prizeNodeItem: unknown) => {
 if (typeof prizeNodeItem === "string") return prizeNodeItem;
 const castPrize = prizeNodeItem as PrizeConfigItem;
 return castPrize?.name || castPrize?.description || "Sponsor prize";
 });
 }, [activeChallengeItem?.prizes]);

 if (isChallengeCacheResolving) {
 return (
 <div className={cn(PAGE_SHELL, "space-y-4 text-left antialiased block transform-gpu w-full select-none pointer-events-none")}>
 <Skeleton className="h-8 w-32 rounded-lg block" />
 <Skeleton className="h-44 w-full rounded-xl bg-card/10 block shadow-none border border-transparent" />
 <div className="space-y-2 block w-full">
 <Skeleton className="h-4 w-full rounded-xs block" />
 <Skeleton className="h-4 w-2/3 rounded-xs block" />
 </div>
 </div>
 );
 }

 if (!activeChallengeItem) {
 return (
 <div className={cn(PAGE_SHELL, "w-full text-left block antialiased")}>
 <EmptyState
 icon={Target}
 title="Competition not found"
 description="We couldn't load this competition. It may have ended or been removed."
 action={{ label: "Back to competitions", onClick: handleReturnToDirectoryTrigger }}
 />
 </div>
 );
 }

 const resolvedStatusPreset = STATUS_PRESETS_DIRECTORY[activeChallengeItem.status] || STATUS_PRESETS_DIRECTORY.upcoming;
 const isChallengeActiveToSubmit = activeChallengeItem.status === "active" && talentProfileRecord && !candidateSubmissionPayload;

 return (
 <div className={cn(PAGE_SHELL, "text-left antialiased block transform-gpu w-full space-y-4 pb-32")}>
 
 {/* HUD LEVEL 1: APPLICATION HEADER NAVIGATION ACTIONS BAR */}
 <header className="flex items-center gap-2 select-none leading-none w-full shrink-0">
 <Button 
 type="button"
 variant="ghost" 
 size="icon" 
 className="h-8 w-8 rounded-lg cursor-pointer transition-transform active:scale-95 shrink-0 border border-border/5" 
 onClick={handleReturnToDirectoryTrigger}
 >
 <ArrowLeft className="h-4 w-4 stroke-[2.5]" />
 </Button>
 <span className={cn(META_TEXT, "font-mono font-bold uppercase tracking-wider select-none pointer-events-none pt-0.5 text-muted-foreground/50")}>
 Return
 </span>
 </header>

 {/* HUD LEVEL 2: DETAILED CHALLENGE MEDIA CANVAS MATRICES */}
 {activeChallengeItem.featured_image && (
 <div className="aspect-[16/9] relative rounded-xl overflow-hidden bg-muted border border-border/40 w-full block select-none shadow-2xs shrink-0 pointer-events-none">
 <img src={activeChallengeItem.featured_image} alt="" className="w-full h-full object-cover block" />
 </div>
 )}

 {/* HUD LEVEL 3: SYLLABUS DIRECTORY DATA OVERVIEW BLOCK */}
 <div className="space-y-1 block w-full leading-none">
 <div className="flex items-center gap-2 flex-wrap select-none pointer-events-none leading-none">
 <Badge 
 variant="outline" 
 className={cn("font-mono text-[8px] font-black uppercase px-1.5 h-4.5 rounded-sm pt-0.5 leading-none shrink-0 border shadow-3xl", resolvedStatusPreset.color)}
 >
 <resolvedStatusPreset.icon className="h-3 w-3 mr-0.5 stroke-[2.2] inline-block" /> 
 <span>{resolvedStatusPreset.label.toUpperCase()}</span>
 </Badge>
 
 {activeChallengeItem.is_featured && (
 <Badge 
 variant="secondary" 
 className="font-mono text-[8px] font-black uppercase px-1.5 h-4.5 rounded-sm bg-amber-500/5 border border-amber-500/10 text-amber-600 tracking-wide pt-0.5 shrink-0 leading-none"
 >
 <Trophy className="h-3 w-3 mr-0.5 text-amber-500 fill-amber-500 inline-block" /> FLAG_FEATURED
 </Badge>
 )}
 </div>
 
 <h1 className={cn(PAGE_TITLE, "text-base sm:text-lg md:text-xl font-bold uppercase tracking-wide text-foreground leading-tight block select-text pt-0.5")}>
 {activeChallengeItem.title}
 </h1>
 </div>

 {/* HUD LEVEL 4: TABULAR TIME METRICS BLOCK GRID ELEMENTS */}
 <div className="grid grid-cols-3 gap-2 select-none pointer-events-none leading-none w-full block shrink-0 pt-0.5">
 <div className="rounded-lg border border-border/60 p-2.5 bg-muted/20 leading-none space-y-1 block flex-1 min-w-0">
 <div className="font-mono text-[9px] font-bold text-muted-foreground/40 uppercase tracking-wide flex items-center gap-1 leading-none">
 <Calendar className="h-3.5 w-3.5 stroke-[2] shrink-0 text-primary" /> <span>Interval Scope</span>
 </div>
 <p className="text-xs font-bold text-foreground truncate block pt-0.5 tabular-nums uppercase">{calculatedChronoMetrics.dateRangeLabel}</p>
 </div>
 
 <div className="rounded-lg border border-border/60 p-2.5 bg-muted/20 leading-none space-y-1 block flex-1 min-w-0">
 <div className="font-mono text-[9px] font-bold text-muted-foreground/40 uppercase tracking-wide flex items-center gap-1 leading-none">
 <Clock className="h-3.5 w-3.5 stroke-[2] shrink-0 text-primary" /> <span>Submission Lock</span>
 </div>
 <p className="text-xs font-bold text-foreground truncate block pt-0.5 tabular-nums uppercase">{calculatedChronoMetrics.deadlineLabel}</p>
 {calculatedChronoMetrics.daysLeft !== null && calculatedChronoMetrics.daysLeft >= 0 && (
 <p className="font-mono text-[8px] font-black text-amber-600 uppercase tracking-tight block leading-none pt-0.5 animate-pulse">
 [TRACK: {calculatedChronoMetrics.daysLeft === 0 ? "CLOSES TODAY" : `${calculatedChronoMetrics.daysLeft.toString()} DAYS RESIDUAL`}]
 </p>
 )}
 </div>
 
 <div className="rounded-lg border border-border/60 p-2.5 bg-muted/20 leading-none space-y-1 block flex-1 min-w-0">
 <div className="font-mono text-[9px] font-bold text-muted-foreground/40 uppercase tracking-wide flex items-center gap-1 leading-none">
 <Users className="h-3.5 w-3.5 stroke-[2] shrink-0 text-primary" /> <span>Participant Cap</span>
 </div>
 <p className="text-xs font-bold text-foreground truncate block pt-0.5 tabular-nums">{activeChallengeItem.max_participants ? activeChallengeItem.max_participants.toLocaleString() : "OPEN FLUID POOL"}</p>
 </div>
 </div>

 {/* HUD LEVEL 5: CORE ASSIGNMENT INTRO TEXT SPECIFICATIONS */}
 <div className="space-y-1.5 block w-full leading-none">
 <h3 className={cn(SECTION_TITLE, "text-xs font-mono font-extrabold uppercase tracking-wide text-muted-foreground/50 select-none block leading-none pb-1.5 border-b border-border/5")}>About Challenge Target</h3>
 <p className="text-xs sm:text-sm text-foreground/80 font-medium leading-relaxed block select-text whitespace-pre-wrap tracking-normal">
 {activeChallengeItem.description || "No strategic summary blueprint parameters loaded yet under this track record."}
 </p>
 </div>

 {/* HUD LEVEL 6: COMPLIANCE CODE COMPILATION PREREQUISITES RULES */}
 {activeChallengeItem.rules && (
 <div className="space-y-1.5 block w-full leading-none">
 <h3 className={cn(SECTION_TITLE, "text-xs font-mono font-extrabold uppercase tracking-wide text-muted-foreground/50 select-none block leading-none pb-1.5 border-b border-border/5")}>Evaluation Boundaries & Rules</h3>
 <Card className={cn(CARD, "rounded-lg border border-border/60 bg-card/20 shadow-none overflow-hidden block w-full")}>
 <CardContent className="p-3 block w-full leading-none">
 <p className="text-xs text-foreground/70 font-medium leading-relaxed block select-text whitespace-pre-wrap tracking-normal">{activeChallengeItem.rules}</p>
 </CardContent>
 </Card>
 </div>
 )}

 {/* HUD LEVEL 7: CRITERIA ALLOCATION INCENTIVE DRAWING ROWS */}
 {resolvedPrizesListArray.length > 0 && (
 <div className="space-y-1.5 block w-full leading-none">
 <h3 className={cn(SECTION_TITLE, "text-xs font-mono font-extrabold uppercase tracking-wide text-muted-foreground/50 select-none block leading-none pb-1.5 border-b border-border/5 flex items-center gap-1.5")}>
 <Gift className="h-3.5 w-3.5 stroke-[2] text-primary shrink-0" /> <span>Bounty Distribution Index</span>
 </h3>
 <Card className={cn(CARD, "rounded-lg bg-primary/[0.01] border-primary/20 shadow-none overflow-hidden block w-full")}>
 <CardContent className="p-3.5 space-y-2 block w-full leading-none">
 {resolvedPrizesListArray.map((prizeNameLabelStr, indexIdx) => (
 <div key={`prize-payout-row-item-${indexIdx}`} className="flex items-center gap-3 leading-none w-full block select-text">
 <div className="h-7 w-7 rounded bg-primary/5 border border-primary/10 text-primary flex items-center justify-center font-mono text-[10px] font-black shrink-0 select-none pointer-events-none shadow-3xs pt-0.5">
 {(indexIdx + 1).toString().padStart(2, "0")}
 </div>
 <span className="text-xs sm:text-sm font-bold text-foreground/80 leading-tight uppercase tracking-wide pt-0.5">
 {prizeNameLabelStr}
 </span>
 </div>
 ))}
 </CardContent>
 </Card>
 </div>
 )}

 {/* HUD LEVEL 8: SUBMISSION ARTIFACT MANIFEST RESPONSE STATUS BOX */}
 {candidateSubmissionPayload && (
 <Card className={cn(CARD, "rounded-lg border border-emerald-500/20 bg-emerald-500/[0.01] shadow-none overflow-hidden block w-full animate-in fade-in duration-200")}>
 <CardContent className="p-3.5 space-y-2.5 block w-full leading-none">
 <div className="flex items-center justify-between gap-4 leading-none w-full block shrink-0 select-none pointer-events-none">
 <span className="text-xs sm:text-sm font-bold text-foreground uppercase tracking-wide flex items-center gap-1.5 pt-0.5">
 <CheckCircle className="h-4 w-4 text-emerald-600 stroke-[2.5]" /> <span>Portfolio Entry Verified & Hashed</span>
 </span>
 <Badge variant="outline" className="font-mono text-[8px] font-black uppercase px-1.5 h-4.5 rounded-sm bg-background border-emerald-500/20 text-emerald-600 tracking-wide pt-0.5 leading-none">
 STATE: {candidateSubmissionPayload.status.toUpperCase()}
 </Badge>
 </div>
 
 <a
 href={candidateSubmissionPayload.submission_url}
 target="_blank"
 rel="noopener noreferrer"
 className="font-mono text-[10px] font-black uppercase text-emerald-600 hover:underline inline-flex items-center gap-1 leading-none select-text pl-0.5"
 >
 <span>Inspect Submitted Credentials Manifest</span> 
 <ExternalLink className="h-3 w-3 stroke-[2.5] shrink-0 pt-0.5" />
 </a>
 
 {candidateSubmissionPayload.feedback && (
 <div className="rounded-lg border border-border/60 bg-background/50 p-2.5 block w-full leading-none mt-1 select-text">
 <p className="font-mono text-[9px] font-black uppercase text-primary tracking-wide block mb-1 select-none pointer-events-none leading-none">Reviewer Evaluation Feedback Notes</p>
 <p className="text-xs text-muted-foreground/80 font-medium leading-relaxed block tracking-normal">{candidateSubmissionPayload.feedback}</p>
 </div>
 )}
 </CardContent>
 </Card>
 )}

 {/* HUD LEVEL 9: COMPLIANCE INTERACTIVE DIALOG MODAL TRANSITIONS GATEWAY */}
 {isChallengeActiveToSubmit && (
 <Dialog open={isSubmitSheetOpen} onOpenChange={setIsSubmitSheetOpen}>
 <DialogTrigger asChild>
 <div className="fixed bottom-0 inset-x-0 z-40 border-t border-border/40 bg-background/95 select-none pb-[max(env(safe-area-inset-bottom),0.75rem)] px-4 py-3 shadow-[0_-12px_40px_rgba(0,0,0,0.03)] animate-in fade-in duration-300">
 <div className="max-w-2xl mx-auto block w-full leading-none">
 <Button type="button" className="w-full h-11 rounded-lg font-bold uppercase tracking-widest text-xs gap-1.5 cursor-pointer shadow-xs transform-gpu active:scale-[0.99] block text-center">
 <Upload className="h-4 w-4 stroke-[2.5] inline-block shrink-0 align-middle" /> 
 <span className="inline-block align-middle pt-0.5">Authorize Entry Project Submission</span>
 </Button>
 </div>
 </div>
 </DialogTrigger>
 
 <DialogContent className="rounded-lg max-w-md border border-border/60 bg-popover text-popover-foreground shadow-sm select-none leading-none p-5">
 <DialogHeader className="text-left leading-none pb-2 border-b border-border/5">
 <DialogTitle className="text-sm font-bold uppercase tracking-wide text-foreground leading-none m-0">Lock Challenge Entry Specs</DialogTitle>
 </DialogHeader>
 
 <div className="space-y-4 pt-4 block w-full leading-none">
 <div className="space-y-1 block leading-none">
 <Label className="font-mono text-[10px] font-extrabold uppercase text-muted-foreground/60 tracking-wide block leading-none ml-0.5">Operational Project Repository URL Address</Label>
 <Input
 type="url"
 placeholder="e.g., https://github.com/profile-identity/arena-challenge-code-specs"
 value={textSubmissionUrlInput}
 onChange={(e) => setTextSubmissionUrlInput(e.target.value)}
 className="h-10 text-xs sm:text-sm bg-background border border-border/60 focus-visible:ring-1 focus-visible:ring-ring rounded-lg shadow-none"
 />
 <p className={cn(META_TEXT, "font-sans text-[10px] font-medium text-muted-foreground/40 block pt-0.5 leading-none")}>Provide public access point link, functional GitHub pipeline repository or portfolio container address.</p>
 </div>
 
 <div className="space-y-1 block leading-none pt-1">
 <Label className="font-mono text-[10px] font-extrabold uppercase text-muted-foreground/60 tracking-wide block leading-none ml-0.5">Implementation Context Notes (Optional)</Label>
 <Textarea
 placeholder="Outline explicit technical choices, code layout attributes or abstraction summaries..."
 value={textDescriptionInput}
 onChange={(e) => setTextDescriptionInput(e.target.value)}
 rows={4}
 className="bg-background border border-border/60 focus-visible:ring-1 focus-visible:ring-ring rounded-lg text-xs sm:text-sm font-sans leading-relaxed resize-none p-2.5"
 />
 </div>
 
 <Button
 type="button"
 onClick={() => executeSubmitMutationTrigger.mutate()}
 disabled={!textSubmissionUrlInput.trim() || executeSubmitMutationTrigger.isPending}
 className="w-full h-10 rounded-lg font-bold uppercase text-xs tracking-wider gap-1.5 cursor-pointer shadow-xs transform-gpu active:scale-[0.985] block text-center"
 >
 {executeSubmitMutationTrigger.isPending ? (
 <div className="flex items-center justify-center gap-1.5 mx-auto leading-none">
 <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0 text-primary-foreground stroke-[2.5]" /> 
 <span className="pt-0.5">Transmitting Allocation...</span>
 </div>
 ) : (
 <span>Commit Arena Submission</span>
 )}
 </Button>
 </div>
 </DialogContent>
 </Dialog>
 )}
 </div>
 );
}