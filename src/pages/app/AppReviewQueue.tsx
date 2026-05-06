/**
 * AppReviewQueue — talent inbox of pending peer-review assignments.
 */
import { Link } from "react-router-dom";
import { Loader2, ClipboardList } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useReviewQueue } from "@/hooks/useDiscussions";
import { formatDistanceToNow } from "date-fns";

export default function AppReviewQueue() {
  const { data = [], isLoading } = useReviewQueue();
  if (isLoading) return <div className="flex justify-center mt-12"><Loader2 className="h-5 w-5 animate-spin" /></div>;

  return (
    <div className="max-w-2xl mx-auto pb-24 px-4 pt-4">
      <h1 className="text-xl font-bold tracking-tight inline-flex items-center gap-1.5">
        <ClipboardList className="h-4 w-4 text-primary" /> Peer reviews to do
      </h1>
      <p className="text-xs text-muted-foreground mt-1">Help your peers — and earn a peer-review credential.</p>

      <div className="mt-4 space-y-2">
        {data.length === 0 ? <Card className="p-4 text-xs text-muted-foreground">Inbox empty. You'll be notified when a new review lands.</Card> :
          data.map((a: any) => (
            <Card key={a.id} className="p-3 rounded-2xl">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{a.submission?.title ?? "Untitled submission"}</p>
                  <Badge variant="outline" className="text-[10px] mt-1">{a.submission?.kind}</Badge>
                </div>
                {a.due_at && (
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    Due {formatDistanceToNow(new Date(a.due_at), { addSuffix: true })}
                  </span>
                )}
              </div>
              <Button asChild size="sm" className="w-full mt-2 rounded-xl">
                <Link to={`/app/submissions/${a.submission_id}`}>Review now</Link>
              </Button>
            </Card>
          ))
        }
      </div>
    </div>
  );
}
