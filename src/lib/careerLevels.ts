export interface CareerLevel {
  level: number;
  label: string;
  min: number;
}

export const LEVELS: CareerLevel[] = [
  { level: 1, label: "Explorer", min: 0 },
  { level: 2, label: "Builder", min: 500 },
  { level: 3, label: "Contender", min: 2_000 },
  { level: 4, label: "Achiever", min: 5_000 },
  { level: 5, label: "Strategist", min: 12_000 },
  { level: 6, label: "Luminary", min: 25_000 },
  { level: 7, label: "Icon", min: 50_000 },
];

export interface CareerLevelInfo {
  level: number;
  label: string;
  current: number;
  currentTierMin: number;
  nextTierMin: number | null;
  nextLabel: string | null;
  progressPct: number;
  toNext: number;
}

export function computeCareerLevel(volume: number): CareerLevelInfo {
  const v = Math.max(0, volume || 0);
  let idx = 0;
  for (let i = 0; i < LEVELS.length; i++) {
    if (v >= LEVELS[i].min) idx = i;
  }
  const tier = LEVELS[idx];
  const next = LEVELS[idx + 1] ?? null;
  if (!next) {
    return {
      level: tier.level,
      label: tier.label,
      current: v,
      currentTierMin: tier.min,
      nextTierMin: null,
      nextLabel: null,
      progressPct: 100,
      toNext: 0,
    };
  }
  const span = next.min - tier.min;
  const into = v - tier.min;
  const progressPct = Math.max(0, Math.min(100, Math.round((into / span) * 100)));
  return {
    level: tier.level,
    label: tier.label,
    current: v,
    currentTierMin: tier.min,
    nextTierMin: next.min,
    nextLabel: next.label,
    progressPct,
    toNext: Math.max(0, next.min - v),
  };
}
