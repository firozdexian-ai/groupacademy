import { Sparkles } from "lucide-react";
import { Dialog, DialogPortal, DialogOverlay } from "@/components/ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";
import { cn } from "@/lib/utils";

/**
 * Full-screen, uncloseable upgrade gate for legacy users who are missing
 * the new reference-table FKs (career_stage_id / institution_id).
 *
 * - No close button (X) is rendered.
 * - Outside-click & Escape are intercepted so the user cannot dismiss.
 * - The `OnboardingWizard` paints its own full-screen surface inside.
 */
export function AccountUpgradeModal({
  open,
  onComplete,
}: {
  open: boolean;
  onComplete: () => void;
}) {
  return (
    <Dialog open={open}>
      <DialogPortal>
        <DialogOverlay className="bg-slate-900/70 backdrop-blur-md" />
        <DialogPrimitive.Content
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
          className={cn(
            "fixed inset-0 z-50 flex h-screen w-screen flex-col bg-slate-50 p-0 outline-none",
            "data-[state=open]:animate-in data-[state=open]:fade-in-0",
          )}
        >
          <DialogPrimitive.Title className="sr-only">
            Confirm your details to unlock your Campus Agent
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            We&apos;ve upgraded our AI infrastructure. Please confirm a few details to unlock
            your Campus Agent and 250 credits.
          </DialogPrimitive.Description>

          {/* Welcome banner above the wizard (the wizard itself paints fixed inset-0,
              so it will overlay this banner; we keep the banner here for accessibility
              labels and a brief flash before the wizard mounts). */}
          <div className="pointer-events-none absolute left-1/2 top-6 z-[60] -translate-x-1/2 rounded-full border border-blue-200 bg-blue-50/95 px-4 py-1.5 text-xs font-semibold text-blue-700 shadow-sm">
            <span className="inline-flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              Quick upgrade · unlock your Campus Agent + 250 credits
            </span>
          </div>

          <OnboardingWizard onComplete={onComplete} />
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
