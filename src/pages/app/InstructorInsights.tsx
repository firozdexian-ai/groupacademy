import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuthoringTrends } from "@/hooks/useAuthoringTrends";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingUp, AlertTriangle, Sparkles, ArrowLeft } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

const FLAG_COLORS: Record<string, string> = {
  low_p_value: "hsl(var(--destructive))",
  miscalibrated: "hsl(var(--warning, 38 92% 50%))",
  stale: "hsl(var(--muted-foreground))",
  trivial: "hsl(var(--primary))",
};

export default function InstructorInsights() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const overrideId = params.get("instructor");
  const [meId, setMeId] = useState<string | undefined>();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setMeId(data.user?.id));
  }, []);

  const instructorId = overrideId || meId;
  const { data, loading } = useAuthoringTrends(instructorId, 30);

  const flagPie = useMemo(() => {
    if (!data?.flag_breakdown) return [];
    return Object.entries(data.flag_breakdown)
      .filter(([, v]) => (v as number) > 0)
      .map(([k, v]) => ({ name: k.replace("_", " "), value: v as number, key: k }));
  }, [data]);

  if (!instructorId) return null;

  return (
    <div className="container max-w-5xl py-6 space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => navigate("/app/instructor/review-queue")}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Review Queue
        </Button>
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-primary" /> Authoring Insights
        </h1>
        <Badge variant="outline">last {data?.window_days ?? 30} days</Badge>
      </div>

      {loading || !data ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading trends…
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <StatCard label="Courses" value={data.totals.courses} />
            <StatCard label="Modules" value={data.totals.modules} />
            <StatCard label="Items" value={data.totals.items} />
            <StatCard
              label="Flagged"
              value={data.totals.flagged_items}
              tone={data.totals.flagged_items > 0 ? "warning" : "ok"}
            />
            <StatCard label="Translations" value={data.totals.translated_items} />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" /> Flag breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="h-64">
                {flagPie.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center mt-12">No flagged items 🎉</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={flagPie} dataKey="value" nameKey="name" outerRadius={80} label>
                        {flagPie.map((d, i) => (
                          <Cell key={i} fill={FLAG_COLORS[d.key] ?? "hsl(var(--primary))"} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" /> AI assistance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Row label="Rewrites applied" value={data.ai_assist.rewrites_applied} />
                <Row label="Translations applied" value={data.ai_assist.translations_applied} />
              </CardContent>
            </Card>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">⚠ Hotspot courses</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {data.hotspots.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No hotspots — nicely balanced.</p>
                ) : (
                  data.hotspots.map((h) => (
                    <button
                      key={h.course_id}
                      onClick={() => navigate(`/app/instructor/review-queue?course=${h.course_id}`)}
                      className="flex w-full items-center justify-between p-2 rounded-md hover:bg-muted text-sm"
                    >
                      <span className="truncate">{h.course_title}</span>
                      <Badge variant="destructive">{h.flagged_count} flags</Badge>
                    </button>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">✅ Most improved</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {data.wins.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No revisions in window yet.</p>
                ) : (
                  data.wins.map((w) => (
                    <div key={w.course_id} className="flex items-center justify-between p-2 rounded-md text-sm">
                      <span className="truncate">{w.course_title}</span>
                      <Badge variant="secondary">{w.resolved_count} revisions</Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, tone }: { label: string; value: number; tone?: "warning" | "ok" }) {
  return (
    <Card>
      <CardContent className="p-3">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div
          className={`text-2xl font-semibold ${
            tone === "warning" ? "text-destructive" : tone === "ok" ? "text-emerald-600" : ""
          }`}
        >
          {value}
        </div>
      </CardContent>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
