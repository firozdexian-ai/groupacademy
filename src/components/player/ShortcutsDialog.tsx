import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SHORTCUTS: { keys: string; label: string }[] = [
  { keys: "← / →", label: "Previous / next stage" },
  { keys: "[ / ]", label: "Previous / next module" },
  { keys: "Enter", label: "Mark current stage complete" },
  { keys: "?", label: "Show this help" },
];

export default function ShortcutsDialog({ open, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm font-black uppercase tracking-[0.2em]">
            Keyboard shortcuts
          </DialogTitle>
        </DialogHeader>
        <ul className="space-y-2 mt-4">
          {SHORTCUTS.map((s) => (
            <li key={s.keys} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{s.label}</span>
              <kbd className="px-2 py-1 rounded-md bg-muted text-[11px] font-mono font-bold">
                {s.keys}
              </kbd>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
