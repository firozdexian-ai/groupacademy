import { useNavigate } from "react-router-dom";
import { Briefcase, Clock, CheckCircle, XCircle, Send, ChevronRight, Zap, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useApplicationHistory } from "@/hooks/useApplicationHistory";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Application Pipeline Tracker
 * CTO Reference: Authoritative node for monitoring talent-to-employer synchronization states.
 */

const STATUS_CONFIG: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: any; color: string }
> = {
  submitted: { label: "SUBMITTED", variant: "secondary", icon: Send, color: "text-blue-500" },
  under_review: { label: "REVIEWING", variant: "outline", icon: Clock, color: "text-amber-500" },
  shortlisted: { label: "MATCHED", variant: "default", icon: Target, color: "text-primary" },
  interview: { label: "INTERVIEWING", variant: "default", icon: Zap, color: "text-indigo-500" },
  rejected: { label: "ARCHIVED", variant: "destructive", icon: XCircle, color: "text-destructive" },
  hired: { label: "PLACED", variant: "default", icon: CheckCircle, color: "text-emerald-500" },
};

export function ApplicationHistoryCard() {
  const navigate = useNavigate();
  const { applications, isLoading, error } = useApplicationHistory();

  if (isLoading) {
    return (
      <Card className="rounded-[32px] border-2 border-border/40 bg-card/30">
        <CardHeader className="pb-4">
          <Skeleton className="h-6 w-32 rounded-lg" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-2xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-24 opacity-60" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-[32px] border-2 border-border/40 bg-card/30 shadow-xl overflow-hidden transition-all hover:border-primary/20">
      <CardHeader className="p-6 border-b border-border/10 bg-muted/5">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg font-black uppercase italic tracking-tighter flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" /> Application_Pipeline
            </CardTitle>
            <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground italic">
              Real-time sync with institutional partners
            </CardDescription>
          </div>
          {applications.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/app/jobs")}
              className="h-8 px-3 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-primary hover:text-white transition-all"
            >
              View_All <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {error ? (
          <div className="py-4 text-center">
            <p className="text-[10px] font-black uppercase text-destructive italic">{error}</p>
          </div>
        ) : applications.length === 0 ? (
          <div className="text-center py-8 space-y-4">
            <div className="h-16 w-16 bg-muted/20 border-2 border-dashed rounded-[24px] flex items-center justify-center mx-auto transition-transform hover:rotate-12">
              <Briefcase className="h-8 w-8 text-muted-foreground/40" />
            </div>
            <div className="space-y-1">
              <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground italic">
                Pipeline_Empty
              </p>
              <p className="text-xs text-muted-foreground/60">Initialize your professional trajectory today.</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/app/jobs")}
              className="h-10 px-6 rounded-xl border-2 font-black uppercase text-[10px] tracking-widest shadow-lg"
            >
              Discover Opportunities
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {applications.slice(0, 5).map((app) => {
              const status = STATUS_CONFIG[app.applicationStatus] || STATUS_CONFIG.submitted;
              const StatusIcon = status.icon;

              return (
                <div
                  key={app.id}
                  className="group flex items-center gap-4 p-4 rounded-[24px] hover:bg-primary/5 cursor-pointer transition-all border-2 border-transparent hover:border-primary/10"
                  onClick={() => navigate(`/app/jobs/${app.jobId}`)}
                >
                  <div className="h-12 w-12 bg-muted/30 border-2 border-border/10 rounded-[18px] flex items-center justify-center group-hover:bg-background transition-colors">
                    <Briefcase className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-black text-sm uppercase italic tracking-tight text-foreground truncate leading-none">
                      {app.jobTitle}
                    </p>
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest italic mt-2">
                      <span className="truncate">{app.companyName}</span>
                      <span className="opacity-30">|</span>
                      <span className="whitespace-nowrap opacity-60">
                        {formatDistanceToNow(new Date(app.appliedAt), { addSuffix: true })}
                      </span>
                    </div>
                  </div>

                  <Badge
                    variant={status.variant}
                    className={cn("h-7 px-3 rounded-lg font-black text-[9px] italic border-2 gap-1.5", status.color)}
                  >
                    <StatusIcon className="h-3 w-3" />
                    {status.label}
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
