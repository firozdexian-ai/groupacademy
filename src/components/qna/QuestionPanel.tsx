import { useState, useEffect, useMemo, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLessonQuestions, useAskQuestion, useAnswerQuestion, useAcceptAnswer } from "@/hooks/useDiscussions";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, Loader2, MessageCircleQuestion, Plus, Send, X, Zap } from "lucide-react";
import { trackError, trackEvent } from "@/lib/errorTracking";
import { cn } from "@/lib/utils";

interface QuestionPanelProps {
  open: boolean;
  onClose: () => void;
  contentId: string;
  itemId?: string;
  moduleId?: string;
  cohortId?: string;
}

/**
 * GroUp Academy: Psychometric Lesson-Level Q&A Discussion Terminal (QuestionPanel)
 * An authoritative operational sandbox managing asynchronous user queries, solutions auditing, and forum tracking rows.
 * Version: Launch Candidate · Phase Z0 Hardened
 */
export function QuestionPanel({ open, onClose, contentId, itemId, moduleId, cohortId }: QuestionPanelProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  const isMountedRef = useRef<boolean>(true);

  const { data: questionsList = [], isLoading, error: queriesFetchException } = useLessonQuestions(contentId, itemId);
  const askQuestionMutation = useAskQuestion();
  const answerQuestionMutation = useAnswerQuestion();
  const acceptAnswerMutation = useAcceptAnswer();

  const [questionBody, setQuestionBody] = useState("");
  const [activeReplyingQuestionId, setActiveReplyingQuestionId] = useState<string | null>(null);
  const [individualAnswerBodyMap, setIndividualAnswerBodyMap] = useState<Record<string, string>>({});

  // Synchronize component lifecycles to safely drop background thread state writes
  useEffect(() => {
    isMountedRef.current = true;
    if (open) {
      trackEvent("question_panel_node_mounted", { contentId, itemId });
    }
    return () => {
      isMountedRef.current = false;
    };
  }, [open, contentId, itemId]);

  // Route query collection extraction errors directly down monitoring pipelines
  useEffect(() => {
    if (queriesFetchException) {
      trackError(queriesFetchException, { component: "QuestionPanel", action: "fetch_lesson_discussions" });
    }
  }, [queriesFetchException]);

  const safeQuestionsCollection = useMemo(() => {
    if (!Array.isArray(questionsList)) return [];
    return questionsList;
  }, [questionsList]);

  const handleQuestionSubmissionProtocol = async () => {
    const sanitizedQuestionStr = questionBody.trim();
    if (!sanitizedQuestionStr || askQuestionMutation.isPending) return;

    trackEvent("question_panel_submission_initiated");
    const dynamicToastTrackerId = toast({
      title: "COMMITTING_QUERY",
      description: "Registering inquiry down discussion ledger nodes…",
    });

    try {
      await askQuestionMutation.mutateAsync({
        content_id: contentId,
        item_id: itemId,
        module_id: moduleId,
        cohort_id: cohortId,
        body: sanitizedQuestionStr,
      });

      // Automated Efficiency: Synchronize cache streams immediately to avoid state drift across layouts
      await queryClient.invalidateQueries({ queryKey: ["lesson-questions", contentId, itemId] });

      if (isMountedRef.current) {
        setQuestionBody("");
        toast({ title: "QUERY_SYNC_VERIFIED", description: "Your inquiry is registered for instructor calibration." });
        trackEvent("question_panel_submission_success");
      }
    } catch (caughtPipelineExceptionErr: any) {
      const formattedExceptionMsgStr =
        caughtPipelineExceptionErr instanceof Error
          ? caughtPipelineExceptionErr.message
          : String(caughtPipelineExceptionErr);

      trackError(formattedExceptionMsgStr, { component: "QuestionPanel", action: "commit_question_payload" });
      toast({ title: "INGRESS_FAULT", description: formattedExceptionMsgStr, variant: "destructive" });
    }
  };

  const handleAnswerSubmissionProtocol = async (targetQuestionIdStr: string) => {
    const sanitizedAnswerStr = (individualAnswerBodyMap[targetQuestionIdStr] || "").trim();
    if (!sanitizedAnswerStr || answerQuestionMutation.isPending) return;

    trackEvent("question_panel_answer_submitted", { questionId: targetQuestionIdStr });

    try {
      await answerQuestionMutation.mutateAsync({
        question_id: targetQuestionIdStr,
        body: sanitizedAnswerStr,
        content_id: contentId,
        item_id: itemId,
      });

      await queryClient.invalidateQueries({ queryKey: ["lesson-questions", contentId, itemId] });

      if (isMountedRef.current) {
        setIndividualAnswerBodyMap((prevMap) => ({ ...prevMap, [targetQuestionIdStr]: "" }));
        setActiveReplyingQuestionId(null);
        toast({ title: "ANSWER_COMMITTED_SUCCESS" });
      }
    } catch (caughtPipelineExceptionErr: any) {
      const formattedExceptionMsgStr =
        caughtPipelineExceptionErr instanceof Error
          ? caughtPipelineExceptionErr.message
          : String(caughtPipelineExceptionErr);

      trackError(formattedExceptionMsgStr, {
        component: "QuestionPanel",
        action: "commit_answer_payload",
        questionId: targetQuestionIdStr,
      });
      toast({ title: "TRANSMISSION_FAULT", description: formattedExceptionMsgStr, variant: "destructive" });
    }
  };

  const handleSolutionAcceptanceProtocol = async (targetQuestionIdStr: string, targetAnswerIdStr: string) => {
    if (!targetQuestionIdStr || !targetAnswerIdStr || acceptAnswerMutation.isPending) return;
    trackEvent("question_panel_solution_marked", { questionId: targetQuestionIdStr, answerId: targetAnswerIdStr });

    try {
      await acceptAnswerMutation.mutateAsync({
        question_id: targetQuestionIdStr,
        answer_id: targetAnswerIdStr,
      });

      await queryClient.invalidateQueries({ queryKey: ["lesson-questions", contentId, itemId] });
      toast({ title: "SOLUTION_VERIFIED_LOCKED", description: "Discussions parameters flagged as resolved verified." });
    } catch (err) {
      trackError(err, {
        component: "QuestionPanel",
        action: "accept_solution_marker",
        questionId: targetQuestionIdStr,
      });
    }
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(isOpenState) => {
        if (!isOpenState && !askQuestionMutation.isPending && !answerQuestionMutation.isPending) {
          onClose();
        }
      }}
    >
      <SheetContent
        side="bottom"
        className="h-[90vh] rounded-t-xl border-t border-border/40 bg-background/95 backdrop-blur-xl flex flex-col p-4 sm:p-5 text-left antialiased transform-gpu select-none sm:select-text"
      >
        {/* HUD LEVEL 1: OVERLAY CONTENT WORKSPACE ROW HEADER */}
        <SheetHeader className="mb-4 text-left select-none shrink-0 leading-none w-full">
          <div className="flex items-center gap-2.5 leading-none w-full">
            <div className="h-7 w-7 rounded-lg bg-primary/10 border border-primary/5 text-primary flex items-center justify-center shrink-0 shadow-inner">
              <MessageCircleQuestion className="h-4 w-4 text-primary stroke-[2.2] animate-pulse" />
            </div>
            <div className="min-w-0 flex flex-col justify-center leading-none flex-1">
              <SheetTitle className="text-sm sm:text-base font-bold text-foreground uppercase tracking-wide leading-none">
                Interactive Lesson Q&A Forum
              </SheetTitle>
              <SheetDescription className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 leading-none pt-1">
                Synchronize micro-discussion nodes with cohort members and instructional authorities
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {/* HUD LEVEL 2: COMPONENT CORE INQUIRY DISPATCH DISPATCH TEXTAREA INPUT BLOCK */}
        <div className="flex gap-2 w-full shrink-0 select-none items-start font-bold text-xs pb-1">
          <Textarea
            rows={2}
            value={questionBody}
            disabled={askQuestionMutation.isPending}
            placeholder="Broadcast a specialized technical inquiry over this operational node baseline…"
            onChange={(e) => setQuestionBody(e.target.value)}
            className="rounded-xl border border-border/40 bg-background/50 text-xs sm:text-sm font-semibold tracking-tight text-foreground p-3 leading-relaxed resize-none shadow-inner flex-1 focus-visible:ring-1 focus-visible:ring-ring"
          />
          <Button
            type="button"
            size="icon"
            disabled={!questionBody.trim() || askQuestionMutation.isPending}
            onClick={handleQuestionSubmissionProtocol}
            className="h-14 w-12 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 shadow-md shrink-0 flex items-center justify-center cursor-pointer transition-transform active:scale-95"
            title="Deploy new technical inquiry record onto lesson discussion matrix arrays"
          >
            {askQuestionMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin stroke-[2.5]" />
            ) : (
              <Plus className="h-5 w-5 stroke-[2.5]" />
            )}
          </Button>
        </div>

        {/* HUD LEVEL 3: SCROLL CANVAS HOSTING CORE DISCUSSION DECK MATRIX REPOSITORY */}
        <ScrollArea className="flex-1 mt-3 pr-1.5 w-full min-w-0 text-left outline-none">
          <div className="w-full min-w-0 space-y-3 font-bold text-xs select-text block pb-4 animate-in fade-in duration-200">
            {isLoading ? (
              <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground select-none leading-none w-full">
                <Loader2 className="h-4 w-4 animate-spin text-primary stroke-[2.5]" />
                <span className="text-[10px] font-mono font-extrabold uppercase tracking-wider animate-pulse">
                  Hydrating discussion registry logs…
                </span>
              </div>
            ) : safeQuestionsCollection.length === 0 ? (
              <p className="text-[10px] font-mono font-extrabold text-center py-10 uppercase tracking-widest text-muted-foreground/40 italic select-none">
                Discussion Registry Empty &bull; Mapped thread parameters vacant
              </p>
            ) : (
              safeQuestionsCollection.map((queryNodeItem: any) => {
                if (!queryNodeItem || !queryNodeItem.id) return null;
                const isReplyingActive = activeReplyingQuestionId === queryNodeItem.id;

                return (
                  <Card
                    key={queryNodeItem.id}
                    className="w-full text-left rounded-xl border border-border/40 bg-card/20 shadow-xs overflow-hidden group/card transition-colors hover:border-border/60"
                  >
                    <CardContent className="p-3.5 space-y-3 w-full min-w-0 flex flex-col justify-center">
                      {/* SUB LEVEL FIELD HEADER ROW STRIP */}
                      <div className="flex items-start justify-between gap-4 w-full leading-none">
                        <p className="text-xs sm:text-sm font-bold text-foreground/90 leading-normal break-words flex-1 pr-1 selection:bg-primary/10">
                          {queryNodeItem.body}
                        </p>
                        {queryNodeItem.is_resolved && (
                          <Badge
                            variant="outline"
                            className="rounded px-1.5 h-4.5 text-[8px] font-extrabold tracking-wider uppercase border border-transparent bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 gap-0.5 flex items-center leading-none shadow-xs shrink-0 select-none"
                          >
                            <CheckCircle2 className="h-3 w-3 stroke-[2.5]" />
                            <span>Resolved</span>
                          </Badge>
                        )}
                      </div>

                      {/* INDIVIDUAL NESTED REPLY STREAM BLOCKS ROW SHIELDS */}
                      <div className="space-y-2 pl-2 sm:pl-3 border-l-2 border-border/10 w-full min-w-0">
                        {(queryNodeItem.answers ?? []).map((answerItem: any) => {
                          if (!answerItem || !answerItem.id) return null;
                          const isSolutionAcceptedNode = queryNodeItem.accepted_answer_id === answerItem.id;

                          return (
                            <div
                              key={answerItem.id}
                              className={cn(
                                "p-2.5 rounded-lg text-[11px] leading-relaxed relative flex flex-col justify-center w-full min-w-0 font-medium transition-colors shadow-xs",
                                isSolutionAcceptedNode
                                  ? "bg-emerald-500/[0.015] border border-emerald-500/20 text-foreground"
                                  : "bg-muted/30 border border-border/5 text-foreground/80",
                              )}
                            >
                              <div className="flex items-start justify-between gap-4 w-full leading-none mb-1 select-none">
                                <Badge
                                  variant="outline"
                                  className="rounded px-1 h-4 text-[7.5px] font-mono font-bold tracking-wide uppercase border-none text-muted-foreground/40 bg-muted/50 shadow-none shrink-0"
                                >
                                  Node ID: {String(answerItem.id).slice(0, 5)}
                                </Badge>
                                {answerItem.is_instructor && (
                                  <Badge
                                    variant="outline"
                                    className="rounded px-1.5 h-4 text-[7.5px] font-extrabold tracking-wider uppercase border border-primary/20 bg-primary/5 text-primary shadow-xs shrink-0"
                                  >
                                    Instructor Authority
                                  </Badge>
                                )}
                              </div>

                              <p className="whitespace-pre-wrap break-words pr-1 block leading-normal select-text font-medium text-foreground/90 selection:bg-primary/10">
                                {answerItem.body}
                              </p>

                              {/* MARK AS SOLUTION METHOD PERMISSION GATE TRIGGER */}
                              {!queryNodeItem.is_resolved && queryNodeItem.author_id === user?.id && (
                                <button
                                  type="button"
                                  disabled={acceptAnswerMutation.isPending}
                                  onClick={() => handleSolutionAcceptanceProtocol(queryNodeItem.id, answerItem.id)}
                                  className="text-[9px] font-mono font-extrabold text-primary hover:text-primary/70 uppercase tracking-wide w-fit cursor-pointer leading-none mt-2 select-none border-none bg-transparent block"
                                >
                                  &bull; Operationalize as Node Solution
                                </button>
                              )}
                            </div>
                          );
                        })}

                        {/* WORKSPACE SECTOR RE-ROUTE: TARGETED REPLIES SUB CANVAS SHEET */}
                        {isReplyingActive ? (
                          <div className="flex gap-2 items-start w-full leading-none font-bold text-xs pt-1 animate-in slide-in-from-top-1 duration-150 select-none">
                            <Textarea
                              rows={1}
                              disabled={answerQuestionMutation.isPending}
                              value={individualAnswerBodyMap[queryNodeItem.id] || ""}
                              placeholder="Inject targeted response segment variables here…"
                              onChange={(e) =>
                                setIndividualAnswerBodyMap((prev) => ({ ...prev, [queryNodeItem.id]: e.target.value }))
                              }
                              className="h-9 rounded-lg border border-border/40 bg-background/50 text-[11px] font-semibold tracking-tight text-foreground px-2.5 py-2 leading-relaxed resize-none shadow-inner flex-1 min-w-0"
                            />
                            <Button
                              type="button"
                              size="icon"
                              disabled={
                                !(individualAnswerBodyMap[queryNodeItem.id] || "").trim() ||
                                answerQuestionMutation.isPending
                              }
                              onClick={() => handleAnswerSubmissionProtocol(queryNodeItem.id)}
                              className="h-9 w-9 rounded-lg bg-primary text-primary-foreground font-bold hover:bg-primary/90 shadow-sm shrink-0 flex items-center justify-center cursor-pointer transition-transform active:scale-95"
                            >
                              <Send className="h-3.5 w-3.5 stroke-[2.2]" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 font-bold text-xs select-none pt-1">
                            <button
                              type="button"
                              onClick={() => {
                                setIndividualAnswerBodyMap((p) => ({ ...p, [queryNodeItem.id]: "" }));
                                setActiveReplyingQuestionId(queryNodeItem.id);
                              }}
                              className="text-[9px] font-mono font-extrabold text-primary hover:text-primary/70 uppercase tracking-wide shrink-0 cursor-pointer border-none bg-transparent block leading-none"
                            >
                              [ Deploy Secondary Response Ingress ]
                            </button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </ScrollArea>

        {/* HUD LEVEL 4: OVERLAY BOTTOM OMNIPRESENCE SHIELD RIBBON FOOTER */}
        <div className="shrink-0 pt-2 border-t border-border/10 select-none shadow-none pointer-events-none tracking-normal font-bold text-[9px] text-muted-foreground/40 font-mono leading-none uppercase w-full flex items-center justify-center gap-1.5 h-6">
          <Zap className="h-3.5 w-3.5 text-amber-500 fill-amber-500/10 stroke-[2.2] shrink-0 animate-pulse" />
          <span>Lesson conversation workspace tracking calibration index variables complete</span>
        </div>
      </SheetContent>
    </Sheet>
  );
}
