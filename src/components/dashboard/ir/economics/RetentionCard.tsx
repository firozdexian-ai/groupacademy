import { Card } from "@/components/ui/card";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { type IRSnapshot } from "@/hooks/useUnitEconomics";

export function RetentionCard({ data }: { data: IRSnapshot[] }) {
  const series = data.map((s) => ({
    date: s.snapshot_date.slice(5),
    NRR: s.net_revenue_retention_pct == null ? null : Number(s.net_revenue_retention_pct),
    GRR: s.gross_revenue_retention_pct == null ? null : Number(s.gross_revenue_retention_pct),
    Usage: s.usage_retention_pct == null ? null : Number(s.usage_retention_pct),
  }));
  return (
    <Card className="p-4">
      <h3 className="text-sm font-semibold mb-1">Retention (NRR / GRR / Usage)</h3>
      <p className="text-xs text-muted-foreground mb-3">Top quartile NRR ≥ 120%</p>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={series}>
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} unit="%" />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="NRR" stroke="hsl(var(--primary))" strokeWidth={2} />
            <Line type="monotone" dataKey="GRR" stroke="hsl(var(--chart-2, 142 76% 36%))" strokeWidth={2} />
            <Line type="monotone" dataKey="Usage" stroke="hsl(var(--muted-foreground))" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
