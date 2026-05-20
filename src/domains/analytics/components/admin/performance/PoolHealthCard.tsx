import {
  poolStatusColor,
  QUIZ_POOL_TARGET,
  SCENARIO_POOL_TARGET,
  type ModuleStat,
} from "@/lib/coursePerformance";

interface Props {
  modules: ModuleStat[];
}

const dot: Record<"green" | "amber" | "red", string> = {
  green: "bg-emerald-500",
  amber: "bg-amber-500",
  red: "bg-destructive",
};

export default function PoolHealthCard({ modules }: Props) {
  if (!modules.length) {
    return <p className="text-sm text-muted-foreground">No modules to track.</p>;
  }
  return (
    <div className="space-y-3">
      {modules.map((m) => {
        const qColor = poolStatusColor(m.quizPoolSize, QUIZ_POOL_TARGET);
        const sColor = poolStatusColor(m.scenarioPoolSize, SCENARIO_POOL_TARGET);
        return (
          <div key={m.id} className="rounded-2xl border border-border/40 p-3 space-y-2">
            <div className="text-xs font-bold truncate">{m.title}</div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${dot[qColor]}`} />
                <span className="font-bold uppercase tracking-wider text-muted-foreground">Quiz</span>
                <span className="ml-auto tabular-nums">
                  {m.quizPoolSize}/{QUIZ_POOL_TARGET}
                  {m.quizPoolLowQuality > 0 && (
                    <span className="text-destructive"> · {m.quizPoolLowQuality} low</span>
                  )}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${dot[sColor]}`} />
                <span className="font-bold uppercase tracking-wider text-muted-foreground">Scen.</span>
                <span className="ml-auto tabular-nums">
                  {m.scenarioPoolSize}/{SCENARIO_POOL_TARGET}
                  {m.scenarioPoolLowQuality > 0 && (
                    <span className="text-destructive"> · {m.scenarioPoolLowQuality} low</span>
                  )}
                </span>
              </div>
              <div className="text-muted-foreground">Served: {m.quizPoolServed}</div>
              <div className="text-muted-foreground">Served: {m.scenarioPoolServed}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
