import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Key, Copy, Check, Loader2 } from "lucide-react";

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
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in to generate codes");
        return;
      }

      const code = generateCode();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      const { error } = await supabase
        .from("salary_analysis_access_codes")
        .insert({
          code,
          email: leadEmail,
          created_by: user.id,
          expires_at: expiresAt.toISOString(),
        });

      if (error) throw error;

      setGeneratedCode(code);
      toast.success("Access code generated successfully");
    } catch (error: any) {
      console.error("Error generating code:", error);
      toast.error("Failed to generate code");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    const message = `Hi ${leadName}!\n\nYour Salary Analysis access code is: ${generatedCode}\n\nUse this code at: ${window.location.origin}/salary-analysis/setup\n\nThis code is valid for 30 days.\n\n- GroUp Academy Team`;
    navigator.clipboard.writeText(message);
    setCopied(true);
    toast.success("Message copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Key className="w-4 h-4 mr-1" />
          Code
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generate Salary Analysis Access Code</DialogTitle>
          <DialogDescription>
            Generate a new access code for {leadEmail}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 pt-4">
          {!generatedCode ? (
            <Button onClick={handleGenerate} disabled={isGenerating} className="w-full">
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Key className="w-4 h-4 mr-2" />
                  Generate Access Code
                </>
              )}
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg text-center">
                <p className="text-sm text-muted-foreground mb-1">Access Code</p>
                <p className="text-2xl font-mono font-bold tracking-wider">{generatedCode}</p>
              </div>
              <Button onClick={handleCopy} variant="outline" className="w-full">
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Message with Code
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
