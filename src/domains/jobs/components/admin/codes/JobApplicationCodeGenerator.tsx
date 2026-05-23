import { useState } from "react";
import { getCurrentUser } from "@/lib/auth";
import { insertJobApplicationAccessCode } from "@/domains/jobs/repo/jobsRepo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Copy,
  Download,
  Loader2,
  Plus,
  Briefcase,
  ShieldCheck,
  Zap,
  Activity,
  Terminal,
  Key,
  Check,
} from "lucide-react";
import { withTimeout } from "@/hooks/useQueryWithTimeout";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import { cn } from "@/lib/utils";

/**
 * Platform Logic: Credential Synthesis Terminal (Access Codes)
 * High-fidelity orchestrator for generating unique application authorization keys.
 * 2026 Standard: Executive Logic geometry with reinforced collision-retry logic.
 */

export function JobApplicationCodeGenerator() {
  const [email, setEmail] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCodes, setGeneratedCodes] = useState<string[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const synthesizeLogicKey = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "JOB-";
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleExecuteSynthesis = async () => {
    if (!email.trim()) {
      toast.error("Error: Target email identifier required");
      return;
    }

    setIsGenerating(true);
    setGeneratedCodes([]);
    try {
      const user = await withTimeout(getCurrentUser(), TIMEOUTS.AUTH, "Auth timed out");

      const codes: string[] = [];

      for (let i = 0; i < quantity; i++) {
        const code = synthesizeLogicKey();
        const { error } = await withTimeout(
          insertJobApplicationAccessCode({
            code,
            email: email.toLowerCase().trim(),
            created_by: user?.id,
          }),
          TIMEOUTS.DEFAULT,
          "Database Ingestion Timeout",
        );

        if (error) {
          if (error.code === "23505") {
            // Collision detected: Recursive retry for current index
            i--;
            continue;
          }
          throw error;
        }
        codes.push(code);
      }

      setGeneratedCodes(codes);
      toast.success(`Handshake Complete: ${codes.length} keys synthesized`);
    } catch (error: any) {
      console.error("Synthesis Error:", error);
      toast.error(error.message || "Credential Synthesis Failed");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    toast.success("Artifact Synced to Clipboard");
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const downloadKeyManifest = () => {
    const content = generatedCodes.map((code, i) => `ARTIFACT_${i + 1}: ${code}`).join("\n");
    const header = `ACCESS_CREDENTIAL_MANIFEST\nTARGET_ENTITY: ${email}\nTIMESTAMP: ${new Date().toISOString()}\n--------------------------\n\n`;

    const blob = new Blob([header + content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Key_Manifest_${email.replace(/[@.]/g, "_")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Manifest Exported");
  };

  return (
    <Card className="rounded-[40px] border-2 border-border/40 bg-card/30 backdrop-blur-xl shadow-2xl overflow-hidden animate-in fade-in duration-700">
      <div className="h-1.5 w-full bg-gradient-to-r from-primary via-blue-600 to-primary" />
      <CardHeader className="p-10 border-b border-border/10 bg-muted/10">
        <div className="flex items-center gap-5">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center border-2 border-primary/20 shadow-inner">
            <Key className="h-8 w-8 text-primary" />
          </div>
          <div className="text-left">
            <CardTitle className="text-3xl font-black uppercase tracking-tighter italic">
              Credential Synthesis
            </CardTitle>
            <CardDescription className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60 italic">
              Authorization Key Generation Protocol — Batch Limit: 20 Keys
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-10 space-y-8">
        <div className="grid gap-8 md:grid-cols-2">
          <div className="space-y-3 text-left">
            <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">
              Target Entity Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="identify_target@entity.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-14 rounded-2xl border-2 font-bold tracking-tight bg-muted/20 focus-visible:ring-primary/20"
            />
          </div>
          <div className="space-y-3 text-left">
            <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Batch Quantity</Label>
            <Input
              id="quantity"
              type="number"
              min={1}
              max={20}
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              className="h-14 rounded-2xl border-2 font-black italic text-xl bg-muted/20"
            />
          </div>
        </div>

        <Button
          onClick={handleExecuteSynthesis}
          disabled={isGenerating}
          className="w-full h-16 rounded-[20px] font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl shadow-primary/30 transition-all hover:scale-[1.01] active:scale-[0.99]"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-3 h-5 w-5 animate-spin" /> Synthesizing Logic Nodes...
            </>
          ) : (
            <>
              <Plus className="mr-3 h-5 w-5" /> Execute Key Generation
            </>
          )}
        </Button>

        {generatedCodes.length > 0 && (
          <div className="space-y-6 pt-10 border-t border-border/10 animate-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-emerald-500" />
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Generated Artifacts:
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={downloadKeyManifest}
                className="h-10 rounded-xl px-6 border-2 font-black uppercase text-[10px] tracking-widest gap-2"
              >
                <Download className="h-3 w-3" /> Export Manifest
              </Button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {generatedCodes.map((code, index) => (
                <div
                  key={index}
                  className="group flex items-center justify-between p-5 bg-muted/30 border-2 border-border/5 rounded-2xl transition-all hover:border-primary/40 hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-[9px] font-black text-muted-foreground/30">
                      #{String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="font-mono text-sm font-bold tracking-widest">{code}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => copyToClipboard(code)}
                    className="h-10 w-10 rounded-xl hover:bg-primary/10 transition-colors"
                  >
                    {copiedCode === code ? (
                      <Check className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 opacity-20 pt-4">
              <Terminal className="h-3 w-3" />
              <span className="text-[8px] font-black uppercase tracking-widest">
                Protocol: Verified Batch Synchronization Complete
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
