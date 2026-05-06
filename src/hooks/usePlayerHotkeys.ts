import { useEffect } from "react";

interface PlayerHotkeys {
  onPrevStage?: () => void;
  onNextStage?: () => void;
  onPrevModule?: () => void;
  onNextModule?: () => void;
  onComplete?: () => void;
  onShowShortcuts?: () => void;
  enabled?: boolean;
}

function isEditable(el: Element | null): boolean {
  if (!el) return false;
  const tag = el.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  return (el as HTMLElement).isContentEditable;
}

export function usePlayerHotkeys({
  onPrevStage,
  onNextStage,
  onPrevModule,
  onNextModule,
  onComplete,
  onShowShortcuts,
  enabled = true,
}: PlayerHotkeys) {
  useEffect(() => {
    if (!enabled) return;
    const handler = (e: KeyboardEvent) => {
      if (isEditable(document.activeElement)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      switch (e.key) {
        case "ArrowLeft":
          if (onPrevStage) {
            e.preventDefault();
            onPrevStage();
          }
          break;
        case "ArrowRight":
          if (onNextStage) {
            e.preventDefault();
            onNextStage();
          }
          break;
        case "[":
          if (onPrevModule) {
            e.preventDefault();
            onPrevModule();
          }
          break;
        case "]":
          if (onNextModule) {
            e.preventDefault();
            onNextModule();
          }
          break;
        case "Enter":
          if (onComplete) {
            e.preventDefault();
            onComplete();
          }
          break;
        case "?":
          if (onShowShortcuts) {
            e.preventDefault();
            onShowShortcuts();
          }
          break;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [enabled, onPrevStage, onNextStage, onPrevModule, onNextModule, onComplete, onShowShortcuts]);
}
