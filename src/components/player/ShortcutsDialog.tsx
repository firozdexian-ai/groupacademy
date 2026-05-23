import { useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { trackEvent } from "@/lib/errorTracking";
import { Command } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SHORTCUTS: { keys: string; label: string }[] = [
  { keys: "← / →", label: "Previous / next stage" },
  { keys: "[ / ]", label: "Previous / next module" },
  { keys: "Enter", label: "Complete stage" },
  { keys: "?", label: "Toggle shortcuts help" },
];

/**
 * GroUp Academy: Keyboard Shortcuts Accessibility Overlay (ShortcutsDialog)
 * An authoritative operational modal visualizing platform macro control bindings and hotkey definitions.
 * Version: Launch Candidate · Phase Z0 Hardened
 */
export default function ShortcutsDialog({ open, onOpenChange }: Props) {
  const isMountedRef = useRef<boolean>(true);

  // Monitor hotkey directory dialogue configurations via metrics pipelines
  useEffect(() => {
    isMountedRef.current = true;
    if (open) {
      trackEvent("keyboard_shortcuts_panel_opened");
    }
    return () => {
      isMountedRef.current = false;
    };
  }, [open]);

  return (
    <Dialog
      open={open}
      onOpenChange={(nextVisibilityState) => {
        onOpenChange(nextVisibilityState);
        if (!nextVisibilityState) trackEvent("keyboard_shortcuts_panel_closed");
      }}
    >
      <DialogContent className="max-w-sm rounded-2xl border border-border/40 bg-card/60 backdrop-blur-3xl p-5 shadow-2xl overflow-hidden text-left antialiased transform-gpu select-none">
        {/* HUD LEVEL 1: TITLE BANNER SEGMENT AREA */}
        <DialogHeader className="text-left leading-none border-b border-border/10 pb-3 w-full">
          <div className="flex items-center gap-2.5 w-full leading-none">
            <div className="h-7 w-7 rounded-lg bg-primary/10 border border-primary/5 text-primary flex items-center justify-center shrink-0 shadow-inner select-none">
              <Command className="h-4 w-4 stroke-[2.2]" />
            </div>
            <div className="min-w-0 flex flex-col justify-center leading-none flex-1">
              <DialogTitle className="text-xs sm:text-sm font-bold text-foreground uppercase tracking-wider leading-none">
                Hotkey Operations Directory
              </DialogTitle>
              <DialogDescription className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/50 leading-none pt-1">
                Macro acceleration input metrics
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* HUD LEVEL 2: SHORTCUT KEYS DIRECTORY RECORD ROWS */}
        <ul className="space-y-3 pt-3.5 w-full font-bold text-xs tracking-tight">
          {SHORTCUTS.map((shortcutItem) => (
            <li
              key={shortcutItem.keys}
              className="flex items-center justify-between gap-4 w-full border-b border-border/5 last:border-none pb-2.5 last:pb-0 font-semibold text-xs leading-none"
            >
              <span className="text-muted-foreground/80 truncate text-ellipsis pr-1 select-text leading-none">
                {shortcutItem.label}
              </span>
              <kbd className="px-2 h-6 rounded-md bg-muted/60 dark:bg-muted/30 border border-border/30 text-[10px] font-mono font-black tracking-tight flex items-center justify-center text-foreground/80 tabular-nums shadow-sm select-all">
                {shortcutItem.keys}
              </kbd>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
