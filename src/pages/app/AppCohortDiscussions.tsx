/**
 * AppCohortDiscussions — list of threads + composer for a cohort.
 */
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ChevronLeft, MessageSquare, Pin, Lock, Plus, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { useDiscussionThreads, useCreateThread } from "@/hooks/useDiscussions";
import { useToast } from "@/hooks/use-toast";

export default function AppCohortDiscussions() {
  const { cohortId } = useParams<{ cohortId: string }>();
  const { data = [], isLoading } = useDiscussionThreads(cohortId);
  const create = useCreateThread();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", body: "" });

  return (
    <div className="max-w-2xl mx-auto pb-24">
      <header className="px-4 pt-4 pb-2">
        <Link to={`/app/cohorts/${cohortId}`} className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <ChevronLeft className="h-3 w-3" /> Cohort
        </Link>
        <div className="flex items-center justify-between mt-1">
          <h1 className="text-xl font-bold tracking-tight inline-flex items-center gap-1.5">
            <MessageSquare className="h-4 w-4 text-primary" /> Discussions
          </h1>
          <Button size="sm" onClick={() => setOpen(true)}><Plus className="h-3.5 w-3.5 mr-1" />New</Button>
        </div>
      </header>

      <main className="px-4 mt-3 space-y-2">
        {isLoading ? <Loader2 className="h-5 w-5 animate-spin mx-auto mt-6" /> :
          data.length === 0 ? <Card className="p-4 text-xs text-muted-foreground">No threads yet — start the conversation.</Card> :
          data.map((t: any) => (
            <Link key={t.id} to={`/app/cohorts/${cohortId}/discussions/${t.id}`}>
              <Card className="p-3 rounded-2xl hover:bg-accent/30 transition">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{t.title}</p>
                    <p className="text-[11px] text-muted-foreground line-clamp-2">{t.body}</p>
                  </div>
                  <div className="flex flex-col gap-1 items-end shrink-0">
                    {t.is_pinned && <Pin className="h-3 w-3 text-amber-500" />}
                    {t.is_locked && <Lock className="h-3 w-3 text-muted-foreground" />}
                    <Badge variant="secondary" className="text-[10px]">{t.post_count}</Badge>
                  </div>
                </div>
              </Card>
            </Link>
          ))
        }
      </main>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl max-h-[80vh] overflow-y-auto">
          <SheetHeader><SheetTitle>New thread</SheetTitle></SheetHeader>
          <div className="space-y-2 mt-3">
            <Input placeholder="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            <Textarea placeholder="What do you want to discuss?" rows={5} value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} />
            <Button className="w-full" onClick={async () => {
              try { await create.mutateAsync({ cohort_id: cohortId!, ...form }); toast({ title: "Thread posted" }); setOpen(false); setForm({ title: "", body: "" }); }
              catch (e: any) { toast({ title: "Failed", description: e.message, variant: "destructive" }); }
            }}>Post thread</Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
