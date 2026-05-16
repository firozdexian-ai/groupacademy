import { ReactNode, useEffect, useState, useMemo } from "react";
import { trackError, trackEvent } from "@/lib/errorTracking";
import { cn } from "@/lib/utils";

interface Props {
  stageKey: number | string;
  children: ReactNode;
}

/**
 * GroUp Academy: Hardware-Accelerated Bimodal Stage Transition Shell (StageShell)
 * An authoritative wrapper layout enforcing accessible cross-fade state synchronizations
 * using pure CSS engine variables. Protects layout bounds from jarring structural pops.
 * Version: Launch Candidate · Phase Z0 Hardened
 */
export default function StageShell({ stageKey, children }: Props) {
  // Capture historical layout identity paths to isolate transitional state overlays
  const [activeBufferKey, setActiveBufferKey] = useState<number | string>(stageKey);
  const [isTransitionPhaseActive, setIsTransitionPhaseActive] = useState(false);
  const [cachedRenderBlock, setCachedRenderBlock] = useState<ReactNode>(children);

  // Monitor transitional viewport initialization triggers via telemetry trackers
  useEffect(() => {
    trackEvent("stage_shell_transition_initialized", {
      incomingKey: stageKey,
      activeKey: activeBufferKey,
    });
  }, [stageKey, activeBufferKey]);

  useEffect(() => {
    // If indices align, verify active element tracks match baseline parameters
    if (stageKey === activeBufferKey) {
      setCachedRenderBlock(children);
      return;
    }

    let isThreadActive = true;
    setIsTransitionPhaseActive(true);
    trackEvent("stage_shell_exit_fade_started", { outgoingKey: activeBufferKey });

    // Step A: Allow current stage context to fade out cleanly down layout frames
    const structuralExitAnimationTimerId = setTimeout(() => {
      try {
        if (isThreadActive) {
          setActiveBufferKey(stageKey);
          setCachedRenderBlock(children);
          setIsTransitionPhaseActive(false);
          trackEvent("stage_shell_ingress_slide_started", { incomingKey: stageKey });
        }
      } catch (err) {
        trackError(err, {
          component: "StageShell",
          action: "execute_transitional_flush_timer_callback",
        });
      }
    }, 180); // Corresponds accurately to exit duration curves

    return () => {
      isThreadActive = false;
      clearTimeout(structuralExitAnimationTimerId);
    };
  }, [stageKey, children, activeBufferKey]);

  return (
    <div
      className={cn(
        "w-full h-full min-w-0 flex flex-col justify-start text-left antialiased transform-gpu select-none sm:select-text",
        "will-change-[opacity,transform] transition-all ease-in-out duration-200",
        // Bimodal Layout Sequencing Filter Matrix Pass
        isTransitionPhaseActive
          ? "opacity-0 translate-y-0.5 scale-[0.995]" // Outgoing exit parameters bounds
          : "opacity-100 translate-y-0 scale-100 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-right-2 motion-safe:duration-300", // Ingress active setup
      )}
    >
      {cachedRenderBlock}
    </div>
  );
}
