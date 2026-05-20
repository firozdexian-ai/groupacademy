import { Card } from "@/components/ui/card";
import { Users, Activity, CheckCircle2, TrendingUp } from "lucide-react";

interface Props {
  totalEnrollments: number;
  activeLast7d: number;
  completionRate: number;
  avgProgress: number;
}

export default function KPIStrip({ totalEnrollments, activeLast7d, completionRate, avgProgress }: Props) {
  const tiles = [
    { label: "Enrollments", value: totalEnrollments.toLocaleString(), icon: Users },
    { label: "Active · 7d", value: activeLast7d.toLocaleString(), icon: Activity },
    { label: "Completion", value: `${(completionRate * 100).toFixed(0)}%`, icon: CheckCircle2 },
    { label: "Avg progress", value: `${avgProgress.toFixed(0)}%`, icon: TrendingUp },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {tiles.map((t) => (
        <Card key={t.label} className="rounded-2xl border-border/40 p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <t.icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              {t.label}
            </div>
            <div className="text-xl font-black tracking-tight">{t.value}</div>
          </div>
        </Card>
      ))}
    </div>
  );
}
