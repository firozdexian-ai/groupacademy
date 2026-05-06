import { ReactNode } from "react";

interface Props {
  stageKey: number | string;
  children: ReactNode;
}

/**
 * Animates stage transitions with a slide-fade.
 * Uses `key` remount + Tailwind animation utilities (no framer-motion dep).
 * Respects user prefers-reduced-motion via `motion-safe:` Tailwind variants.
 */
export default function StageShell({ stageKey, children }: Props) {
  return (
    <div
      key={stageKey}
      className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-right-4 motion-safe:duration-300"
    >
      {children}
    </div>
  );
}
