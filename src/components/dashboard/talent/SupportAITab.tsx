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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label"; // FIXED: Added missing import
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: AI Support Intelligence Terminal
 * CTO Reference: OCR-driven conversation analyzer and reply generator.
 * Resolved TS2304 by restoring the Label primitive import.
 */

interface AIResponse {
  reply: string;
  suggestions: string[];
  tone: string;
  actions: string[];
}

export function SupportAssistant() {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [context, setContext] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<AIResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Protocol Fault: Image format required.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Payload Fault: Image must be under 10MB.");
      return;
    }
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
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* EXECUTIVE HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-muted/20 p-8 rounded-[40px] border-2 border-border/40 backdrop-blur-md text-left">
        <div className="space-y-1">
          <div className="flex items-center gap-3 text-primary">
            <Zap className="h-8 w-8 fill-current" />
            <h2 className="text-4xl font-black uppercase tracking-tighter italic leading-none">Support Intel</h2>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 italic">
            Visual Conversation OCR & Neural Response Logic
          </p>
        </div>
        <div className="flex gap-3">
          <Badge variant="outline" className="h-14 px-6 rounded-2xl border-2 font-black italic gap-2 text-primary">
            <ShieldCheck className="h-4 w-4" /> AI_ASSIST_ENABLED
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* INPUT TERMINAL */}
        <div className="space-y-6">
          {imagePreview ? (
            <Card className="rounded-[40px] border-2 border-primary/20 bg-card/30 overflow-hidden shadow-2xl relative group">
              <CardContent className="p-4">
                <img
                  src={imagePreview}
                  alt="Conversation"
                  className="w-full rounded-3xl border-2 border-border/10 max-h-[500px] object-contain bg-black/40 shadow-inner"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-6 right-6 h-10 w-10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={reset}
                >
                  <X className="h-5 w-5" />
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div
              className={cn(
                "border-4 border-dashed rounded-[40px] p-12 text-center cursor-pointer transition-all duration-500 min-h-[300px] flex flex-col items-center justify-center",
                dragActive
                  ? "border-primary bg-primary/5 scale-95"
                  : "border-border/40 hover:border-primary/40 bg-muted/10 shadow-inner",
              )}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => document.getElementById("support-image-upload")?.click()}
            >
              <div className="h-20 w-20 rounded-3xl bg-muted/50 flex items-center justify-center mb-6 shadow-lg border-2 border-border/10">
                <ImageIcon className="h-10 w-10 text-primary" />
              </div>
              <p className="text-lg font-black uppercase italic tracking-tight">Drop Screenshot Here</p>
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

          <div className="space-y-3 text-left">
            <Label className="text-[10px] font-black uppercase italic tracking-widest text-primary ml-2 flex items-center gap-2">
              <User className="h-3 w-3" /> Additional Context Node
            </Label>
            <Textarea
              placeholder="e.g., User is asking about the 75-credit cost for mock interview retakes..."
              value={context}
              onChange={(e) => setContext(e.target.value)}
              className="rounded-3xl border-2 font-medium italic min-h-[120px] bg-muted/20"
            />
          </div>

          <Button
            onClick={analyze}
            disabled={!imagePreview || loading}
            className="w-full h-20 rounded-[32px] font-black uppercase italic tracking-tighter text-2xl gap-4 shadow-xl shadow-primary/20 hover:scale-[1.01] active:scale-95 transition-transform"
          >
            {loading ? (
              <>
                <Loader2 className="h-8 w-8 animate-spin" />
                Processing Registry...
              </>
            ) : (
              <>
                <Sparkles className="h-8 w-8 fill-current" />
                Initialize Neural Analysis
              </>
            )}
          </Button>
        </div>

        {/* OUTPUT TERMINAL */}
        <div className="space-y-6">
          {response ? (
            <div className="space-y-6 animate-in slide-in-from-right-10 duration-700">
              <div className="flex items-center gap-4 bg-muted/30 p-4 rounded-2xl border-2">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center border-2 border-primary/20">
                  <Activity className="h-5 w-5 text-primary" />
                </div>
                <div className="text-left">
                  <p className="text-[9px] font-black uppercase text-muted-foreground italic">Neural Tone Detection</p>
                  <p className="font-black uppercase italic text-sm">{response.tone}</p>
                </div>
                <Badge className="ml-auto bg-green-500/10 text-green-600 font-black italic">VERIFIED_LOGIC</Badge>
              </div>

              <Card className="rounded-[40px] border-2 border-border/40 bg-card/30 shadow-2xl overflow-hidden">
                <CardHeader className="p-8 border-b border-border/10 flex flex-row items-center justify-between">
                  <div className="text-left">
                    <CardTitle className="text-sm font-black uppercase italic flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-primary" /> Deployed Reply Node
                    </CardTitle>
                    <CardDescription className="text-[9px] font-bold uppercase tracking-widest">
                      Optimized for high-fidelity conversion
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyReply}
                    className="h-10 rounded-xl border-2 font-black uppercase text-[10px] italic shadow-md"
                  >
                    {copied ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
                    {copied ? "SECURED" : "COPY"}
                  </Button>
                </CardHeader>
                <CardContent className="p-8 text-left">
                  <p className="text-sm font-medium italic whitespace-pre-wrap leading-relaxed">"{response.reply}"</p>
                </CardContent>
              </Card>

              <div className="grid gap-6">
                <Card className="rounded-[32px] border-2 border-border/40 bg-card/10 backdrop-blur-sm">
                  <CardHeader className="p-6 pb-2 text-left">
                    <CardTitle className="text-xs font-black uppercase italic flex items-center gap-2 text-primary">
                      <Lightbulb className="h-4 w-4" /> Feature Mapping
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 pt-0 text-left">
                    <div className="space-y-2">
                      {response.suggestions?.map((s, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-3 p-3 bg-muted/20 rounded-xl border border-border/5"
                        >
                          <span className="h-5 w-5 rounded bg-primary/10 text-primary flex items-center justify-center text-[10px] font-black shrink-0">
                            {i + 1}
                          </span>
                          <span className="text-xs font-bold italic">{s}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-[32px] border-2 border-border/40 bg-card/10 backdrop-blur-sm">
                  <CardHeader className="p-6 pb-2 text-left">
                    <CardTitle className="text-xs font-black uppercase italic flex items-center gap-2 text-amber-600">
                      <ListChecks className="h-4 w-4" /> Strategic Follow-up
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 pt-0 text-left">
                    <div className="space-y-2">
                      {response.actions?.map((a, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-3 p-3 bg-muted/20 rounded-xl border border-border/5"
                        >
                          <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                          <span className="text-xs font-bold italic">{a}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <Card className="rounded-[40px] border-4 border-dashed border-border/40 bg-transparent flex flex-col items-center justify-center p-12 min-h-[500px]">
              <div className="h-20 w-20 rounded-full bg-muted/30 flex items-center justify-center mb-6 animate-pulse">
                <Sparkles className="h-10 w-10 text-muted-foreground/20" />
              </div>
              <p className="text-sm font-black uppercase tracking-widest text-muted-foreground/30 italic">
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
