import { useState, useMemo, ReactNode } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { aiDestinationAgent } from "@/domains/abroad/api/abroadApi";
import { useCredits } from "@/domains/finance/hooks/useCredits";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Globe } from "lucide-react";

/**
 * GroUp Academy: Career Abroad Roadmap Builder Sheet (V5.6.0)
 * CTO Reference: Primary B2C intake funnel capturing prospective international student pipelines.
 * Architecture: Hardened overlay interaction locks preventing session exit interruptions.
 * Phase: Z0 Code Freeze Hardened (May 2026 Launch Edition).
 */

export interface RoadmapBuilderSheetProps {
  countryCode: string;
  children: ReactNode;
}

export interface IntakePayloadForm {
  full_name: string;
  field_of_study: string;
  degree_level: "bachelors" | "masters" | "phd";
  target_intake: string;
  budget_level: "low" | "medium" | "high";
  ielts_score: string;
  gpa: string;
  years_experience: string;
}

export function RoadmapBuilderSheet({ countryCode, children }: RoadmapBuilderSheetProps) {
  const [open, setOpen] = useState(false);
  const { balance, deductCustomAmount } = useCredits();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Authoritative framework constraint: Study Abroad Roadmap value peg is 100 credits ($2.00 USD / ৳200 BDT)
  const ROADMAP_CREDIT_COST = 100;

  // Immutable Requirements: Intact data structures matching the database public schema
  const [form, setForm] = useState<IntakePayloadForm>({
    full_name: "",
    field_of_study: "",
    degree_level: "masters",
    target_intake: "Fall 2026",
    budget_level: "medium",
    ielts_score: "",
    gpa: "",
    years_experience: "0",
  });

  // --- ACTION: TRANSACTION_ISOLATED_MUTATION ---
  const roadmapMutation = useMutation({
    mutationKey: ["generate-abroad-roadmap", countryCode],
    mutationFn: async (): Promise<{ roadmap_id: string }> => {
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

      // HUD: CORE_SWARM_INVOCATION_EDGE_ROUTING
      const data = await aiDestinationAgent({
        country_code: countryCode,
        intent: "roadmap",
        roadmap_payload: {
          full_name: form.full_name.trim(),
          field_of_study: form.field_of_study.trim(),
          degree_level: form.degree_level,
          target_intake: form.target_intake.trim(),
          budget_level: form.budget_level,
          ielts_score: form.ielts_score ? Number(form.ielts_score) : null,
          gpa: form.gpa ? String(form.gpa).trim() : null,
          years_experience: Math.max(0, Number(form.years_experience) || 0),
        },
      });

      if (data.error) {
        throw new Error(String(data.error));
      }

      return data as { roadmap_id: string };
    },
    onSuccess: async (data) => {
      toast({
        title: "🔥 Roadmap Generated!",
        description: `Successfully consumed ${ROADMAP_CREDIT_COST} credits from your profile wallet.`,
      });

      // Synchronize state caches universally via React Query invalidation map keys before redirecting
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["talent-credits-balance"] }),
        queryClient.invalidateQueries({ queryKey: ["roadmap-leads"] }),
        queryClient.invalidateQueries({ queryKey: ["talent-profile"] }),
      ]);

      setOpen(false);

      // HUD: EXECUTING_PROGRAMMATIC_VIEWPORT_NAVIGATION
      window.location.assign(`/app/abroad/roadmap/${data.roadmap_id}`);
    },
    onError: (err: any) => {
      const msg = err.message || "";

      if (msg.includes("INSUFFICIENT_CREDITS") || msg.includes("LEDGER_MUTATION_DENIED")) {
        toast({
          title: "Wallet Deficit",
          description: `This automated agent service requires ${ROADMAP_CREDIT_COST} credits. Please top up your balance.`,
          variant: "destructive",
        });
      } else {
        // Internal error logger
        console.error("[abroad] Roadmap generation failed.", {
          countryCode,
          formData: form,
          message: msg,
          timestamp: new Date().toISOString(),
        });

        toast({
          title: "Couldn't generate roadmap",
          description: "Something went wrong on our side. Please try again in a moment.",
          variant: "destructive",
        });
      }
    },
  });

  const handleFormChange = (field: keyof IntakePayloadForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const isPending = roadmapMutation.isPending;

  // Intercept open modal toggle actions explicitly while credit transactions are moving down the wire
  const handleOpenChange = (nextOpenState: boolean) => {
    if (isPending) return; // Completely seals interaction borders against background process disruptions
    setOpen(nextOpenState);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent
        side="bottom"
        // Secure interaction settings blocking modal swipe closes during background active transits
        onPointerDownOutside={(e) => isPending && e.preventDefault()}
        onEscapeKeyDown={(e) => isPending && e.preventDefault()}
        className="h-[85vh] overflow-y-auto sm:max-w-xl mx-auto rounded-t-xl border-t select-none"
      >
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
              disabled={isPending}
              onChange={(e) => handleFormChange("full_name", e.target.value)}
              className="w-full h-10 transition-all focus:ring-2 disabled:opacity-50"
            />
          </div>

          {/* Field of Study input container field node */}
          <div className="space-y-1">
            <Label className="text-sm font-medium">Field of Study</Label>
            <Input
              value={form.field_of_study}
              disabled={isPending}
              onChange={(e) => handleFormChange("field_of_study", e.target.value)}
              placeholder="e.g. Computer Science"
              className="w-full h-10 transition-all focus:ring-2 disabled:opacity-50"
            />
          </div>

          {/* Degree selection menu node */}
          <div className="space-y-1">
            <Label className="text-sm font-medium">Target Degree Level</Label>
            <select
              disabled={isPending}
              className="w-full h-10 border rounded-md px-3 bg-background font-normal shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
              value={form.degree_level}
              onChange={(e) => handleFormChange("degree_level", e.target.value as any)}
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
              disabled={isPending}
              onChange={(e) => handleFormChange("target_intake", e.target.value)}
              className="w-full h-10 transition-all focus:ring-2 disabled:opacity-50"
            />
          </div>

          {/* Budget tier selection menu node */}
          <div className="space-y-1">
            <Label className="text-sm font-medium">Estimated Budget Level</Label>
            <select
              disabled={isPending}
              className="w-full h-10 border rounded-md px-3 bg-background font-normal shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
              value={form.budget_level}
              onChange={(e) => handleFormChange("budget_level", e.target.value as any)}
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
                disabled={isPending}
                value={form.ielts_score}
                onChange={(e) => handleFormChange("ielts_score", e.target.value)}
                placeholder="6.5"
                className="w-full h-10 transition-all focus:ring-2 disabled:opacity-50"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-sm font-medium">Current CGPA</Label>
              <Input
                disabled={isPending}
                value={form.gpa}
                onChange={(e) => handleFormChange("gpa", e.target.value)}
                placeholder="3.50"
                className="w-full h-10 transition-all focus:ring-2 disabled:opacity-50"
              />
            </div>
          </div>

          {/* Work experience year index container field node */}
          <div className="space-y-1">
            <Label className="text-sm font-medium">Professional Work Experience (Years)</Label>
            <Input
              type="number"
              disabled={isPending}
              value={form.years_experience}
              onChange={(e) => handleFormChange("years_experience", e.target.value)}
              className="w-full h-10 transition-all focus:ring-2 disabled:opacity-50"
            />
          </div>

          {/* Transaction submit execution button element */}
          <div className="pt-2">
            <Button
              onClick={() => roadmapMutation.mutate()}
              disabled={isPending}
              className="w-full h-11 font-semibold tracking-wide transition-all shadow-md active:scale-[0.99] disabled:cursor-not-allowed"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {isPending ? "Building your roadmap..." : `Generate AI Roadmap (${ROADMAP_CREDIT_COST} Credits)`}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
