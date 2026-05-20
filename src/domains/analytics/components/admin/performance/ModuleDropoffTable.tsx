import type { ModuleStat } from "@/lib/coursePerformance";

interface Props {
  modules: ModuleStat[];
}

export default function ModuleDropoffTable({ modules }: Props) {
  if (!modules.length) {
    return <p className="text-sm text-muted-foreground">No modules yet.</p>;
  }
  return (
    <div className="overflow-x-auto -mx-2">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            <th className="text-left px-2 py-2">#</th>
            <th className="text-left px-2 py-2">Module</th>
            <th className="text-right px-2 py-2">Reached</th>
            <th className="text-right px-2 py-2">Drop-off</th>
            <th className="text-right px-2 py-2">Quiz</th>
            <th className="text-right px-2 py-2">Scenario</th>
          </tr>
        </thead>
        <tbody>
          {modules.map((m, idx) => (
            <tr key={m.id} className="border-t border-border/40">
              <td className="px-2 py-2 text-muted-foreground tabular-nums">{idx + 1}</td>
              <td className="px-2 py-2 font-medium truncate max-w-[220px]">{m.title}</td>
              <td className="px-2 py-2 text-right tabular-nums">{m.reachedCount}</td>
              <td className="px-2 py-2 text-right tabular-nums">
                <span className={m.dropoffPct > 0.3 ? "text-destructive font-bold" : ""}>
                  {(m.dropoffPct * 100).toFixed(0)}%
                </span>
              </td>
              <td className="px-2 py-2 text-right tabular-nums">
                {m.quizAttempts}
                {m.quizAvgScore != null && (
                  <span className="text-muted-foreground"> · {m.quizAvgScore.toFixed(0)}%</span>
                )}
              </td>
              <td className="px-2 py-2 text-right tabular-nums">
                {m.scenarioRuns}
                {m.scenarioAvgScore != null && (
                  <span className="text-muted-foreground"> · {m.scenarioAvgScore.toFixed(0)}</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
