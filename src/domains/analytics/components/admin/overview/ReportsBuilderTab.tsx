/**
 * Reports Builder Canvas Dashboard View (Phase 10j.3 - Hardened).
 * Interfaces with the admin-report-builder edge infrastructure to compile dynamic
 * visual indicators and business analytical charts based on conversational inputs.
 * Conforms fully to 2024 Highly Professional SaaS UI guidelines.
 */
import { useState } from "react";
import { Sparkles, FileBarChart, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { adminReportBuilder } from "@/domains/analytics/api/analyticsApi";
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
import { InlineSpinner } from "@/components/common/InlineSpinner";

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

// Pure system semantic design matrix tokens mapped directly from tailwind configurations
const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(var(--success))",
  "hsl(var(--warning))",
  "hsl(var(--secondary))",
  "hsl(var(--destructive))",
  "hsl(var(--ring))",
];

// Cohesive tooltip configuration for accessible data inspections
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
  const [error, setError] = useState<string | null>(null);

  const generateReport = async (text: string) => {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    setSpec(null);
    setData({});

    try {
      // Invoke our unified, authorization-forwarding domain handler
      const result = await adminReportBuilder({ brief: text });
      const payload = result.data as any;

      if (payload?.error) {
        const detail = payload.detail
          ? ` — ${typeof payload.detail === "string" ? payload.detail : JSON.stringify(payload.detail)}`
          : "";
        throw new Error(`${payload.error}${detail}`);
      }

      setSpec(payload.spec);
      setData(payload.data ?? {});
    } catch (e: any) {
      console.error("[Digital Workforce Anomaly] Report configuration compilation failure:", e);
      setError(e?.message || "The platform was unable to compile the metrics layout for this request.");
      toast({
        title: "Report creation failed",
        description: "Please check your input string query or try another parameter template.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-6xl mx-auto">
      {/* Interactive Briefing Selector Panel */}
      <Card className="rounded-2xl border border-border bg-card shadow-sm">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold text-muted-foreground">AI Analytics Assistant</span>
          </div>

          <Textarea
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            placeholder="Describe the cross-sectional data or platform insight you want to view..."
            className="rounded-xl min-h-[90px] border border-input bg-background/50 focus-visible:ring-primary/20 text-sm leading-relaxed"
          />

          <div className="flex flex-wrap gap-2 pt-1">
            {SUGGESTIONS.map((suggestion) => (
              <Button
                key={suggestion}
                variant="outline"
                size="sm"
                className="rounded-xl text-xs font-medium border border-border hover:bg-primary/5 hover:text-primary transition-colors duration-200"
                onClick={() => setBrief(suggestion)}
              >
                {suggestion}
              </Button>
            ))}
          </div>

          <Button
            onClick={() => generateReport(brief)}
            disabled={loading || !brief.trim()}
            className="rounded-xl h-10 px-6 font-medium text-xs gap-2 shadow-sm"
          >
            {loading ? <InlineSpinner size="sm" /> : <Sparkles className="h-3.5 w-3.5" />}
            Generate Report
          </Button>
        </CardContent>
      </Card>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-xl flex items-center gap-3 text-sm text-destructive font-medium">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Compiled Content Workspace Output */}
      {spec && (
        <Card className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
          <div className="h-1 w-full bg-gradient-to-r from-primary via-indigo-500 to-accent" />

          <CardHeader className="border-b border-border p-6 bg-muted/10">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <CardTitle className="text-xl font-bold tracking-tight text-foreground">{spec.title}</CardTitle>
                {spec.period?.from && (
                  <CardDescription className="text-xs text-muted-foreground font-medium">
                    Reporting window: {new Date(spec.period.from).toLocaleDateString("en-US")} —{" "}
                    {new Date(spec.period.to ?? "").toLocaleDateString("en-US")}
                  </CardDescription>
                )}
              </div>
              <FileBarChart className="h-5 w-5 text-muted-foreground/40 shrink-0 mt-1" />
            </div>
          </CardHeader>

          <CardContent className="p-6 sm:p-8 space-y-6">
            {spec.sections.map((section, idx) => (
              <SectionRender key={idx} section={section} payload={data[idx]} />
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
      <div className="p-5 rounded-xl bg-muted/40 border border-border space-y-1">
        <h4 className="text-xs font-semibold text-muted-foreground">{section.title}</h4>
        <p className="text-sm text-foreground/90 leading-relaxed">{section.note}</p>
      </div>
    );
  }

  if (section.kind === "kpi") {
    const kpiValue = payload?.value ?? 0;
    return (
      <div className="p-6 rounded-xl bg-primary/5 border border-primary/10 relative overflow-hidden group">
        <div className="absolute top-4 right-4 opacity-10 group-hover:scale-105 transition-transform duration-300">
          <FileBarChart className="h-10 w-10 text-primary" />
        </div>
        <h4 className="text-xs font-semibold text-muted-foreground">{section.title}</h4>
        <p className="text-4xl font-bold tracking-tight text-primary mt-2 leading-none">
          {Number(kpiValue).toLocaleString()}
        </p>
      </div>
    );
  }

  const rows = (payload?.rows ?? []).map((row: any) => ({
    label: row.label ?? (row.bucket ? new Date(row.bucket).toLocaleDateString("en-US") : ""),
    value: Number(row.value ?? 0),
  }));

  return (
    <div className="p-5 rounded-xl border border-border bg-card space-y-4">
      <h4 className="text-xs font-semibold text-muted-foreground">{section.title}</h4>

      <div className="h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          {section.kind === "bar" ? (
            <BarChart data={rows} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="label"
                fontSize={11}
                stroke="hsl(var(--muted-foreground))"
                axisLine={false}
                tickLine={false}
              />
              <YAxis fontSize={11} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} />
              <Tooltip contentStyle={SHARED_TOOLTIP_STYLE} cursor={{ fill: "hsl(var(--primary)/0.04)" }} />
              <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          ) : section.kind === "line" ? (
            <LineChart data={rows} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="label"
                fontSize={11}
                stroke="hsl(var(--muted-foreground))"
                axisLine={false}
                tickLine={false}
              />
              <YAxis fontSize={11} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} />
              <Tooltip contentStyle={SHARED_TOOLTIP_STYLE} />
              <Line
                type="monotone"
                dataKey="value"
                stroke="hsl(var(--primary))"
                strokeWidth={2.5}
                dot={{ r: 4, fill: "hsl(var(--background))", strokeWidth: 2, stroke: "hsl(var(--primary))" }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          ) : (
            <PieChart>
              <Pie data={rows} dataKey="value" nameKey="label" innerRadius={60} outerRadius={90} paddingAngle={4}>
                {rows.map((_: any, idx: number) => (
                  <Cell
                    key={idx}
                    fill={CHART_COLORS[idx % CHART_COLORS.length]}
                    stroke="hsl(var(--background))"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip contentStyle={SHARED_TOOLTIP_STYLE} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
