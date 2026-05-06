/**
 * AppDiscussionThread — single thread with replies + composer (realtime).
 */
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ChevronLeft, Send, Loader2, CheckCircle2, Flag } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useThread, useReplyToThread, useReportContent } from "@/hooks/useDiscussions";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

export default function AppDiscussionThread() {
  const { cohortId, threadId } = useParams<{ cohortId: string; threadId: string }>();
  const { data, isLoading } = useThread(threadId);
  const reply = useReplyToThread();
  const report = useReportContent();
  const { toast } = useToast();
  const [body, setBody] = useState("");

  if (isLoading || !data) return <div className="flex justify-center mt-12"><Loader2 className="h-5 w-5 animate-spin" /></div>;
  const { thread, posts } = data;
  if (!thread) return <p className="text-center text-sm text-muted-foreground py-12">Thread not found.</p>;

  return (
    <div className="max-w-2xl mx-auto pb-32">
      <header className="px-4 pt-4 pb-2">
        <Link to={`/app/cohorts/${cohortId}/discussions`} className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <ChevronLeft className="h-3 w-3" /> Threads
        </Link>
        <h1 className="text-lg font-bold mt-1">{thread.title}</h1>
        <p className="text-xs text-muted-foreground">{posts.length} replies</p>
      </header>

      <main className="px-4 mt-3 space-y-2">
        <Card className="p-3 rounded-2xl">
          <p className="text-sm whitespace-pre-wrap">{thread.body}</p>
          <p className="text-[10px] text-muted-foreground mt-1">{formatDistanceToNow(new Date(thread.created_at), { addSuffix: true })}</p>
        </Card>
        {posts.map((p: any) => (
          <Card key={p.id} className={`p-3 rounded-2xl ${p.is_solution ? "border-emerald-500/40 bg-emerald-500/5" : ""}`}>
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm whitespace-pre-wrap flex-1">{p.body}</p>
              {p.is_solution && <Badge className="bg-emerald-500 text-[10px] shrink-0"><CheckCircle2 className="h-3 w-3 mr-0.5" />Solution</Badge>}
            </div>
            <div className="flex items-center justify-between mt-2">
              <p className="text-[10px] text-muted-foreground">{formatDistanceToNow(new Date(p.created_at), { addSuffix: true })}</p>
              <button onClick={async () => {
                const reason = prompt("Report reason:");
                if (reason) { await report.mutateAsync({ scope: "post", scope_id: p.id, reason }); toast({ title: "Reported" }); }
              }} className="text-[10px] text-muted-foreground inline-flex items-center gap-0.5 hover:text-destructive">
                <Flag className="h-2.5 w-2.5" /> Report
              </button>
            </div>
          </Card>
        ))}
      </main>

      {!thread.is_locked && (
        <div className="fixed bottom-0 left-0 right-0 p-3 bg-background/95 backdrop-blur border-t safe-bottom">
          <div className="max-w-2xl mx-auto flex gap-2">
            <Textarea rows={1} placeholder="Reply…" value={body} onChange={e => setBody(e.target.value)} className="resize-none" />
            <Button size="icon" disabled={!body.trim()} onClick={async () => {
              try { await reply.mutateAsync({ thread_id: threadId!, body }); setBody(""); }
              catch (e: any) { toast({ title: "Failed", description: e.message, variant: "destructive" }); }
            }}><Send className="h-4 w-4" /></Button>
          </div>
        </div>
      )}
    </div>
  );
}
