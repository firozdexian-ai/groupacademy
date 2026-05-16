import * as React from "react";
import { useToast } from "@/hooks/use-toast";
import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from "@/components/ui/toast";

/**
 * GroUp Academy: Authoritative Local Signal Orchestrator Hub (Toaster)
 * Hardened transitional state loop managing global toast notifications with zero visual jitter and absolute token symmetry.
 * Version: Launch Candidate · Phase Z0 Lifecycle & Layout Hardened
 */
export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider swipeDirection="right" duration={4000}>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={`signal-notification-node-${id}`} {...props}>
            {/* HUD LEVEL 1: ISOLATED METADATA CONTEXT CONTENT TRACKS */}
            <div className="flex flex-col flex-1 min-w-0 leading-none space-y-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && <ToastDescription>{description}</ToastDescription>}
            </div>

            {/* HUD LEVEL 2: ACTION INTERACTION INGRESS SLOT */}
            {action && (
              <div className="flex shrink-0 items-center justify-center pl-1 self-center select-none">{action}</div>
            )}

            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
