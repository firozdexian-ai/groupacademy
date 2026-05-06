import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Flame, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const PRESETS = [5, 10, 25, 50];

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onConfirm: (qty: number) => Promise<void>;
}

export function HypeBoostSheet({ open, onOpenChange, onConfirm }: Props) {
  const [picked, setPicked] = useState<number>(10);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      await onConfirm(picked);
      onOpenChange(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader className="text-left">
          <SheetTitle className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-500" />
            Boost this post
          </SheetTitle>
          <SheetDescription>
            Send multiple hypes in one go. 1 credit each — 80% goes to the creator.
          </SheetDescription>
        </SheetHeader>

        <div className="grid grid-cols-4 gap-2 mt-4">
          {PRESETS.map((n) => (
            <button
              key={n}
              onClick={() => setPicked(n)}
              className={cn(
                "rounded-xl py-3 border text-sm font-semibold flex flex-col items-center gap-0.5 transition",
                picked === n
                  ? "bg-orange-500/10 border-orange-500 text-orange-700"
                  : "bg-card border-border/40 text-foreground hover:border-orange-500/40",
              )}
            >
              <span>{n}×</span>
              <span className="text-[10px] font-normal text-muted-foreground">{n} cr</span>
            </button>
          ))}
        </div>

        <Button onClick={submit} disabled={busy} className="w-full mt-4 gap-2">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Flame className="h-4 w-4" />}
          Send {picked} hype{picked > 1 ? "s" : ""}
        </Button>
      </SheetContent>
    </Sheet>
  );
}
