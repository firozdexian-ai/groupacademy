import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, Check } from "lucide-react";
import { toast } from "sonner";
import { callContentAI, type AIContext } from "@/lib/contentAI";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  context: AIContext;
  onApply: (url: string) => void;
}

export function AICoverImageSheet({ open, onOpenChange, context, onApply }: Props) {
  const [prompts, setPrompts] = useState<string[] | null>(null);
  const [generating, setGenerating] = useState(false);
  const [picking, setPicking] = useState<number | null>(null);

  const loadPrompts = async () => {
    setGenerating(true);
    try {
      const res = await callContentAI<string[]>("image_prompt", context);
      setPrompts(res);
    } catch (e: any) { toast.error(e.message || "Failed"); }
    finally { setGenerating(false); }
  };

  const generateImage = async (idx: number) => {
    setPicking(idx);
    try {
      const url = await callContentAI<string>("cover_image", { ...context, cover_prompt: prompts![idx] });
      onApply(url);
      toast.success("Cover image applied");
      onOpenChange(false);
      setPrompts(null);
    } catch (e: any) { toast.error(e.message || "Failed"); }
    finally { setPicking(null); }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader><SheetTitle className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> AI Cover Image</SheetTitle></SheetHeader>
        <div className="mt-6 space-y-4">
          {!prompts && (
            <Button onClick={loadPrompts} disabled={generating} className="w-full">
              {generating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
              Generate 3 prompt options
            </Button>
          )}
          {prompts && prompts.map((p, i) => (
            <div key={i} className="border rounded-2xl p-4 space-y-3">
              <p className="text-sm">{p}</p>
              <Button size="sm" onClick={() => generateImage(i)} disabled={picking !== null} className="w-full">
                {picking === i ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <Check className="h-3 w-3 mr-2" />}
                Use this prompt
              </Button>
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
