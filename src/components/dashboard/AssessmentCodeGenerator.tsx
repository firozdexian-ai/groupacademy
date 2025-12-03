import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
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
import { KeyRound, Copy, Check } from "lucide-react";

interface AssessmentCodeGeneratorProps {
  leadEmail: string;
  leadName: string;
}

export function AssessmentCodeGenerator({ leadEmail, leadName }: AssessmentCodeGeneratorProps) {
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in to generate codes");
        return;
      }

      const code = generateCode();
      
      const { error } = await supabase
        .from("assessment_access_codes")
        .insert({
          code,
          email: leadEmail.toLowerCase().trim(),
          created_by: user.id,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        });

      if (error) throw error;

      setGeneratedCode(code);
      toast.success("Access code generated successfully!");
    } catch (error) {
      console.error("Error generating code:", error);
      toast.error("Failed to generate access code");
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = () => {
    if (generatedCode) {
      const message = `Hi ${leadName},\n\nYour Career Readiness Assessment retake access code is: ${generatedCode}\n\nThis code is valid for 30 days.\n\nVisit: ${window.location.origin}/career-assessment\n\nThank you,\nGroUp Academy`;
      navigator.clipboard.writeText(message);
      setCopied(true);
      toast.success("Code and message copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setGeneratedCode(null); setCopied(false); } }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <KeyRound className="h-4 w-4 mr-1" />
          Generate Code
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generate Retake Access Code</DialogTitle>
          <DialogDescription>
            Generate a paid access code for {leadName} ({leadEmail}) to retake the assessment.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={leadEmail} disabled />
          </div>
          
          {generatedCode ? (
            <div className="space-y-2">
              <Label>Generated Code</Label>
              <div className="flex items-center gap-2">
                <Input 
                  value={generatedCode} 
                  readOnly 
                  className="font-mono text-lg tracking-widest text-center"
                />
                <Button variant="outline" size="icon" onClick={handleCopy}>
                  {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Click copy to get the full message with code to send to the user.
              </p>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground mb-4">
                This will generate an 8-character access code valid for 30 days.
              </p>
              <Button onClick={handleGenerate} disabled={generating}>
                {generating ? "Generating..." : "Generate Access Code"}
              </Button>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
