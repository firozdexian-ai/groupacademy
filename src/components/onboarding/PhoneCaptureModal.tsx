import { Dialog, DialogPortal, DialogOverlay } from "@/components/ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { LogOut } from "lucide-react";
import { PhoneCaptureStep } from "./PhoneCaptureStep";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

interface Props {
  open: boolean;
  onComplete: () => void;
}

/**
 * Uncloseable modal that gates the app until a phone number is captured.
 * Used for OAuth users (and any talent missing a phone) per the mandatory
 * global phone capture rule. A small "Sign out" link in the corner is the
 * recovery hatch so users are never permanently locked out.
 */
export function PhoneCaptureModal({ open, onComplete }: Props) {
  const { signOut } = useAuth();
  const block = (e: Event) => e.preventDefault();
  return (
    <Dialog open={open}>
      <DialogPortal>
        <DialogOverlay className="bg-slate-950/80 backdrop-blur-xl transition-all duration-300 z-40" />
        <DialogPrimitive.Content
          onPointerDownOutside={block}
          onEscapeKeyDown={block}
          onInteractOutside={block}
          className={cn(
            "fixed inset-0 z-50 flex items-center justify-center bg-background p-4 outline-none overflow-y-auto",
            "data-[state=open]:animate-in data-[state=open]:fade-in-0 duration-300",
          )}
        >
          <DialogPrimitive.Title className="sr-only">Add your phone number</DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            We need your phone number so employers can reach you about jobs.
          </DialogPrimitive.Description>

          <button
            type="button"
            onClick={() => signOut()}
            className="absolute top-5 right-5 z-20 inline-flex items-center gap-1.5 rounded-full border border-border/40 bg-card/80 backdrop-blur-md px-3 py-1.5 text-[11px] font-semibold text-muted-foreground hover:text-foreground hover:bg-card transition-colors shadow-sm"
            aria-label="Sign out"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign out</span>
          </button>

          <div className="w-full max-w-md">
            <PhoneCaptureStep onContinue={onComplete} />
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
