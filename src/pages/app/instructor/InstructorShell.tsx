/**
 * Phase 4.1 — Instructor Workspace shell.
 * Visible only to users with active course_engagements.
 */
import { useState } from "react";
import { Navigate, Link, useSearchParams } from "react-router-dom";
import {
  GraduationCap,
  BookOpen,
  Wallet,
  Sparkles,
  ListChecks,
  BarChart3,
  Loader2,
} from "lucide-react";
import { useInstructorSummary } from "@/hooks/useInstructorWorkspace";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const TABS = [
  { key: "courses", label: "My Courses", icon: BookOpen },
  { key: "credits", label: "AI Credits", icon: Sparkles },
  { key: "earnings", label: "Earnings", icon: Wallet },
  { key: "review", label: "Review Queue", icon: ListChecks },
  { key: "insights", label: "Insights", icon: BarChart3 },
] as const;

export default function InstructorShell() {
  const { data, isLoading } = useInstructorSummary();
  const [params, setParams] = useSearchParams();
  const tab = (params.get("tab") as (typeof TABS)[number]["key"]) ?? "courses";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const engagements = data?.engagements ?? [];
  if (engagements.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-12 text-center">
        <GraduationCap className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
        <h1 className="text-lg font-semibold">Instructor Workspace</h1>
        <p className="text-sm text-muted-foreground mt-2">
          You're not yet contracted to teach a course. We hire instructors through open course briefs.
        </p>
        <Button asChild className="mt-4" size="sm">
          <Link to="/app/jobs?kind=instructor">Browse open instructor briefs</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto pb-24">
      <header className="px-4 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-semibold tracking-tight">Instructor Workspace</h1>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          Author courses, track earnings, manage AI credits.
        </p>
      </header>

      {/* Tabs */}
      <div className="px-4 mt-2 flex gap-1.5 overflow-x-auto pb-2 -mx-4 px-4">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setParams({ tab: t.key })}
              className={`shrink-0 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs ${
                tab === t.key
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      <main className="px-4 mt-3 space-y-2">
        {tab === "courses" && <CoursesPanel engagements={engagements} />}
        {tab === "credits" && <CreditsPanel credits={data?.credits ?? []} />}
        {tab === "earnings" && (
          <EarningsPanel total={data?.earnings_total ?? 0} pending={data?.earnings_pending ?? 0} />
        )}
        {tab === "review" && (
          <Card className="p-4 text-sm">
            <Link to="/app/instructor/review-queue" className="text-primary underline">
              Open review queue →
            </Link>
          </Card>
        )}
        {tab === "insights" && (
          <Card className="p-4 text-sm">
            <Link to="/app/instructor/insights" className="text-primary underline">
              Open authoring insights →
            </Link>
          </Card>
        )}
      </main>
    </div>
  );
}

function CoursesPanel({ engagements }: { engagements: any[] }) {
  return (
    <div className="space-y-2">
      {engagements.map((e) => (
        <Card key={e.id} className="p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{e.title ?? "Course"}</p>
              <div className="mt-1 flex flex-wrap gap-1">
                <Badge variant="outline" className="text-[10px]">{e.role}</Badge>
                <Badge variant="secondary" className="text-[10px]">
                  {e.author_status ?? "draft"}
                </Badge>
                <Badge variant="outline" className="text-[10px]">
                  {Number(e.revenue_share_pct).toFixed(0)}% share
                </Badge>
              </div>
            </div>
            <Button asChild size="sm" variant="outline">
              <Link to={`/app/instructor/course/${e.content_id}`}>Open</Link>
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}

function CreditsPanel({ credits }: { credits: any[] }) {
  if (credits.length === 0) {
    return <Card className="p-4 text-sm text-muted-foreground">No credit balances yet.</Card>;
  }
  return (
    <div className="space-y-2">
      {credits.map((c) => (
        <Card key={c.content_id} className="p-3 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">{Number(c.balance).toFixed(1)} AI credits</p>
            <p className="text-[11px] text-muted-foreground">
              Monthly grant: {Number(c.monthly_grant).toFixed(0)} • per course
            </p>
          </div>
          <Sparkles className="h-4 w-4 text-amber-400" />
        </Card>
      ))}
      <p className="text-[11px] text-muted-foreground px-1">
        Generate (0.3 cr/MCQ • 0.5 cr/scenario) • Rewrite (0.2 cr) • Translate (0.1 cr).
      </p>
    </div>
  );
}

function EarningsPanel({ total, pending }: { total: number; pending: number }) {
  return (
    <div className="space-y-2">
      <Card className="p-4">
        <p className="text-[11px] text-muted-foreground">Available + paid</p>
        <p className="text-2xl font-semibold mt-1">৳{Number(total).toFixed(0)}</p>
      </Card>
      <Card className="p-4">
        <p className="text-[11px] text-muted-foreground">Pending (clearing)</p>
        <p className="text-xl font-semibold mt-1">৳{Number(pending).toFixed(0)}</p>
      </Card>
      <p className="text-[11px] text-muted-foreground px-1">
        60% instructor / 40% platform on net revenue. Withdraw via your wallet.
      </p>
    </div>
  );
}
