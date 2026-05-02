/**
 * Report Builder — natural-language brief → executive canvas with charts.
 * Backed by /admin-report-builder edge function.
 */
import { useState } from "react";
import { Sparkles, Loader2, FileBarChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line,
  PieChart, Pie, Cell, CartesianGrid, Legend,
} from "recharts";

interface Section {
  kind: "kpi" | "bar" | "line" | "pie" | "note";
  title: string;
  source?: { fn: string; metric?: string; dimension?: string; granularity?: string; n?: number };
  note?: string;
}
interface Spec { title: string; period?: { from?: string; to?: string }; sections: Section[]; }

const SUGGESTIONS = [
  "Month-on-month talent growth, last 12 months",
  "Job distribution across countries this quarter",
  "Credit economy: issued vs spent, last 6 months",
  "Top 10 services by revenue, this quarter",
];
const COLORS = ["#2A7DDE", "#33E1E4", "#10D576", "#FFB020", "#A855F7", "#EF4444", "#0EA5E9", "#F97316"];

export function ReportsBuilderTab() {
  const [brief, setBrief] = useState("");
  const [loading, setLoading] = useState(false);
  const [spec, setSpec] = useState<Spec | null>(null);
  const [data, setData] = useState<Record<string, any>>({});

  const generate = async (text: string) => {
    if (!text.trim()) return;
    setLoading(true); setSpec(null); setData({});
    try {
      const { data: res, error } = await supabase.functions.invoke("admin-report-builder", {
        body: { brief: text },
      });
      if (error) throw error;
      const payload = res as any;
      if (payload?.error) {
        const detail = payload.detail ? ` — ${typeof payload.detail === "string" ? payload.detail : JSON.stringify(payload.detail)}` : "";
        throw new Error(`${payload.error}${detail}`);
      }
      setSpec(payload.spec); setData(payload.data ?? {});
    } catch (e: any) {
      toast({ title: "Report error", description: e?.message ?? String(e), variant: "destructive" });
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-muted/20 p-8 rounded-[40px] border-2 border-border/40 backdrop-blur-md">
        <div className="space-y-1">
          <div className="flex items-center gap-3 text-primary">
            <FileBarChart className="h-8 w-8" />
            <h2 className="text-3xl font-black uppercase tracking-tighter italic leading-none">Report Builder</h2>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 italic">
            Describe a report · AI builds the canvas
          </p>
        </div>
      </header>

      <Card className="rounded-[40px] border-2 border-border/40 bg-card/30 backdrop-blur-xl">
        <CardContent className="p-6 space-y-3">
          <Textarea
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            placeholder="e.g. Month-on-month talent growth, last 12 months"
            className="rounded-2xl min-h-[80px] border-2"
          />
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <Button key={s} variant="outline" size="sm" className="rounded-xl border-2" onClick={() => setBrief(s)}>{s}</Button>
            ))}
          </div>
          <Button onClick={() => generate(brief)} disabled={loading || !brief.trim()} className="rounded-2xl h-12 px-6 font-black uppercase tracking-widest text-xs">
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
            Generate report
          </Button>
        </CardContent>
      </Card>

      {spec && (
        <Card className="rounded-[40px] border-2 border-border/40 bg-background shadow-2xl overflow-hidden">
          <div className="h-1.5 w-full bg-gradient-to-r from-primary via-blue-600 to-primary" />
          <CardHeader className="border-b border-border/20 p-8">
            <CardTitle className="text-2xl font-black tracking-tighter italic uppercase">{spec.title}</CardTitle>
            {spec.period?.from && (
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 italic">
                {new Date(spec.period.from).toLocaleDateString()} — {new Date(spec.period.to ?? "").toLocaleDateString()}
              </p>
            )}
          </CardHeader>
          <CardContent className="p-6 grid gap-6">
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
      <div className="p-5 rounded-2xl bg-muted/30 border border-border/30">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 italic mb-1">{section.title}</p>
        <p className="text-sm">{section.note}</p>
      </div>
    );
  }
  if (section.kind === "kpi") {
    const value = payload?.value ?? 0;
    return (
      <div className="p-6 rounded-2xl bg-primary/5 border border-primary/20">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 italic">{section.title}</p>
        <p className="text-5xl font-black italic tracking-tighter text-primary mt-2 leading-none">
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
    <div className="p-5 rounded-2xl border border-border/30 bg-card">
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 italic mb-3">{section.title}</p>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          {section.kind === "bar" ? (
            <BarChart data={rows}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="label" fontSize={10} />
              <YAxis fontSize={10} />
              <Tooltip />
              <Bar dataKey="value" fill="#2A7DDE" radius={[6, 6, 0, 0]} />
            </BarChart>
          ) : section.kind === "line" ? (
            <LineChart data={rows}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="label" fontSize={10} />
              <YAxis fontSize={10} />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#2A7DDE" strokeWidth={2} dot={false} />
            </LineChart>
          ) : (
            <PieChart>
              <Pie data={rows} dataKey="value" nameKey="label" outerRadius={100} label>
                {rows.map((_: any, i: number) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip /><Legend />
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
