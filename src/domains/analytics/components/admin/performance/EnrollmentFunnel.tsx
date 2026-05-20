interface Props {
  funnel: { label: string; value: number }[];
}

export default function EnrollmentFunnel({ funnel }: Props) {
  const max = Math.max(1, ...funnel.map((f) => f.value));
  return (
    <div className="space-y-3">
      {funnel.map((f, i) => {
        const pct = (f.value / max) * 100;
        const conv = i === 0 ? 100 : funnel[0].value ? (f.value / funnel[0].value) * 100 : 0;
        return (
          <div key={f.label} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold uppercase tracking-wider text-muted-foreground">{f.label}</span>
              <span className="font-black tabular-nums">
                {f.value} <span className="text-muted-foreground font-normal">· {conv.toFixed(0)}%</span>
              </span>
            </div>
            <div className="h-2.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-accent transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
