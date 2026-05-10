import { useState, useCallback } from "react";
import {
  Upload,
  Loader2,
  Copy,
  Check,
  Sparkles,
  X,
  MessageSquare,
  Lightbulb,
  Activity,
  ListChecks,
  Image as ImageIcon,
  Zap,
  ShieldCheck,
  User,
  Bot,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/**
 * Platform Logic: Global CRM Support AI
 * 2026 Standard: Blended Phase 6 UI (OCR-driven Neural Response)
 */

interface AIResponse {
  reply: string;
  suggestions: string[];
  tone: string;
  actions: string[];
}

export function SupportAITab() {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [context, setContext] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<AIResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return toast.error("Protocol Fault: Image format required.");
    if (file.size > 10 * 1024 * 1024) return toast.error("Payload Fault: Image must be under 10MB.");

    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
    setResponse(null);
  }, []);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
    },
    [handleFile],
  );

  const analyze = async () => {
    if (!imagePreview) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-support-assistant", {
        body: { image: imagePreview, context: context || undefined },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setResponse(data);
      toast.success("Intelligence: Conversation analyzed.");
    } catch (err: any) {
      console.error("Analysis Fault:", err);
      toast.error(err.message || "System Error: Neural analysis failed.");
    } finally {
      setLoading(false);
    }
  };

  const copyReply = async () => {
    if (!response?.reply) return;
    await navigator.clipboard.writeText(response.reply);
    setCopied(true);
    toast.success("Protocol: Artifact copied to clipboard.");
    setTimeout(() => setCopied(false), 2000);
  };

  const reset = () => {
    setImagePreview(null);
    setContext("");
    setResponse(null);
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-1000 p-4 md:p-6">
      {/* Phase 6 Executive Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-muted/20 p-8 rounded-[40px] border-2 border-border/40 backdrop-blur-md">
        <div className="space-y-1 text-left">
          <div className="flex items-center gap-3 text-cyan-500">
            <Bot className="h-8 w-8 text-cyan-500 fill-cyan-500/20" />
            <h2 className="text-4xl font-black uppercase tracking-tighter italic leading-none text-foreground">
              Support AI
            </h2>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 italic">
            Visual Conversation OCR & Neural Response
          </p>
        </div>
        <Badge
          variant="outline"
          className="h-12 px-6 rounded-xl font-black uppercase text-xs tracking-widest gap-2 border-cyan-500/50 text-cyan-600 bg-cyan-500/10 animate-pulse"
        >
          <ShieldCheck className="h-4 w-4" /> AI_ASSIST_ENABLED
        </Badge>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* INPUT TERMINAL */}
        <div className="space-y-6">
          <Card className="rounded-[40px] border-2 border-border/40 shadow-2xl overflow-hidden bg-card/30 backdrop-blur-xl">
            <div className="h-1.5 w-full bg-gradient-to-r from-cyan-400 to-blue-500" />
            <CardContent className="p-8 space-y-8 text-left">
              {imagePreview ? (
                <div className="relative group rounded-[32px] overflow-hidden border-2 border-cyan-500/20 bg-black/40 shadow-inner">
                  <img src={imagePreview} alt="Conversation" className="w-full max-h-[400px] object-contain" />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-4 right-4 h-12 w-12 rounded-xl opacity-0 group-hover:opacity-100 transition-all shadow-xl scale-95 group-hover:scale-100"
                    onClick={reset}
                  >
                    <X className="h-6 w-6" />
                  </Button>
                </div>
              ) : (
                <div
                  className={cn(
                    "border-4 border-dashed rounded-[32px] p-12 text-center cursor-pointer transition-all duration-500 min-h-[300px] flex flex-col items-center justify-center",
                    dragActive
                      ? "border-cyan-500 bg-cyan-500/5 scale-[0.98]"
                      : "border-border/40 hover:border-cyan-500/40 bg-muted/10 hover:bg-muted/20",
                  )}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById("support-image-upload")?.click()}
                >
                  <div className="h-20 w-20 rounded-[24px] bg-cyan-500/10 flex items-center justify-center mb-6 shadow-lg border-2 border-cyan-500/20">
                    <ImageIcon className="h-10 w-10 text-cyan-500" />
                  </div>
                  <p className="text-xl font-black uppercase italic tracking-tight text-foreground">
                    Drop Screenshot Here
                  </p>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-2">
                    PNG, JPG or WebP (Node limit 10MB)
                  </p>
                  <input
                    id="support-image-upload"
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                  />
                </div>
              )}

              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase italic tracking-widest text-cyan-500 ml-1 flex items-center gap-2">
                  <User className="h-3 w-3" /> Additional Context Node
                </Label>
                <Textarea
                  placeholder="e.g., User is asking about the 75-credit cost for mock interview retakes..."
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  className="rounded-3xl border-2 font-medium italic min-h-[120px] bg-muted/20 resize-none p-4"
                />
              </div>

              <Button
                onClick={analyze}
                disabled={!imagePreview || loading}
                className="w-full h-16 rounded-[24px] font-black uppercase italic tracking-[0.2em] text-sm gap-3 shadow-xl bg-cyan-600 hover:bg-cyan-700 text-white transition-all"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" /> Processing Registry...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5 fill-current" /> Initialize Neural Analysis
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* OUTPUT TERMINAL */}
        <div className="space-y-6">
          {response ? (
            <div className="space-y-6 animate-in slide-in-from-bottom-10 duration-700">
              <div className="flex items-center gap-4 bg-muted/30 p-4 rounded-[24px] border-2 border-border/40 backdrop-blur-md text-left">
                <div className="h-12 w-12 rounded-xl bg-cyan-500/10 flex items-center justify-center border-2 border-cyan-500/20">
                  <Activity className="h-6 w-6 text-cyan-500" />
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase text-muted-foreground/60 italic tracking-widest">
                    Neural Tone Detection
                  </p>
                  <p className="font-black uppercase italic text-lg tracking-tight leading-none mt-0.5">
                    {response.tone}
                  </p>
                </div>
                <Badge className="ml-auto bg-emerald-500/10 text-emerald-500 border-none font-black italic uppercase tracking-widest text-[9px] px-3">
                  VERIFIED_LOGIC
                </Badge>
              </div>

              <Card className="rounded-[40px] border-2 border-border/40 bg-card/30 shadow-2xl overflow-hidden backdrop-blur-xl text-left">
                <div className="h-1.5 w-full bg-gradient-to-r from-cyan-400 to-blue-500" />
                <CardHeader className="p-8 border-b border-border/10 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-black uppercase italic tracking-tight flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-cyan-500" /> Deployed Reply Node
                    </CardTitle>
                    <CardDescription className="text-[9px] font-bold uppercase tracking-widest mt-1">
                      Optimized for high-fidelity conversion
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    onClick={copyReply}
                    className={cn(
                      "h-12 px-6 rounded-xl border-2 font-black uppercase text-[10px] tracking-widest italic shadow-md transition-all",
                      copied
                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                        : "hover:bg-cyan-500/10 hover:text-cyan-600 hover:border-cyan-500/30",
                    )}
                  >
                    {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}{" "}
                    {copied ? "SECURED" : "COPY ARTIFACT"}
                  </Button>
                </CardHeader>
                <CardContent className="p-8">
                  <p className="text-sm font-medium italic whitespace-pre-wrap leading-relaxed text-foreground/90 bg-muted/10 p-6 rounded-3xl border border-border/5">
                    "{response.reply}"
                  </p>
                </CardContent>
              </Card>

              <div className="grid gap-6">
                <Card className="rounded-[32px] border-2 border-border/40 bg-card/30 shadow-xl overflow-hidden backdrop-blur-xl text-left">
                  <CardHeader className="p-6 pb-2 border-b border-border/5 bg-muted/5">
                    <CardTitle className="text-xs font-black uppercase tracking-widest italic flex items-center gap-2 text-amber-500">
                      <Lightbulb className="h-4 w-4" /> Feature Mapping
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      {response.suggestions?.map((s, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-4 p-4 bg-muted/20 rounded-2xl border border-border/10"
                        >
                          <span className="h-8 w-8 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center text-[11px] font-black shrink-0">
                            {i + 1}
                          </span>
                          <span className="text-xs font-bold italic text-foreground/80">{s}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-[32px] border-2 border-border/40 bg-card/30 shadow-xl overflow-hidden backdrop-blur-xl text-left">
                  <CardHeader className="p-6 pb-2 border-b border-border/5 bg-muted/5">
                    <CardTitle className="text-xs font-black uppercase tracking-widest italic flex items-center gap-2 text-emerald-500">
                      <ListChecks className="h-4 w-4" /> Strategic Follow-up
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      {response.actions?.map((a, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-4 p-4 bg-muted/20 rounded-2xl border border-border/10"
                        >
                          <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                          <span className="text-xs font-bold italic text-foreground/80">{a}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <Card className="rounded-[40px] border-4 border-dashed border-border/40 bg-transparent flex flex-col items-center justify-center p-12 min-h-[600px]">
              <div className="h-24 w-24 rounded-[32px] bg-muted/30 flex items-center justify-center mb-6 animate-pulse border-2 border-border/10">
                <Sparkles className="h-10 w-10 text-muted-foreground/30" />
              </div>
              <p className="text-sm font-black uppercase tracking-widest text-muted-foreground/40 italic">
                Awaiting Neural Ingestion
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function CheckCircle2(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("lucide lucide-check-circle-2", props.className)}
    >
      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

export default SupportAITab;
