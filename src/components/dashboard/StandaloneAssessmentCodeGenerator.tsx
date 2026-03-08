import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Copy, Download, Loader2, Plus, ClipboardCheck } from "lucide-react";
import { withTimeout } from "@/hooks/useQueryWithTimeout";
import { TIMEOUTS } from "@/lib/timeoutConfig";

export function StandaloneAssessmentCodeGenerator() {
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
      toast.error("Please enter an email address");
      return;
    }

    setIsGenerating(true);
    try {
      const { data: { user } } = await withTimeout(
        supabase.auth.getUser(),
        TIMEOUTS.AUTH,
        "Authentication timed out"
      );
      const codes: string[] = [];

      for (let i = 0; i < quantity; i++) {
        const code = generateCode();
        const { error } = await withTimeout(
          Promise.resolve(supabase
            .from("assessment_access_codes")
            .insert({
              code,
              email: email.toLowerCase().trim(),
              created_by: user?.id,
            })),
          TIMEOUTS.DEFAULT,
          "Code generation timed out"
        );

        if (error) {
          if (error.code === "23505") {
            i--;
            continue;
          }
          throw error;
        }
        codes.push(code);
      }

      setGeneratedCodes(codes);
      toast.success(`Generated ${codes.length} assessment code(s)`);
    } catch (error: any) {
      console.error("Error generating codes:", error);
      toast.error(error.message || "Failed to generate codes");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const downloadCodes = () => {
    const content = generatedCodes.map((code, i) => 
      `Code ${i + 1}: ${code}`
    ).join("\n");
    
    const blob = new Blob([`Career Assessment Access Codes for: ${email}\n\n${content}`], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `assessment-codes-${email}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardCheck className="w-5 h-5" />
          Assessment Retake Codes
        </CardTitle>
        <CardDescription>
          Generate access codes for Career Readiness Scorecard retakes (50 Credits each)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="quantity">Number of Codes</Label>
            <Input
              id="quantity"
              type="number"
              min={1}
              max={20}
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
            />
          </div>
        </div>

        <Button onClick={handleGenerate} disabled={isGenerating} className="w-full">
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Plus className="mr-2 h-4 w-4" />
              Generate Codes
            </>
          )}
        </Button>

        {generatedCodes.length > 0 && (
          <div className="space-y-3 pt-4 border-t">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Generated Codes:</p>
              <Button variant="outline" size="sm" onClick={downloadCodes}>
                <Download className="mr-2 h-3 w-3" />
                Download
              </Button>
            </div>
            <div className="space-y-2">
              {generatedCodes.map((code, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg font-mono"
                >
                  <span className="text-sm">{code}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => copyToClipboard(code)}
                  >
                    <Copy className="h-4 w-4" />
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
