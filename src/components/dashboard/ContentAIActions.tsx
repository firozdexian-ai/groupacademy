import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { callContentAI, type AIMode, type AIContext } from "@/lib/contentAI";
import { cn } from "@/lib/utils";

interface Props {
  mode: AIMode;
  context: AIContext;
  onResult: (result: any) => void;
  label?: string;
  className?: string;
  size?: "sm" | "default";
}

export function AIActionButton({ mode, context, onResult, label = "AI", className, size = "sm" }: Props) {
  const [busy, setBusy] = useState(false);
  const run = async () => {
    setBusy(true);
    try {
      const result = await callContentAI(mode, context);
      onResult(result);
      toast.success(`AI ${mode} ready`);
    } catch (e: any) {
      const msg = e?.message || "AI request failed";
      if (msg.includes("credits") || msg.includes("402")) toast.error("AI credits exhausted. Please top up.");
      else if (msg.includes("Rate") || msg.includes("429")) toast.error("Rate limited, try again shortly.");
      else toast.error(msg);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Button type="button" variant="outline" size={size} disabled={busy} onClick={run}
      className={cn("h-7 px-2 text-[10px] font-bold uppercase tracking-widest gap-1 rounded-lg border-primary/30 text-primary hover:bg-primary/10", className)}>
      {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
      {label}
    </Button>
  );
}
