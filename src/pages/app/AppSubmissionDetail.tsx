/**
 * AppSubmissionDetail — submission viewer + rubric reviewer (when assigned).
 */
import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ChevronLeft, Loader2, Send } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useSubmission, useSubmitReview } from "@/hooks/useDiscussions";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const DEFAULT_RUBRIC = [
  { key: "clarity", label: "Clarity & structure" },
  { key: "completeness", label: "Completeness" },
  { key: "originality", label: "Originality" },
  { key: "execution", label: "Execution / polish" },
];

export default function AppSubmissionDetail() {
  const { submissionId } = useParams<{ submissionId: string }>();
  const { data, isLoading } = useSubmission(submissionId);
  const submit = useSubmitReview();
  const { user } = useAuth();
  const { toast } = useToast();
  const [scores, setScores] = useState<Record<string, number>>({});
  const [comments, setComments] = useState("");

  const isReviewer = useMemo(() =>
    !!data?.assignments.find((a: any) => a.reviewer_id === user?.id && a.status === "pending"),
    [data, user]);
  const alreadyReviewed = useMemo(() =>
    !!data?.reviews.find((r: any) => r.reviewer_id === user?.id),
    [data, user]);

  if (isLoading || !data) return <div className="flex justify-center mt-12"><Loader2 className="h-5 w-5 animate-spin" /></div>;
  const sub = data.submission;
  if (!sub) return <p className="text-center text-sm text-muted-foreground py-12">Submission not found.</p>;
  const isAuthor = sub.author_id === user?.id;

  const avg = Object.values(scores).length ? Object.values(scores).reduce((a, b) => a + b, 0) / Object.values(scores).length : 0;

  return (
    <div className="max-w-2xl mx-auto pb-24 px-4 pt-4">
      <Link to="/app/review-queue" className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <ChevronLeft className="h-3 w-3" /> Back
      </Link>
      <h1 className="text-xl font-bold tracking-tight mt-1">{sub.title ?? "Submission"}</h1>
      <div className="flex gap-1.5 mt-1">
        <Badge variant="outline" className="text-[10px]">{sub.kind}</Badge>
        <Badge variant="secondary" className="text-[10px]">{sub.status}</Badge>
        {sub.score != null && <Badge className="text-[10px] bg-emerald-500">Avg {Number(sub.score).toFixed(1)}</Badge>}
      </div>

      <Card className="p-3 mt-3 rounded-2xl">
        {sub.body?.summary ? <p className="text-sm whitespace-pre-wrap">{sub.body.summary}</p> : <p className="text-xs text-muted-foreground italic">No summary provided.</p>}
        {Array.isArray(sub.files) && sub.files.length > 0 && (
          <div className="mt-2 space-y-1">
            {sub.files.map((f: any, i: number) => (
              <a key={i} href={f.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary block truncate">
                📎 {f.name ?? f.url}
              </a>
            ))}
          </div>
        )}
      </Card>

      {(isAuthor || sub.status === "reviewed" || sub.status === "approved") && data.reviews.length > 0 && (
        <section className="mt-4">
          <h2 className="text-sm font-semibold mb-2">Reviews</h2>
          <div className="space-y-2">
            {data.reviews.map((r: any) => (
              <Card key={r.id} className="p-3 rounded-2xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">{r.is_instructor ? "Instructor" : "Peer reviewer"}</span>
                  {r.score != null && <Badge className="text-[10px]">Score {Number(r.score).toFixed(1)}</Badge>}
                </div>
                {r.comments && <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">{r.comments}</p>}
              </Card>
            ))}
          </div>
        </section>
      )}

      {isReviewer && !alreadyReviewed && (
        <section className="mt-4">
          <h2 className="text-sm font-semibold mb-2">Submit your review</h2>
          <Card className="p-3 rounded-2xl space-y-2">
            {DEFAULT_RUBRIC.map(c => (
              <div key={c.key} className="flex items-center justify-between gap-2">
                <span className="text-xs">{c.label}</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button key={n} onClick={() => setScores({ ...scores, [c.key]: n })}
                      className={`h-7 w-7 rounded-md text-xs border ${scores[c.key] === n ? "bg-primary text-primary-foreground border-primary" : "bg-card"}`}>{n}</button>
                  ))}
                </div>
              </div>
            ))}
            <Textarea rows={3} placeholder="Comments for the author…" value={comments} onChange={e => setComments(e.target.value)} />
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Avg {avg.toFixed(1)} / 5</span>
              <Button size="sm" disabled={Object.keys(scores).length < DEFAULT_RUBRIC.length} onClick={async () => {
                try {
                  await submit.mutateAsync({
                    submission_id: submissionId!,
                    rubric: DEFAULT_RUBRIC.map(c => ({ key: c.key, label: c.label, score: scores[c.key] })),
                    score: avg, comments,
                  });
                  toast({ title: "Review submitted — thanks!" });
                } catch (e: any) { toast({ title: "Failed", description: e.message, variant: "destructive" }); }
              }}><Send className="h-3.5 w-3.5 mr-1" />Submit review</Button>
            </div>
          </Card>
        </section>
      )}
    </div>
  );
}
