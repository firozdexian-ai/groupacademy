import { useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ReviewQueueRunner } from "@/components/learning/ReviewQueueRunner";

export default function LearningReview() {
  useEffect(() => {
    document.title = "Review Queue · Spaced Repetition";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute(
        "content",
        "Review topics due for spaced repetition and reinforce mastery across your courses.",
      );
    }
  }, []);

  return (
    <div className="min-h-screen pb-20">
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b">
        <div className="px-4 py-3 flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild className="h-8 w-8">
            <Link to="/app/learning" aria-label="Back to Learning Hub">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="min-w-0">
            <h1 className="text-base font-bold truncate">Review Queue</h1>
            <p className="text-[11px] text-muted-foreground truncate">
              Spaced repetition · keeps your skills sharp
            </p>
          </div>
        </div>
      </header>

      <main className="px-4 py-3 space-y-2">
        <ReviewQueueRunner />
      </main>
    </div>
  );
}
