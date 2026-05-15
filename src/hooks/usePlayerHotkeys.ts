import { useEffect, useRef } from "react";

/**
 * GroUp Academy: Player Hotkeys & UX Fluidity Sensor (V5.6.0)
 * CTO Reference: High-performance client-side macro input bindings for workspace navigation.
 * Architecture: Ref-isolated listeners to prevent N-cycle listener teardown.
 * Phase: Z0 Code Freeze Hardened (May 2026).
 */

interface PlayerHotkeys {
  onPrevStage?: () => void;
  onNextStage?: () => void;
  onPrevModule?: () => void;
  onNextModule?: () => void;
  onComplete?: () => void;
  onShowShortcuts?: () => void;
  enabled?: boolean;
}

/**
 * Validates focus context to prevent macro conflicts inside native entry components.
 */
function isEditable(el: Element | null): boolean {
  if (!el) return false;
  const tag = el.tagName;

  // Guard baseline native text input vectors
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;

  // Guard rich code editors or custom IDE cells utilized in practice workflows
  if (el.classList.contains("cm-content") || el.getAttribute("role") === "textbox") return true;

  return (el as HTMLElement).isContentEditable;
}

/**
 * Attaches keyboard shortcut listeners to target elements.
 * Employs stable reference routing to ensure zero listener re-binding loops.
 */
export function usePlayerHotkeys({
  onPrevStage,
  onNextStage,
  onPrevModule,
  onNextModule,
  onComplete,
  onShowShortcuts,
  enabled = true,
}: PlayerHotkeys) {
  // HUD: CONSOLIDATING_MUTABLE_CALLBACK_MATRIX
  // Caches fresh callbacks in refs to decouple the browser listener from render lifecycles
  const actionsRef = useRef({
    onPrevStage,
    onNextStage,
    onPrevModule,
    onNextModule,
    onComplete,
    onShowShortcuts,
  });

  // Keep references perfectly aligned with the latest component state
  useEffect(() => {
    actionsRef.current = {
      onPrevStage,
      onNextStage,
      onPrevModule,
      onNextModule,
      onComplete,
      onShowShortcuts,
    };
  }, [onPrevStage, onNextStage, onPrevModule, onNextModule, onComplete, onShowShortcuts]);

  useEffect(() => {
    if (!enabled) return;

    const handler = (e: KeyboardEvent) => {
      try {
        if (isEditable(document.activeElement)) return;

        // Prevent macro overrides when system meta combinations are initialized
        if (e.metaKey || e.ctrlKey || e.altKey) return;

        const actions = actionsRef.current;

        switch (e.key) {
          case "ArrowLeft":
            if (actions.onPrevStage) {
              e.preventDefault();
              actions.onPrevStage();
            }
            break;
          case "ArrowRight":
            if (actions.onNextStage) {
              e.preventDefault();
              actions.onNextStage();
            }
            break;
          case "[":
            if (actions.onPrevModule) {
              e.preventDefault();
              actions.onPrevModule();
            }
            break;
          case "]":
            if (actions.onNextModule) {
              e.preventDefault();
              actions.onNextModule();
            }
            break;
          case "Enter":
            if (actions.onComplete) {
              e.preventDefault();
              actions.onComplete();
            }
            break;
          case "?":
            if (actions.onShowShortcuts) {
              e.preventDefault();
              actions.onShowShortcuts();
            }
            break;
          default:
            break;
        }
      } catch (err) {
        console.error("[Digital Workforce] ANOMALY: Keyboard interface callback execution crashed.", err);
      }
    };

    // HUD: BINDING_SYSTEM_WINDOW_LISTENER
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [enabled]);
}
