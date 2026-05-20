import * as React from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, BarChart3, ChevronRight, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { authoringReviewDigest } from "@/domains/learning/api/learningApi";
import { EdgeFunctionError } from "@/edge/EdgeFunctionError";

// =========================================================================
// DETERMINISTIC COMPONENT DATA TYPE CONTRACTS
// =========================================================================
interface DigestSummary {
  flagged_quiz: number;
  flagged_scenarios: number;
  quiz_items: number;
  scenario_items: number;
}

interface WeakTopic {
  topic_tag: string;
  learner_mastery_mean: number | null;
}

interface ModuleDigest {
  module: { id: string; title: string; content_id: string };
  content: { id: string; title: string } | null;
  owner: { instructor_id: string; full_name: string | null; email: string | null } | null;
  summary: DigestSummary;
  weak_topics?: WeakTopic[];
}

/**
 * GroUp Academy: Authoritative Author Review Queue (InstructorReviewQueue)
 * Hardened responsive queue orchestrating parallel digestion of module flags and analytics.
 * Version: Launch Candidate · Phase Z1 Production Contract Locked
 */
export default function InstructorReviewQueue() {
  const [digests, setDigests] = React.useState<ModuleDigest[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isAdmin, setIsAdmin] = React.useState<boolean>(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Authentication credential session expired.");

      const { data: adminRole } = await supabase.from("user_roles")
        .select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
      setIsAdmin(!!adminRole);

      // Fetch managed content IDs
      let contentIds: string[] = [];
      if (adminRole) {
        const { data: courses } = await supabase.from("content").select("id").eq("is_published", true).limit(50);
        contentIds = courses?.map((c) => c.id) ?? [];
      } else {
        const { data: instructor } = await supabase.from("instructors").select("id").eq("email", user.email ?? "").maybeSingle();
        if (!instructor) throw new Error("No instructor profile mapped to account.");
        const { data: contentAccess } = await supabase.from("content_instructors").select("content_id").eq("instructor_id", instructor.id);
        contentIds = contentAccess?.map((r) => r.content_id) ?? [];
      }

      if (!contentIds.length) { setDigests([]); return; }

      const { data: modules } = await supabase.from("course_modules").select("id").in("content_id", contentIds);
      const moduleIds = modules?.map((m) => m.id) ?? [];

      // Optimize: Parallelize digest calls (capped at 10 for edge function safety)
      const batch = moduleIds.slice(0, 10);
      const results = await Promise.all(
        batch.map(async (mid) => {
          try {
            return (await authoringReviewDigest({ mode: "single", module_id: mid, days: 30 })) as unknown as ModuleDigest;
          } catch {
            return null;
          }
        })
      );

      const parsedDigests = results
        .filter((d): d is ModuleDigest => d !== null)
        .filter((d) => (d.summary.flagged_quiz + d.summary.flagged_scenarios) > 0)
        .sort((a, b) => {
          const totalB = b.summary.flagged_quiz + b.summary.flagged_scenarios;
          const totalA = a.summary.flagged_quiz + a.summary.flagged_scenarios;
          return totalB - totalA;
        });

      setDigests(parsedDigests);
    } catch (e: any) {
      setError(e?.message ?? "Pipeline synchronization failure.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { void load(); }, [load]);

  const handleWeeklyDispatch = async () => {
    toast.loading("Initiating global weekly digest distribution…", { id: "wd" });
    try {
      await authoringReviewDigest({ mode: "weekly", days: 7 });
      toast.dismiss("wd");
      toast.success("Digests transmitted.");
    } catch (err) {
      toast.dismiss("wd");
      toast.error(err instanceof EdgeFunctionError ? "Dispatch failure." : "Dispatch failure.");
    }
  };

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black uppercase tracking-tight">Review Queue</h1>
          <p className="text-xs text-muted-foreground">Learner-flagged content requiring author intervention.</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={load}><RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Refresh</Button>
          {isAdmin && <Button size="sm" onClick={handleWeeklyDispatch}>Dispatch Weekly</Button>}
        </div>
      </header>

      {loading && [...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}

      {error && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="py-6 text-center text-sm text-destructive font-medium">{error}</CardContent>
        </Card>
      )}

      {!loading && !error && digests.length === 0 && (
        <Card className="p-8 text-center text-sm text-muted-foreground">Everything is humming. No flags identified. 🎉</Card>
      )}

      {digests.map((d) => (
        <Card key={d.module.id} className="rounded-xl overflow-hidden">
          <CardHeader className="pb-3 bg-muted/20">
            <CardTitle className="text-sm flex justify-between items-center">
              <span className="truncate">{d.module.title}</span>
              <Badge variant="destructive" className="shrink-0 text-[10px]">
                {d.summary.flagged_quiz + d.summary.flagged_scenarios} Flags
              </Badge>
            </CardTitle>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{d.content?.title}</p>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="text-[10px] font-mono">{d.summary.flagged_quiz} Quiz Issues</Badge>
              <Badge variant="outline" className="text-[10px] font-mono">{d.summary.flagged_scenarios} Scenario Issues</Badge>
              {d.weak_topics?.slice(0, 3).map(t => (
                <Badge key={t.topic_tag} variant="secondary" className="text-[10px]">{t.topic_tag}</Badge>
              ))}
            </div>
            <Button asChild size="sm" variant="outline" className="w-full">
              <Link to={`/content/${d.module.content_id}/modules`}>
                <BarChart3 className="h-3.5 w-3.5 mr-2" /> View Analytics
              </Link>
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}