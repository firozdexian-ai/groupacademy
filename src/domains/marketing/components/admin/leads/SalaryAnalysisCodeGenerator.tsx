import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { withTimeout } from "@/hooks/useQueryWithTimeout";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import { toast } from "sonner";
import { Key, Copy, Check, Loader2, Zap, ShieldCheck, Mail } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

/**
 * GroUp Academy: Salary Analysis Access Deployment
 * CTO Reference: High-fidelity authorization generator for specialized career intelligence.
 */

interface SalaryAnalysisCodeGeneratorProps {
  leadEmail: string;
  leadName: string;
}

export const SalaryAnalysisCodeGenerator = ({ leadEmail, leadName }: SalaryAnalysisCodeGeneratorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const generateCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      // 1. Authenticated Identity Audit
      const authResponse = await withTimeout(supabase.auth.getUser(), TIMEOUTS.AUTH, "Authentication check timed out");

      const user = authResponse?.data?.user;
      if (!user) {
        toast.error("Security Fault: Unauthorized access attempt.");
        return;
      }

      const code = generateCode();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      // 2. Wrap PostgrestBuilder in a native async function for standard Promise return
      const executeInsertion = async () => {
        return await supabase.from("salary_analysis_access_codes").insert({
          code,
          email: leadEmail.toLowerCase().trim(),
          created_by: user.id,
          expires_at: expiresAt.toISOString(),
        });
      };

      // 3. Monitor Execution via Platform Timeout Protocol
      const { error } = (await withTimeout(executeInsertion(), TIMEOUTS.DEFAULT, "Code generation timed out")) as {
        error: any;
      };

      if (error) throw error;

      setGeneratedCode(code);
      toast.success("Protocol Successful: Access code deployed.");
    } catch (error: any) {
      console.error("Access Code Fault:", error);
      const isTimeout = error.message?.includes("timed out");
      toast.error(isTimeout ? "Network Latency Detected. Retrying..." : "System Error: Code generation failed.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (generatedCode) {
      const message = `Hi ${leadName}!\n\nYour GroUp Academy Salary Analysis access code is: ${generatedCode}\n\nThis key allows you to access the setup here: ${window.location.origin}/salary-analysis/setup\n\nThis key is valid for 30 days.\n\nBest regards,\nGroUp Academy Team`;
      navigator.clipboard.writeText(message);
      setCopied(true);
      toast.success("Protocol: Outreach template copied to clipboard.");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(o) => {
        setIsOpen(o);
        if (!o) {
          setGeneratedCode(null);
          setCopied(false);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="font-black uppercase text-[10px] tracking-widest gap-2 rounded-xl border-2 hover:bg-primary/5"
        >
          <Key className="w-3 h-3" />
          Code
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md rounded-[32px] border-4 overflow-hidden p-0 bg-background shadow-2xl">
        <div className="h-2 w-full bg-primary" />
        <div className="p-8 space-y-6">
          <DialogHeader className="text-left">
            <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter flex items-center gap-3">
              <ShieldCheck className="h-6 w-6 text-primary" /> Access Deployment
            </DialogTitle>
            <DialogDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 italic">
              Authorized key generation for {leadName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase italic tracking-widest flex items-center gap-2 text-primary/80">
                <Mail className="h-3 w-3" /> Target Email
              </Label>
              <Input
                value={leadEmail}
                disabled
                className="h-12 rounded-xl border-2 font-bold bg-muted/30 border-border/40"
              />
            </div>

            {generatedCode ? (
              <div className="space-y-3 animate-in zoom-in-95 duration-300">
                <Label className="text-[10px] font-black uppercase italic tracking-widest text-primary flex items-center gap-2">
                  <Zap className="h-3 w-3 fill-current" /> Generated Key
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={generatedCode}
                    readOnly
                    className="h-16 font-mono text-2xl font-black tracking-[0.4em] text-center rounded-2xl border-2 border-primary/20 bg-primary/5 shadow-inner"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopy}
                    className="h-16 w-16 rounded-2xl border-2 hover:bg-primary hover:text-white transition-all shadow-md"
                  >
                    {copied ? <Check className="h-6 w-6 text-green-500" /> : <Copy className="h-6 w-6" />}
                  </Button>
                </div>
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest text-center italic">
                  Key valid for 30 days. Copy for outreach template.
                </p>
              </div>
            ) : (
              <div className="py-4 text-center">
                <p className="text-[11px] font-medium text-muted-foreground mb-6 leading-relaxed">
                  Generate a high-security 8-character key that bypasses the credit requirement for **Salary Analysis**
                  engagement.
                </p>
                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="w-full h-14 rounded-2xl font-black uppercase italic tracking-tighter text-lg shadow-xl hover:scale-[1.02] active:scale-95 transition-transform"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Synchronizing...
                    </>
                  ) : (
                    <>
                      <Key className="w-5 h-5 mr-2" />
                      Initialize Generation
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>

          <DialogFooter className="sm:justify-start">
            <Button
              variant="ghost"
              onClick={() => setIsOpen(false)}
              className="font-black uppercase text-[10px] tracking-widest italic opacity-50 hover:opacity-100 transition-opacity"
            >
              Close Console
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};
