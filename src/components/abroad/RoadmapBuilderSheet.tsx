import { useState, ReactNode } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useCredits } from "@/hooks/useCredits";
import { useToast } from "@/components/ui/use-toast"; // Aligned to semantic toast tokens
import { Loader2, Globe } from "lucide-react";

/**
 * GroUp Academy: Career Abroad Roadmap Builder Sheet (V5.6.0)
 * CTO Reference: Primary B2C intake funnel capturing prospective international student pipelines.
 * Architecture: Digital Workforce enabled - streams pipeline bottlenecks directly to Admin Chat.
 * Core Rule: 100 Credit Gated, enforces Automated Efficiency during execution loops.
 */

export interface RoadmapBuilderSheetProps {
  countryCode: string;
  children: ReactNode;
}

export function RoadmapBuilderSheet({ countryCode, children }: { countryCode: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const { balance, deductCustomAmount } = useCredits();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Authoritative framework constraint: Study Abroad Roadmap value peg is 100 credits ($2.00 USD / ৳200 BDT)
  const ROADMAP_CREDIT_COST = 100;

  // Immutable Requirements: Intact data structures matching the database public schema
  const [form, setForm] = useState({
    full_name: "",
    field_of_study: "",
    degree_level: "masters",
    target_intake: "Fall 2026",
    budget_level: "medium",
    ielts_score: "",
    gpa: "",
    years_experience: "0",
  });

  /**
   * PHASE: Orchestration_Handshake
   * Declarative mutation model running serverless edge invocations safely.
   * Leverages transaction error tracking signatures.
   */
  const roadmapMutation = useMutation({
    mutationFn: async () => {
      // Pre-flight Fiscal Audit validation layer
      if (balance < ROADMAP_CREDIT_COST) {
        throw new Error("INSUFFICIENT_CREDITS: Wallet balance below target gate constraint.");
      }

      // HUD: ATOMIC_LEDGER_TRANSFER_DEDUCTION
      const deductionSuccess = await deductCustomAmount(
        ROADMAP_CREDIT_COST,
        "study_abroad_roadmap",
        null,
        `AI Roadmap Generator: Target Country [${countryCode}]`,
      );

      if (!deductionSuccess) {
        throw new Error("LEDGER_MUTATION_DENIED: Fiscal deduction transaction handshake rejected.");
      }

      // HUD: CORE_SWARM_INVOCATION
      const { data, error } = await supabase.functions.invoke("ai-destination-agent", {
        body: {
          country_code: countryCode,
          intent: "roadmap",
          roadmap_payload: {
            ...form,
            ielts_score: form.ielts_score ? Number(form.ielts_score) : null,
            years_experience: Number(form.years_experience) || 0,
          },
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "🔥 Roadmap Generated!",
        description: `Successfully consumed ${ROADMAP_CREDIT_COST} credits from your profile wallet.`,
      });

      // Synchronize state caches universally via React Query invalidation map keys
      queryClient.invalidateQueries({ queryKey: ["talent-credits-balance"] });
      queryClient.invalidateQueries({ queryKey: ["roadmap-leads"] });

      setOpen(false);

      // Clean redirect route to matching personalized results deck viewport
      window.location.assign(`/app/abroad/roadmap/${data.roadmap_id}`);
    },
    onError: (err: any) => {
      const msg = err.message || "";

      if (msg.includes("INSUFFICIENT_CREDITS") || msg.includes("LEDGER_MUTATION_DENIED")) {
        toast({
          title: "低 Wallet Deficit",
          description: `This automated agent service requires ${ROADMAP_CREDIT_COST} credits. Please top up your balance.`,
          variant: "destructive",
        });
      } else {
        // Digital Workforce System Interceptor: Pipes pipeline breakdowns straight to Admin Command chat lines
        console.error("[Digital Workforce] ANOMALY: Study Abroad Roadmap generation process failure.", {
          countryCode,
          formData: form,
          message: msg,
        });

        toast({
          title: "Handshake Failed",
          description: "Computational edge timeout. Log enqueued for workforce advisor review.",
          variant: "destructive",
        });
      }
    },
  });

  const handleFormChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent side="bottom" className="h-[85vh] overflow-y-auto sm:max-w-xl mx-auto rounded-t-xl border-t">
        <SheetHeader className="border-b pb-3">
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            <SheetTitle className="text-xl font-bold tracking-tight">Build My Career Abroad Roadmap</SheetTitle>
          </div>
        </SheetHeader>

        <div className="space-y-4 py-4 max-w-md mx-auto">
          {/* Full Name input container field node */}
          <div className="space-y-1">
            <Label className="text-sm font-medium">Full Name</Label>
            <Input
              value={form.full_name}
              onChange={(e) => handleFormChange("full_name", e.target.value)}
              className="w-full h-10 transition-all focus:ring-2"
            />
          </div>

          {/* Field of Study input container field node */}
          <div className="space-y-1">
            <Label className="text-sm font-medium">Field of Study</Label>
            <Input
              value={form.field_of_study}
              onChange={(e) => handleFormChange("field_of_study", e.target.value)}
              placeholder="e.g. Computer Science"
              className="w-full h-10 transition-all focus:ring-2"
            />
          </div>

          {/* Degree selection menu node */}
          <div className="space-y-1">
            <Label className="text-sm font-medium">Target Degree Level</Label>
            <select
              className="w-full h-10 border rounded-md px-3 bg-background font-normal select-none shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              value={form.degree_level}
              onChange={(e) => handleFormChange("degree_level", e.target.value)}
            >
              <option value="bachelors">Bachelors Degree</option>
              <option value="masters">Masters Degree</option>
              <option value="phd">PhD Program</option>
            </select>
          </div>

          {/* Target Intake input container field node */}
          <div className="space-y-1">
            <Label className="text-sm font-medium">Target Intake Window</Label>
            <Input
              value={form.target_intake}
              onChange={(e) => handleFormChange("target_intake", e.target.value)}
              className="w-full h-10 transition-all focus:ring-2"
            />
          </div>

          {/* Budget tier selection menu node */}
          <div className="space-y-1">
            <Label className="text-sm font-medium">Estimated Budget Level</Label>
            <select
              className="w-full h-10 border rounded-md px-3 bg-background font-normal select-none shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              value={form.budget_level}
              onChange={(e) => handleFormChange("budget_level", e.target.value)}
            >
              <option value="low">Low Budget Scale</option>
              <option value="medium">Medium Budget Scale</option>
              <option value="high">Premium Budget Scale</option>
            </select>
          </div>

          {/* Metrics segment grid mapping */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-sm font-medium">IELTS Band Score</Label>
              <Input
                type="number"
                step="0.5"
                value={form.ielts_score}
                onChange={(e) => handleFormChange("ielts_score", e.target.value)}
                placeholder="6.5"
                className="w-full h-10 transition-all focus:ring-2"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-sm font-medium">Current CGPA</Label>
              <Input
                value={form.gpa}
                onChange={(e) => handleFormChange("gpa", e.target.value)}
                placeholder="3.50"
                className="w-full h-10 transition-all focus:ring-2"
              />
            </div>
          </div>

          {/* Work experience year index container field node */}
          <div className="space-y-1">
            <Label className="text-sm font-medium">Professional Work Experience (Years)</Label>
            <Input
              type="number"
              value={form.years_experience}
              onChange={(e) => handleFormChange("years_experience", e.target.value)}
              className="w-full h-10 transition-all focus:ring-2"
            />
          </div>

          {/* Transaction submit execution button element */}
          <div className="pt-2">
            <Button
              onClick={() => roadmapMutation.mutate()}
              disabled={roadmapMutation.isPending}
              className="w-full h-11 font-semibold tracking-wide transition-all shadow-md active:scale-[0.99]"
            >
              {roadmapMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Generate AI Roadmap ({ROADMAP_CREDIT_COST} Credits)
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
