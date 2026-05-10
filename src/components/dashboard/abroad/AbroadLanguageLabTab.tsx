import { useAbroadGraph } from "hooks/useAbroadGraph";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Languages, Activity, Mic, Users, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

export function AbroadLanguageLabTab() {
  const { abroadGraphQuery } = useAbroadGraph();
  const { data, isLoading } = abroadGraphQuery;

  // Telemetry calculations
  const attempts = data?.ieltsAttempts || [];
  const scoredAttempts = attempts.filter((a) => a.score !== undefined && a.score !== null);
  const avgScore =
    scoredAttempts.length > 0
      ? (scoredAttempts.reduce((sum, a) => sum + (a.score || 0), 0) / scoredAttempts.length).toFixed(1)
      : "0.0";

  const pendingScoring = attempts.length - scoredAttempts.length;
  const activeUsers = new Set(attempts.map((a) => a.user_id)).size;

  return (
    <div className="space-y-10 animate-in fade-in duration-1000 p-4 md:p-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-muted/20 p-8 rounded-[40px] border-2 border-border/40 backdrop-blur-md">
        <div className="space-y-1 text-left">
          <div className="flex items-center gap-3 text-fuchsia-500">
            <Languages className="h-8 w-8 text-fuchsia-500 fill-fuchsia-500/20" />
            <h2 className="text-3xl font-black uppercase tracking-tighter italic leading-none text-foreground">
              Language Lab
            </h2>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 italic">
            Acoustic & Written Telemetry
          </p>
        </div>
      </header>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-[32px] bg-muted/40" />
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          {/* Telemetry KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricTile
              label="Avg Band Score"
              value={avgScore}
              icon={Trophy}
              color="text-fuchsia-500"
              bg="bg-fuchsia-500/10"
            />
            <MetricTile
              label="Total Submissions"
              value={attempts.length}
              icon={Mic}
              color="text-blue-500"
              bg="bg-blue-500/10"
            />
            <MetricTile
              label="Active Learners"
              value={activeUsers}
              icon={Users}
              color="text-emerald-500"
              bg="bg-emerald-500/10"
            />
            <MetricTile
              label="Pending AI Scoring"
              value={pendingScoring}
              icon={Activity}
              color="text-amber-500"
              bg="bg-amber-500/10"
            />
          </div>

          {/* Telemetry Stream */}
          <Card className="rounded-[40px] border-2 border-border/40 bg-card/30 shadow-2xl overflow-hidden backdrop-blur-xl">
            <div className="h-1.5 w-full bg-gradient-to-r from-fuchsia-400 via-pink-500 to-rose-600" />
            <CardContent className="p-8 flex flex-col items-center justify-center min-h-[300px] text-center space-y-4">
              <div className="h-20 w-20 rounded-full bg-fuchsia-500/10 flex items-center justify-center border-2 border-fuchsia-500/20">
                <Activity className="h-10 w-10 text-fuchsia-500 animate-pulse" />
              </div>
              <h3 className="font-black text-xl uppercase italic tracking-tight text-foreground/90">
                Signal Processing Active
              </h3>
              <p className="text-xs font-bold text-muted-foreground max-w-md">
                The Language Lab is currently operating as a read-only telemetry node. Audio submissions and mock scores
                are being aggregated from the IELTS Prompts module.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function MetricTile({ label, value, icon: Icon, color, bg }: any) {
  return (
    <Card className="rounded-[32px] border-2 border-border/40 bg-card/30 backdrop-blur-sm shadow-xl overflow-hidden hover:border-primary/30 transition-all group">
      <CardContent className="p-6 flex items-center gap-5">
        <div
          className={cn(
            "h-14 w-14 rounded-2xl flex items-center justify-center border-2 border-white/5 transition-transform group-hover:rotate-6 shadow-inner shrink-0",
            bg,
            color,
          )}
        >
          <Icon className="h-6 w-6" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground italic mb-1 truncate">
            {label}
          </p>
          <p className="text-4xl font-black italic tracking-tighter leading-none text-foreground/90">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default AbroadLanguageLabTab;
