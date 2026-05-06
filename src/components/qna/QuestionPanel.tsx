/**
 * QuestionPanel — sheet for lesson-level Q&A in player + course detail.
 */
import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { CheckCircle2, Loader2, MessageCircleQuestion, Plus, Send } from "lucide-react";
import { useLessonQuestions, useAskQuestion, useAnswerQuestion, useAcceptAnswer } from "@/hooks/useDiscussions";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onClose: () => void;
  contentId: string;
  itemId?: string;
  moduleId?: string;
  cohortId?: string;
}

export function QuestionPanel({ open, onClose, contentId, itemId, moduleId, cohortId }: Props) {
  const { data = [], isLoading } = useLessonQuestions(contentId, itemId);
  const ask = useAskQuestion();
  const answer = useAnswerQuestion();
  const accept = useAcceptAnswer();
  const { user } = useAuth();
  const { toast } = useToast();
  const [body, setBody] = useState("");
  const [activeQ, setActiveQ] = useState<string | null>(null);
  const [answerBody, setAnswerBody] = useState("");

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[90vh] overflow-y-auto">
        <SheetHeader><SheetTitle className="inline-flex items-center gap-1.5"><MessageCircleQuestion className="h-4 w-4" />Lesson Q&A</SheetTitle></SheetHeader>
        <div className="mt-3 space-y-2">
          <div className="flex gap-2">
            <Textarea rows={2} placeholder="Ask a question…" value={body} onChange={e => setBody(e.target.value)} />
            <Button size="icon" disabled={!body.trim()} onClick={async () => {
              try { await ask.mutateAsync({ content_id: contentId, item_id: itemId, module_id: moduleId, cohort_id: cohortId, body }); setBody(""); toast({ title: "Question posted" }); }
              catch (e: any) { toast({ title: "Failed", description: e.message, variant: "destructive" }); }
            }}><Plus className="h-4 w-4" /></Button>
          </div>

          {isLoading ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> :
            data.length === 0 ? <p className="text-xs text-muted-foreground text-center py-4">No questions yet.</p> :
            data.map((q: any) => (
              <Card key={q.id} className="p-3 rounded-2xl">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm flex-1">{q.body}</p>
                  {q.is_resolved && <Badge className="bg-emerald-500 text-[10px]"><CheckCircle2 className="h-3 w-3 mr-0.5" />Resolved</Badge>}
                </div>
                <div className="mt-2 space-y-1.5">
                  {(q.answers ?? []).map((a: any) => (
                    <div key={a.id} className={`p-2 rounded-lg text-xs ${q.accepted_answer_id === a.id ? "bg-emerald-500/10 border border-emerald-500/30" : "bg-muted/40"}`}>
                      <div className="flex items-start justify-between gap-2">
                        <p className="flex-1 whitespace-pre-wrap">{a.body}</p>
                        {a.is_instructor && <Badge variant="outline" className="text-[9px]">Instructor</Badge>}
                      </div>
                      {!q.is_resolved && q.author_id === user?.id && (
                        <button onClick={async () => { await accept.mutateAsync({ question_id: q.id, answer_id: a.id }); toast({ title: "Marked as solution" }); }}
                          className="text-[10px] text-primary mt-1">Mark as solution</button>
                      )}
                    </div>
                  ))}
                  {activeQ === q.id ? (
                    <div className="flex gap-1.5">
                      <Textarea rows={1} placeholder="Your answer…" value={answerBody} onChange={e => setAnswerBody(e.target.value)} className="text-xs" />
                      <Button size="icon" disabled={!answerBody.trim()} onClick={async () => {
                        try { await answer.mutateAsync({ question_id: q.id, body: answerBody, content_id: contentId, item_id: itemId }); setAnswerBody(""); setActiveQ(null); }
                        catch (e: any) { toast({ title: "Failed", description: e.message, variant: "destructive" }); }
                      }}><Send className="h-3.5 w-3.5" /></Button>
                    </div>
                  ) : (
                    <button onClick={() => setActiveQ(q.id)} className="text-[10px] text-primary">Answer</button>
                  )}
                </div>
              </Card>
            ))
          }
        </div>
      </SheetContent>
    </Sheet>
  );
}
