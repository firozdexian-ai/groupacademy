import * as React from "react";
import { Link, useParams } from "react-router-dom";
import { ChevronLeft, MessageSquare, Pin, Lock, Plus, Loader2, Inbox, CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { useDiscussionThreads, useCreateThread } from "@/hooks/useDiscussions";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// =========================================================================
// DETERMINISTIC COMPONENT DATA TYPE CONTRACTS
// =========================================================================
interface DiscussionThread {
 id: string;
 title: string;
 body: string;
 is_pinned: boolean;
 is_locked: boolean;
 post_count: number;
 created_at: string;
}

interface ComposerForm {
 title: string;
 body: string;
}

/**
 * GroUp Academy: Collaborative Cohort Discussion Matrix (AppCohortDiscussions)
 * Hardened responsive communication board securing asynchronous compilation maps and isolating thread composer inputs.
 * Version: Launch Candidate · Phase Z1 Production Contract Locked
 */
export default function AppCohortDiscussions() {
 const { cohortId: unverifiedCohortIdStr } = useParams<{ cohortId: string }>();
 const { data: discussionThreadsPayload = [], isLoading: isThreadsCacheResolving } =
 useDiscussionThreads(unverifiedCohortIdStr);

 const createThreadMutation = useCreateThread();
 const { toast } = useToast();

 const [isComposerSheetOpen, setIsComposerSheetOpen] = React.useState<boolean>(false);
 const [composerFormState, setComposerFormState] = React.useState<ComposerForm>({ title: "", body: "" });

 // Cast background datasets cleanly via robust type contracts to shield parsing loops
 const typedThreadsArray = discussionThreadsPayload as unknown as DiscussionThread[];

 const handleInputChangeAction = React.useCallback((fieldKey: keyof ComposerForm, valueString: string) => {
 setComposerFormState((prev) => ({ ...prev, [fieldKey]: valueString }));
 }, []);

 const handleThreadCommitSequence = React.useCallback(async () => {
 if (!unverifiedCohortIdStr) return;

 if (!composerFormState.title.trim() || !composerFormState.body.trim()) {
 toast({
 title: "Validation Error",
 description: "Thread summary titles and message descriptions are mandatory configuration components.",
 variant: "destructive",
 });
 return;
 }

 try {
 await createThreadMutation.mutateAsync({
 cohort_id: unverifiedCohortIdStr,
 title: composerFormState.title.trim(),
 body: composerFormState.body.trim(),
 });

 toast({
 title: "Conversation Dispatched",
 description: "The topic narrative has been successfully synchronized onto the workspace board.",
 });

 setComposerFormState({ title: "", body: "" });
 setIsComposerSheetOpen(false);
 } catch (mutationExceptionPayload: any) {
 toast({
 title: "Mutation Aborted",
 description: mutationExceptionPayload.message || "Failed to broadcast communication payload parameters.",
 variant: "destructive",
 });
 }
 }, [composerFormState, unverifiedCohortIdStr, createThreadMutation, toast]);

 if (!unverifiedCohortIdStr) return null;

 return (
 <div className="max-w-2xl mx-auto px-4 py-4 pb-24 text-left antialiased block transform-gpu w-full">
 {/* HUD LEVEL 1: APP SHELL HUD HEADER ADMINISTRATIVE CORE */}
 <header className="block w-full select-none pb-3 border-b border-border/10">
 <Link
 to={`/app/cohorts/${unverifiedCohortIdStr}`}
 className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors leading-none"
 >
 <ChevronLeft className="h-3 w-3 stroke-[2.2]" /> <span>Return to Cohort Runway</span>
 </Link>

 <div className="flex items-center justify-between mt-3 leading-none w-full">
 <div className="space-y-0.5 block">
 <h1 className="text-base sm:text-lg md:text-xl font-bold uppercase tracking-wide text-foreground flex items-center gap-2 leading-none pt-0.5">
 <MessageSquare className="h-4 w-4 sm:h-5 w-5 text-primary stroke-[2.2] shrink-0" />
 <span>Cohort Group Discussions</span>
 </h1>
 <p className="text-[11px] sm:text-xs font-semibold text-muted-foreground/60 leading-none block mt-0.5">
 Engage with peer operators, author lecture briefs, and share system solutions.
 </p>
 </div>

 <Button
 type="button"
 size="sm"
 onClick={() => setIsComposerSheetOpen(true)}
 className="h-8 rounded-lg font-bold uppercase text-[10px] sm:text-xs tracking-wider gap-1 cursor-pointer shrink-0 shadow-2xs transform-gpu active:scale-[0.985]"
 >
 <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
 <span>New Topic</span>
 </Button>
 </div>
 </header>

 {/* HUD LEVEL 2: DETERMINISTIC DISCUSSION ENTRY ROW STREAM */}
 <main className="mt-4 space-y-2 block w-full">
 {isThreadsCacheResolving ? (
 <div
 role="status"
 className="w-full flex items-center justify-center py-12 font-mono text-[10px] sm:text-xs font-bold uppercase tracking-widest text-muted-foreground/40 select-none pointer-events-none gap-2"
 >
 <Loader2 className="h-4 w-4 animate-spin text-primary" />
 <span>Compiling Active Manifests...</span>
 </div>
 ) : typedThreadsArray.length === 0 ? (
 <div className="rounded-xl border border-dashed border-border/60 bg-card/20 p-8 text-center select-none block">
 <Inbox className="h-5 w-5 text-muted-foreground/30 mx-auto stroke-[2.2] pointer-events-none" />
 <p className="text-xs font-semibold text-muted-foreground/60 leading-normal mt-2 max-w-xs mx-auto">
 No conversational threads or research items logged within this channel quadrant yet.
 </p>
 </div>
 ) : (
 <div className="space-y-2 block w-full">
 {typedThreadsArray.map((threadItemNode) => (
 <Link
 key={`discussion-thread-card-index-${threadItemNode.id}`}
 to={`/app/cohorts/${unverifiedCohortIdStr}/discussions/${threadItemNode.id}`}
 className="group block rounded-lg outline-none focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
 >
 <Card className="rounded-lg border border-border/60 bg-card hover:border-border-foreground/10 transition-all duration-100 shadow-none overflow-hidden">
 <CardContent className="p-3 flex items-start justify-between gap-4 leading-none w-full block">
 <div className="min-w-0 flex-1 leading-none space-y-1 block">
 <h3 className="text-xs sm:text-sm font-bold text-foreground group-hover:text-primary transition-colors leading-snug uppercase tracking-wide block pt-0.5">
 {threadItemNode.title}
 </h3>
 <p className="text-[11px] sm:text-xs font-medium text-muted-foreground/70 leading-normal block select-text line-clamp-2 pr-2">
 {threadItemNode.body}
 </p>
 </div>

 {/* Badge Overlay Indicators */}
 <div className="flex flex-col gap-1.5 items-end shrink-0 select-none pointer-events-none leading-none">
 <div className="flex items-center gap-1.5 h-4 block shrink-0">
 {threadItemNode.is_pinned && (
 <span title="Topic pinned by administrator">
 <Pin className="h-3.5 w-3.5 text-amber-500 fill-amber-500 stroke-[1.5]" />
 </span>
 )}
 {threadItemNode.is_locked && (
 <span title="Conversation parameters locked">
 <Lock className="h-3.5 w-3.5 text-muted-foreground/40 stroke-[2.2]" />
 </span>
 )}
 </div>
 <Badge
 variant="secondary"
 className="font-mono text-[9px] font-extrabold uppercase px-1.5 h-4.5 rounded pt-0.5 leading-none shrink-0 rounded-xs tabular-nums"
 >
 {threadItemNode.post_count.toLocaleString()} MESSAGES
 </Badge>
 </div>
 </CardContent>
 </Card>
 </Link>
 ))}
 </div>
 )}
 </main>

 {/* OVERLAY PANEL SECTOR: COMPOSER ENTRY DIALOG FORM SHEET */}
 <Sheet open={isComposerSheetOpen} onOpenChange={setIsComposerSheetOpen}>
 <SheetContent
 side="right"
 className="rounded-l-xl w-full max-w-sm overflow-y-auto block select-none border-l border-border/60 bg-popover/95 "
 >
 <SheetContent id="composer-panel-disclosure-slot" className="hidden" />
 <SheetHeader className="text-left select-none pointer-events-none block leading-none pb-3 border-b border-border/10">
 <SheetTitle className="text-sm font-bold uppercase tracking-wide text-foreground">
 Broadcast Discussion Thread
 </SheetTitle>
 <SheetDescription className="text-[11px] font-semibold text-muted-foreground/50">
 Instantiate an unlocked research parameter lane across the group workspace.
 </SheetDescription>
 </SheetHeader>

 <div className="space-y-4 mt-4 block w-full leading-none">
 <div className="space-y-1 block leading-none">
 <Label className="font-mono text-[10px] font-extrabold uppercase text-muted-foreground/60 tracking-wide block leading-none">
 Discussion Topic Title
 </Label>
 <Input
 type="text"
 disabled={createThreadMutation.isPending}
 placeholder="e.g., Help with the week 3 assignment"
 value={composerFormState.title}
 onChange={(e) => handleInputChangeAction("title", e.target.value)}
 className="h-9 text-xs sm:text-sm bg-background/50 border border-border/40 focus-visible:ring-1 focus-visible:ring-ring rounded-lg shadow-none font-sans"
 />
 </div>

 <div className="space-y-1 block leading-none">
 <Label className="font-mono text-[10px] font-extrabold uppercase text-muted-foreground/60 tracking-wide block leading-none">
 Syllabus Brief Description / Content Body
 </Label>
 <Textarea
 disabled={createThreadMutation.isPending}
 placeholder="Detail the question context variables or analytical code fragments you intend to isolate..."
 rows={6}
 value={composerFormState.body}
 onChange={(e) => handleInputChangeAction("body", e.target.value)}
 className="bg-background/50 border border-border/40 focus-visible:ring-1 focus-visible:ring-ring rounded-lg shadow-none text-xs sm:text-sm font-sans leading-relaxed resize-none p-3"
 />
 </div>

 <Button
 type="button"
 disabled={
 createThreadMutation.isPending || !composerFormState.title.trim() || !composerFormState.body.trim()
 }
 onClick={handleThreadCommitSequence}
 className="w-full h-9 rounded-lg font-bold uppercase text-xs tracking-wider gap-1.5 mt-2 cursor-pointer shadow-xs transform-gpu active:scale-[0.985] disabled:opacity-50"
 >
 {createThreadMutation.isPending ? (
 <Loader2 className="h-3.5 w-3.5 animate-spin" />
 ) : (
 <CheckCircle className="h-3.5 w-3.5 stroke-[2.2]" />
 )}
 <span>Publish Conversation Node</span>
 </Button>
 </div>
 </SheetContent>
 </Sheet>
 </div>
 );
}
