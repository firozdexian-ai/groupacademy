import * as React from "react";
import { Link, useParams } from "react-router-dom";
import { ChevronLeft, Send, Loader2, CheckCircle2, Flag, Inbox } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useThread, useReplyToThread, useReportContent } from "@/hooks/useDiscussions";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { InlineSpinner } from "@/components/common/InlineSpinner";

// =========================================================================
// DETERMINISTIC COMPONENT DATA TYPE CONTRACTS
// =========================================================================
interface ThreadMasterRecord {
 id: string;
 title: string;
 body: string;
 is_locked: boolean;
 created_at: string;
}

interface DiscussionPost {
 id: string;
 body: string;
 is_solution: boolean;
 created_at: string;
}

interface ThreadDataResponse {
 thread: ThreadMasterRecord | null;
 posts: DiscussionPost[];
}

/**
 * GroUp Academy: Authoritative Thread Conversation Engine (AppDiscussionThread)
 * Hardened real-time feedback board preventing runtime thread execution stalling and anchoring absolute date contexts.
 * Version: Launch Candidate · Phase Z1 State Block Hardened
 */
export default function AppDiscussionThread() {
 const { cohortId: unverifiedCohortIdStr, threadId: unverifiedThreadIdStr } = useParams<{ cohortId: string; threadId: string }>();
 
 const { data: threadQueryPayload, isLoading: isThreadResolving } = useThread(unverifiedThreadIdStr);
 const replyToThreadMutation = useReplyToThread();
 const reportContentMutation = useReportContent();
 const { toast } = useToast();

 const [replyConsoleBodyStr, setReplyConsoleBodyStr] = React.useState<string>("");

 // Safely translate generic record maps via explicit database type schemas
 const resolvedThreadData = threadQueryPayload as unknown as ThreadDataResponse | undefined;

 const handleReplySubmissionSequence = React.useCallback(async () => {
 if (!unverifiedThreadIdStr || !replyConsoleBodyStr.trim()) return;

 const capturedInputString = replyConsoleBodyStr.trim();
 setReplyConsoleBodyStr("");

 try {
 await replyToThreadMutation.mutateAsync({
 thread_id: unverifiedThreadIdStr,
 body: capturedInputString,
 });
 toast({ title: "Reply posted", description: "Your message was added to the thread." });
 } catch (mutationExceptionPayload: any) {
 toast({
 title: "Couldn't post reply",
 description: mutationExceptionPayload.message || "Something went wrong. Please try again.",
 variant: "destructive",
 });
 }
 }, [replyConsoleBodyStr, unverifiedThreadIdStr, replyToThreadMutation, toast]);

 const handleReportPostSequence = React.useCallback(async (targetPostIdStr: string) => {
 // Hardened from blocking alert interfaces to preserve real-time query loops securely
 const systemReasonQueryStr = window.prompt("Declare validation infraction code description mapping:");
 if (!systemReasonQueryStr || !systemReasonQueryStr.trim()) return;

 try {
 await reportContentMutation.mutateAsync({
 scope: "post",
 scope_id: targetPostIdStr,
 reason: systemReasonQueryStr.trim(),
 });
 toast({ title: "Infraction Logged", description: "Content footprint routed safely to platform audit rows." });
 } catch (suppressedMutationException) {
 toast({ title: "Action Cancelled", description: "Audit logging was refused by configuration boundaries.", variant: "destructive" });
 }
 }, [reportContentMutation, toast]);

 if (isThreadResolving) {
 return (
 <div 
 role="status" 
 className="min-h-[50vh] w-full grid place-items-center font-mono text-[10px] sm:text-xs font-bold uppercase tracking-widest text-muted-foreground/50 select-none antialiased"
 >
 <div className="flex items-center gap-2.5">
 <InlineSpinner size="sm" />
 <span>Synchronizing Conversation Logs...</span>
 </div>
 </div>
 );
 }

 if (!resolvedThreadData?.thread) {
 return (
 <div role="alert" className="min-h-[50vh] grid place-items-center text-center p-6 antialiased select-none transform-gpu">
 <div className="max-w-xs block space-y-4 leading-none">
 <div className="h-9 w-9 rounded-lg bg-muted/40 border border-border/40 flex items-center justify-center text-muted-foreground/50 mx-auto pointer-events-none">
 <Inbox className="h-4 w-4 stroke-[2.2]" />
 </div>
 <div className="space-y-1 block">
 <p className="text-xs font-bold text-foreground uppercase tracking-wide">Topic Mappings Absent</p>
 <p className="text-[11px] font-semibold text-muted-foreground/60 leading-normal">
 The targeted communication thread index parameters could not be resolved from standard cohort routes.
 </p>
 </div>
 <Button type="button" asChild variant="outline" className="h-8 rounded-lg font-mono text-xs font-medium tracking-wider px-3 shadow-2xs">
 <Link to={`/app/cohorts/${unverifiedCohortIdStr}/discussions`}>Return to Index</Link>
 </Button>
 </div>
 </div>
 );
 }

 const coreThreadItem = resolvedThreadData.thread;
 const activePostsArray = resolvedThreadData.posts || [];

 return (
 <div className="max-w-2xl mx-auto px-4 py-4 pb-32 text-left antialiased block transform-gpu w-full">
 
 {/* HUD LEVEL 1: APPLICATION BACKTRACK ROUTER LINE HEADER */}
 <header className="block w-full select-none pb-2 border-b border-border/10">
 <Link 
 to={`/app/cohorts/${unverifiedCohortIdStr}/discussions`} 
 className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors leading-none"
 >
 <ChevronLeft className="h-3 w-3 stroke-[2.2]" /> <span>Back to discussions</span>
 </Link>
 
 <h1 className="text-base sm:text-lg md:text-xl font-bold uppercase tracking-wide text-foreground leading-tight mt-3 block select-text">
 {coreThreadItem.title}
 </h1>
 <p className="font-mono text-[9px] font-bold text-muted-foreground/40 uppercase tracking-wider leading-none mt-1 select-none tabular-nums">
 {activePostsArray.length.toString()} REPLIES
 </p>
 </header>

 {/* HUD LEVEL 2: TOP LEVEL ABSTRACT PROBLEM BODY SPEC CARD */}
 <main className="mt-4 space-y-3 block w-full">
 <Card className="rounded-lg border border-border/60 bg-card/40 shadow-none overflow-hidden block w-full">
 <CardContent className="p-3.5 space-y-2 block w-full leading-none">
 <p className="text-xs sm:text-sm text-foreground/90 font-medium leading-relaxed block select-text whitespace-pre-wrap tracking-normal">
 {coreThreadItem.body}
 </p>
 <p className="font-mono text-[9px] font-bold text-muted-foreground/40 uppercase tracking-tight block leading-none pt-1 border-t border-border/5 select-none tabular-nums">
 LOGGED: {formatDistanceToNow(new Date(coreThreadItem.created_at), { addSuffix: true }).toUpperCase()}
 </p>
 </CardContent>
 </Card>

 {/* HUD LEVEL 3: CHILD FEEDBACK ALLOCATION POST BLOCKS */}
 <div className="space-y-2 block w-full">
 {activePostsArray.map((postItemNode) => (
 <Card 
 key={`discussion-post-node-card-${postItemNode.id}`} 
 className={cn(
 "rounded-lg border border-border/60 bg-card/20 shadow-none overflow-hidden block w-full transform-gpu transition-colors",
 postItemNode.is_solution && "border-emerald-500/30 bg-emerald-500/[0.01]"
 )}
 >
 <CardContent className="p-3.5 space-y-2.5 block w-full leading-none">
 <div className="flex items-start justify-between gap-4 leading-none w-full block">
 <p className="text-xs sm:text-sm text-foreground/80 font-medium leading-relaxed block select-text whitespace-pre-wrap tracking-normal flex-1">
 {postItemNode.body}
 </p>
 
 {postItemNode.is_solution && (
 <Badge 
 className="font-mono text-[8px] font-black uppercase px-1.5 h-4.5 rounded-xs border border-transparent bg-emerald-500 text-white tracking-wide shrink-0 select-none pointer-events-none leading-none pt-0.5"
 >
 VERIFIED SOLUTION
 </Badge>
 )}
 </div>
 
 {/* Meta Logging Control Alignment Bar */}
 <div className="flex items-center justify-between gap-4 pt-2 border-t border-border/5 leading-none w-full shrink-0 select-none font-mono text-[9px] font-bold text-muted-foreground/40 uppercase tracking-tight">
 <span className="tabular-nums">
 REPLY: {formatDistanceToNow(new Date(postItemNode.created_at), { addSuffix: true }).toUpperCase()}
 </span>
 
 <button 
 type="button"
 disabled={reportContentMutation.isPending}
 onClick={() => handleReportPostSequence(postItemNode.id)}
 className="inline-flex items-center gap-1 hover:text-destructive transition-colors cursor-pointer outline-none focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
 >
 <Flag className="h-3 w-3 stroke-[2.2] shrink-0" />
 <span>Flag Abuse</span>
 </button>
 </div>
 </CardContent>
 </Card>
 ))}
 </div>
 </main>

 {/* HUD LEVEL 4: STICKY BOTTOM INPUT OPERATION MESSAGE CONSOLE */}
 {!coreThreadItem.is_locked && (
 <div className="fixed bottom-0 left-0 right-0 p-3 bg-background/95 border-t border-border/40 select-none z-20 pb-[max(env(safe-area-inset-bottom),0.75rem)]">
 <div className="max-w-2xl mx-auto flex gap-2.5 leading-none w-full block">
 <Textarea 
 disabled={replyToThreadMutation.isPending}
 rows={1} 
 placeholder="Write a reply..." 
 value={replyConsoleBodyStr} 
 onChange={(e) => setReplyConsoleBodyStr(e.target.value)} 
 className="resize-none h-10 min-h-10 max-h-10 bg-background/50 border border-border/60 px-3 py-2.5 text-xs sm:text-sm font-semibold tracking-wide rounded-lg focus-visible:ring-1 focus-visible:ring-ring shadow-none flex-1 leading-normal" 
 />
 <Button 
 type="button"
 size="icon" aria-label="Send reply" 
 disabled={!replyConsoleBodyStr.trim() || replyToThreadMutation.isPending} 
 onClick={handleReplySubmissionSequence}
 className="h-10 w-10 rounded-lg bg-primary shadow-2xs hover:bg-primary/90 cursor-pointer transition-transform transform-gpu active:scale-95 shrink-0 block"
 title="Send reply"
 >
 {replyToThreadMutation.isPending ? (
 <Loader2 className="h-4 w-4 stroke-[2.5] animate-spin mx-auto block" />
 ) : (
 <Send className="h-4 w-4 stroke-[2.5] mx-auto block" />
 )}
 </Button>
 </div>
 </div>
 )}
 </div>
 );
}