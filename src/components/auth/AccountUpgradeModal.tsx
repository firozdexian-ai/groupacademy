import { Dialog, DialogPortal, DialogOverlay } from "@/components/ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";
import { Sparkles, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

interface AccountUpgradeModalProps {
  open: boolean;
  onComplete: () => void;
}

/**
 * Uncloseable gate shown to talents who completed signup before the new
 * onboarding fields existed. They re-run the short wizard to fill in the
 * missing details. A small "Sign out" escape hatch keeps users from being
 * permanently locked out if any lookup data is unavailable.
 */
export function AccountUpgradeModal({ open, onComplete }: AccountUpgradeModalProps) {
  const { signOut } = useAuth();
  const block = (e: Event) => e.preventDefault();

  return (
    <Dialog open={open}>
      <DialogPortal>
        <DialogOverlay className="bg-slate-950/80 backdrop-blur-xl transition-all duration-500 z-40" />
        <DialogPrimitive.Content
          onPointerDownOutside={block}
          onEscapeKeyDown={block}
          onInteractOutside={block}
          className={cn(
            "fixed inset-0 z-50 flex h-screen w-screen flex-col bg-background p-0 outline-none overflow-hidden select-none",
            "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-100 duration-500",
          )}
        >
          <DialogPrimitive.Title className="sr-only">Finish setting up your account</DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            We need a couple more details to personalize your experience.
          </DialogPrimitive.Description>

          <div className="h-1.5 w-full bg-gradient-to-r from-primary via-blue-600 to-primary shrink-0" />

          <div className="relative flex-1 w-full h-full">
            <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10 w-full max-w-md px-4 pointer-events-none">
              <div className="rounded-full border border-primary/20 bg-card/90 backdrop-blur-md px-4 py-2 shadow-xl flex items-center justify-center gap-2">
                <Sparkles className="h-4 w-4 text-primary shrink-0" />
                <span className="text-[11px] font-semibold text-primary leading-none">
                  Finish setting up your account
                </span>
              </div>
            </div>

            {/* Escape hatch — talents stuck on this gate (e.g. lookup data
                missing) can always sign out and contact support. */}
            <button
              type="button"
              onClick={() => signOut()}
              className="absolute top-5 right-5 z-20 pointer-events-auto inline-flex items-center gap-1.5 rounded-full border border-border/40 bg-card/80 backdrop-blur-md px-3 py-1.5 text-[11px] font-semibold text-muted-foreground hover:text-foreground hover:bg-card transition-colors shadow-sm"
              aria-label="Sign out"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign out</span>
            </button>

            <OnboardingWizard onComplete={onComplete} />
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
