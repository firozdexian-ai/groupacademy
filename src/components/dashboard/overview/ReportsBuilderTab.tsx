/**
 * Report Builder — Refactored Executive Canvas
 * CTO Version: May 2026
 * Fixes: P2, P7, P8 (Semantic Theming & Tooltip Visibility)
 */
import { useState } from "react";
import { Sparkles, Loader2, FileBarChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  Legend,
} from "recharts";

interface Section {
  kind: "kpi" | "bar" | "line" | "pie" | "note";
  title: string;
  source?: { fn: string; metric?: string; dimension?: string; granularity?: string; n?: number };
  note?: string;
}
interface Spec {
  title: string;
  period?: { from?: string; to?: string };
  sections: Section[];
}

const SUGGESTIONS = [
  "Month-on-month talent growth, last 12 months",
  "Job distribution across countries this quarter",
  "Credit economy: issued vs spent, last 6 months",
  "Top 10 services by revenue, this quarter",
];

// P7: Derived from real semantic theme tokens (only tokens that exist in index.css)
const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(var(--success))",
  "hsl(var(--warning))",
  "hsl(var(--secondary))",
  "hsl(var(--destructive))",
  "hsl(var(--ring))",
];

// P8: Shared tooltip styling for dark/light mode consistency
const SHARED_TOOLTIP_STYLE = {
  backgroundColor: "hsl(var(--popover))",
  borderColor: "hsl(var(--border))",
  color: "hsl(var(--popover-foreground))",
  borderRadius: "12px",
  fontSize: "12px",
  fontWeight: "600",
};

export function ReportsBuilderTab() {
  const [brief, setBrief] = useState("");
  const [loading, setLoading] = useState(false);
  const [spec, setSpec] = useState<Spec | null>(null);
  const [data, setData] = useState<Record<string, any>>({});

  const generate = async (text: string) => {
    if (!text.trim()) return;
    setLoading(true);
    setSpec(null);
    setData({});
    try {
      const { data: res, error } = await supabase.functions.invoke("admin-report-builder", {
        body: { brief: text },
      });
      if (error) throw error;
      const payload = res as any;
      if (payload?.error) {
        const detail = payload.detail
          ? ` — ${typeof payload.detail === "string" ? payload.detail : JSON.stringify(payload.detail)}`
          : "";
        throw new Error(`${payload.error}${detail}`);
      }
      setSpec(payload.spec);
      setData(payload.data ?? {});
    } catch (e: any) {
      toast({ title: "Report error", description: e?.message ?? String(e), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* P2: In-tab prompt row only (Page header provided by Dashboard shell) */}
      <Card className="rounded-[40px] border-2 border-border/40 bg-card/30 backdrop-blur-xl shadow-lg">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-4 w-4 text-primary animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 italic">
              AI Canvas Engine
            </span>
          </div>
          <Textarea
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            placeholder="Describe the insight you need..."
            className="rounded-2xl min-h-[100px] border-2 bg-background/50 focus-visible:ring-primary/20"
          />
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <Button
                key={s}
                variant="outline"
                size="sm"
                className="rounded-xl border-2 hover:bg-primary/5 hover:text-primary transition-colors"
                onClick={() => setBrief(s)}
              >
                {s}
              </Button>
            ))}
          </div>
          <Button
            onClick={() => generate(brief)}
            disabled={loading || !brief.trim()}
            className="rounded-2xl h-12 px-8 font-black uppercase tracking-widest text-xs gap-2"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Compile Leadership Report
          </Button>
        </CardContent>
      </Card>

      {spec && (
        <Card className="rounded-[40px] border-2 border-border/40 bg-background shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-700">
          <div className="h-1.5 w-full bg-gradient-to-r from-primary via-blue-600 to-primary" />
          <CardHeader className="border-b border-border/20 p-8">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-black tracking-tighter italic uppercase text-foreground">
                  {spec.title}
                </CardTitle>
                {spec.period?.from && (
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 italic mt-1">
                    Telemetry: {new Date(spec.period.from).toLocaleDateString()} —{" "}
                    {new Date(spec.period.to ?? "").toLocaleDateString()}
                  </p>
                )}
              </div>
              <FileBarChart className="h-8 w-8 text-primary/20" />
            </div>
          </CardHeader>
          <CardContent className="p-8 grid gap-8">
            {spec.sections.map((s, i) => (
              <SectionRender key={i} section={s} payload={data[i]} />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function SectionRender({ section, payload }: { section: Section; payload: any }) {
  if (section.kind === "note") {
    return (
      <div className="p-6 rounded-[24px] bg-muted/30 border border-border/30">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 italic mb-2">
          {section.title}
        </p>
        <p className="text-sm text-foreground/80 leading-relaxed">{section.note}</p>
      </div>
    );
  }
  if (section.kind === "kpi") {
    const value = payload?.value ?? 0;
    return (
      <div className="p-8 rounded-[32px] bg-primary/5 border-2 border-primary/10 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
          <FileBarChart className="h-12 w-12 text-primary" />
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 italic">
          {section.title}
        </p>
        <p className="text-6xl font-black italic tracking-tighter text-primary mt-4 leading-none">
          {Number(value).toLocaleString()}
        </p>
      </div>
    );
  }

  const rows = (payload?.rows ?? []).map((r: any) => ({
    label: r.label ?? (r.bucket ? new Date(r.bucket).toLocaleDateString() : ""),
    value: Number(r.value ?? 0),
  }));

  return (
    <div className="p-6 rounded-[32px] border-2 border-border/40 bg-card/50">
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 italic mb-6">
        {section.title}
      </p>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          {section.kind === "bar" ? (
            <BarChart data={rows}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="label" fontSize={10} axisLine={false} tickLine={false} />
              <YAxis fontSize={10} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={SHARED_TOOLTIP_STYLE} cursor={{ fill: "hsl(var(--primary)/0.05)" }} />
              {/* P7: Semantic color fill */}
              <Bar dataKey="value" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
            </BarChart>
          ) : section.kind === "line" ? (
            <LineChart data={rows}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="label" fontSize={10} axisLine={false} tickLine={false} />
              <YAxis fontSize={10} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={SHARED_TOOLTIP_STYLE} />
              {/* P7: Semantic stroke color */}
              <Line
                type="monotone"
                dataKey="value"
                stroke="hsl(var(--primary))"
                strokeWidth={3}
                dot={{ r: 4, fill: "hsl(var(--background))", strokeWidth: 2 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          ) : (
            <PieChart>
              <Pie data={rows} dataKey="value" nameKey="label" innerRadius={60} outerRadius={100} paddingAngle={5}>
                {rows.map((_: any, i: number) => (
                  <Cell
                    key={i}
                    fill={CHART_COLORS[i % CHART_COLORS.length]}
                    stroke="hsl(var(--background))"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip contentStyle={SHARED_TOOLTIP_STYLE} />
              <Legend iconType="circle" />
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
