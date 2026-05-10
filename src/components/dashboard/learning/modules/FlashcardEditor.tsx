import { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Trash2,
  Eye,
  Code,
  Copy,
  Check,
  RotateCcw,
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Layers,
  Terminal,
  ShieldCheck,
  Activity,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/**
 * Platform Logic: Knowledge Ingestion Terminal (Flashcard Editor)
 * High-fidelity orchestrator for artifact synthesis and logic-pair validation.
 * 2026 Standard: Executive Logic geometry with reinforced 3D kinetic preview.
 */

interface Flashcard {
  id: string;
  front: string;
  back: string;
}

interface FlashcardEditorProps {
  initialCards?: Flashcard[];
  onChange?: (cards: Flashcard[]) => void;
  onSave?: (json: string) => void;
}

export function FlashcardEditor({ initialCards = [], onChange, onSave }: FlashcardEditorProps) {
  const [cards, setCards] = useState<Flashcard[]>(
    initialCards.length > 0 ? initialCards : [{ id: crypto.randomUUID(), front: "", back: "" }],
  );
  const [activeTab, setActiveTab] = useState<"visual" | "json" | "preview">("visual");
  const [previewIndex, setPreviewIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [copied, setCopied] = useState(false);
  const [jsonInput, setJsonInput] = useState("");

  const updateRegistry = useCallback(
    (newCards: Flashcard[]) => {
      setCards(newCards);
      onChange?.(newCards);
    },
    [onChange],
  );

  const injectArtifact = () => {
    updateRegistry([...cards, { id: crypto.randomUUID(), front: "", back: "" }]);
  };

  const purgeArtifact = (id: string) => {
    if (cards.length === 1) return toast.error("Logic Fault: Minimum 1 artifact required");
    updateRegistry(cards.filter((card) => card.id !== id));
  };

  const updateLogicPair = (id: string, field: "front" | "back", value: string) => {
    updateRegistry(cards.map((card) => (card.id === id ? { ...card, [field]: value } : card)));
  };

  const shiftSequence = (fromIndex: number, direction: "up" | "down") => {
    const toIndex = direction === "up" ? fromIndex - 1 : fromIndex + 1;
    if (toIndex < 0 || toIndex >= cards.length) return;
    const newCards = [...cards];
    [newCards[fromIndex], newCards[toIndex]] = [newCards[toIndex], newCards[fromIndex]];
    updateRegistry(newCards);
  };

  const getPayloadSynthesis = (): string => {
    return JSON.stringify(
      cards.map((c) => ({ front: c.front, back: c.back })),
      null,
      2,
    );
  };

  const copyPayload = async () => {
    try {
      await navigator.clipboard.writeText(getPayloadSynthesis());
      setCopied(true);
      toast.success("Payload Synced to Clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Handshake Failed: Copy aborted");
    }
  };

  const ingestPayload = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      if (!Array.isArray(parsed)) throw new Error("Registry Fault: Expected Array format");

      const newCards: Flashcard[] = parsed.map((item: any) => ({
        id: crypto.randomUUID(),
        front: item.front || item.Front || item.question || item.term || "",
        back: item.back || item.Back || item.answer || item.definition || "",
      }));

      updateRegistry(newCards);
      setActiveTab("visual");
      toast.success(`Ingested ${newCards.length} Registry Artifacts`);
    } catch (err: any) {
      toast.error(err.message || "Invalid Logic Schema");
    }
  };

  const handleCommit = () => {
    const emptyNodes = cards.filter((c) => !c.front.trim() || !c.back.trim());
    if (emptyNodes.length > 0) return toast.error(`Sync Blocked: ${emptyNodes.length} nodes incomplete`);
    onSave?.(getPayloadSynthesis());
    toast.success("Registry Handshake Verified");
  };

  const validCards = cards.filter((c) => c.front.trim() && c.back.trim());

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Executive HUD Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-muted/20 p-6 rounded-[32px] border-2 border-border/40 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center border-2 border-primary/20 shadow-inner">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-black uppercase tracking-tighter italic leading-none">Knowledge Ingestion</h3>
            <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-[0.2em] mt-1 italic">
              Registry Depth: {cards.length} Logic Artifacts
            </p>
          </div>
        </div>
        <Button
          onClick={handleCommit}
          disabled={validCards.length === 0}
          className="h-12 px-8 rounded-xl font-black uppercase tracking-widest text-[11px] shadow-2xl shadow-primary/20 transition-all hover:scale-105 active:scale-95"
        >
          <ShieldCheck className="mr-2 h-4 w-4" /> Commit Registry
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
        <TabsList className="bg-muted/30 backdrop-blur-md rounded-[20px] border-2 border-border/40 p-1.5 mb-8 w-full max-w-md">
          <TabsTrigger
            value="visual"
            className="flex-1 rounded-xl font-black uppercase text-[10px] tracking-widest gap-2 py-3"
          >
            <Layers className="w-4 h-4" /> Visual
          </TabsTrigger>
          <TabsTrigger
            value="json"
            className="flex-1 rounded-xl font-black uppercase text-[10px] tracking-widest gap-2 py-3"
          >
            <Terminal className="w-4 h-4" /> Schema
          </TabsTrigger>
          <TabsTrigger
            value="preview"
            className="flex-1 rounded-xl font-black uppercase text-[10px] tracking-widest gap-2 py-3"
          >
            <Eye className="w-4 h-4" /> Audit
          </TabsTrigger>
        </TabsList>

        <TabsContent value="visual" className="mt-0 space-y-6">
          <ScrollArea className="h-[600px] pr-6 -mr-6">
            <div className="space-y-6 pb-12">
              {cards.map((card, index) => (
                <Card
                  key={card.id}
                  className="group rounded-[32px] border-2 border-border/40 bg-card/30 backdrop-blur-xl overflow-hidden transition-all duration-500 hover:border-primary/40 shadow-xl"
                >
                  <CardHeader className="p-6 bg-muted/10 border-b border-border/10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge
                          variant="outline"
                          className="rounded-lg border-2 font-black text-[9px] bg-background uppercase tracking-widest px-3"
                        >
                          Node_{String(index + 1).padStart(3, "0")}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 opacity-20 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => shiftSequence(index, "up")}
                          disabled={index === 0}
                          className="h-9 w-9 rounded-xl"
                        >
                          <ArrowLeft className="h-4 w-4 rotate-90" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => shiftSequence(index, "down")}
                          disabled={index === cards.length - 1}
                          className="h-9 w-9 rounded-xl"
                        >
                          <ArrowRight className="h-4 w-4 rotate-90" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => purgeArtifact(card.id)}
                          className="h-9 w-9 rounded-xl text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">
                        Stimulus (Front)
                      </Label>
                      <Textarea
                        value={card.front}
                        onChange={(e) => updateLogicPair(card.id, "front", e.target.value)}
                        className="min-h-[120px] rounded-2xl border-2 bg-muted/5 font-medium italic focus-visible:ring-primary/20 p-6"
                        placeholder="Enter logic stimulus..."
                      />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-emerald-500 ml-1">
                        Resolution (Back)
                      </Label>
                      <Textarea
                        value={card.back}
                        onChange={(e) => updateLogicPair(card.id, "back", e.target.value)}
                        className="min-h-[120px] rounded-2xl border-2 bg-muted/5 font-medium italic focus-visible:ring-emerald-500/20 p-6"
                        placeholder="Enter resolution data..."
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
              <Button
                variant="outline"
                onClick={injectArtifact}
                className="w-full h-24 rounded-[32px] border-4 border-dashed border-border/40 bg-muted/5 hover:bg-primary/5 hover:border-primary/40 transition-all group"
              >
                <Plus className="h-6 w-6 mr-3 text-muted-foreground group-hover:scale-125 transition-transform" />
                <span className="font-black uppercase tracking-widest text-xs opacity-40">
                  Initialize New Registry Node
                </span>
              </Button>
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="json" className="mt-0 space-y-8">
          <Card className="rounded-[32px] border-2 border-border/40 bg-card/30 overflow-hidden shadow-2xl">
            <CardHeader className="p-8 border-b border-border/10 bg-muted/10 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl font-black uppercase tracking-tighter italic">
                  Payload Synthesis
                </CardTitle>
                <CardDescription className="text-[10px] font-bold uppercase tracking-widest">
                  Artifact raw logic schema
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={copyPayload}
                className="h-10 rounded-xl px-6 border-2 font-black uppercase text-[10px] gap-2"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                {copied ? "Synced" : "Sync Payload"}
              </Button>
            </CardHeader>
            <CardContent className="p-8">
              <pre className="bg-background/50 p-8 rounded-2xl text-xs font-mono border-2 border-border/10 overflow-x-auto max-h-[400px] leading-relaxed italic text-primary/80">
                <code>{getPayloadSynthesis()}</code>
              </pre>
            </CardContent>
          </Card>

          <Card className="rounded-[32px] border-4 border-primary/20 bg-primary/5 overflow-hidden shadow-xl">
            <CardHeader className="p-8 bg-primary/5">
              <CardTitle className="text-xl font-black uppercase tracking-tighter italic">
                Ingest Logic Schema
              </CardTitle>
              <CardDescription className="text-[10px] font-bold uppercase tracking-widest italic opacity-60">
                Paste external artifact payload for injection
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <Textarea
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                className="min-h-[200px] font-mono text-sm bg-background/50 rounded-2xl border-2 p-6 focus-visible:ring-primary/20"
                placeholder={`[\n  { "front": "Logic A", "back": "Result A" }\n]`}
              />
              <Button
                onClick={ingestPayload}
                disabled={!jsonInput.trim()}
                className="w-full h-14 rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] shadow-xl shadow-primary/20"
              >
                Authorize Ingestion Protocol
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="mt-0">
          {validCards.length > 0 ? (
            <div className="max-w-2xl mx-auto space-y-12 py-12">
              <div className="flex items-center justify-between px-4">
                <Badge variant="secondary" className="rounded-lg font-black text-[10px] px-4 py-1">
                  ARTIFACT {previewIndex + 1} / {validCards.length}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsFlipped(false)}
                  disabled={!isFlipped}
                  className="font-black uppercase text-[10px] tracking-widest"
                >
                  <RotateCcw className="h-4 w-4 mr-2" /> Hard Reset
                </Button>
              </div>

              <div className="relative h-[400px] w-full perspective-2000" onClick={() => setIsFlipped(!isFlipped)}>
                <div
                  className={cn(
                    "absolute inset-0 transition-all duration-700 ease-in-out preserve-3d cursor-pointer rounded-[48px]",
                    isFlipped ? "rotate-y-180" : "rotate-y-0",
                  )}
                  style={{ transformStyle: "preserve-3d", transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)" }}
                >
                  {/* Front Face */}
                  <div
                    className="absolute inset-0 backface-hidden rounded-[48px] border-4 border-primary/20 bg-gradient-to-br from-primary/10 via-background to-primary/5 flex flex-col items-center justify-center p-12 text-center shadow-2xl"
                    style={{ backfaceVisibility: "hidden" }}
                  >
                    <div className="absolute top-8 left-8 h-10 w-10 rounded-xl bg-primary/10 border-2 border-primary/20 flex items-center justify-center">
                      <Terminal className="h-5 w-5 text-primary" />
                    </div>
                    <Badge className="mb-6 font-black tracking-[0.3em] uppercase text-[9px]">Logic_Stimulus</Badge>
                    <p className="text-3xl font-black tracking-tight italic uppercase">
                      {validCards[previewIndex]?.front}
                    </p>
                    <div className="mt-12 flex items-center gap-2 opacity-20">
                      <Activity className="h-4 w-4 animate-pulse" />
                      <span className="text-[9px] font-bold uppercase tracking-widest italic">
                        Awaiting Interaction
                      </span>
                    </div>
                  </div>

                  {/* Back Face */}
                  <div
                    className="absolute inset-0 backface-hidden rounded-[48px] border-4 border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-background to-emerald-500/5 flex flex-col items-center justify-center p-12 text-center shadow-2xl rotate-y-180"
                    style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                  >
                    <div className="absolute top-8 left-8 h-10 w-10 rounded-xl bg-emerald-500/10 border-2 border-emerald-500/20 flex items-center justify-center">
                      <Check className="h-5 w-5 text-emerald-500" />
                    </div>
                    <Badge className="mb-6 bg-emerald-500 text-white font-black tracking-[0.3em] uppercase text-[9px] border-none">
                      Verified_Resolution
                    </Badge>
                    <p className="text-3xl font-black tracking-tight italic text-emerald-600 uppercase">
                      {validCards[previewIndex]?.back}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center gap-6">
                <Button
                  variant="outline"
                  className="h-14 w-48 rounded-2xl border-2 font-black uppercase text-[10px] tracking-widest gap-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPreviewIndex((p) => Math.max(0, p - 1));
                    setIsFlipped(false);
                  }}
                  disabled={previewIndex === 0}
                >
                  <ChevronLeft className="h-5 w-5" /> Previous Node
                </Button>
                <Button
                  variant="outline"
                  className="h-14 w-48 rounded-2xl border-2 font-black uppercase text-[10px] tracking-widest gap-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPreviewIndex((p) => Math.min(validCards.length - 1, p + 1));
                    setIsFlipped(false);
                  }}
                  disabled={previewIndex === validCards.length - 1}
                >
                  Next Node <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            </div>
          ) : (
            <Card className="rounded-[40px] border-2 border-dashed border-border/40 bg-card/10 py-32 text-center">
              <Eye className="h-16 w-16 text-muted-foreground/20 mx-auto mb-6" />
              <p className="text-[11px] font-black uppercase tracking-[0.4em] text-muted-foreground/40 italic">
                Audit Blocked: No logic paths detected.
              </p>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
