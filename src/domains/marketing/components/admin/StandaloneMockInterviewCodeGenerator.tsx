import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Copy, Download, Loader2, Plus, MessageSquare, Zap, ShieldCheck, Mail, Hash, Activity } from "lucide-react";
import { withTimeout } from "@/hooks/useQueryWithTimeout";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: AI Mock Interview Access Deployment
 * CTO Reference: Standalone bulk generator for single-use interview retake authorization.
 */

export function StandaloneMockInterviewCodeGenerator() {
  const [email, setEmail] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCodes, setGeneratedCodes] = useState<string[]>([]);

  const generateCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleGenerate = async () => {
    if (!email.trim()) {
      toast.error("Protocol Fault: Target email identifier required.");
      return;
    }

    setIsGenerating(true);
    try {
      // 1. Authenticated Identity Audit
      const authResponse = await withTimeout(supabase.auth.getUser(), TIMEOUTS.AUTH, "Authentication check timed out");

      const user = authResponse?.data?.user;
      const codes: string[] = [];

      // 2. High-Intensity Generation Loop
      for (let i = 0; i < quantity; i++) {
        const code = generateCode();

        // Wrap query in native async for standard Promise casting
        const executeInsertion = async () => {
          return await supabase.from("mock_interview_access_codes").insert({
            code,
            email: email.toLowerCase().trim(),
            created_by: user?.id,
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          });
        };

        const result = (await withTimeout(
          executeInsertion(),
          TIMEOUTS.DEFAULT,
          "Database latency detected during key deployment",
        )) as { error: any };

        if (result.error) {
          // Collision handling logic
          if (result.error.code === "23505") {
            i--;
            continue;
          }
          throw result.error;
        }
        codes.push(code);
      }

      setGeneratedCodes(codes);
      toast.success(`Protocol Successful: ${codes.length} access node(s) deployed.`);
    } catch (error: any) {
      console.error("Access Code Fault:", error);
      toast.error(error.message || "System Error: Key generation failed.");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Deployment Key Secured & Copied");
    } catch (err) {
      toast.error("Clipboard Fault Detected");
    }
  };

  const downloadCodes = () => {
    const content = generatedCodes.map((code, i) => `Access Node ${i + 1}: ${code}`).join("\n");
    const blob = new Blob([`GRO-UP ACADEMY: AI MOCK INTERVIEW KEYS\nTarget: ${email}\nValid: 30 Days\n\n${content}`], {
      type: "text/plain",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `interview_keys_${email.split("@")[0]}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Audit artifact generated.");
  };

  return (
    <Card className="rounded-[40px] border-2 border-border/40 bg-card/30 shadow-2xl overflow-hidden animate-in fade-in duration-700">
      <div className="h-1.5 w-full bg-gradient-to-r from-primary via-blue-600 to-primary" />
      <CardHeader className="p-8 border-b border-border/10 bg-muted/10 text-left">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-xl font-black uppercase italic tracking-tighter flex items-center gap-3">
              <MessageSquare className="h-5 w-5 text-primary" /> Interview Pulse
            </CardTitle>
            <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 italic">
              Authorization keys for AI Behavioral retakes (50 Credits/Key)
            </CardDescription>
          </div>
          <ShieldCheck className="h-8 w-8 text-primary opacity-20" />
        </div>
      </CardHeader>

      <CardContent className="p-8 space-y-6">
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2 text-left">
            <Label className="text-[10px] font-black uppercase italic tracking-widest flex items-center gap-2 text-primary/80">
              <Mail className="h-3 w-3" /> Target Identifier
            </Label>
            <Input
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-14 rounded-2xl border-2 font-bold bg-card/50"
            />
          </div>
          <div className="space-y-2 text-left">
            <Label className="text-[10px] font-black uppercase italic tracking-widest flex items-center gap-2 text-primary/80">
              <Hash className="h-3 w-3" /> Node Quantity
            </Label>
            <Input
              type="number"
              min={1}
              max={20}
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              className="h-14 rounded-2xl border-2 font-black italic text-lg"
            />
          </div>
        </div>

        <Button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full h-16 rounded-[24px] font-black uppercase italic tracking-tighter text-xl gap-3 shadow-xl hover:scale-[1.01] active:scale-95 transition-transform"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-6 w-6 animate-spin" />
              Synchronizing...
            </>
          ) : (
            <>
              <Zap className="h-6 w-6 fill-current" />
              Initialize Generation
            </>
          )}
        </Button>

        {generatedCodes.length > 0 && (
          <div className="space-y-4 pt-6 border-t border-border/10 animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-black uppercase tracking-widest text-primary italic">Deployed Keys:</p>
              <Button
                variant="outline"
                size="sm"
                onClick={downloadCodes}
                className="h-10 rounded-xl border-2 font-black text-[9px] gap-2"
              >
                <Download className="h-3 w-3" /> EXPORT LOG
              </Button>
            </div>
            <div className="grid gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {generatedCodes.map((code, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-muted/20 rounded-2xl border-2 border-border/5 group hover:border-primary/20 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-[10px] font-black text-primary italic">
                      #{index + 1}
                    </div>
                    <span className="font-mono text-lg font-black tracking-[0.2em]">{code}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => copyToClipboard(code)}
                    className="h-10 w-10 rounded-xl hover:bg-primary/10 transition-all"
                  >
                    <Copy className="h-4 w-4 text-primary" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
