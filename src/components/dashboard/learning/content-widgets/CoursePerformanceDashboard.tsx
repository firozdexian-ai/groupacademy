import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3, Download, Layers, Activity, Sparkles } from "lucide-react";
import { useCoursePerformance, modulesToCsv } from "@/lib/coursePerformance";
import KPIStrip from "../../performance/KPIStrip";
import EnrollmentFunnel from "../../performance/EnrollmentFunnel";
import ModuleDropoffTable from "../../performance/ModuleDropoffTable";
import PoolHealthCard from "../../performance/PoolHealthCard";
import RecentActivityList from "../../performance/RecentActivityList";

interface Props {
  contentId: string;
  contentTitle?: string;
}

export default function CoursePerformanceDashboard({ contentId, contentTitle }: Props) {
  const { data, loading, error } = useCoursePerformance(contentId);

  const handleExport = () => {
    if (!data) return;
    const csv = modulesToCsv(data.modules);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(contentTitle || "course").replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-performance.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="rounded-3xl border-destructive/40">
        <CardContent className="p-6 text-sm text-destructive">{error}</CardContent>
      </Card>
    );
  }

  if (!data) return null;

  if (data.totalEnrollments === 0) {
    return (
      <Card className="rounded-3xl border-border/40">
        <CardContent className="p-12 text-center space-y-3">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
            <Sparkles className="h-6 w-6" />
          </div>
          <div className="text-lg font-black">No enrollments yet</div>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Once learners enroll in this course, performance metrics will appear here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
          Performance overview
        </h2>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          className="rounded-xl text-[10px] font-black uppercase tracking-widest"
        >
          <Download className="mr-2 h-3.5 w-3.5" /> Export CSV
        </Button>
      </div>

      <KPIStrip
        totalEnrollments={data.totalEnrollments}
        activeLast7d={data.activeLast7d}
        completionRate={data.completionRate}
        avgProgress={data.avgProgress}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="rounded-3xl border-border/40">
          <CardHeader className="bg-muted/30 border-b border-border/20 pb-3">
            <CardTitle className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" /> Enrollment funnel
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <EnrollmentFunnel funnel={data.funnel} />
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border/40">
          <CardHeader className="bg-muted/30 border-b border-border/20 pb-3">
            <CardTitle className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" /> Recent activity
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <RecentActivityList recent={data.recent} />
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-3xl border-border/40">
        <CardHeader className="bg-muted/30 border-b border-border/20 pb-3">
          <CardTitle className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" /> Per-module drop-off
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5">
          <ModuleDropoffTable modules={data.modules} />
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-border/40">
        <CardHeader className="bg-muted/30 border-b border-border/20 pb-3">
          <CardTitle className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" /> AI pool health
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5">
          <PoolHealthCard modules={data.modules} />
        </CardContent>
      </Card>
    </div>
  );
}
