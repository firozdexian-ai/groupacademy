import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { withTimeout } from "@/hooks/useQueryWithTimeout";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { KeyRound, Copy, Check, Zap, Mail, ShieldCheck } from "lucide-react";

/**
 * GroUp Academy: Access Code Deployment Protocol
 * CTO Reference: Final fix for TS2739 using an async wrapper to ensure native Promise return.
 */

interface MockInterviewCodeGeneratorProps {
  leadEmail: string;
  leadName: string;
}

export function MockInterviewCodeGenerator({ leadEmail, leadName }: MockInterviewCodeGeneratorProps) {
  const [open, setOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const generateCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      // 1. Authenticated Session Audit
      const authResponse = await withTimeout(supabase.auth.getUser(), TIMEOUTS.AUTH, "Authentication check timed out");

      const user = authResponse?.data?.user;
      if (!user) {
        toast.error("Security Fault: Unauthorized access attempt.");
        return;
      }

      const code = generateCode();

      // 2. Wrap PostgrestBuilder in a native async function to return a full Promise
      const executeInsertion = async () => {
        return await supabase.from("mock_interview_access_codes").insert({
          code,
          email: leadEmail.toLowerCase().trim(),
          created_by: user.id,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        });
      };

      // 3. Monitor Execution via Platform Timeout Protocol
      const { error } = (await withTimeout(executeInsertion(), TIMEOUTS.DEFAULT, "Code insertion timed out")) as {
        error: any;
      };

      if (error) throw error;

      setGeneratedCode(code);
      toast.success("Deployment Successful: Access code generated.");
    } catch (error: any) {
      console.error("Access Code Fault:", error);
      const isTimeout = error.message?.includes("timed out");
      toast.error(isTimeout ? "Network Latency Detected. Retrying..." : "System Error: Code generation failed.");
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = () => {
    if (generatedCode) {
      const message = `Hi ${leadName},\n\nYour GroUp Academy Mock Interview retake access code is: ${generatedCode}\n\nThis key is valid for 30 days.\n\nVisit: ${window.location.origin}/mock-interview/setup\n\nBest regards,\nGroUp Academy Admin`;
      navigator.clipboard.writeText(message);
      setCopied(true);
      toast.success("Protocol: Outreach template copied to clipboard.");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
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
          <KeyRound className="h-3 w-3" />
          Generate Code
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
              Authorized key generation for {leadName} [cite: 455]
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
                  This protocol generates an 8-character single-use key that bypasses the 75-credit cost for mock
                  interview retakes[cite: 223].
                </p>
                <Button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="w-full h-14 rounded-2xl font-black uppercase italic tracking-tighter text-lg shadow-xl hover:scale-[1.02] active:scale-95 transition-transform"
                >
                  {generating ? "Synchronizing..." : "Initialize Generation"}
                </Button>
              </div>
            )}
          </div>

          <DialogFooter className="sm:justify-start">
            <Button
              variant="ghost"
              onClick={() => setOpen(false)}
              className="font-black uppercase text-[10px] tracking-widest italic opacity-50 hover:opacity-100 transition-opacity"
            >
              Close Console
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
