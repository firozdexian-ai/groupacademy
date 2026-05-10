import { useState } from "react";
import { useUnitEconomics } from "@/hooks/useUnitEconomics";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, TrendingUp, TrendingDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { RetentionCard } from "./RetentionCard";
import { HitLCogsCard } from "./HitLCogsCard";
import { RevPerEmployeeCard } from "./RevPerEmployeeCard";
import { MetricEntrySheet } from "./MetricEntrySheet";

function KpiTile({
  label,
  value,
  suffix = "",
  delta,
}: {
  label: string;
  value: string | number | null;
  suffix?: string;
  delta?: number | null;
}) {
  return (
    <Card className="p-4">
      <div className="text-xs text-muted-foreground uppercase tracking-wide">{label}</div>
      <div className="text-2xl font-bold mt-1">
        {value == null || value === "" ? "—" : `${value}${suffix}`}
      </div>
      {delta != null && (
        <Badge variant="outline" className={`mt-2 text-xs ${delta >= 0 ? "text-green-600" : "text-destructive"}`}>
          {delta >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
          {delta.toFixed(1)}%
        </Badge>
      )}
    </Card>
  );
}

export function UnitEconomics() {
  const { snapshots, ordered, kpis } = useUnitEconomics();
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">AI-Era Unit Economics</h1>
          <p className="text-sm text-muted-foreground">
            Software 3.0 metrics: retention, AI vs HitL cost mix, capital efficiency.
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Log Snapshot
        </Button>
      </div>

      {snapshots.isLoading && <Skeleton className="h-32 w-full" />}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiTile label="NRR" value={kpis.nrr ?? "—"} suffix="%" delta={kpis.deltas.nrr} />
        <KpiTile label="GRR" value={kpis.grr ?? "—"} suffix="%" delta={kpis.deltas.grr} />
        <KpiTile label="Usage Retention" value={kpis.usageRetention ?? "—"} suffix="%" />
        <KpiTile
          label="Rev / Employee"
          value={kpis.revPerEmp ? `$${Number(kpis.revPerEmp).toLocaleString()}` : null}
          delta={kpis.deltas.revPerEmp}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <RetentionCard data={ordered} />
        <HitLCogsCard data={ordered} />
        <RevPerEmployeeCard data={ordered} />
      </div>

      <MetricEntrySheet open={open} onOpenChange={setOpen} />
    </div>
  );
}

export default UnitEconomics;
