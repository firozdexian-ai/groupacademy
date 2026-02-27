import { useState } from "react";
import { Coins, ChevronRight, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GigSubmissionForm } from "./GigSubmissionForm";
import { getIcon } from "@/lib/iconMap";

interface GigCardProps {
  gig: any;
  userSubmissions?: { total: number; pending: number };
}

export function GigCard({ gig, userSubmissions }: GigCardProps) {
  const [showForm, setShowForm] = useState(false);

  const Icon = getIcon(gig.icon);
  const isMaxed =
    gig.max_completions_per_user &&
    userSubmissions &&
    userSubmissions.total >= gig.max_completions_per_user;
  const hasPending = userSubmissions && userSubmissions.pending > 0;

  return (
    <>
      <div className="bg-card rounded-xl p-4 shadow-sm border border-border">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-semibold text-sm">{gig.title}</h3>
              <Badge
                variant="secondary"
                className="bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 gap-1 flex-shrink-0"
              >
                <Coins className="h-3 w-3" />
                +{gig.credit_reward}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {gig.description}
            </p>
            {gig.requirements && (
              <p className="text-xs text-muted-foreground/70 mt-1 italic">
                {gig.requirements}
              </p>
            )}
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-2">
                {userSubmissions && userSubmissions.total > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {userSubmissions.total} submitted
                  </span>
                )}
                {gig.max_completions_per_user && (
                  <span className="text-xs text-muted-foreground">
                    (max {gig.max_completions_per_user})
                  </span>
                )}
              </div>
              {isMaxed ? (
                <Badge variant="outline" className="text-xs gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Completed
                </Badge>
              ) : hasPending && (gig.max_completions_per_user ?? 1) <= 1 ? (
                <Badge variant="outline" className="text-xs">
                  Pending review
                </Badge>
              ) : (
                <div className="flex items-center gap-2">
                  {hasPending && (
                    <Badge variant="outline" className="text-xs">
                      {userSubmissions!.pending} pending
                    </Badge>
                  )}
                  <Button
                    size="sm"
                    className="h-8 text-xs gap-1"
                    onClick={() => setShowForm(true)}
                  >
                    Start <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <GigSubmissionForm
        gig={gig}
        open={showForm}
        onOpenChange={setShowForm}
      />
    </>
  );
}
