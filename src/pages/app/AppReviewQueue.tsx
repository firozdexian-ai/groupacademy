import * as React from "react";
import { Link } from "react-router-dom";
import { Loader2, ClipboardList, Inbox } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useReviewQueue } from "@/hooks/useDiscussions";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

// =========================================================================
// DETERMINISTIC COMPONENT DATA TYPE CONTRACTS
// =========================================================================
interface SubmissionNode {
 id: string;
 title: string | null;
 kind: string;
}

interface AssignmentRecord {
 id: string;
 submission_id: string;
 due_at: string | null;
 submission: SubmissionNode | null;
}

/**
 * GroUp Academy: Talent Peer-Review Assignment Queue Cockpit (AppReviewQueue)
 * Hardened evaluation dashboard isolating dynamic metadata filters and shielding text fields from layout shifts.
 * Version: Launch Candidate · Phase Z1 Integration Stability Locked
 */
export default function AppReviewQueue() {
 const { data: reviewQueuePayload = [], isLoading: isQueueCacheResolving } = useReviewQueue();

 // Cast incoming query responses to explicit contract shapes to protect child elements
 const typedAssignmentsArray = reviewQueuePayload as unknown as AssignmentRecord[];

 if (isQueueCacheResolving) {
 return (
 <div
 role="status"
 className="min-h-[50vh] w-full grid place-items-center font-mono text-[10px] sm:text-xs font-bold uppercase tracking-widest text-muted-foreground/40 select-none antialiased"
 >
 <div className="flex items-center gap-2.5">
 <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
 <span>Synchronizing Vetting Queue Matrix...</span>
 </div>
 </div>
 );
 }

 return (
 <div className="max-w-2xl mx-auto px-4 py-6 pb-24 text-left antialiased block transform-gpu w-full">
 {/* HUD LEVEL 1: APPLICATION HEADER PANEL SCHEMAS */}
 <header className="block w-full select-none pb-3 border-b border-border/10 leading-none">
 <h1 className="text-base sm:text-lg md:text-xl font-bold uppercase tracking-wide text-foreground flex items-center gap-2 leading-none pt-0.5">
 <ClipboardList className="h-4 w-4 sm:h-5 w-5 text-primary stroke-[2.2] shrink-0 pointer-events-none" />
 <span>Peer Review Evaluation Queue</span>
 </h1>
 <p className="text-[11px] sm:text-xs font-semibold text-muted-foreground/60 leading-none block mt-1.5">
 Conduct specialty task cross-vetting audits to validate system modules and earn active validation credentials.
 </p>
 </header>

 {/* HUD LEVEL 2: INBOX GRID LIST VIEWPORT ITERATION CHANNELS */}
 <main className="mt-4 space-y-2 block w-full">
 {typedAssignmentsArray.length === 0 ? (
 <div className="rounded-lg border border-dashed border-border/60 bg-card/20 p-8 text-center select-none block mt-2">
 <Inbox className="h-5 w-5 text-muted-foreground/30 mx-auto stroke-[2.2] pointer-events-none" />
 <p className="text-xs font-semibold text-muted-foreground/60 leading-normal mt-2 max-w-xs mx-auto">
 Assignment inbox current clearance standard complete. You will be notified when a new candidate submission
 lands.
 </p>
 </div>
 ) : (
 <div className="space-y-3 block w-full">
 {typedAssignmentsArray.map((assignmentNodeItem) => {
 const hasVerifiedSubmissionDetails = !!assignmentNodeItem.submission;
 const compiledSubmissionTitleStr =
 assignmentNodeItem.submission?.title ?? "Unspecified Curriculum Title Specification";
 const compiledSubmissionKindStr =
 assignmentNodeItem.submission?.kind?.replace(/_/g, " ").toUpperCase() || "CORE ARTIFACT";

 return (
 <Card
 key={`peer-review-assignment-card-${assignmentNodeItem.id}`}
 className="rounded-lg border border-border/60 bg-card shadow-none overflow-hidden block w-full"
 >
 <CardContent className="p-4 flex flex-col gap-3.5 leading-none w-full block">
 <div className="flex items-start justify-between gap-4 leading-none w-full block">
 <div className="min-w-0 flex-1 leading-none space-y-1 block">
 <p className="text-xs sm:text-sm font-bold text-foreground truncate block pt-0.5 uppercase tracking-wide select-text">
 {compiledSubmissionTitleStr}
 </p>

 <Badge
 variant="outline"
 className="font-mono text-[8px] font-extrabold uppercase px-1.5 h-4.5 rounded border border-border/40 bg-background/50 text-muted-foreground/60 select-none shrink-0 pointer-events-none leading-none tracking-wide pt-0.5 rounded-xs"
 >
 {compiledSubmissionKindStr}
 </Badge>
 </div>

 {assignmentNodeItem.due_at && (
 <span className="font-mono text-[9px] sm:text-sm font-medium text-destructive uppercase tracking-tight shrink-0 select-none pointer-events-none leading-none tabular-nums pt-1 animate-pulse">
 CLOSES:{" "}
 {formatDistanceToNow(new Date(assignmentNodeItem.due_at), { addSuffix: true }).toUpperCase()}
 </span>
 )}
 </div>

 {/* Action Execution Dispatch Link Ingress */}
 <Button
 asChild
 type="button"
 size="sm"
 className="w-full h-8.5 rounded-lg font-mono text-[10px] font-extrabold uppercase tracking-wider cursor-pointer shadow-2xs transform-gpu active:scale-[0.99]"
 >
 <Link to={`/app/submissions/${assignmentNodeItem.submission_id}`}>
 Launch Evaluation Workspace Protocol
 </Link>
 </Button>
 </CardContent>
 </Card>
 );
 })}
 </div>
 )}
 </main>
 </div>
 );
}
