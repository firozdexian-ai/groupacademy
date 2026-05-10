import { Card } from "@/components/ui/card";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { type IRSnapshot } from "@/hooks/useUnitEconomics";

export function HitLCogsCard({ data }: { data: IRSnapshot[] }) {
  const series = data.map((s) => ({
    date: s.snapshot_date.slice(5),
    AI: Number(s.ai_inference_cogs_usd ?? 0),
    HitL: Number(s.hitl_labor_cogs_usd ?? 0),
  }));
  return (
    <Card className="p-4">
      <h3 className="text-sm font-semibold mb-1">AI Inference vs HitL Labor COGS</h3>
      <p className="text-xs text-muted-foreground mb-3">Cost of human oversight vs automated AI execution</p>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={series}>
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} />
            <Legend />
            <Area type="monotone" dataKey="AI" stackId="1" fill="hsl(var(--primary))" stroke="hsl(var(--primary))" />
            <Area
              type="monotone"
              dataKey="HitL"
              stackId="1"
              fill="hsl(var(--destructive))"
              stroke="hsl(var(--destructive))"
              fillOpacity={0.7}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
